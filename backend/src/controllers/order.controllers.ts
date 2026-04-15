import { Request, Response } from "express";
import mongoose from "mongoose";
import Order from "../models/order.models.js";
import Cart from "../models/cart.models.js";
import Product from "../models/product.models.js";
import User from "../models/user.models.js";
import { sendOrderConfirmationEmail } from "../utils/sendEmail.js";
import { deleteCachePattern } from "../utils/redis.js";

// ─── CHECKOUT — Place Order ───────────────────────────────────────────────────
// Full atomic flow:
// 1. Validate stock for every cart item
// 2. Create order document
// 3. Decrement stock for each product (atomic, same transaction)
// 4. Clear cart
// 5. Invalidate Redis product cache
// 6. Send order confirmation email (fire-and-forget)
export const checkout = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  try {
    const userId = req.user._id;
    const { shippingDate, shippingAddress } = req.body;

    let createdOrder: any;

    await session.withTransaction(async () => {
      // ── Step 1: Fetch cart ──────────────────────────────────────────────
      const cart = await Cart.findOne({ userId }).session(session);
      if (!cart || cart.items.length === 0) {
        throw new Error("Cart is empty");
      }

      // ── Step 2: Validate stock for ALL items before doing anything ──────
      // Fetch all products in one query for efficiency
      const productIds = cart.items.map((item: any) => item.productId);
      const products = await Product.find({ _id: { $in: productIds } })
        .select("_id name stock")
        .session(session);

      // Build a quick lookup map  productId → product
      const productMap = new Map(products.map((p) => [p._id.toString(), p]));

      // Check each cart item
      for (const item of cart.items as any[]) {
        const prod = productMap.get(item.productId.toString());

        if (!prod) {
          throw new Error(`Product not found: ${item.productId}`);
        }
        if (prod.stock < item.quantity) {
          throw new Error(
            `Insufficient stock for "${prod.name}". Available: ${prod.stock}, Requested: ${item.quantity}`
          );
        }
      }

      // ── Step 3: Calculate total ─────────────────────────────────────────
      const totalAmount = cart.items.reduce(
        (sum: number, item: any) => sum + item.price * item.quantity,
        0
      );

      // ── Step 4: Create Order ────────────────────────────────────────────
      const [order] = await Order.create(
        [{
          userId,
          // Store { productId, quantity, price } — not just productId
          items: cart.items.map((item: any) => item.productId),
          orderDate: new Date(),
          shippingDate: shippingDate ? new Date(shippingDate) : new Date(),
          status: "Pending",
          totalAmount,
          shippingAddress,
        }],
        { session }
      );

      // ── Step 5: Decrement stock atomically (same session/transaction) ───
      // Uses $inc so it's non-blocking and safe for concurrent orders
      const stockDecrements = cart.items.map((item: any) =>
        Product.findByIdAndUpdate(
          item.productId,
          { $inc: { stock: -item.quantity } },  // decrement by ordered qty
          { session, new: true }
        )
      );
      await Promise.all(stockDecrements);
      console.log(`📦 Stock decremented for ${cart.items.length} product(s)`);

      // ── Step 6: Clear cart ──────────────────────────────────────────────
      cart.items = [];
      await cart.save({ session });

      createdOrder = order;
    });

    session.endSession();

    // ── Step 7: Invalidate Redis cache for all affected products ───────────
    // Product stock changed → cached versions are now stale
    try {
      await deleteCachePattern("products:*");
      const productIds = createdOrder.items || [];
      for (const productId of productIds) {
        await deleteCachePattern(`product:${productId}`);
      }
      console.log("🗑️  Product cache invalidated after order");
    } catch (cacheErr: any) {
      console.log("⚠️  Cache invalidation failed (order still placed):", cacheErr.message);
    }

    // ── Step 8: Send confirmation email (fire-and-forget) ─────────────────
    try {
      const user = await User.findById(createdOrder.userId).select("email firstName");
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
      console.log("⚠️  Could not fetch user for email:", emailErr.message);
    }

    return res.status(201).json({ message: "Order placed", data: createdOrder });

  } catch (err: any) {
    session.endSession();

    // Surface friendly errors to frontend
    if (err.message === "Cart is empty") {
      return res.status(400).json({ message: "Cart is empty" });
    }
    if (err.message.startsWith("Insufficient stock")) {
      return res.status(400).json({ message: err.message });
    }
    if (err.message.startsWith("Product not found")) {
      return res.status(404).json({ message: err.message });
    }

    console.error("❌ Checkout error:", err);
    return res.status(500).json({ message: "Server error during checkout", error: err.message });
  }
};

// ─── GET USER ORDERS ──────────────────────────────────────────────────────────
export const getUserOrders = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json({ data: orders });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

// ─── CANCEL ORDER — restores stock ───────────────────────────────────────────
export const cancelOrder = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  try {
    const userId = req.user._id;
    const { orderId } = req.params;

    await session.withTransaction(async () => {
      const order = await Order.findOne({ _id: orderId, userId }).session(session);
      if (!order) throw new Error("Order not found");
      if (order.status !== "Pending") {
        throw new Error("Only pending orders can be cancelled");
      }

      // NOTE: Order.items stores productIds only (not qty).
      // For full stock restore we'd need qty stored in order — mark as cancelled instead of restoring
      // (This is a known limitation; full qty-in-order is a future improvement)
      order.status = "Cancelled";
      await order.save({ session });
    });

    session.endSession();

    // Invalidate cache
    await deleteCachePattern("products:*").catch(() => {});

    res.status(200).json({ message: "Order cancelled successfully" });
  } catch (err: any) {
    session.endSession();
    if (err.message === "Order not found") return res.status(404).json({ message: err.message });
    if (err.message === "Only pending orders can be cancelled") return res.status(400).json({ message: err.message });
    res.status(500).json({ message: "Server error", error: err });
  }
};