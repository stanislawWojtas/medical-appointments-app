import { Router } from "express";
import { login, register, refreshToken, logout } from "../controllers/authController";

const AuthRouter = Router();

AuthRouter.post('/register', register);
AuthRouter.post('/login', login);
AuthRouter.post('/refresh-token', refreshToken);
AuthRouter.post('/logout', logout);

export default AuthRouter;