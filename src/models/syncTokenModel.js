// src/models/syncTokenModel.js
import mongoose from 'mongoose';

const syncTokenSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: 'globalSyncToken', // Single record for global sync token
  },
  syncToken: {
    type: String,
    required: false,
  },
});

export default mongoose.model('SyncToken', syncTokenSchema);
