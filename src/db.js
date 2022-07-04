import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

let db = null;

try {
    const mongoClient = new MongoClient(process.env.MONGO_URI);
    mongoClient.connect(() => {
        db = mongoClient.db(process.env.MONGO_DATABASE);
      });
      console.log("Conexão com o banco dados MongoDB estabelecida!");
} catch (error) {
    console.log("Erro ao se conectar ao banco de dados!", error);
}

export default db;