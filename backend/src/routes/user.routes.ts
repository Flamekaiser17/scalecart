import { Router } from "express";
import {
    loginUser,
    verifyEmail,
    getUserProfile,
    uploadProfileImage,
    updateUserProfile,
    refreshAccessToken,
    registerUser,
    logoutUser,
    forgotPassword,
    resetPassword
} from "../controllers/user.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { upload } from "../middlewares/multer.middlewares.js";

    const router: Router = Router();

// Public routes
router.route("/register").post(registerUser);
router.get("/verify-email", verifyEmail);
router.route("/login").post(loginUser);

// Protected routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/forgot-password").post(forgotPassword);
router.route("/reset-password").post(resetPassword);
router.route("/profile")
    .get(verifyJWT, getUserProfile)
    .put(verifyJWT, updateUserProfile);
router.post('/upload-avatar', verifyJWT, upload.single('avatar'), uploadProfileImage);

export default router; 