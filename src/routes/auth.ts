import { type Request, type Response, type NextFunction,Router } from 'express';
import express from 'express'
import { registerController } from '../controllers/auth.controller';
import { loginController } from '../controllers/auth.controller';
export const authRouter: Router = Router();


authRouter.post('/register', registerController);
authRouter.post('/login', loginController);
