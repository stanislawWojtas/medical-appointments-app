import { Request, Response } from "express";
import User from "../models/User";
import bcrypt from "bcryptjs";
import Doctor from "../models/Doctor";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

export const register = async (request: Request, response: Response) => {
	const session = await mongoose.startSession();
	session.startTransaction();
	
	try{
		const {email, password, role, firstName, lastName, specialization, pricePerVisit} = request.body;

		// Walidacja podstawowych danych
		if (!email || !password) {
			await session.abortTransaction();
			return response.status(400).json({message: "Email and password are required"});
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

		const newUser = new User({
			email,
			password: hashedPass,
			role: role || 'PATIENT'
		});

		//jeżeli rejestrujemy lekarza to tworzymy mu od razu profil
		if (role === 'DOCTOR'){
			console.log(firstName, lastName, specialization)
			if(!firstName || !lastName || !specialization){
				await session.abortTransaction();
				return response.status(400).json({message: "Doctor must provide firstname, lastname and specialization"});
			}
			const newDoctor = new Doctor({
				firstName,
				lastName, 
				specialization,
				pricePerVisit: pricePerVisit || 150 // domyślnie cena to 150
			});
			const savedDoctor = await newDoctor.save({session});
			newUser.doctorId = savedDoctor._id as any;
		}

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

		const user = await User.findOne({email});
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
			doctorId: user.doctorId,
		},
		process.env.JWT_SECRET,
		{expiresIn: '1h'}); //Token ważny przez godzinę

		return response.json({
			token,
			user: {
				id: user._id,
				email: user.email,
				role: user.role,
				doctorId: user.doctorId
			}
		});
	}catch(error){
		return response.status(500).json({message: (error as Error).message})
	}
}