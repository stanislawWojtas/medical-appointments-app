import express from 'express';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware';
import {
	registerDoctor,
	getAllPatients,
	blockUser,
	unblockUser,
	getAllDoctorsWithReviews
} from '../controllers/adminController';
import { deleteReview } from '../controllers/reviewController';

const router = express.Router();

// Wszystkie route są chronione i wymagają roli ADMIN
router.post('/register-doctor', verifyToken, authorizeRoles('ADMIN'), registerDoctor);
router.get('/patients', verifyToken, authorizeRoles('ADMIN'), getAllPatients);
router.patch('/users/:userId/block', verifyToken, authorizeRoles('ADMIN'), blockUser);
router.patch('/users/:userId/unblock', verifyToken, authorizeRoles('ADMIN'), unblockUser);
router.get('/doctors-with-reviews', verifyToken, authorizeRoles('ADMIN'), getAllDoctorsWithReviews);
router.delete('/reviews/:reviewId', verifyToken, authorizeRoles('ADMIN'), deleteReview);

export default router;
