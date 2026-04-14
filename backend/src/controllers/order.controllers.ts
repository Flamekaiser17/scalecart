import { Request, Response } from "express";
import mongoose from "mongoose";
import Order from "../models/order.models.js";
import Cart from "../models/cart.models.js";
import User from "../models/user.models.js";
import { sendOrderConfirmationEmail } from "../utils/sendEmail.js";

// Create an order from the user's cart — wrapped in a MongoDB transaction
export const checkout = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  try {
    const userId = req.user._id;
    const { shippingDate, shippingAddress } = req.body;

    let createdOrder: any;

    await session.withTransaction(async () => {
      const cart = await Cart.findOne({ userId }).session(session);
      if (!cart || cart.items.length === 0) {
        throw new Error("Cart is empty");
      }

      const totalAmount = cart.items.reduce(
        (sum: number, item: any) => sum + item.price * item.quantity,
        0
      );

      const [order] = await Order.create(
        [{
          userId,
          items: cart.items.map((item: any) => item.productId),
          orderDate: new Date(),
          shippingDate: shippingDate ? new Date(shippingDate) : new Date(),
          status: "Pending",
          totalAmount,
          shippingAddress,
        }],
        { session }
      );

      // Clear cart atomically with order creation
      cart.items = [];
      await cart.save({ session });

      createdOrder = order;
    });

    session.endSession();

    // ── Send real order confirmation email (fire-and-forget — don't fail order if email fails)
    try {
      const user = await User.findById(userId).select("email firstName");
      if (user?.email) {
        sendOrderConfirmationEmail(user.email, {
          orderId:         createdOrder._id.toString(),
          totalAmount:     createdOrder.totalAmount,
          itemCount:       createdOrder.items.length,
          shippingAddress: createdOrder.shippingAddress,
        })
          .then(() => console.log(`✉️  Order confirmation email sent to ${user.email}`))
          .catch((err: any) => console.log(`⚠️  Email error (order still placed): ${err.message}`));
      }
    } catch (emailErr: any) {
      console.log("⚠️  Could not fetch user email:", emailErr.message);
    }

    return res.status(201).json({ message: "Order placed", data: createdOrder });
  } catch (err: any) {
    session.endSession();
    if (err.message === "Cart is empty") {
      return res.status(400).json({ message: "Cart is empty" });
    }
    return res.status(500).json({ message: "Server error", error: err });
  }
};

// Get all orders for the current user (newest first)
export const getUserOrders = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json({ data: orders });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

// Cancel a pending order
export const cancelOrder = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;
    const { orderId } = req.params;
    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.status !== "Pending") {
      return res.status(400).json({ message: "Only pending orders can be cancelled" });
    }
    await Order.deleteOne({ _id: orderId, userId });
    res.status(200).json({ message: "Order cancelled successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};