import { Request, Response } from "express";
import crypto from "crypto";
import Order from "../models/order.models.js";
import Cart from "../models/cart.models.js";
import User from "../models/user.models.js";
import razorpayInstance from "../utils/razorpay.js";
import { sendOrderConfirmationEmail } from "../utils/sendEmail.js";

// ─────────────────────────────────────────────────────────────────────────────
// [DEV ONLY] Simulate a payment — generates a valid HMAC signature so you can
// test the full verifyPayment flow in Postman without a real Razorpay payment.
// NEVER expose this in production.
// POST /api/v1/payments/simulate  (body: { razorpay_order_id, razorpay_payment_id })
// ─────────────────────────────────────────────────────────────────────────────
export const simulatePayment = async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ message: "Not available in production." });
  }
  const { razorpay_order_id, razorpay_payment_id } = req.body;
  if (!razorpay_order_id || !razorpay_payment_id) {
    return res.status(400).json({ message: "Provide razorpay_order_id and razorpay_payment_id" });
  }
  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const signature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET as string)
    .update(body)
    .digest("hex");

  return res.status(200).json({
    success: true,
    message: "Use these values in POST /api/v1/payments/verify",
    data: { razorpay_order_id, razorpay_payment_id, razorpay_signature: signature },
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1: Create a Razorpay order (call this before showing the payment dialog)
// POST /api/v1/payments/create-order
// ─────────────────────────────────────────────────────────────────────────────
export const createRazorpayOrder = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;

    // Get the user's current cart
    const cart = await Cart.findOne({ userId });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty. Cannot create payment." });
    }

    // Calculate total (in paise — Razorpay uses smallest currency unit)
    const totalAmount = cart.items.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0
    );
    const amountInPaise = Math.round(totalAmount * 100);

    // receipt must be <= 40 chars — use short form of userId + timestamp
    const shortUserId = userId.toString().slice(-8);
    const shortTs = Date.now().toString().slice(-8);
    const receipt = `rcpt_${shortUserId}_${shortTs}`;

    // Create Razorpay order
    const razorpayOrder = await razorpayInstance.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt,
      notes: {
        userId: userId.toString(),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Razorpay order created",
      data: {
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,         // in paise
        amountInRupees: totalAmount,          // for display
        currency: razorpayOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID,  // send to frontend to initialize Razorpay checkout
      },
    });
  } catch (err: any) {
    console.error("Razorpay create order error:", err);
    return res.status(500).json({ message: "Failed to create Razorpay order", error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2: Verify payment signature (CRITICAL — prevents fraud)
// POST /api/v1/payments/verify
// Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, shippingAddress }
// ─────────────────────────────────────────────────────────────────────────────
export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, shippingAddress } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing payment verification fields." });
    }

    // ── HMAC-SHA256 Signature Verification ──
    // Razorpay signs: "razorpay_order_id|razorpay_payment_id" with your KEY_SECRET
    // If our computed hash matches theirs → payment is genuine
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET as string)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      console.error("❌ Payment signature mismatch — possible fraud attempt");
      return res.status(400).json({ success: false, message: "Payment verification failed. Invalid signature." });
    }

    console.log("✅ Payment signature verified successfully");

    // ── Fetch cart and create the order in MongoDB ──
    const cart = await Cart.findOne({ userId });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty." });
    }

    const totalAmount = cart.items.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0
    );

    const order = await Order.create({
      userId,
      items: cart.items.map((item: any) => item.productId),
      orderDate: new Date(),
      shippingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 days
      status: "Pending",
      totalAmount,
      shippingAddress: shippingAddress || "",
      paymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      paymentStatus: "Paid",
    });

    // Clear the cart
    cart.items = [];
    await cart.save();

    // Link order to user
    await User.findByIdAndUpdate(userId, { $push: { orders: order._id } });

    // ── Send Order Confirmation Email ──
    try {
      const user = await User.findById(userId);
      if (user?.email) {
        await sendOrderConfirmationEmail(user.email, {
          orderId: (order._id as any).toString(),
          totalAmount,
          paymentId: razorpay_payment_id,
          shippingAddress: shippingAddress || "",
        });
      }
    } catch (emailErr) {
      // Email failure should NOT fail the order — log and continue
      console.error("Email send error (non-fatal):", emailErr);
    }

    return res.status(201).json({
      success: true,
      message: "Payment verified. Order placed successfully!",
      data: {
        orderId: order._id,
        paymentId: razorpay_payment_id,
        totalAmount,
        paymentStatus: "Paid",
      },
    });
  } catch (err: any) {
    console.error("Payment verification error:", err);
    return res.status(500).json({ message: "Server error during payment verification", error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3: Get payment status for a specific order
// GET /api/v1/payments/status/:orderId
// ─────────────────────────────────────────────────────────────────────────────
export const getPaymentStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;
    const { orderId } = req.params;

    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    return res.status(200).json({
      success: true,
      data: {
        orderId: order._id,
        paymentStatus: order.paymentStatus,
        paymentId: order.paymentId || null,
        razorpayOrderId: order.razorpayOrderId || null,
        orderStatus: order.status,
        totalAmount: order.totalAmount,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};
