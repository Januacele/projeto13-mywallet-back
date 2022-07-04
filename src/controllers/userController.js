import dayjs from 'dayjs';
import joi from 'joi';
import db from './../db.js';


export async function getMovimentacao(req, res){
  const { authorization } = req.headers;
  
  const token = authorization ?.replace("Bearer ", "").trim();

    if(!token){
      return res.sendStatus(401);
    }

    try {
      const sessao = await db.collection('sessoes').findOne({ token });

      if(!sessao){
          return res.sendStatus(401);
      }

      const movimentos = await db.collection("movimentos").findOne({ userId: sessao.userId });

      if (movimentos) {
          delete movimentos.userId;
          res.send(movimentos);
      }

    } catch (error) {
      res.sendStatus(500);
    }
  
  }



export async function addMovimentacao(req, res){
    
    const { authorization } = req.headers;
    const token = authorization ?.replace("Bearer ", "").trim();
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

      const validation = movimentacaoSchema.validate(movimentacao, { abortEarly: true });
      
      if (validation.error) {
        console.log(error.details);
        res.sendStatus(422);
        return;
      }

      let valor = movimentacao.valor;
      if(movimentacao.type === 'saida') valor = (-1)*valor;

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
  }


