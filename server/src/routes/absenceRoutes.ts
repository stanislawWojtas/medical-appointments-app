import { Router } from "express";
import { addAbsence, getAbsences, removeAbsence } from "../controllers/absenceController";


const AbsenceRouter = Router();

AbsenceRouter.get('/', getAbsences);
AbsenceRouter.post('/', addAbsence);
AbsenceRouter.delete('/:id', removeAbsence);


export default AbsenceRouter;