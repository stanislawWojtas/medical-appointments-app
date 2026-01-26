// Klasa adaptera dzięki której będziemy mogli przełączać się pomiędzy backendami (Firebase, Serwer Node js i ewentualnie json-server)

import type { Absence } from "../models/Absence";
import type { Appointment, AppointmentType, PatientData } from "../models/Appointment";
import type { Doctor } from "../models/Doctor";
import type { Review, ReviewStats, CreateReviewDto } from "../models/Review";

export interface IDataProvider {
	getDoctors() : Promise<Doctor[]>;
	getDoctorById(id: string): Promise<Doctor | undefined>;
	
	getAppointments(doctorId: string, startDate: Date, endDate: Date): Promise<Appointment[]>;
	cancelAppointmentByDoctor(appointmentId: string, reason?: string): Promise<Appointment>;
	cancelAppointmentByPatient(appointmentId: string): Promise<Appointment>;
	addAvailability(newSlots: Appointment[]): Promise<Appointment[]>;
	removeAppointment(appointmentId: string): Promise<void>;
	bookAppointment(appointmentId: string, patientData: PatientData, visitType: AppointmentType, duration: number): Promise<Appointment>;

	getAbsences(doctorId: string): Promise<Absence[]>
	addAbsence(doctorId: string, startDate: Date, endDate: Date, reason?: string): Promise<Absence>;
	removeAbsence(absenceId: string): Promise<void>;

	// Reviews
	createReview(reviewData: CreateReviewDto): Promise<Review>;
	getReviewsByDoctor(doctorId: string): Promise<Review[]>;
	getReviewStats(doctorId: string): Promise<ReviewStats>;

}