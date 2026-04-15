import { Request, Response } from "express";
import prisma from "../db/prisma.js";
import { sendOrderConfirmationEmail } from "../utils/sendEmail.js";
import { deleteCachePattern } from "../utils/redis.js";

// ─── CHECKOUT — Place Order (Atomic Prisma Transaction) ────────────────────────
export const checkout = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;
    const { shippingDate, shippingAddress } = req.body;

    let createdOrder: any;

    await prisma.$transaction(async (tx) => {
      // 1. Fetch cart & items
      const cart = await tx.cart.findUnique({
        where: { userId },
        include: { items: true },
      });

      if (!cart || cart.items.length === 0) {
        throw new Error("Cart is empty");
      }

      // 2. Validate stock
      const productIds = cart.items.map((item) => item.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true, stock: true },
      });

      const productMap = new Map(products.map((p) => [p.id, p]));

      for (const item of cart.items) {
        const prod = productMap.get(item.productId);
        if (!prod) throw new Error(`Product not found: ${item.productId}`);
        if (prod.stock < item.quantity) {
          throw new Error(
            `Insufficient stock for "${prod.name}". Available: ${prod.stock}, Requested: ${item.quantity}`
          );
        }
      }

      // 3. Calculate total
      const totalAmount = cart.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      // 4. Create Order & OrderItems
      createdOrder = await tx.order.create({
        data: {
          userId,
          status: "Pending",
          totalAmount,
          shippingAddress,
          shippingDate: shippingDate ? new Date(shippingDate) : new Date(),
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
        include: { items: true },
      });

      // 5. Decrement stock
      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // 6. Clear cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    });

    // 7. Invalidate Redis cache
    try {
      await deleteCachePattern("products:*");
      for (const item of createdOrder.items || []) {
        await deleteCachePattern(`product:${item.productId}`);
      }
      console.log("Product cache invalidated after order");
    } catch (cacheErr: any) {
      console.log("Cache invalidation failed (order still placed):", cacheErr.message);
    }

    // 8. Send confirmation email (fire-and-forget)
    try {
      const user = await prisma.user.findUnique({
        where: { id: createdOrder.userId },
        select: { email: true, firstName: true },
      });
      
      if (user?.email) {
        // Run in background
        Promise.resolve().then(() => {
          return sendOrderConfirmationEmail(user.email, {
            orderId: createdOrder.id.toString(),
            totalAmount: createdOrder.totalAmount,
            itemCount: createdOrder.items.length,
            shippingAddress: createdOrder.shippingAddress || "",
          });
        })
        .then(() => console.log(`Order confirmation email sent to ${user.email}`))
        .catch((err) => console.error(`Email error in checkout flow:`, err));
      } else {
         console.log("No email found for user ID:", createdOrder.userId)
      }
    } catch (emailErr: any) {
      console.log("Could not fetch user for email:", emailErr.message);
    }

    return res.status(201).json({ message: "Order placed", data: { ...createdOrder, _id: createdOrder.id } });

  } catch (err: any) {
    if (err.message === "Cart is empty") {
      return res.status(400).json({ message: "Cart is empty" });
    }
    if (err.message.startsWith("Insufficient stock")) {
      return res.status(400).json({ message: err.message });
    }
    if (err.message.startsWith("Product not found")) {
      return res.status(404).json({ message: err.message });
    }

    console.error("Checkout error:", err);
    return res.status(500).json({ message: "Server error during checkout", error: err.message });
  }
};

// ─── GET USER ORDERS ──────────────────────────────────────────────────────────
export const getUserOrders = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;
    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: { images: { select: { url: true } } }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    // Normalize for frontend
    const payload = orders.map(order => ({
      ...order,
      _id: order.id,
      items: order.items.map(item => ({
        ...item,
        productId: {
          ...item.product,
          _id: item.product.id,
          images: item.product.images.map(img => img.url)
        }
      }))
    }));

    res.status(200).json({ data: payload });
  } catch (err: any) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── CANCEL ORDER — restores stock ─────────────────────────────────────────────
export const cancelOrder = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;
    const { orderId } = req.params;

    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId, userId },
        include: { items: true },
      });

      if (!order) throw new Error("Order not found");
      if (order.status !== "Pending") {
        throw new Error("Only pending orders can be cancelled");
      }

      // Restore stock
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }

      await tx.order.update({
        where: { id: orderId },
        data: { status: "Cancelled" },
      });
    });

    // Invalidate cache
    await deleteCachePattern("products:*").catch(() => {});

    res.status(200).json({ message: "Order cancelled successfully" });
  } catch (err: any) {
    if (err.message === "Order not found") return res.status(404).json({ message: err.message });
    if (err.message === "Only pending orders can be cancelled") return res.status(400).json({ message: err.message });
    res.status(500).json({ message: "Server error", error: err.message });
  }
};