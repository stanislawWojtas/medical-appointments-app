import { Router } from "express";
import { addAvaibility, bookAppointment, getAppointments, removeAppointment } from "../controllers/appointmentController";


const AppointmentRouter = Router();

AppointmentRouter.get('/',getAppointments);
AppointmentRouter.post('/availability', addAvaibility);
AppointmentRouter.delete('/:id', removeAppointment);
AppointmentRouter.put('/:id/book', bookAppointment);

export default AppointmentRouter;