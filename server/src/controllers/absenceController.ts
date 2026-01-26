import { Request, Response } from "express"
import Absence, { IAbsence } from "../models/Absence";
import Appointment from "../models/Appointment";
import mongoose from "mongoose";

export const getAbsences = async (request: Request, response: Response) => {
	try{
		const {doctorId} = request.query as { doctorId: string };
		if(!doctorId){
			return response.status(400).json({message: "Doctor ID is required"});
		}
		const absences = await Absence.find({
			doctorId
		});
		response.status(200).json(absences);
		return;
	}catch(error){
		response.status(500).json({message: 'Error fetching absences: ', error});
		return;
	}
}

export const addAbsence = async (request: Request, response: Response) => {
	const session = mongoose.startSession();
	(await session).startTransaction();
	try{
		const { doctorId, startDate, endDate, reason }: IAbsence = request.body;
		if(!doctorId || !startDate || !endDate) {
			return response.status(400).json({message: "Doctor ID, startDate, endDate are required"});
		}
		// Weryfikacja: czy lekarz może dodać nieobecność tylko dla siebie
		const userDoctorId = request.user?.doctorId;
		if (!userDoctorId || doctorId.toString() !== userDoctorId.toString()) {
			return response.status(403).json({message: "You can only add absences for your own schedule"});
		}
		const start = new Date(startDate);
		const end = new Date(endDate);
		
		const newAbsence = new Absence({doctorId, startDate: start, endDate: end, reason});
		const savedAbsence = await newAbsence.save();
		if (!savedAbsence){
			return response.status(404).json({message: "Unable to save absence into database"});
		}

		// Usuwamy wolne appointment w terminie absencji
		await Appointment.deleteMany({
			doctorId: doctorId,
			date: {$gte: start, $lte: end},
			status: "AVAILABLE"
		})

		// Aktualizacja appointment które są booked (na canceled)
		await Appointment.updateMany({
			doctorId: doctorId, 
			date: {$gte: start, $lte: end},
			status: "BOOKED",
		},
		{
			$set: {status: "CANCELED"}
		})

		response.status(201).json(savedAbsence);
		return;
	} catch (error){
		response.status(500).json({message: "Error during creating new absence: ", error});
		return;
	}finally{
		(await session).endSession()
	}
}

export const removeAbsence = async (request: Request, response: Response) => {
	try {
		const { id } = request.params;
		
		if (!id) {
			return response.status(400).json({ message: "Absence ID is required" });
		}

		const absence = await Absence.findById(id);
		if (!absence) {
			return response.status(404).json({ message: "Absence not found" });
		}

		// Weryfikacja: czy nieobecność należy do zalogowanego lekarza
		const userDoctorId = request.user?.doctorId;
		if (!userDoctorId || absence.doctorId?.toString() !== userDoctorId.toString()) {
			return response.status(403).json({message: "You can only remove your own absences"});
		}


		await Appointment.deleteMany({
			doctorId: absence.doctorId,
			date: { $gte: absence.startDate, $lte: absence.endDate }
		});

		await Absence.deleteOne({ _id: id });

		response.status(200).json({ message: "Absence and related appointments removed successfully" });
		return;
	} catch (error) {
		response.status(500).json({ message: "Error removing absence", error });
		return;
	}
}