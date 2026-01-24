import { Request, Response } from "express";
import { getAppointmentsByDoctorAndDates } from "../services/appointmentService";
import Appointment, { IAppointment, IPatientData } from '../models/Appointment';
import mongoose from "mongoose";

type VisitType = Exclude<IAppointment["type"], undefined>;


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

    // ta metoda może wymagać wielu operacji na bazie więc używamy transakcji żeby było bezpiecznie
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const { id } = request.params;
        const { patientData, visitType, duration }: { patientData: IPatientData; visitType: VisitType; duration: number } = request.body;
        if (!patientData || !visitType) {
            await session.abortTransaction();
            return response.status(400).json({ message: "Invalid input: expected non-empty patientData and visitType" });
        }

        if(!duration || duration < 1 || duration > 8){
            await session.abortTransaction();
            return response.status(400).json({message: "Invalid duration. Numebr must be within 1 and 8 slots"})
        }
        
        const mainSlot= await Appointment.findById(id).session(session);
        if(!mainSlot || mainSlot.status !== "AVAILABLE"){
            await session.abortTransaction();
            return response.status(400).json({message: "Appointment is not available"});
        }

        // mechanizm blokowania slotów gdy duration > 1
        const slotsToBlock = [];
        if(duration > 1){
            for(let i = 1 ; i < duration; i++){
                const nextTime = new Date(mainSlot.date.getTime() + i * 30 * 60000);
                const nextSlot = await Appointment.findOne({
                    doctorId: mainSlot.doctorId,
                    date: nextTime,
                    status: 'AVAILABLE'
                }).session(session);

                if(!nextSlot){
                    await session.abortTransaction();
                    return response.status(409).json({
                        message: `Cannot book appointment. Slot at ${nextTime.toLocaleString('pl-PL')} is not available`
                    });
                }
                slotsToBlock.push(nextSlot);
            }
        }
        
        mainSlot.status = 'BOOKED';
        mainSlot.patientData = patientData;
        mainSlot.type = visitType;
        mainSlot.duration = duration;
        await mainSlot.save({ session });

        await Promise.all(slotsToBlock.map(slot => {
            slot.status = 'BLOCKED';
            return slot.save({ session });
        }));


        await session.commitTransaction();
        response.status(200).json(mainSlot);
        return;
    } catch (error) {
        response.status(500).json({ message: "Error during booking appointment", error });
        return;
    } finally{
        session.endSession();
    }
}
