import axios from "axios";
import type { Doctor } from "../models/Doctor";
import type { IDataProvider } from "./IDataProvider";
import type { Appointment, AppointmentType } from "../models/Appointment";
import type { Absence } from "../models/Absence";


export class NodeDataProvider implements IDataProvider {
	private api = axios.create({
		baseURL: 'http://localhost:3000/api',
		timeout: 5000,
	})	

	async getDoctors(): Promise<Doctor[]> {
		const response = await this.api.get('/doctors');
		return response.data;
	}
	
	async getDoctorById(id: string): Promise<Doctor | undefined> {
		try{
			const response = await this.api.get(`/doctors/${id}`);
			return response.data;
		}catch(error){
			if(axios.isAxiosError(error) && error.response?.status === 404){
				return undefined; // lekarz nie znaleziony
			}
			throw error;
		}
	}

	async getAppointments(doctorId: string, startDate: Date, endDate: Date): Promise<Appointment[]> {
		const response = await this.api.get('/appointments', {
			params: {doctorId, startDate: startDate.toISOString(), endDate: endDate.toISOString()}
		});
		return response.data;
	}

	async addAvailability(newSlots: Appointment[]): Promise<Appointment[]> {
		const response = await this.api.post('/appointments/availability', newSlots);
		return response.data;
	}

	async removeAppointment(appointmentId: string): Promise<void> {
		await this.api.delete(`/appointments/${appointmentId}`);
	}

	async bookAppointment(appointmentId: string, patientData: any, visitType: AppointmentType, duration: number): Promise<Appointment> {
		const response = await this.api.put(`/appointments/${appointmentId}/book`, {patientData: patientData, visitType: visitType, duration: duration});
		return response.data;
	}

	async cancelAppointmentByDoctor(appointmentId: string, reason?: string): Promise<Appointment> {
		const response = await this.api.patch(`/appointments/${appointmentId}/cancel-by-doctor`, { reason });
		return response.data;
	}

	async cancelAppointmentByPatient(appointmentId: string): Promise<Appointment> {
		const response = await this.api.patch(`/appointments/${appointmentId}/cancel-by-patient`);
		return response.data;
	}

	async getAbsences(doctorId: string): Promise<Absence[]> {
		const response = await this.api.get('/absences', {
			params: {doctorId: doctorId}
		})
		return response.data;
	}


	async addAbsence(doctorId: string, startDate: Date, endDate: Date, reason?: string): Promise<Absence> {
		const response = await this.api.post('/absences', {
			doctorId: doctorId,
			startDate: startDate,
			endDate: endDate,
			reason: reason
		});
		return response.data;
	}

	async removeAbsence(absenceId: string): Promise<void> {
		await this.api.delete(`/absences/${absenceId}`);
	}
}
