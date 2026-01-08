import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config()

export const PORT = process.env.PORT;
export const MONGO_URI = process.env.MONGO_URI;

export const connectToDatabase = async (): Promise<void> =>{
	try{
		await mongoose.connect(MONGO_URI as string, {family: 4});
		console.log("MongoDB connected succesfully");
	}catch(error){
		console.error("MongoDB connection failed: ", error);
		process.exit(1) // twardy fail
	}
}