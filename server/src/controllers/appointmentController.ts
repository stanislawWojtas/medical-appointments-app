import { Request, Response } from "express";
import { getAppointmentsByDoctorAndDates } from "../services/appointmentService";
import Appointment, { IAppointment, IPatientData } from '../models/Appointment';


export const getAppointments = async (request: Request, response: Response) => {
    try {
        const { doctorId, startDate, endDate } = request.query as { doctorId: string; startDate: string; endDate: string };  // Jawne typowanie
        
        const appointments = await getAppointmentsByDoctorAndDates(doctorId, startDate, endDate);
        response.json(appointments);
        return;
    } catch (error) {
        response.status(500).json({ message: (error as Error).message });
        return;
    }
};

export const addAvaibility = async (request: Request, response: Response) => {
    try{
        const newSlots: IAppointment = request.body;

        if (!Array.isArray(newSlots) || newSlots.length === 0){
            return response.status(400).json({message: "Invalid input: expected non-empty array of appointments"});
        }
        const appointments = await Appointment.insertMany(newSlots);

        response.status(201).json(appointments);
        return;
    }catch(error){
        response.status(500).json({message: (error as Error).message});
        return;
    }
}

export const removeAppointment = async (request: Request, response: Response) => {
    try{
        const {id} = request.params;

        if(!id){
            return response.status(400).json({message: "Appointment ID is required"})
        };

        const result = await Appointment.deleteOne({_id: id});
        if(result.deletedCount === 0){
            return response.status(404).json({message: "Appointment not found"});
        }

        response.status(200).json({message: "Appointment removed successfully"});
        return;
    }catch(error){
        response.status(500).json({message: "Error during removing availability:, ", error});
        return;
    }
}

export const bookAppointment = async (request: Request, response: Response) => {
    try {
        const { id } = request.params;
        const { patientData, visitType }: { patientData: IPatientData, visitType: string } = request.body;
        if (!patientData || !visitType) {
            return response.status(400).json({ message: "Invalid input: expected non-empty patientData and visitType" });
        }
        const appointment = await Appointment.findOneAndUpdate(
            { _id: id, status: 'AVAILABLE' },  // musi być dodatkowo 'AVAILABLE' - to rozwiązuje problem dwóch rezerwacji w tym samym czasie
            { $set: { patientData, type: visitType, status: 'BOOKED' } },
            { new: true }
        );
        if (!appointment) {
            return response.status(404).json({ message: "Appointment not found or already booked" });
        }
        response.status(200).json(appointment);
        return;
    } catch (error) {
        response.status(500).json({ message: "Error during booking appointment", error });
        return;
    }
}
