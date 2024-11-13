import mongoose, { connect } from 'mongoose';

const MONGO_URI = process.env.MONGODB_URI;

if (!MONGO_URI || MONGO_URI.length === 0) {
  throw new Error("MONGO_URI not found");
}

if (!global.mongoose) {
  global.mongoose = { conn: null, promise: null };
}

let cached = global.mongoose;

export const connectDB = async function () {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = connect(MONGO_URI, opts)
      .then((mongoose) => {
        console.log("✅ New connection established");
        return mongoose;
      })
      .catch((error) => {
        console.error("❌ Connection to database failed");
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
};

export const disconnectDB = async () => {
  if (cached.conn) {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
    cached.conn = null;
  }
};
