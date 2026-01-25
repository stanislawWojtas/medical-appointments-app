import { endOfDay, startOfDay } from "date-fns";
import type { Appointment, AppointmentType } from "../models/Appointment";
import type { IDataProvider } from "./IDataProvider";
import { FirebaseDataProvider } from "./FirebaseDataProvider";
import { NodeDataProvider } from "./NodeJsDataProvider";

const USE_FIREBASE = false; // TODO: Na razie jest true/false ale domyślnie będzie firebase/node/json-server

const dataProvider: IDataProvider = USE_FIREBASE ? new FirebaseDataProvider() : new NodeDataProvider(); // TODO: dodać inne implementacje IDataProvider (json-server)


export const getAppointmentsByDates = async (startDate: Date, endDate: Date, doctorId: string) => {
	return await dataProvider.getAppointments(doctorId, startOfDay(startDate), endOfDay(endDate));
}


export const createAvailability = async (doctorId: string, date: Date) => {

	const newSlot: Partial<Appointment> = {
		doctorId: doctorId,
		date: date.toISOString(),
		duration: 1,
		status: "AVAILABLE",
		price: 0
	};
	
	const createdAppointments = await dataProvider.addAvailability([newSlot] as Appointment[]);

	return createdAppointments[0]; // zwracamy pierwsze (i jedyne) utworzone appointment z prawdziwym ID

}

export const removeAppointment = async (id: string) => {
	await dataProvider.removeAppointment(id);
	return {id};
}

export const cancelAppointmentByDoctor = async (appointmentId: string, reason?: string) => {
	return await dataProvider.cancelAppointmentByDoctor(appointmentId, reason);
}

export const cancelAppointmentByPatient = async (appointmentId: string) => {
	return await dataProvider.cancelAppointmentByPatient(appointmentId);
}

// TODO: potem dodaj wysyłanie powiadomień do użytkowników którym anulowano wizyte
export const addAbsence = async (doctorId: string, startDate: Date, endDate: Date, reason?: string) => {
	// zamiana żeby nieobecność obejmowała całe dni
	startDate = startOfDay(startDate);
	endDate = endOfDay(endDate);
	return await dataProvider.addAbsence(doctorId, startDate, endDate, reason);
}

export const getAbsences = async (doctorId: string) => {
	return await dataProvider.getAbsences(doctorId);
}

export const removeAbsence = async (absenceId: string) => {
	await dataProvider.removeAbsence(absenceId);
	return { id: absenceId };
}

export const getDoctorById = async (id: string) => {
	return await dataProvider.getDoctorById(id);
}



export const reserveAppointment = async(id: string, visitType: AppointmentType, firstName: string, lastName:string, gender:'male'|'female', age: number, slotsNum: number,  note:string) => {
	const patientData = {
		firstName: firstName,
		lastName: lastName,
		age: age,
		gender: gender,
		notes: note
	};
	return await dataProvider.bookAppointment(id, patientData, visitType, slotsNum);
}