import { Router } from "express";
import { addAvaibility, bookAppointment, getAppointments, removeAppointment } from "../controllers/appointmentController";
import { cancelAppointmentByDoctor, cancelAppointmentByPatient } from "../controllers/appointmentController";

const AppointmentRouter = Router();

AppointmentRouter.get('/',getAppointments);
AppointmentRouter.post('/availability', addAvaibility);
AppointmentRouter.delete('/:id', removeAppointment);
AppointmentRouter.put('/:id/book', bookAppointment);
AppointmentRouter.patch('/:id/cancel-by-doctor', cancelAppointmentByDoctor);
AppointmentRouter.patch('/:id/cancel-by-patient', cancelAppointmentByPatient);

export default AppointmentRouter;