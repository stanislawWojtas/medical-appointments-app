import { Request, Response } from "express";
import { getAppointmentsByDoctorAndDates } from "../services/appointmentService";
import Appointment, { IAppointment, IPatientData } from '../models/Appointment';
import mongoose  from "mongoose";

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

        // Weryfikacja: czy wszystkie sloty należą do zalogowanego lekarza
        const userDoctorId = request.user?.doctorId;
        if (!userDoctorId) {
            return response.status(403).json({message: "Doctor ID not found in user profile"});
        }

        for (const slot of newSlots) {
            if (slot.doctorId?.toString() !== userDoctorId.toString()) {
                return response.status(403).json({message: "You can only add availability for your own schedule"});
            }
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

        // Weryfikacja: czy wizyta należy do zalogowanego lekarza
        const appointment = await Appointment.findById(id);
        if (!appointment) {
            return response.status(404).json({message: "Appointment not found"});
        }

        const userDoctorId = request.user?.doctorId;
        if (!userDoctorId || appointment.doctorId?.toString() !== userDoctorId.toString()) {
            return response.status(403).json({message: "You can only remove your own appointments"});
        }

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

export const cancelAppointmentByDoctor = async(request: Request, response: Response) =>{
    const session = await mongoose.startSession();
    try{
        session.startTransaction();

        const {id} = request.params;
        const {reason} = request.body;

        const mainSlot = await Appointment.findById(id).session(session);
        if(!mainSlot){
            await session.abortTransaction();
            return response.status(404).json({message: "Appointment not found"});
        }

        // Weryfikacja: czy wizyta należy do zalogowanego lekarza
        const userDoctorId = request.user?.doctorId;
        if (!userDoctorId || mainSlot.doctorId?.toString() !== userDoctorId.toString()) {
            await session.abortTransaction();
            return response.status(403).json({message: "You can only cancel your own appointments"});
        }

        if(mainSlot.status !== 'BOOKED'){
            await session.abortTransaction();
            return response.status(400).json({message: "Only booked appointments can be canceled"});
        };

        mainSlot.status = 'CANCELED';
        if(reason) mainSlot.cancelReason = reason;
        await mainSlot.save({session})

        // handling spotkań dłuższych niż 30 minut
        if(mainSlot.duration > 1){
            for(let i = 1; i < mainSlot.duration; i++){
                const nextTime = new Date(mainSlot.date.getTime() + i * 30 * 60000);
                const blockedSlot = await Appointment.findOne({
                    doctorId: mainSlot.doctorId,
                    date: nextTime,
                    status: 'BLOCKED'
                }).session(session);

                if(blockedSlot){
                    blockedSlot.status = 'CANCELED';
                    await blockedSlot.save({session})
                }
            }
        }

        await session.commitTransaction();
        response.status(200).json(mainSlot);
        return;
    }catch(error){
        await session.abortTransaction();
        response.status(500).json({message: "Error canceling appointment: ", error});
        return;
    }finally{
        session.endSession();
    }
}

export const cancelAppointmentByPatient = async (request: Request, response: Response) => {
    const session = await mongoose.startSession();
    try{
        session.startTransaction();

        const {id} = request.params;

        const mainSlot = await Appointment.findById(id).session(session);
        if(!mainSlot){
            await session.abortTransaction();
            return response.status(404).json({message: "Appointment not found"});
        }

        if(mainSlot.status !== 'BOOKED'){
            await session.abortTransaction();
            return response.status(400).json({message: "Only booked appointments can be canceled"})
        }

        //zwolnienie slotu głównego
        mainSlot.status = 'AVAILABLE';
        mainSlot.patientData = undefined;
        mainSlot.type = undefined;
        const duration = mainSlot.duration;
        mainSlot.duration = 1;
        await mainSlot.save({session});

        // jeżeli slot jest dłuższy niż 30 min
        if(duration > 1){
            for (let i = 0; i < duration; i++){
                const nextTime = new Date(mainSlot.date.getTime() + i * 30 * 60000);
                const blockedSlot = await Appointment.findOne({
                    doctorId: mainSlot.doctorId,
                    date: nextTime,
                    status: 'BLOCKED'
                }).session(session);
                
                if (blockedSlot) {
                    blockedSlot.status = 'AVAILABLE';
                    await blockedSlot.save({ session });
                }
            }
        }

        await session.commitTransaction();
        response.status(200).json(mainSlot);
        return;
    }catch(error){
        await session.abortTransaction();
        response.status(500).json({message: "Error canceling appointment", error});
        return;
    }finally{
        session.endSession();
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
        mainSlot.patientId = new mongoose.Types.ObjectId(request.user?.id);
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

export const getMyAppointments = async (request: Request, response: Response) => {
    try {
        const userId = request.user?.id;
        
        if (!userId) {
            return response.status(401).json({ message: "User not authenticated" });
        }

        // Automatyczna zmiana statusu BOOKED -> COMPLETED dla wizyt które już minęły
        const now = new Date();
        await Appointment.updateMany(
            {
                patientId: userId,
                status: 'BOOKED',
                date: { $lt: now }
            },
            {
                $set: { status: 'COMPLETED' }
            }
        );

        // wszystkie wizyty pacjenta (BOOKED, COMPLETED, CANCELLED) posortowane od najnowszych
        const appointments = await Appointment.find({
            patientId: userId,
            status: { $in: ['BOOKED', 'COMPLETED', 'CANCELED'] }
        })
        .populate('doctorId', 'firstName lastName specialization')
        .sort({ date: 1 }); 

   
        const formattedAppointments = appointments.map(apt => ({
            id: apt._id.toString(),
            doctorId: apt.doctorId?._id?.toString() || apt.doctorId,
            patientId: apt.patientId?.toString(),
            date: apt.date,
            duration: apt.duration,
            price: apt.price,
            status: apt.status,
            type: apt.type,
            patientData: apt.patientData ? {
                firstName: apt.patientData.firstName,
                lastName: apt.patientData.lastName,
                age: apt.patientData.age,
                gender: apt.patientData.gender,
                notes: apt.patientData.notes
            } : undefined,
            doctor: apt.doctorId && typeof apt.doctorId === 'object' ? {
                firstName: (apt.doctorId as any).firstName,
                lastName: (apt.doctorId as any).lastName,
                specialization: (apt.doctorId as any).specialization
            } : undefined
        }));

        response.json(formattedAppointments);
        return;
    } catch (error) {
        response.status(500).json({ message: "Error fetching appointments", error });
        return;
    }
}
