import express from 'express';
import joi from 'joi';
import { MongoClient, ObjectId } from 'mongodb';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';

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

    const passwordCriptografado = bcrypt.hashSync(usuario.password, 10)

    await db.collection('usuarios').insertOne({...usuario, password: passwordCriptografado});
    res.status(200).send("Usuário cadastrado com sucesso!");

});

app.post('/login', async (req, res) => {
    const usuario = req.body;
  
    const usuarioSchema = joi.object({
      email: joi.string().email().required(),
      password: joi.string().required()
    });
  
    const { error } = usuarioSchema.validate(usuario);
  
    if (error) {
      return res.sendStatus(400);
    }
      const user = await db.collection("usuarios").findOne({email : usuario.email});

      if(user && bcrypt.compareSync(usuario.password, user.password)){
        
        const token = uuid()

        await db.collection('sessoes').insertOne({
            token: token,
            userId: user._id
        });
        res.status(200).send({ token });

      } else {
        return res.status(404).send("Senha ou Email incorretos");
      }
});

app.post('/carteira', async (req, res) => {
    const carteira = req.body;

    const { authorization } = req.headers;
    const token = authorization?.replace('Bearer ', '');
  
    const carteiraSchema = joi.object({
      valor: joi.string().required(),
      descricao: joi.string().required()
    });
  
    const { error } = carteiraSchema.validate(carteira);
  
    if (error) {
      return res.sendStatus(422);
    }
  
    const sessao = await db.collection('sessoes').findOne({token});

    if(!sessao){
        return res.sendStatus(401);
    }

    await db.collection('carteira').insertOne({...carteira, userId: sessao.userId});
    res.status(200).send("Item adcionado à carteira com sucesso!");
  
  });

app.get('/carteira', async (req, res) => {
    const { authorization } = req.headers;
    const token = authorization?.replace('Bearer ', '');

    const sessao = await db.collection('sessoes').findOne({token});

    if(!sessao){
        return res.sendStatus(401);
    }

    const carteira = await db.collection('carteira').find({userId: new ObjectId(sessao.userId)}).toArray();

    res.send(carteira);
  
  });

const PORT = process.env.PORT || 5008;
app.listen(PORT, () => console.log('Servidor rodou deboas'));