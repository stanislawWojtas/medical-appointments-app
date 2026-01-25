import type { Doctor } from "../models/Doctor";
import type { IDataProvider } from "./IDataProvider";
import type { Appointment, AppointmentType } from "../models/Appointment";
import type { Absence } from "../models/Absence";
import { api } from "../api/axiosInstance";


export class NodeDataProvider implements IDataProvider {
	// Używamy globalnej api z interceptorami
	private api = api;

	async getDoctors(): Promise<Doctor[]> {
		const response = await this.api.get('/api/doctors');
		return response.data;
	}
	
	async getDoctorById(id: string): Promise<Doctor | undefined> {
		try{
			const response = await this.api.get(`/api/doctors/${id}`);
			return response.data;
		}catch(error){
			if(error && typeof error === 'object' && 'response' in error){
				const axiosError = error as any;
				if(axiosError.response?.status === 404){
					return undefined; 
				}
			}
			throw error;
		}
	}

	async getAppointments(doctorId: string, startDate: Date, endDate: Date): Promise<Appointment[]> {
		const response = await this.api.get('/api/appointments', {
			params: {doctorId, startDate: startDate.toISOString(), endDate: endDate.toISOString()}
		});
		return response.data;
	}

	async addAvailability(newSlots: Appointment[]): Promise<Appointment[]> {
		const response = await this.api.post('/api/appointments/availability', newSlots);
		return response.data;
	}

	async removeAppointment(appointmentId: string): Promise<void> {
		await this.api.delete(`/api/appointments/${appointmentId}`);
	}

	async bookAppointment(appointmentId: string, patientData: any, visitType: AppointmentType, duration: number): Promise<Appointment> {
		const response = await this.api.put(`/api/appointments/${appointmentId}/book`, {patientData: patientData, visitType: visitType, duration: duration});
		return response.data;
	}

	async cancelAppointmentByDoctor(appointmentId: string, reason?: string): Promise<Appointment> {
		const response = await this.api.patch(`/api/appointments/${appointmentId}/cancel-by-doctor`, { reason });
		return response.data;
	}

	async cancelAppointmentByPatient(appointmentId: string): Promise<Appointment> {
		const response = await this.api.patch(`/api/appointments/${appointmentId}/cancel-by-patient`);
		return response.data;
	}

	async getAbsences(doctorId: string): Promise<Absence[]> {
		const response = await this.api.get('/api/absences', {
			params: {doctorId: doctorId}
		})
		return response.data;
	}


	async addAbsence(doctorId: string, startDate: Date, endDate: Date, reason?: string): Promise<Absence> {
		const response = await this.api.post('/api/absences', {
			doctorId: doctorId,
			startDate: startDate,
			endDate: endDate,
			reason: reason
		});
		return response.data;
	}

	async removeAbsence(absenceId: string): Promise<void> {
		await this.api.delete(`/api/absences/${absenceId}`);
	}
}
