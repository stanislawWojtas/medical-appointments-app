import mongoose, { Document, Schema } from "mongoose";

export interface IDoctor extends Document{
	id: mongoose.Types.ObjectId;
	firstName: string;
	lastName: string;
	specialization: string;
	pricePerVisit: number;
}

const DoctorSchema: Schema = new Schema({
	id: {type: mongoose.Types.ObjectId},
	firstName: {type: String, required: true},
	lastName: {type: String, required: true},
	specialization: {
		type: String,
		required: true,
		enum: ['GENERAL', 'CARDIOLOGIST', 'DERMATOLOGIST', 'ENDOCRINOLOGIST', 'NEUROLOGIST', 'OPHTHALMOLOGIST', 'ORTHOPEDIST', 'PEDIATRICIAN', 'PSYCHIATRIST', 'LARYNGOLOGIST']
	},
	pricePerVisit: {type: Number, required:true}
}, {
	timestamps: true
})

DoctorSchema.set('toJSON', {
	transform: (_document: any, returnedObject:any) => {
		returnedObject.id = returnedObject._id.toString()
		delete returnedObject._id;
		delete returnedObject.__v;
	}
});

export default mongoose.model<IDoctor>('Doctor', DoctorSchema);