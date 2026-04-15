import { Request, Response } from "express";
import prisma from "../db/prisma.js";

// ─── GET CURRENT USER'S CART ──────────────────────────────────────────────────
export const getCart = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id; // from auth middleware alias
    
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: { images: { select: { url: true } } }
            }
          }
        }
      }
    });

    if (!cart) {
      return res.status(200).json({ items: [], totalAmount: 0 });
    }

    // Normalize for frontend
    const payload = {
      ...cart,
      items: cart.items.map(item => ({
        ...item,
        productId: {
          ...item.product,
          _id: item.product.id,
          images: item.product.images.map(img => img.url)
        }
      }))
    };

    res.status(200).json(payload);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch cart", details: err.message });
  }
};

// ─── ADD ITEM TO CART ─────────────────────────────────────────────────────────
export const addToCart = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;
    const { productId, quantity } = req.body;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ error: "Product not found" });
    if (quantity < 1 || quantity > product.stock) {
      return res.status(400).json({ error: "Invalid quantity or insufficient stock" });
    }

    // Secure price calculation (discounted price)
    const securePrice = product.price - (product.price * (product.discount / 100));

    // Get or create cart
    let cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId } });
    }

    // Upsert cart item
    await prisma.cartItem.upsert({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: productId,
        }
      },
      update: {
        quantity: { increment: quantity },
        price: securePrice,
      },
      create: {
        cartId: cart.id,
        productId,
        quantity,
        price: securePrice,
      }
    });

    res.status(200).json({ message: "Item added to cart" });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to add to cart", details: err.message });
  }
};

// ─── UPDATE REMOVE CART ITEM ───────────────────────────────────────────────────────
export const updateCartItem = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;
    const { productId, quantity } = req.body;

    if (quantity < 1) return res.status(400).json({ error: "Quantity must be at least 1" });

    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) return res.status(404).json({ error: "Cart not found" });

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (product && quantity > product.stock) {
      return res.status(400).json({ error: "Insufficient stock" });
    }

    await prisma.cartItem.update({
      where: {
        cartId_productId: { cartId: cart.id, productId }
      },
      data: { quantity }
    });

    res.status(200).json({ message: "Cart item updated" });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to update cart item", details: err.message });
  }
};

// ─── REMOVE ITEM FROM CART ────────────────────────────────────────────────────
export const removeFromCart = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;
    const { productId } = req.body;

    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) return res.status(404).json({ error: "Cart not found" });

    await prisma.cartItem.delete({
      where: {
        cartId_productId: { cartId: cart.id, productId }
      }
    });

    res.status(200).json({ message: "Item removed from cart" });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to remove from cart", details: err.message });
  }
};

// ─── CLEAR CART ───────────────────────────────────────────────────────────────
export const clearCart = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;
    
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) return res.status(404).json({ error: "Cart not found" });

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id }
    });

    res.status(200).json({ message: "Cart cleared" });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to clear cart", details: err.message });
  }
};