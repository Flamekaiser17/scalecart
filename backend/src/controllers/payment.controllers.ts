import { Request, Response } from "express";
import crypto from "crypto";
import prisma from "../db/prisma.js";
import razorpayInstance from "../utils/razorpay.js";
import { sendOrderConfirmationEmail } from "../utils/sendEmail.js";

interface RequestWithUser extends Request {
    user: {
        _id: string;
        id?: string;
    };
}

// [DEV ONLY] Simulate a payment
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

// STEP 1: Create a Razorpay order
export const createRazorpayOrder = async (req: RequestWithUser, res: Response) => {
  try {
    const userId = req.user._id;

    // Get the user's current cart with items and product details
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: true
      }
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty. Cannot create payment." });
    }

    // Calculate total
    const totalAmount = cart.items.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0
    );
    const amountInPaise = Math.round(totalAmount * 100);

    const receipt = `rcpt_${userId.toString().slice(-8)}_${Date.now().toString().slice(-8)}`;

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
        amount: razorpayOrder.amount,
        amountInRupees: totalAmount,
        currency: razorpayOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (err: any) {
    console.error("Razorpay create order error:", err);
    return res.status(500).json({ message: "Failed to create Razorpay order", error: err.message });
  }
};

// STEP 2: Verify payment signature
export const verifyPayment = async (req: RequestWithUser, res: Response) => {
  try {
    const userId = req.user._id;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, shippingAddress } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing payment verification fields." });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET as string)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Payment verification failed. Invalid signature." });
    }

    // Fetch cart
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: true }
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty." });
    }

    const totalAmount = cart.items.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0
    );

    // Create order using Prisma transaction to ensure atomicity
    const order = await prisma.$transaction(async (tx) => {
      // 1. Create the order
      const newOrder = await tx.order.create({
        data: {
          userId,
          orderDate: new Date(),
          shippingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: "Pending",
          totalAmount,
          shippingAddress: shippingAddress || "",
          paymentId: razorpay_payment_id,
          razorpayOrderId: razorpay_order_id,
          paymentStatus: "Paid",
          items: {
            create: cart.items.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
      });

      // 2. Clear the cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id }
      });

      return newOrder;
    });

    // ── Send Order Confirmation Email ──
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user?.email) {
        await sendOrderConfirmationEmail(user.email, {
          orderId: order.id,
          totalAmount,
          paymentId: razorpay_payment_id,
          shippingAddress: shippingAddress || "",
        });
      }
    } catch (emailErr) {
      console.error("Email send error (non-fatal):", emailErr);
    }

    return res.status(201).json({
      success: true,
      message: "Payment verified. Order placed successfully!",
      data: {
        orderId: order.id,
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

// STEP 3: Get payment status
export const getPaymentStatus = async (req: RequestWithUser, res: Response) => {
  try {
    const userId = req.user._id;
    const { orderId } = req.params;

    const order = await prisma.order.findFirst({
      where: { id: orderId, userId }
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    return res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
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
