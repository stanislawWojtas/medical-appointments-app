// typ wizyty
export type AppointmentType = 'FIRST_VISIT' | 'FOLLOW_UP' | 'CONSULTATION' | 'PRESCRIPTION' | 'TELEVISIT' | 'CHRONIC_CARE' | 'DIAGNOSTIC';
// status wizyty
export type AppointmentStatus = 'AVAILABLE' | 'BOOKED' | 'CANCELED' | 'COMPLETED' | 'BLOCKED';

export interface PatientData {
	firstName: string;
	lastName: string;
	age: number;
	gender: 'male' | 'female';
	notes?: string;
}

export interface Appointment {
	id: string;
	doctorId: string;
	patientId?: string;
	date: string;
	duration: number; //ile slotów (po 30min) zajmuje

	price: number;
	status: AppointmentStatus;
	type?: AppointmentType;

	// dane pacjenta
	patientData?: PatientData;
	
	// informacje o lekarzu (populated)
	doctor?: {
		firstName: string;
		lastName: string;
		specialization: string;
	};
}