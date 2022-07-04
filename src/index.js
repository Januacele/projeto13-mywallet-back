import express, {json} from 'express';
import cors from 'cors';
import authRout from './routes/authRouter.js';
import userRouter from './routes/userRouter.js';
import dotenv from 'dotenv';


dotenv.config();


const app = express();
app.use(json());
app.use(cors());


app.use(authRout);
app.use(userRouter);

const PORT = process.env.PORT;
app.listen(PORT, () => console.log('Servidor rodou deboas'));