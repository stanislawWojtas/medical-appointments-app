import { Router } from "express";
import { addAvaibility, bookAppointment, getAppointments, removeAppointment, getMyAppointments } from "../controllers/appointmentController";
import { cancelAppointmentByDoctor, cancelAppointmentByPatient } from "../controllers/appointmentController";
import { verifyToken, authorizeRoles } from "../middleware/authMiddleware";

const AppointmentRouter = Router();

// Wszyscy zalogowani mogą przeglądać terminy
AppointmentRouter.get('/', verifyToken, getAppointments);

// Pacjent pobiera swoje wizyty
AppointmentRouter.get('/my-appointments', verifyToken, authorizeRoles('PATIENT'), getMyAppointments);

// Tylko lekarze mogą dodawać dostępność
AppointmentRouter.post('/availability', verifyToken, authorizeRoles('DOCTOR'), addAvaibility);

// Tylko lekarze mogą usuwać terminy
AppointmentRouter.delete('/:id', verifyToken, authorizeRoles('DOCTOR'), removeAppointment);

// Tylko pacjenci mogą rezerwować wizyty
AppointmentRouter.put('/:id/book', verifyToken, authorizeRoles('PATIENT'), bookAppointment);

// Tylko lekarze mogą anulować jako lekarz
AppointmentRouter.patch('/:id/cancel-by-doctor', verifyToken, authorizeRoles('DOCTOR'), cancelAppointmentByDoctor);

// Tylko pacjenci mogą anulować jako pacjent
AppointmentRouter.patch('/:id/cancel-by-patient', verifyToken, authorizeRoles('PATIENT'), cancelAppointmentByPatient);

export default AppointmentRouter;