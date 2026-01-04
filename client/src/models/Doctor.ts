export type DoctorSpecialization = 
	| 'GENERAL' 
	| 'CARDIOLOGIST' 
	| 'DERMATOLOGIST' 
	| 'ENDOCRINOLOGIST' 
	| 'NEUROLOGIST' 
	| 'OPHTHALMOLOGIST' 
	| 'ORTHOPEDIST' 
	| 'PEDIATRICIAN' 
	| 'PSYCHIATRIST' 
	| 'LARYNGOLOGIST';


export interface Doctor {
	id: string;
	firstName: string;
	lastName: string;
	specialization: DoctorSpecialization;
	pricePerVisit: number;
};