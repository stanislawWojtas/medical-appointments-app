import mongoose, { Schema, Document } from "mongoose";

export interface IReview extends Document {
	doctorId: mongoose.Types.ObjectId;
	patientId: mongoose.Types.ObjectId;
	appointmentId: mongoose.Types.ObjectId;
	rating: number;
	comment: string;
	createdAt: Date;
}

const ReviewSchema: Schema = new Schema({
	doctorId: { type: mongoose.Types.ObjectId, ref: 'Doctor', required: true },
	patientId: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
	appointmentId: { type: mongoose.Types.ObjectId, ref: 'Appointment', required: true, unique: true },
	rating: { type: Number, required: true, min: 1, max: 5 },
	comment: { type: String, required: true, maxlength: 1000 }
}, {
	timestamps: true
});

ReviewSchema.index({ doctorId: 1, createdAt: -1 });

const Review = mongoose.model<IReview>('Review', ReviewSchema);

export default Review;
