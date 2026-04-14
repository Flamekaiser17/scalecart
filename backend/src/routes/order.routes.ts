import { Router } from "express";
import { checkout, getUserOrders, cancelOrder } from "../controllers/order.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

router.use(verifyJWT);

router.post("/checkout", checkout);
router.get("/", getUserOrders);
router.patch("/:orderId/cancel", verifyJWT, cancelOrder);

export default router; 