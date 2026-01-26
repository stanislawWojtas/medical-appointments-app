import { Request, Response } from "express";
import User from "../models/User";
import Doctor from "../models/Doctor";
import Review from "../models/Review";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

// Rejestracja nowego lekarza (tylko przez admina)
export const registerDoctor = async (request: Request, response: Response) => {
	const session = await mongoose.startSession();
	session.startTransaction();
	
	try {
		const { email, password, firstName, lastName, specialization, pricePerVisit } = request.body;

		if (!email || !password || !firstName || !lastName || !specialization) {
			await session.abortTransaction();
			return response.status(400).json({ message: "All fields are required for doctor registration" });
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			await session.abortTransaction();
			return response.status(400).json({ message: "Invalid email format" });
		}

		if (password.length < 8) {
			await session.abortTransaction();
			return response.status(400).json({ message: "Password must be at least 8 characters long" });
		}

		const existingUser = await User.findOne({ email }).session(session);
		if (existingUser) {
			await session.abortTransaction();
			return response.status(409).json({ message: `User with email: ${email} already exists` });
		}

		const salt = await bcrypt.genSalt(10);
		const hashedPass = await bcrypt.hash(password, salt);

		const newDoctor = new Doctor({
			firstName,
			lastName, 
			specialization,
			pricePerVisit: pricePerVisit || 150 // domyślnie cena to 150
		});
		const savedDoctor = await newDoctor.save({ session });

		const newUser = new User({
			email,
			password: hashedPass,
			role: 'DOCTOR',
			doctorId: savedDoctor._id
		});

		await newUser.save({ session });
		await session.commitTransaction();

		return response.status(201).json({ 
			message: "Doctor registered successfully",
			doctor: {
				id: savedDoctor._id,
				firstName: savedDoctor.firstName,
				lastName: savedDoctor.lastName,
				specialization: savedDoctor.specialization,
				email: newUser.email
			}
		});
	} catch (error) {
		await session.abortTransaction();
		return response.status(500).json({ message: (error as Error).message });
	} finally {
		session.endSession();
	}
};

export const getAllPatients = async (_request: Request, response: Response) => {
	try {
		const patients = await User.find({ role: 'PATIENT' })
			.select('email isBlocked createdAt')
			.sort({ createdAt: -1 });
		
		return response.status(200).json(patients);
	} catch (error) {
		return response.status(500).json({ message: (error as Error).message });
	}
};

export const blockUser = async (request: Request, response: Response) => {
	try {
		const { userId } = request.params;

		const user = await User.findById(userId);
		if (!user) {
			return response.status(404).json({ message: "User not found" });
		}

		if (user.role === 'ADMIN') {
			return response.status(403).json({ message: "Cannot block admin users" });
		}

		user.isBlocked = true;
		await user.save();

		return response.status(200).json({ 
			message: "User blocked successfully",
			user: { id: user._id, email: user.email, isBlocked: user.isBlocked }
		});
	} catch (error) {
		return response.status(500).json({ message: (error as Error).message });
	}
};

export const unblockUser = async (request: Request, response: Response) => {
	try {
		const { userId } = request.params;

		const user = await User.findById(userId);
		if (!user) {
			return response.status(404).json({ message: "User not found" });
		}

		user.isBlocked = false;
		await user.save();

		return response.status(200).json({ 
			message: "User unblocked successfully",
			user: { id: user._id, email: user.email, isBlocked: user.isBlocked }
		});
	} catch (error) {
		return response.status(500).json({ message: (error as Error).message });
	}
};

export const getAllDoctorsWithReviews = async (_request: Request, response: Response) => {
	try {
		const doctors = await Doctor.find().lean();
		
		// Dla każdego lekarza pobieramy jego komentarze
		const doctorsWithReviews = await Promise.all(
			doctors.map(async (doctor) => {
				const reviews = await Review.find({ doctorId: doctor._id })
					.populate('patientId', 'email')
					.sort({ createdAt: -1 })
					.lean();
				
				return {
					...doctor,
					reviews: reviews
				};
			})
		);

		return response.status(200).json(doctorsWithReviews);
	} catch (error) {
		return response.status(500).json({ message: (error as Error).message });
	}
};
