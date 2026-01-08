import Appointment from "../models/Appointment";


export const getAppointmentsByDoctorAndDates = async (doctorId: string, startDate: string, endDate: string) => {

	// Walidacja
	if(!doctorId || !startDate || !endDate){
		throw new Error("Missing required parameters")
	}

	const start = new Date(startDate);
	const end = new Date(endDate);

	if(isNaN(start.getDate()) || isNaN(end.getDate())){
		throw new Error("Invdalid date format");
	}

	if(start > end){
		throw new Error("startDate cannot be after endDate");
	}

	const appointments = await Appointment.find({
		doctorId: doctorId,
		date: {$gte: start, $lte: end}
	})

	return appointments;
}