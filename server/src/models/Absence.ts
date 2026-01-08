import mongoose, { Document, Schema } from "mongoose";

export interface IAbsence extends Document{
	doctorId: mongoose.Types.ObjectId;
	startDate: Date;
	endDate: Date;
	reason?: string;
}

const AbsenceSchema: Schema = new Schema({
	doctorId: {type: Schema.Types.ObjectId, ref: 'Doctor', required: true},
	startDate: {type: Date, required: true},
	endDate: {type: Date, required: true},
	reason: {type: String, required: false}
},{
	timestamps: true,
});

AbsenceSchema.set('toJSON', {
	transform: (_document: any, returnedObject: any) => {
        returnedObject.id = returnedObject._id.toString();
        delete returnedObject._id;
        delete returnedObject.__v;
    }
});

export default mongoose.model<IAbsence>( 'Absence', AbsenceSchema);