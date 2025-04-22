import mongoose from 'mongoose';

const gameDataSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  gameData: {
    plots: [{
      id: Number,
      planted: Boolean,
      plantType: String,
      growthStage: Number,
      isWatered: Boolean,
      plantedAt: Date,
      readyToHarvest: Boolean
    }],
    userSeeds: {
      type: Map,
      of: Number,
      default: {}
    },
    userBalance: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now }
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true,
  toJSON: { 
    getters: true
  }
});

gameDataSchema.pre('save', function(next) {
  this.gameData.lastUpdated = new Date();
  next();
});

gameDataSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  if (update.$set) {
    update.$set.updatedAt = new Date();
  } else {
    update.$set = { updatedAt: new Date() };
  }
  next();
});

const GameData = mongoose.model('GameData', gameDataSchema);

export default GameData; 