import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import prisma from "../db/prisma.js";
import apiResponse from "../utils/apiResponse.js";
import sendEmail, { sendWelcomeEmail } from "../utils/sendEmail.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Request, Response, CookieOptions } from "express";
import fs from "fs";

interface JwtPayload {
  _id: string;
  exp: number;
}

interface RequestWithUser extends Request {
  user: any;
}

interface RequestWithFile extends Request {
  file?: Express.Multer.File;
}

// ─── HELPER FUNCTIONS ─────────────────────────────────────────────────────────
const generateAccessToken = (user: any) => jwt.sign(
  { _id: user.id, email: user.email, username: user.username },
  process.env.ACCESS_TOKEN_SECRET as string,
  { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
);

const generateRefreshToken = (user: any) => jwt.sign(
  { _id: user.id },
  process.env.REFRESH_TOKEN_SECRET as string,
  { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
);

const generateAccessAndRefreshTokens = async (userId: string) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new apiError(404, "User not found");

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken },
    });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new apiError(500, "Something went wrong while generating tokens");
  }
};

const sanitizeUser = (user: any) => {
  const { password, refreshToken, ...userWithoutSecrets } = user;
  return { ...userWithoutSecrets, _id: user.id };
};

// ─── AUTH CONTROLLERS ─────────────────────────────────────────────────────────

export const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const { firstName, lastName, username, phoneNumber, email, password } = req.body;

  if ([firstName, username, email, password].some((f) => !f || f.trim() === "")) {
    throw new apiError(400, "All required fields must be provided");
  }

  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] },
  });

  if (existingUser) {
    throw new apiError(400, "User already exists with this email or username");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const verificationToken = crypto.randomBytes(32).toString("hex");

  const user = await prisma.user.create({
    data: {
      firstName,
      lastName: lastName || "",
      username,
      email,
      phoneNumber: phoneNumber || "",
      password: hashedPassword,
      emailVerificationToken: verificationToken,
      emailVerificationTokenExpires: new Date(Date.now() + 3600000),
      isVerified: true, // Auto-verify in development
    },
  });

  const createdUser = sanitizeUser(user);

  sendWelcomeEmail(email, firstName)
    .then(() => console.log(`✉️  Welcome email sent to ${email}`))
    .catch((err: any) => console.log(`⚠️  Email skipped: ${err.message}`));

  return res.status(200).json(
    new apiResponse(200, { user: createdUser }, "User registered successfully")
  );
});

export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new apiError(400, "Email and password required");
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new apiError(400, "Invalid email or password");
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswordCorrect) {
    throw new apiError(400, "Invalid email or password");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user.id);
  const loggedInUser = sanitizeUser(user);

  const options: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new apiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in successfully"
      )
    );
});

export const logoutUser = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as RequestWithUser).user._id;

  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken: null },
  });

  const options: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new apiResponse(200, {}, "User logged out successfully"));
});

export const refreshAccessToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) throw new apiError(400, "Refresh token is required");

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET as string) as JwtPayload;
    if (decoded.exp * 1000 < Date.now()) throw new apiError(401, "Refresh token expired");

    const user = await prisma.user.findUnique({ where: { id: decoded._id } });
    if (!user || user.refreshToken !== refreshToken) {
      throw new apiError(401, "Invalid refresh token");
    }

    const accessToken = generateAccessToken(user);

    return res
      .status(200)
      .json(new apiResponse(200, { accessToken }, "Token refreshed"));
  } catch (error) {
    throw new apiError(401, "Invalid or expired token");
  }
});

// ─── PROFILE CONTROLLERS ──────────────────────────────────────────────────────

export const getUserProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as RequestWithUser).user._id;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new apiError(404, "User not found");

  return res
    .status(200)
    .json(new apiResponse(200, { user: sanitizeUser(user) }, "User profile retrieved"));
});

export const updateUserProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as RequestWithUser).user._id;
  const { firstName, lastName, phoneNumber } = req.body;

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(phoneNumber && { phoneNumber }),
    },
  });

  return res
    .status(200)
    .json(new apiResponse(200, { user: sanitizeUser(user) }, "Profile updated"));
});

export const uploadProfileImage = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as RequestWithUser).user._id;
  const avatarLocalPath = (req as RequestWithFile).file?.path;

  if (!avatarLocalPath || !fs.existsSync(avatarLocalPath)) {
    throw new apiError(400, "Valid avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath, "avatar");
  if (!avatar?.url) throw new apiError(400, "Error uploading to Cloudinary");

  const user = await prisma.user.update({
    where: { id: userId },
    data: { avatar: avatar.url },
  });

  return res
    .status(200)
    .json(new apiResponse(200, { user: sanitizeUser(user) }, "Avatar updated"));
});

// Stubs for remaining unused features
export const verifyEmail = asyncHandler(async (req: Request, res: Response) => res.status(200).json());
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => res.status(200).json());
export const resetPassword = asyncHandler(async (req: Request, res: Response) => res.status(200).json());