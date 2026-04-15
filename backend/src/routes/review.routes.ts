import { Router } from 'express';
import { addReview, getProductReviews, deleteReview } from '../controllers/review.controllers.js';
import { verifyJWT } from '../middlewares/auth.middlewares.js';

const router = Router();

// Add a review (protected)
router.post('/', verifyJWT, addReview as any);

// Get all reviews for a product (public)
router.get('/product/:productId', getProductReviews as any);

// Delete a review (protected)
router.delete('/:reviewId', verifyJWT, deleteReview as any);

export default router; 