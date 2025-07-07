import { MongoClient, Db } from 'mongodb';

let client: MongoClient | null = null;
let db: Db | null = null;

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MongoDB URI to .env.local');
}

const uri = process.env.MONGODB_URI;
const dbName = 'medical-interpreter';

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (client && db) {
    return { client, db };
  }

  try {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db(dbName);
    
    console.log('Connected to MongoDB');
    
    return { client, db };
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

export function getDb(): Db {
  if (!db) {
    throw new Error('Database not initialized. Call connectToDatabase() first.');
  }
  return db;
}

// Graceful shutdown
process.on('SIGINT', async () => {
  if (client) {
    await client.close();
    console.log('MongoDB connection closed');
  }
  process.exit(0);
});