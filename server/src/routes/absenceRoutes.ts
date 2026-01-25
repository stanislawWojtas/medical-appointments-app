import { Router } from "express";
import { addAbsence, getAbsences, removeAbsence } from "../controllers/absenceController";
import { verifyToken, authorizeRoles } from "../middleware/authMiddleware";

const AbsenceRouter = Router();

// zalogowani użytkownicy mogą przeglądać nieobecności lekarza
AbsenceRouter.get('/', verifyToken, getAbsences);

// Tylko lekarze mogą dodawać nieobecności
AbsenceRouter.post('/', verifyToken, authorizeRoles('DOCTOR'), addAbsence);

// Tylko lekarze mogą usuwać nieobecności
AbsenceRouter.delete('/:id', verifyToken, authorizeRoles('DOCTOR'), removeAbsence);

export default AbsenceRouter;