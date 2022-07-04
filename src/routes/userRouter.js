import { Router } from 'express';
import { getMovimentacao, addMovimentacao } from './../controllers/userController.js';


const userRouter = Router();

userRouter.get("/carteira", getMovimentacao);
userRouter.post("/carteira", addMovimentacao);



export default userRouter;