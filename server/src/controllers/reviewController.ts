import { Request, Response } from "express";
import Review from '../models/Review';
import Appointment from '../models/Appointment';
import User from '../models/User';
import mongoose from "mongoose";
import '../middleware/authMiddleware'; 

export const createReview = async (request: Request, response: Response) => {
	try {
		const { appointmentId, rating, comment } = request.body;
		const patientId = request.user?.id;

		if (!patientId) {
			return response.status(401).json({ message: "Unauthorized" });
		}

		const user = await User.findById(patientId);
		if (!user) {
			return response.status(404).json({ message: "User not found" });
		}

		if (user.isBlocked) {
			return response.status(403).json({ message: "You are blocked and cannot create reviews" });
		}

		const appointment = await Appointment.findById(appointmentId);
		if (!appointment) {
			return response.status(404).json({ message: "Appointment not found" });
		}

		if (appointment.patientId?.toString() !== patientId.toString()) {
			return response.status(403).json({ message: "You can only review your own appointments" });
		}

		if (appointment.status !== 'COMPLETED') {
			return response.status(400).json({ message: "You can only review completed appointments" });
		}

		const existingReview = await Review.findOne({ appointmentId });
		if (existingReview) {
			return response.status(400).json({ message: "You have already reviewed this appointment" });
		}

		if (rating < 1 || rating > 5) {
			return response.status(400).json({ message: "Rating must be between 1 and 5" });
		}

		const review = new Review({
			doctorId: appointment.doctorId,
			patientId: patientId,
			appointmentId: appointmentId,
			rating: rating,
			comment: comment
		});

		await review.save();

		response.status(201).json(review);
		return;
	} catch (error) {
		console.error("Error creating review:", error);
		response.status(500).json({ message: (error as Error).message });
		return;
	}
};

export const getReviewsByDoctor = async (request: Request, response: Response) => {
	try {
		const { doctorId } = request.params;

		if (!mongoose.Types.ObjectId.isValid(doctorId)) {
			return response.status(400).json({ message: "Invalid doctor ID" });
		}

		const reviews = await Review.find({ doctorId: doctorId })
			.sort({ createdAt: -1 });

		response.json(reviews);
		return;
	} catch (error) {
		console.error("Error fetching reviews:", error);
		response.status(500).json({ message: (error as Error).message });
		return;
	}
};

export const getReviewStats = async (request: Request, response: Response) => {
	try {
		const { doctorId } = request.params;

		if (!mongoose.Types.ObjectId.isValid(doctorId)) {
			return response.status(400).json({ message: "Invalid doctor ID" });
		}

		const stats = await Review.aggregate([
			{ $match: { doctorId: new mongoose.Types.ObjectId(doctorId) } },
			{
				$group: {
					_id: null,
					averageRating: { $avg: "$rating" },
					totalReviews: { $sum: 1 },
					ratingDistribution: {
						$push: "$rating"
					}
				}
			}
		]);

		if (stats.length === 0) {
			return response.json({
				averageRating: 0,
				totalReviews: 0,
				ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
			});
		}

		const distribution = stats[0].ratingDistribution.reduce((acc: Record<number, number>, rating: number) => {
			acc[rating] = (acc[rating] || 0) + 1;
			return acc;
		}, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });

		response.json({
			averageRating: Math.round(stats[0].averageRating * 10) / 10,
			totalReviews: stats[0].totalReviews,
			ratingDistribution: distribution
		});
		return;
	} catch (error) {
		console.error("Error fetching review stats:", error);
		response.status(500).json({ message: (error as Error).message });
		return;
	}
};

export const deleteReview = async (request: Request, response: Response) => {
	try {
		const { reviewId } = request.params;

		if (!mongoose.Types.ObjectId.isValid(reviewId)) {
			return response.status(400).json({ message: "Invalid review ID" });
		}

		const review = await Review.findById(reviewId);
		if (!review) {
			return response.status(404).json({ message: "Review not found" });
		}

		await Review.findByIdAndDelete(reviewId);

		return response.status(200).json({ 
			message: "Review deleted successfully",
			reviewId: reviewId
		});
	} catch (error) {
		console.error("Error deleting review:", error);
		return response.status(500).json({ message: (error as Error).message });
	}
};

