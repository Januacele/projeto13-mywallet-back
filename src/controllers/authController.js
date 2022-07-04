import bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';
import joi from 'joi';
import db from './../db.js';

export async function cadastrar(req, res){
    const user = req.body;
  
    const userSchema = joi.object({
      name: joi.string().required(),
      email: joi.string().email().required(),
      password: joi.string().required()
    });
  
    const { error } = userSchema.validate(user, { abortEarly: false });
  
    if (error) {
      console.log(error.details);
      return res.sendStatus(422);
    }
  
    try {
      const emailCadastrado = await db.collection('usuarios').findOne( { email: user.email});
      if(emailCadastrado){
        res.status(409).send("Esse email já foi cadastrado, favor usar outro.");
        return;
      }
  
      const passwordCriptografado = bcrypt.hashSync(user.password, 10);
      await db.collection("usuarios").insertOne({...user, password: passwordCriptografado});
  
      const salvarUsuario = await db.collection("usuarios").findOne({ password: passwordCriptografado });
  
      const usuarioBalanco = {
        userId: salvarUsuario._id,
        movimentos: [],
        balanco: 0
      }
      await db.collection('movimentos').insertOne(usuarioBalanco);
  
      res.sendStatus(201);
    } catch (error) {
      res.status(500).send("Erro ao registrar");
    };
    
  }


  export async function login(req, res) {
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

        res.status(200).send(response);

      } else {
        return res.status(404).send("Senha ou Email incorretos");
      }

    } catch (error) {
        res.sendStatus(500);
        console.log("Erro ao fazer login");
    }
}