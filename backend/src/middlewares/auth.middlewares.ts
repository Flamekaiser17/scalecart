import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import jwt from "jsonwebtoken";
import prisma from "../db/prisma.js";
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

    if (!token) throw new apiError(401, "Unauthorized request");

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: decodedToken._id },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        avatar: true,
        isVerified: true,
        refreshToken: true,
      },
    });

    if (!user) throw new apiError(401, "Invalid access token");

    // Expose as req.user — use _id alias for backward compat with all controllers
    req.user = { ...user, _id: user.id };
    next();
  } catch (error: any) {
    throw new apiError(401, error?.message || "Invalid access token");
  }
});