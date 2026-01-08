import { Router } from "express";
import { addAbsence, getAbsences } from "../controllers/absenceController";


const AbsenceRouter = Router();

AbsenceRouter.get('/', getAbsences);
AbsenceRouter.post('/', addAbsence)


export default AbsenceRouter;