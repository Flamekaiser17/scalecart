import { Request, Response } from "express";
import WishlistItem from "../models/wishlist.models.js";

// Get current user's wishlist
export const getWishlist = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;
    const wishlist = await WishlistItem.find({ userId }).populate('productId');
    res.status(200).json({ items: wishlist });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch wishlist', details: err });
  }
};

// Add product to wishlist
export const addToWishlist = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;
    const { productId } = req.body;
    const exists = await WishlistItem.findOne({ userId, productId });
    if (exists) return res.status(200).json({ message: 'Already in wishlist' });
    const item = await WishlistItem.create({ userId, productId });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add to wishlist', details: err });
  }
};

// Remove product from wishlist
export const removeFromWishlist = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;
    const { productId } = req.body;
    await WishlistItem.deleteOne({ userId, productId });
    res.status(200).json({ message: 'Removed from wishlist' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove from wishlist', details: err });
  }
};

// Toggle wishlist status
export const toggleWishlist = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;
    const { productId } = req.body;
    const exists = await WishlistItem.findOne({ userId, productId });
    if (exists) {
      await WishlistItem.deleteOne({ userId, productId });
      return res.status(200).json({ message: 'Removed from wishlist' });
    } else {
      const item = await WishlistItem.create({ userId, productId });
      return res.status(201).json(item);
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle wishlist', details: err });
  }
}; 