import express from 'express';
import { createReview, getReviewsByDoctor, getReviewStats } from '../controllers/reviewController';
import { authorizeRoles, verifyToken } from '../middleware/authMiddleware';

const router = express.Router();

// nowa recenzja (tylko pacjenci)
router.post('/', verifyToken, authorizeRoles('PATIENT'), createReview);

// swoje recenzje widzi tylko lekarz
router.get('/doctor/:doctorId', verifyToken, authorizeRoles('DOCTOR'), getReviewsByDoctor);

// statystki też widzi tylko lekarz
router.get('/doctor/:doctorId/stats', authorizeRoles('DOCTOR'), getReviewStats);

export default router;
