import express from 'express';
import joi from 'joi';
import { MongoClient, ObjectId } from 'mongodb';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;
mongoClient.connect(() => {
  db = mongoClient.db(process.env.MONGO_DATABASE);
});

app.post('/cadastrar', async (req, res) => {
  const usuario = req.body;

  const usuarioSchema = joi.object({
    name: joi.string().required(),
    email: joi.string().email().required(),
    password: joi.string().required()
  });

  const { error } = usuarioSchema.validate(usuario);

  if (error) {
    return res.sendStatus(400);
  }

    await db.collection('usuarios').insertOne(usuario);
    res.status(200).send("Usuário cadastrado com sucesso!");

})

const PORT = process.env.PORT || 5008;
app.listen(PORT, () => console.log('Servidor rodou deboas'));