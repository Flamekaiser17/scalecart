import { Router } from "express";
import {
  createRazorpayOrder,
  verifyPayment,
  getPaymentStatus,
  simulatePayment,
} from "../controllers/payment.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

router.use(verifyJWT);

router.post("/create-order", createRazorpayOrder as any);
router.post("/verify", verifyPayment as any);
router.get("/status/:orderId", getPaymentStatus as any);

// DEV ONLY — generates a valid HMAC signature for Postman testing
router.post("/simulate", simulatePayment as any);

export default router;
