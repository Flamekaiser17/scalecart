import { Router } from 'express';
import { addReview, getProductReviews, deleteReview } from '../controllers/review.controllers.js';
import { verifyJWT } from '../middlewares/auth.middlewares.js';

const router = Router();

// Add a review (protected)
router.post('/', verifyJWT, addReview);

// Get all reviews for a product (public)
router.get('/product/:productId', getProductReviews);

// Delete a review (protected)
router.delete('/:reviewId', verifyJWT, deleteReview);

export default router; 