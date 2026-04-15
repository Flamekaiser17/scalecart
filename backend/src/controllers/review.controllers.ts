import { Request, Response } from 'express';
import prisma from '../db/prisma.js';

interface RequestWithUser extends Request {
  user: {
    _id: string;
    id?: string;
  };
}

// Add a review to a product
export const addReview = async (req: RequestWithUser, res: Response) => {
  try {
    const { productId, rating, comment } = req.body;
    const userId = req.user?._id || req.body.userId;

    if (!productId || !rating || !comment || !userId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Create review using Prisma
    const review = await prisma.review.create({
      data: {
        userId,
        productId,
        rating: Number(rating),
        comment,
      },
    });

    // Update product average rating
    const allReviews = await prisma.review.findMany({
      where: { productId },
      select: { rating: true },
    });

    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await prisma.product.update({
      where: { id: productId },
      data: { rating: avgRating },
    });

    res.status(201).json({ message: 'Review added', data: review });
  } catch (err: any) {
    console.error("Error adding review:", err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get all reviews for a product
export const getProductReviews = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;

    const reviews = await prisma.review.findMany({
      where: { productId },
      include: {
        user: {
          select: { firstName: true, lastName: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ data: reviews });
  } catch (err: any) {
    console.error("Error fetching reviews:", err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Delete a review
export const deleteReview = async (req: RequestWithUser, res: Response) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user._id;

    // Find review first to get productId
    const review = await prisma.review.findUnique({
      where: { id: reviewId }
    });

    if (!review) return res.status(404).json({ message: 'Review not found' });
    
    // Security check: only author or admin can delete (simplified to author here)
    if (review.userId !== userId) {
        return res.status(403).json({ message: 'Unauthorized' });
    }

    const productId = review.productId;

    await prisma.review.delete({
      where: { id: reviewId }
    });

    // Update product average rating
    const allReviews = await prisma.review.findMany({
      where: { productId },
      select: { rating: true },
    });

    const avgRating = allReviews.length > 0 
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length 
      : 0;

    await prisma.product.update({
      where: { id: productId },
      data: { rating: avgRating },
    });

    res.status(200).json({ message: 'Review deleted' });
  } catch (err: any) {
    console.error("Error deleting review:", err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};