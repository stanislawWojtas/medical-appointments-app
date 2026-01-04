import { endOfDay, startOfDay } from "date-fns";
import { api, ENDPOINTS } from "../api/axiosInstance";
import type { Absence } from "../models/Absence";
import type { Appointment, AppointmentType } from "../models/Appointment";
import type { Doctor } from "../models/Doctor";
import type { IDataProvider } from "./IDataProvider";
import { FirebaseDataProvider } from "./FirebaseDataProvider";

const USE_FIREBASE = true; // TODO: Na razie jest true/false ale domyślnie będzie firebase/node/json-server

const dataProvider: IDataProvider = USE_FIREBASE ? new FirebaseDataProvider() : null; // TODO: dodać inne implementacje IDataProvider


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

	const optimisticSlot = {...newSlot, id: Math.random().toString()} //używamy tymczasowego id do wyświetlenia w UI od razu
	
	await dataProvider.addAvailability([newSlot] as Appointment[]);

	return optimisticSlot;

}

export const removeAppointment = async (id: string) => {
	await dataProvider.removeAppointment(id);
	return {id};
}

// TODO: potem dodaj wysyłanie powiadomień do użytkowników którym anulowano wizyte
export const addAbsence = async (doctorId: string, startDate: Date, endDate: Date, reason?: string) => {
	// zamiana żeby nieobecność obejmowała całe dni
	startDate = startOfDay(startDate);
	endDate = endOfDay(endDate);
	await dataProvider.addAbsence(doctorId, startDate, endDate, reason);
}

export const getAbsences = async (doctorId: string) => {
	return await dataProvider.getAbsences(doctorId);
}

export const getDoctorById = async (id: string) => {
	return await dataProvider.getDoctorById(id);
}



export const reserveAppointment = async(id: string, visitType: AppointmentType, firstName: string, lastName:string, gender:'male'|'female', age: number, note:string) => {
	const patientData = {
		firstName: firstName,
		lastName: lastName,
		age: age,
		gender: gender,
		notes: note
	};
	await dataProvider.bookAppointment(id, patientData, visitType);
	return true;
}