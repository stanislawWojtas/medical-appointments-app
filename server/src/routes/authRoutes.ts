import { Router } from "express";
import { login, register } from "../controllers/authController";

const AuthRouter = Router();

AuthRouter.post('/register', register);
AuthRouter.post('/login', login);

export default AuthRouter;