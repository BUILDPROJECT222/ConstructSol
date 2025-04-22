import mongoose from 'mongoose';

const leaderboardSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  totalHarvests: {
    type: Number,
    default: 0
  },
  totalRewards: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Update lastUpdated on every save
leaderboardSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

const Leaderboard = mongoose.model('Leaderboard', leaderboardSchema);

export default Leaderboard; 