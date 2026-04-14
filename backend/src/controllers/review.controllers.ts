import { Request, Response } from 'express';
import Review from '../models/review.models.js';
import Product from '../models/product.models.js';
import mongoose from 'mongoose';

// Add a review to a product
export const addReview = async (req: Request, res: Response) => {
  try {
    const { productId, rating, comment } = req.body;
    const userId = req.user?._id || req.body.userId; // Adjust for your auth
    if (!productId || !rating || !comment || !userId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    // Create review
    const review = await Review.create({
      userId,
      productId,
      rating,
      comment,
      date: new Date(),
    });
    // Add review to product
    await Product.findByIdAndUpdate(productId, {
      $push: { reviews: review._id },
    });
    // Update product average rating
    const product = await Product.findById(productId).populate('reviews');
    if (product) {
      const allReviews = await Review.find({ productId });
      const avgRating =
        allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      product.rating = avgRating;
      await product.save();
    }
    res.status(201).json({ message: 'Review added', data: review });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};

// Get all reviews for a product
export const getProductReviews = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid productId' });
    }
    const reviews = await Review.find({ productId }).populate('userId', 'firstName lastName');
    res.status(200).json({ data: reviews });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};

// (Optional) Delete a review
export const deleteReview = async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    const review = await Review.findByIdAndDelete(reviewId);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    // Remove from product
    await Product.findByIdAndUpdate(review.productId, { $pull: { reviews: review._id } });
    // Update product average rating
    const product = await Product.findById(review.productId);
    if (product) {
      const allReviews = await Review.find({ productId: review.productId });
      const avgRating = allReviews.length > 0 ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length : 0;
      product.rating = avgRating;
      await product.save();
    }
    res.status(200).json({ message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
}; 