import { endOfDay, startOfDay } from "date-fns";
import type { Appointment, AppointmentType } from "../models/Appointment";
import type { IDataProvider, LoginResponse, RegisterPayload, RegisterDoctorPayload } from "./IDataProvider";
import type { CreateReviewDto } from "../models/Review";
import { FirebaseDataProvider } from "./FirebaseDataProvider";
import { NodeDataProvider } from "./NodeJsDataProvider";

// TUTAJ ZMIENIA SIĘ BACKEND NODE JS LUB FIREBASE
// ====================================================================
const USE_FIREBASE = false;
// ====================================================================

const dataProvider: IDataProvider = USE_FIREBASE ? new FirebaseDataProvider() : new NodeDataProvider();

// Authentication
export const login = async (email: string, password: string): Promise<LoginResponse> => {
	return await dataProvider.login(email, password);
}

export const register = async (payload: RegisterPayload): Promise<void> => {
	return await dataProvider.register(payload);
}

// Doctors
export const getDoctors = async () => {
	return await dataProvider.getDoctors();
}

export const getDoctorById = async (id: string) => {
	return await dataProvider.getDoctorById(id);
}

// Appointments
export const getAppointmentsByDates = async (startDate: Date, endDate: Date, doctorId: string) => {
	return await dataProvider.getAppointments(doctorId, startOfDay(startDate), endOfDay(endDate));
}

export const getMyAppointments = async () => {
	return await dataProvider.getMyAppointments();
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

export const reserveAppointment = async(
	id: string, 
	visitType: AppointmentType, 
	firstName: string, 
	lastName: string, 
	gender: 'male' | 'female', 
	age: number,
	slotsNum: number,  
	note: string
) => {
	const patientData = {
		firstName: firstName,
		lastName: lastName,
		age: age,
		gender: gender,
		notes: note
	};
	return await dataProvider.bookAppointment(id, patientData, visitType, slotsNum);
}

export const createReview = async (appointmentId: string, rating: number, comment: string) => {
	const reviewData: CreateReviewDto = {
		appointmentId,
		rating,
		comment
	};
	return await dataProvider.createReview(reviewData);
}

export const getReviewsByDoctor = async (doctorId: string) => {
	return await dataProvider.getReviewsByDoctor(doctorId);
}
// Admin operations
export const registerDoctor = async (payload: RegisterDoctorPayload) => {
	return await dataProvider.registerDoctor(payload);
}

export const getAllPatients = async () => {
	return await dataProvider.getAllPatients();
}

export const blockUser = async (userId: string) => {
	return await dataProvider.blockUser(userId);
}

export const unblockUser = async (userId: string) => {
	return await dataProvider.unblockUser(userId);
}

export const getAllDoctorsWithReviews = async () => {
	return await dataProvider.getAllDoctorsWithReviews();
}
export const getReviewStats = async (doctorId: string) => {
	return await dataProvider.getReviewStats(doctorId);
}
export const deleteReview = async (reviewId: string) => {
	return await dataProvider.deleteReview(reviewId);
}