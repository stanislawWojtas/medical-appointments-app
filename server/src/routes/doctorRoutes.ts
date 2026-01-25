import { Router } from "express";
import { getDoctorById, getDoctors } from "../controllers/doctorController";

const DoctorRouter = Router();

DoctorRouter.get('/', getDoctors);

DoctorRouter.get('/:id', getDoctorById);

export default DoctorRouter;