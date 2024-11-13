import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
let client;
let database;

export const connectDB = async () => {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
    database = client.db(); // default database
    console.log('Connected to MongoDB');
  }
  return database;
};

export const closeDB = async () => {
  if (client) {
    await client.close();
    client = null;
    database = null;
    console.log('Disconnected from MongoDB');
  }
};
