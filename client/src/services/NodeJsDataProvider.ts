import type { Doctor } from "../models/Doctor";
import type { IDataProvider, LoginResponse, RegisterPayload, RegisterDoctorPayload, Patient, DoctorWithReviews } from "./IDataProvider";
import type { Appointment, AppointmentType, PatientData } from "../models/Appointment";
import type { Absence } from "../models/Absence";
import type { Review, ReviewStats, CreateReviewDto } from "../models/Review";
import { api } from "../api/axiosInstance";


export class NodeDataProvider implements IDataProvider {
	// Używamy globalnej api z interceptorami
	private api = api;

	async login(email: string, password: string): Promise<LoginResponse> {
		const response = await this.api.post('/api/auth/login', {
			email,
			password
		});
		return response.data;
	}

	async register(payload: RegisterPayload): Promise<void> {
		await this.api.post('/api/auth/register', payload);
	}

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
				const axiosError = error as { response?: { status?: number } };
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

	async getMyAppointments(): Promise<Appointment[]> {
		const response = await this.api.get('/api/appointments/my-appointments');
		return response.data;
	}

	async addAvailability(newSlots: Appointment[]): Promise<Appointment[]> {
		const response = await this.api.post('/api/appointments/availability', newSlots);
		return response.data;
	}

	async removeAppointment(appointmentId: string): Promise<void> {
		await this.api.delete(`/api/appointments/${appointmentId}`);
	}

	async bookAppointment(appointmentId: string, patientData: PatientData, visitType: AppointmentType, duration: number): Promise<Appointment> {
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

	async createReview(reviewData: CreateReviewDto): Promise<Review> {
		const response = await this.api.post('/api/reviews', reviewData);
		return response.data;
	}

	async getReviewsByDoctor(doctorId: string): Promise<Review[]> {
		const response = await this.api.get(`/api/reviews/doctor/${doctorId}`);
		return response.data;
	}

	async getReviewStats(doctorId: string): Promise<ReviewStats> {
		const response = await this.api.get(`/api/reviews/doctor/${doctorId}/stats`);
		return response.data;
	}

	// Admin operations
	async registerDoctor(payload: RegisterDoctorPayload): Promise<void> {
		await this.api.post('/api/admin/register-doctor', payload);
	}

	async getAllPatients(): Promise<Patient[]> {
		const response = await this.api.get('/api/admin/patients');
		return response.data;
	}

	async blockUser(userId: string): Promise<void> {
		await this.api.patch(`/api/admin/users/${userId}/block`);
	}

	async unblockUser(userId: string): Promise<void> {
		await this.api.patch(`/api/admin/users/${userId}/unblock`);
	}

	async getAllDoctorsWithReviews(): Promise<DoctorWithReviews[]> {
		const response = await this.api.get('/api/admin/doctors-with-reviews');
		return response.data;
	}

	async deleteReview(reviewId: string): Promise<void> {
		await this.api.delete(`/api/admin/reviews/${reviewId}`);
	}
}
