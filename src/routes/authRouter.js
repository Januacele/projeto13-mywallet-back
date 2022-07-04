import { Router } from 'express';
import { cadastrar, login } from './../controllers/authController.js';

const authRouter = Router();

authRouter.post("/cadastrar", cadastrar);
authRouter.post("/login", login);



export default authRouter;