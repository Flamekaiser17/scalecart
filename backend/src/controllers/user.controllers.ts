import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import User from "../models/user.models.js";
import apiResponse from "../utils/apiResponse.js";
import sendEmail, { sendWelcomeEmail } from "../utils/sendEmail.js";
import jwt from "jsonwebtoken";
import crypto from 'crypto';
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Request, Response } from "express";
import { CookieOptions } from "express";
import { Document } from "mongoose";
import fs from 'fs';

interface JwtPayload {
    _id: string;
    exp: number;
}

interface TokenResponse {
    accessToken: string;
    refreshToken: string;
}

interface IUser {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    username: string;
    password: string;
    refreshToken?: string;
    emailVerificationToken?: string;
    emailVerificationTokenExpires?: Date;
    isVerified: boolean;
    generateAccessToken: () => string;
    generateRefreshToken: () => string;
    isPasswordCorrect: (password: string) => Promise<boolean>;
    save: (options?: { validateBeforeSave?: boolean }) => Promise<Document>;
}

interface RequestWithUser extends Request {
    user: {
        _id: string;
        id?: string;
    };
}

interface RequestWithFile extends Request {
    file?: Express.Multer.File;
}

type UserDocument = Document & IUser;

const refreshAccessToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body as { refreshToken: string };

    if (!refreshToken) {
        throw new apiError(400, "Refresh token is required");
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET as string) as JwtPayload;

        if (decoded.exp * 1000 < Date.now()) {
            throw new apiError(401, "Refresh token has expired");
        }

        const user = await User.findById(decoded._id) as UserDocument;

        if (!user || user.refreshToken !== refreshToken) {
            throw new apiError(401, "Invalid refresh token");
        }

        const accessToken = user.generateAccessToken();

        return res.status(200).json(
            new apiResponse(200, { accessToken }, "Access token refreshed successfully")
        );
    } catch (error) {
        throw new apiError(401, "Invalid or expired refresh token");
    }
});

const generateAccessAndRefreshTokens = async (userId: string): Promise<TokenResponse> => {
    try {
        const user = await User.findById(userId) as UserDocument;
        if (!user) {
            throw new apiError(404, "User not found");
        }
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new apiError(500, "Something went wrong while generating refresh and access tokens");
    }
};

const registerUser = asyncHandler(async (req: Request, res: Response) => {
    const { firstName, lastName, username, phoneNumber, email, password } = req.body as {
        firstName: string;
        lastName: string;
        username: string;
        phoneNumber: string;
        email: string;
        password: string;
    };

    // Allow phoneNumber to be optional
    if ([firstName, username, email, password].some((field) => !field || field?.trim() === "")) {
        throw new apiError(400, "All fields are required");
    }

    const existingUser = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (existingUser) {
        throw new apiError(400, "User already exists");
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = await User.create({
        firstName,
        lastName,
        email,
        phoneNumber,
        username,
        password,
        emailVerificationToken: verificationToken,
        emailVerificationTokenExpires: Date.now() + 3600000,
        // Auto-verify in development — user can login immediately after registering
        isVerified: true,
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new apiError(500, "Something went wrong while registering user");
    }

    // Send welcome email (fire-and-forget — don't block registration)
    sendWelcomeEmail(email, firstName)
      .then(() => console.log(`✉️  Welcome email sent to ${email}`))
      .catch((err: any) => console.log(`⚠️  Email skipped (check SMTP config): ${err.message}`));

    return res.status(200).json(
        new apiResponse(200, {
            user: createdUser,
        }, "User registered successfully. You can now login!")
    );
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
    const { token, email } = req.query as { token: string; email: string };

    const user = await User.findOne({
        email,
        emailVerificationToken: token,
        emailVerificationTokenExpires: { $gt: Date.now() }
    }) as UserDocument;

    if (!user) {
        throw new apiError(400, "Invalid or expired token");
    }

    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationTokenExpires = undefined;

    await user.save();

    return res.status(200).json(new apiResponse(200, null, "Email verified successfully"));
});

const loginUser = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body as { email: string; password: string };

    if (!(email || password)) {
        throw new apiError(400, "email password required");
    }
    
    const user = await User.findOne({ email }) as UserDocument;

    if (!user) {
        throw new apiError(400, "invalid email");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password);

    if (!isPasswordCorrect) {
        throw new apiError(400, "invalid password");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    console.log(user);

    const options: CookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict"
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new apiResponse(
                200,
                { user: loggedInUser, accessToken, refreshToken },
                "user logged in successfully"
            )
        );
});

const logoutUser = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as RequestWithUser).user._id;
    await User.findByIdAndUpdate(
        userId,
        {
            $set: {
                refreshToken: undefined
            }
        },
        { new: true }
    );

    const options: CookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict"
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new apiResponse(200, {}, "User logged out successfully"));
});

const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body as { email: string };

    const user = await User.findOne({ email }) as UserDocument;

    if (!user) {
        throw new apiError(400, "User does not exist");
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const otpToken = jwt.sign(
        { otp, id: user._id },
        process.env.JWT_RESET_PASSWORD_SECRET as string,
        { expiresIn: "15m" }
    );

    const message = `Your OTP for password reset is: ${otp}. It is valid for 15 minutes.`;

    try {
        await sendEmail({
            email: user.email,
            subject: "Password Reset OTP",
            message,
        });

        return res
            .status(200)
            .json(new apiResponse(200, { otpToken }, "OTP sent successfully"));
    } catch (error) {
        throw new apiError(500, "Failed to send OTP email");
    }
});

const resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { otpToken, newPassword } = req.body as { otpToken: string; newPassword: string };

    try {
        const decoded = jwt.verify(otpToken, process.env.JWT_RESET_PASSWORD_SECRET as string) as { otp: string; id: string };

        const user = await User.findById(decoded.id) as UserDocument;

        if (!user) {
            throw new apiError(400, "User not found");
        }

        user.password = newPassword;
        await user.save();

        return res.status(200).json(new apiResponse(200, null, "Password reset successful"));
    } catch (error) {
        throw new apiError(400, "Invalid or expired OTP");
    }
});

const getUserProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as RequestWithUser).user._id;

    const user = await User.findById(userId).select("-password -refreshToken");

    if (!user) {
        throw new apiError(404, "User not found");
    }

    return res.status(200).json(new apiResponse(200, { user }, "User profile retrieved successfully"));
});

const updateUserProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as RequestWithUser).user._id;
    const { firstName, lastName, phoneNumber } = req.body as {
        firstName?: string;
        lastName?: string;
        phoneNumber?: string;
    };

    const user = await User.findById(userId) as UserDocument;

    if (!user) {
        throw new apiError(404, "User not found");
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phoneNumber) user.phoneNumber = phoneNumber;

    await user.save();

    return res.status(200).json(new apiResponse(200, { user }, "Profile updated successfully"));
});

const uploadProfileImage = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as RequestWithUser).user._id;
    const avatarLocalPath = (req as RequestWithFile).file?.path;

    if (!avatarLocalPath) {
        throw new apiError(400, "Avatar file is required");
    }

    // Check if file exists
    if (!fs.existsSync(avatarLocalPath)) {
        throw new apiError(400, "Uploaded file not found");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath, "avatar");

    if (!avatar?.url) {
        throw new apiError(400, "Error while uploading avatar to Cloudinary. Please check your Cloudinary configuration.");
    }

    const user = await User.findByIdAndUpdate(
        userId,
        { $set: { avatar: avatar.url } },
        { new: true }
    ).select("-password -refreshToken");

    if (!user) {
        throw new apiError(404, "User not found");
    }

    return res.status(200).json(new apiResponse(200, { user }, "Avatar updated successfully"));
});

export {
    refreshAccessToken,
    registerUser,
    loginUser,
    logoutUser,
    forgotPassword,
    resetPassword,
    getUserProfile,
    updateUserProfile,
    uploadProfileImage
}; 