// backend/src/config/database.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    console.error('💡 Make sure MongoDB is running:');
    console.error('   - Start MongoDB: mongod');
    console.error('   - Or: sudo systemctl start mongod');
    process.exit(1);
  }
};

module.exports = connectDB;