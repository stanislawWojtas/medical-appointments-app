// Klasa adaptera dzięki której będziemy mogli przełączać się pomiędzy backendami (Firebase, Serwer Node js i ewentualnie json-server)

import type { Absence } from "../models/Absence";
import type { Appointment, AppointmentType, PatientData } from "../models/Appointment";
import type { Doctor } from "../models/Doctor";
import type { Review, ReviewStats, CreateReviewDto } from "../models/Review";

export interface LoginResponse {
	token: string;
	user: {
		id: string;
		email: string;
		role: string;
	};
}

export interface RegisterPayload {
	email: string;
	password: string;
	role: 'PATIENT' | 'DOCTOR';
	firstname?: string;
	lastname?: string;
	specialization?: string;
	pricePerVisit?: number;
}

export interface RegisterDoctorPayload {
	email: string;
	password: string;
	firstName: string;
	lastName: string;
	specialization: string;
	pricePerVisit?: number;
}

export interface Patient {
	id: string;
	email: string;
	isBlocked: boolean;
	createdAt: string;
}

export interface DoctorWithReviews extends Doctor {
	reviews: Review[];
}

export interface IDataProvider {
	// Authentication
	login(email: string, password: string): Promise<LoginResponse>;
	register(payload: RegisterPayload): Promise<void>;

	// Doctors
	getDoctors() : Promise<Doctor[]>;
	getDoctorById(id: string): Promise<Doctor | undefined>;
	
	// Appointments
	getAppointments(doctorId: string, startDate: Date, endDate: Date): Promise<Appointment[]>;
	getMyAppointments(): Promise<Appointment[]>;
	cancelAppointmentByDoctor(appointmentId: string, reason?: string): Promise<Appointment>;
	cancelAppointmentByPatient(appointmentId: string): Promise<Appointment>;
	addAvailability(newSlots: Appointment[]): Promise<Appointment[]>;
	removeAppointment(appointmentId: string): Promise<void>;
	bookAppointment(appointmentId: string, patientData: PatientData, visitType: AppointmentType, duration: number): Promise<Appointment>;

	// Absences
	getAbsences(doctorId: string): Promise<Absence[]>
	addAbsence(doctorId: string, startDate: Date, endDate: Date, reason?: string): Promise<Absence>;
	removeAbsence(absenceId: string): Promise<void>;

	// Reviews
	createReview(reviewData: CreateReviewDto): Promise<Review>;
	getReviewsByDoctor(doctorId: string): Promise<Review[]>;
	getReviewStats(doctorId: string): Promise<ReviewStats>;

	// Admin operations
	registerDoctor(payload: RegisterDoctorPayload): Promise<void>;
	getAllPatients(): Promise<Patient[]>;
	blockUser(userId: string): Promise<void>;
	unblockUser(userId: string): Promise<void>;
	getAllDoctorsWithReviews(): Promise<DoctorWithReviews[]>;
	deleteReview(reviewId: string): Promise<void>;

}