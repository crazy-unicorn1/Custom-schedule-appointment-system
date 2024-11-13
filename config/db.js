import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI;

export const connectDB = async () => {
  if (mongoose.connection.readyState === 0) {
    try {
      console.log('Connecting to MongoDB...');
      await mongoose.connect(uri);
      console.log('MongoDB connected');
    } catch (err) {
      console.error('Error connecting to MongoDB:', err);
      throw new Error('Unable to connect to MongoDB');
    }
  }
};

export const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
};
