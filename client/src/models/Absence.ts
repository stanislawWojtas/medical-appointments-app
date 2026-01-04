
// Nieobecności są całodobowe
export interface Absence {
	id: string;
	doctorId: string;
	startDate: string;
	endDate: string;
	reason?: string;
}