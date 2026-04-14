import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import jwt from "jsonwebtoken";
import User from "../models/user.models.js";
import { Request, Response, NextFunction } from "express";

interface JwtPayload {
    _id: string;
}

declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

export const verifyJWT = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new apiError(401, "Unauthorized request");
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string) as JwtPayload;

        const user = await User.findById(decodedToken?._id).select(
            "-password -refreshToken"
        );

        if (!user) {
            throw new apiError(401, "invalid access token");
        }

        req.user = user;
        next();
    } catch (error: any) {
        throw new apiError(401, error?.message || "invalid access token");
    }
});
 