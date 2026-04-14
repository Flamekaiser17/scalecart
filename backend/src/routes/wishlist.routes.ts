import { Router } from "express";
import { getWishlist, addToWishlist, removeFromWishlist, toggleWishlist } from "../controllers/wishlist.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

router.use(verifyJWT);

router.get("/", getWishlist);
router.post("/add", addToWishlist);
router.delete("/remove", removeFromWishlist);
router.post("/toggle", toggleWishlist);

export default router; 