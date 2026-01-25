// Klasa adaptera dzięki której będziemy mogli przełączać się pomiędzy backendami (Firebase, Serwer Node js i ewentualnie json-server)

import type { Absence } from "../models/Absence";
import type { Appointment, AppointmentType } from "../models/Appointment";
import type { Doctor } from "../models/Doctor";

export interface IDataProvider {
	getDoctors() : Promise<Doctor[]>;
	getDoctorById(id: string): Promise<Doctor | undefined>;
	
	getAppointments(doctorId: string, startDate: Date, endDate: Date): Promise<Appointment[]>;
	cancelAppointmentByDoctor(appointmentId: string, reason?: string): Promise<Appointment>;
	cancelAppointmentByPatient(appointmentId: string): Promise<Appointment>;
	addAvailability(newSlots: Appointment[]): Promise<Appointment[]>;
	removeAppointment(appointmentId: string): Promise<void>;
	// TODO: wytwórz interfejs patientData i zmien formularz żeby przesyłał ten interfejs a nie wszystko osobno
	bookAppointment(appointmentId: string, patientData: any, visitType: AppointmentType, duration: number): Promise<Appointment>;

	getAbsences(doctorId: string): Promise<Absence[]>
	// TODO: zmień dane absence na jakiś jeden interfejs
	addAbsence(doctorId: string, startDate: Date, endDate: Date, reason?: string): Promise<Absence>;
	removeAbsence(absenceId: string): Promise<void>;

	

}