const mongoose = require('mongoose');

// Loaded from backend/.env via dotenv (see server.js).
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/betapp';
const DB_NAME = process.env.DB_NAME || 'betapp';

async function connectDatabase() {
  await mongoose.connect(MONGODB_URI, { dbName: DB_NAME });
  console.log(`Connected to MongoDB (${DB_NAME})`);
}

module.exports = { connectDatabase };
