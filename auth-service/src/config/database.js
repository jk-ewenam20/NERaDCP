const mongoose = require('mongoose');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Auth Service: MongoDB connected');
  } catch (err) {
    console.error('Auth Service: MongoDB connection failed:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
