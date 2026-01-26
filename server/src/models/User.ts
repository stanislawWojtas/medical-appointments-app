import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document{
	email:string;
	password:string;
	role: 'DOCTOR' | 'PATIENT' | 'ADMIN';
	isBlocked: boolean;

	//powiązanie z lekarzem żeby było szybciej
	doctorId?: mongoose.Types.ObjectId;
}

const UserSchema: Schema = new Schema({
	email: {
		type: String,
		required: true,
		unique: true,
		lowercase: true,
		trim: true
	},
	password: {
		type: String,
		required: true
	},
	role: {
		type: String,
		enum: ['DOCTOR', 'PATIENT', 'ADMIN'],
		default: 'PATIENT',
	},
	isBlocked: {
		type: Boolean,
		default: false
	},
	doctorId:{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Doctor',
		required: false
	}
}, {
	timestamps: true
})

//usuwamy też hasło z wyświetlania
UserSchema.set('toJSON', {
	virtuals: true,
	versionKey: false,
	transform: function (_doc, ret) {
		delete ret._id;
		delete ret.password;
	}
});

export default mongoose.model<IUser>('User', UserSchema);