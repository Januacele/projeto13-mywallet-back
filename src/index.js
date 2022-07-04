import express from 'express';
import joi from 'joi';
import { MongoClient } from 'mongodb';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';
import dayjs from 'dayjs';

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

  const { error } = usuarioSchema.validate(usuario, { abortEarly: true });

  if (error) {
    console.log(error.details);
    return res.sendStatus(422);
  }

  try {
    const emailCadastrado = await db.collection('usuarios').findOne( { email: usuario.email});
    if(emailCadastrado){
      res.status(409).send("Esse email já foi cadastrado, favor usar outro.");
      return;
    }

    const passwordCriptografado = bcrypt.hashSync(usuario.password, 10);
    await db.collection('usuarios').insertOne({...usuario, password: passwordCriptografado});

    const salvarUsuario = await db.collection('usuarios').findOne({ password: passwordCriptografado });

    const usuarioBalanco = {
      userId: salvarUsuario._id,
      movimentos: [],
      balanco: 0
    }
    await db.collection('movimentos').insertOne(usuarioBalanco);

    res.sendStatus(201);
  } catch (e) {
    res.status(500).send(`Erro ao registrar, ${e}`);
  }
  
});

app.post('/login', async (req, res) => {
    const login = req.body;
  
    const loginSchema = joi.object({
      email: joi.string().email().required(),
      password: joi.string().required()
    });
  
    const { error } = loginSchema.validate(login, { abortEarly: true });
  
    if (error) {
      return res.sendStatus(422);
    }
    
    try {
      const user = await db.collection("usuarios").findOne({ email : login.email});

      if(user && bcrypt.compareSync(login.password, user.password)){
        
        const token = uuid()

        await db.collection('sessoes').insertOne({
            token,
            userId: user._id
        });

        const response = {
          token,
          name: user.name
      };

        res.status(200).send({ response });

      } else {
        return res.status(404).send("Senha ou Email incorretos");
      }

    } catch (error) {
        res.sendStatus(500);
        console.log("Erro ao fazer login");
    }
});


app.post('/carteira', async (req, res) => {
    
    const { authorization } = req.headers;
    const token = authorization?.replace("Bearer", "").trim();
    if(!token){
      return res.sendStatus(401);
    }

    let diaMes = dayjs().toDate();
    diaMes = dayjs(diaMes).format("DD/MM");

    try {

      const sessao = await db.collection("sessoes").findOne({ token });

      if(!sessao){
       return res.sendStatus(401);
      }

      const movimentacao = req.body;

      const movimentacaoSchema = joi.object({
        type: joi.any().valid('entrada','saida').required(),
        valor: joi.number().sign('positive').precision(2).required(),
        descricao: joi.string().required()
      });

      const { error } = movimentacaoSchema.validate(movimentacao, { abortEarly: true });
      
      if (error) {
        console.log(error.details);
        res.sendStatus(422);
        return;
      }

      let valor = movimentacao.valor;
      if(movimentacao.type === 'saida'){
        valor = (-1)*valor;
        return;
      } 

      const userId = sessao.userId;
      const novaMovimentacao = {...movimentacao, date: diaMes};

      await db.collection("movimentacoes").updateOne(
        {userId}, 
        {
          $push: { movimentacoes: novaMovimentacao },
          $inc: { balanco: valor }
        });
      res.status(200).send("Item adcionado à carteira com sucesso!");
      
    } catch (error) {
      res.sendStatus(500);
    }
  });


app.get('/carteira', async (req, res) => {
  const { authorization } = req.headers;
  const token = authorization?.replace("Bearer", "").trim();

    if(!token){
      return res.sendStatus(401);
    }

    try {
      const sessao = await db.collection('sessoes').findOne({ token });

      if(!sessao){
          return res.sendStatus(401);
      }

    } catch (error) {
      res.sendStatus(500);
    }
  
  });

const PORT = process.env.PORT || 5008;
app.listen(PORT, () => console.log('Servidor rodou deboas'));