import mongoose, { Schema } from "mongoose";

export interface IPatientData {
	firstName: string;
	lastName: string;
	age: number;
	gender: "male" | "female";
	notes?: string;
}

export interface IAppointment extends Document{
	doctorId: mongoose.Types.ObjectId;
	date: Date;
	patientId?: mongoose.Types.ObjectId;
	duration: number;

	price: number;
	status: 'AVAILABLE' | 'BOOKED' | 'CANCELED' | 'COMPLETED' | 'BLOCKED';
	type?: 'FIRST_VISIT' | 'FOLLOW_UP' | 'CONSULTATION' | 'PRESCRIPTION' | 'TELEVISIT' | 'CHRONIC_CARE' | 'DIAGNOSTIC';

	patientData?: IPatientData;
}

const AppointmentSchema: Schema = new Schema({
	doctorId: {type: mongoose.Types.ObjectId, ref: 'Doctor', required: true},
	patientId: {type: mongoose.Types.ObjectId, ref: 'User', required: false},
	date: {type: Date, required: true},
	duration: {type: Number, required: true, default: 1},
	price: {type: Number, required: true},
	status: {
		type: String,
		enum: ['AVAILABLE', 'BOOKED', 'CANCELED', 'COMPLETED', 'BLOCKED'],
		default: 'AVAILABLE'
	},
	type: {
		type: String,
		enum: ['FIRST_VISIT', 'FOLLOW_UP', 'CONSULTATION', 'PRESCRIPTION', 'TELEVISIT', 'CHRONIC_CARE', 'DIAGNOSTIC'],
		required: false,
	},
	patientData: {
		firstName: {type: String},
		lastName: {type: String},
		age: {type: Number},
		gender: {type: String, enum: ['male', 'female']},
		notes: {type: String, required: false}
	}
}, {
	timestamps: true
});

AppointmentSchema.set('toJSON', {
	transform: (_document: any, returnedObject:any) => {
		returnedObject.id = returnedObject._id.toString()
		delete returnedObject._id;
		delete returnedObject.__v;
	}
})

export default mongoose.model<IAppointment>('Appointment', AppointmentSchema);