import mongoose from 'mongoose';

const historySchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true,
    index: true
  },
  plantType: {
    type: String,
    required: true
  },
  plantName: String,
  reward: {
    type: Number,
    required: true
  },
  transactionSignature: {
    type: String,
    required: true,
    unique: true
  },
  harvestedAt: {
    type: Date,
    default: Date.now
  }
});

const History = mongoose.model('History', historySchema);

export default History; 