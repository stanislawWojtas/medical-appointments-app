import { Request, Response } from "express";
import Doctor from "../models/Doctor"


// GET /doctors
export const getDoctors = async (_request: Request, response: Response) => {
	try {
		const doctors = await Doctor.find();
		response.json(doctors);
	} catch(error){
		response.status(500).json({ message: (error as Error).message});
	}
}

// GET /doctors/:id

export const getDoctorById = async (request: Request, response: Response) => {
	try{
		const doctor = await Doctor.findById(request.params.id);
		if(doctor){
			response.json(doctor);
		}else{
			response.status(404).json({message: "Doctor not found"});
		}
	}catch (error){
		response.status(500).json({message: (error as Error).message});
	}
}