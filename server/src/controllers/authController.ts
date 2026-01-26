import { Request, Response } from "express";
import User from "../models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

export const register = async (request: Request, response: Response) => {
	const session = await mongoose.startSession();
	session.startTransaction();
	
	try{
		const {email, password} = request.body;

		// Walidacja podstawowych danych
		if (!email || !password) {
			await session.abortTransaction();
			return response.status(400).json({message: "Email and password are required"});
		}

		// Walidacja formatu email
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			await session.abortTransaction();
			return response.status(400).json({message: "Invalid email format"});
		}

		if (password.length < 8) {
			await session.abortTransaction();
			return response.status(400).json({message: "Password must be at least 8 characters long"});
		}

		const existingUser = await User.findOne({email}).session(session);
		if(existingUser){
			await session.abortTransaction();
			return response.status(409).json({message: `User with email: ${email} already exist`});
		}

		const salt = await bcrypt.genSalt(10);
		const hashedPass = await bcrypt.hash(password, salt);

		// Publiczny endpoint rejestracji tworzy TYLKO pacjentów
		// Rejestracja lekarzy jest dostępna tylko przez admin panel
		const newUser = new User({
			email,
			password: hashedPass,
			role: 'PATIENT'
		});

		await newUser.save({session});
		await session.commitTransaction();

		return response.status(201).json({message: "User created successfully"})
	}catch(error){
		await session.abortTransaction();
		return response.status(500).json({message: (error as Error).message})
	} finally {
		session.endSession();
	}
}

export const login = async (request: Request, response: Response) => {
	try{
		const {email, password} = request.body;

		// Walidacja danych wejściowych
		if (!email || !password) {
			return response.status(400).json({message: "Email and password are required"});
		}

		const user = await User.findOne({email}).populate('doctorId', 'firstName lastName');
		if(!user){
			return response.status(400).json({message: "Invalid credentials"});
		}
		const isMatch = await bcrypt.compare(password, user.password);
		if(!isMatch){
			return response.status(400).json({message: "Invalid credentials"});
		}

		// Sprawdzenie czy JWT_SECRET istnieje
		if (!process.env.JWT_SECRET) {
			throw new Error("JWT_SECRET is not defined in environment variables");
		}

		//Wygenerowanie tokena
		const token = jwt.sign({
			id: user._id,
			role: user.role,
			doctorId: user.doctorId?._id || user.doctorId,
		},
		process.env.JWT_SECRET,
		{expiresIn: '1h'}); //Token ważny przez godzinę

		// Type assertion dla populated doctorId
		const doctorData = user.doctorId as any;

		return response.json({
			token,
			user: {
				id: user._id,
				email: user.email,
				role: user.role,
				doctorId: doctorData?._id || user.doctorId,
				firstName: doctorData?.firstName,
				lastName: doctorData?.lastName
			}
		});
	}catch(error){
		return response.status(500).json({message: (error as Error).message})
	}
}