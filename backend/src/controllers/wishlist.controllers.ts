import { Request, Response } from "express";
import prisma from "../db/prisma.js";

// ─── GET CURRENT USER'S WISHLIST ──────────────────────────────────────────────
export const getWishlist = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;
    const wishlist = await prisma.wishlist.findMany({
      where: { userId },
      include: {
        product: {
          include: { images: { select: { url: true } } }
        }
      }
    });

    // Normalize for frontend
    const payload = wishlist.map(item => ({
      ...item,
      productId: {
        ...item.product,
        _id: item.product.id,
        images: item.product.images.map(img => img.url)
      }
    }));

    res.status(200).json({ items: payload });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch wishlist", details: err.message });
  }
};

// ─── ADD TO WISHLIST ──────────────────────────────────────────────────────────
export const addToWishlist = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;
    const { productId } = req.body;

    const exists = await prisma.wishlist.findUnique({
      where: {
        userId_productId: { userId, productId }
      }
    });

    if (exists) return res.status(200).json({ message: "Already in wishlist" });

    const item = await prisma.wishlist.create({
      data: { userId, productId }
    });
    
    res.status(201).json(item);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to add to wishlist", details: err.message });
  }
};

// ─── REMOVE FROM WISHLIST ─────────────────────────────────────────────────────
export const removeFromWishlist = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;
    const { productId } = req.body;

    await prisma.wishlist.delete({
      where: {
        userId_productId: { userId, productId }
      }
    });

    res.status(200).json({ message: "Removed from wishlist" });
  } catch (err: any) {
    // If it doesn't exist, we can ignore the error
    res.status(500).json({ error: "Failed to remove from wishlist", details: err.message });
  }
};

// ─── TOGGLE WISHLIST (Add/Remove) ─────────────────────────────────────────────
export const toggleWishlist = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;
    const { productId } = req.body;

    const exists = await prisma.wishlist.findUnique({
      where: {
        userId_productId: { userId, productId }
      }
    });

    if (exists) {
      await prisma.wishlist.delete({
        where: { userId_productId: { userId, productId } }
      });
      return res.status(200).json({ message: "Removed from wishlist" });
    } else {
      const item = await prisma.wishlist.create({
        data: { userId, productId }
      });
      return res.status(201).json(item);
    }
  } catch (err: any) {
    res.status(500).json({ error: "Failed to toggle wishlist", details: err.message });
  }
};