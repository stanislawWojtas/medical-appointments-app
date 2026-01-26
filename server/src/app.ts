import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { connectToDatabase } from './utils/config';
import DoctorRouter from './routes/doctorRoutes';
import AppointmentRouter from './routes/appointmentRoutes';
import AbsenceRouter from './routes/absenceRoutes';
import AuthRouter from './routes/authRoutes';
import ReviewRouter from './routes/reviewRoutes';
import AdminRouter from './routes/adminRoutes';

export const app = express();
app.use(cors({
	origin: "*"
}))

const startServer = async () => {
	await connectToDatabase();
} 

app.use(morgan('dev'));

app.use(express.static('dist'));
app.use(express.json());

app.use('/api/doctors', DoctorRouter);
app.use('/api/appointments', AppointmentRouter);
app.use('/api/absences', AbsenceRouter);
app.use('/api/auth', AuthRouter);
app.use('/api/reviews', ReviewRouter);
app.use('/api/admin', AdminRouter);

startServer();