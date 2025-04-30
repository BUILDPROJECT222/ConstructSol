import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import { Connection, PublicKey, Transaction, Keypair } from '@solana/web3.js';
import { 
  createTransferCheckedInstruction, 
  getAssociatedTokenAddress,
  getAccount,
  TOKEN_PROGRAM_ID, 
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction
} from '@solana/spl-token';
import bs58 from 'bs58';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import Leaderboard from './models/leaderboard.js';
import GameData from './models/GameData.js';
import History from './models/History.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env file
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increase limit to 1000 requests per windowMs
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Apply rate limiting to specific routes only
app.use('/api/game-data', limiter);

// Add logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Request body:', req.body);
  next();
});

// Constants
const MAINNET_RPC_URL = process.env.REACT_APP_MAINNET_RPC_URL;
const TOKEN_MINT = new PublicKey(process.env.REACT_APP_TOKEN_MINT);
const TOKEN_DECIMALS = parseInt(process.env.REACT_APP_TOKEN_DECIMALS);

// Validasi environment variables yang diperlukan
const requiredEnvVars = [
  'MONGODB_URI',
  'STORE_WALLET_PRIVATE_KEY',
  'REACT_APP_TOKEN_MINT',
  'REACT_APP_TOKEN_DECIMALS'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
}

// Database connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      console.error('MONGODB_URI is not defined');
      return;
    }

    if (mongoose.connection.readyState === 1) {
      console.log('MongoDB already connected');
      return;
    }

    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    await mongoose.connect(mongoURI, options);
    console.log('MongoDB Connected Successfully');
  } catch (error) {
    console.error('MongoDB Connection Error:', error);
    // Log detail error untuk debugging
    if (error.name === 'MongooseServerSelectionError') {
      console.error('MongoDB Server Selection Error Details:', {
        message: error.message,
        reason: error.reason,
        hosts: error.hosts
      });
    }
    return;
  }
};

// Solana wallet setup
let storeWalletKeypair;
try {
  const privateKeyString = process.env.STORE_WALLET_PRIVATE_KEY;
  const privateKeyBytes = bs58.decode(privateKeyString);
  storeWalletKeypair = Keypair.fromSecretKey(privateKeyBytes);
  console.log('Store wallet loaded successfully:', storeWalletKeypair.publicKey.toString());
} catch (error) {
  console.error('Failed to load store wallet:', error);
  process.exit(1);
}

const getConnection = () => {
  return new Connection(MAINNET_RPC_URL, {
    commitment: 'confirmed',
    wsEndpoint: undefined,
    confirmTransactionInitialTimeout: 60000
  });
};

// Routes
app.get('/api/health', async (req, res) => {
  try {
    await connectDB();
    res.json({ 
      status: 'ok',
      dbState: mongoose.connection.readyState,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/leaderboard', async (req, res) => {
  try {
    await connectDB();
    console.log('=== Fetching Leaderboard Data ===');
    
    const data = await Leaderboard.find()
      .sort({ totalRewards: -1 })
      .limit(10)
      .select({
        walletAddress: 1,
        totalHarvests: 1,
        totalRewards: 1,
        _id: 0
      })
      .lean();
    
    console.log('Found', data.length, 'leaderboard entries');
    
    // Format the data before sending
    const formattedData = data.map(entry => ({
      walletAddress: entry.walletAddress,
      totalHarvests: entry.totalHarvests || 0,
      totalRewards: entry.totalRewards || 0
    }));

    res.json(formattedData);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch leaderboard'
    });
  }
});

// Tambahkan fungsi validasi ini
const isValidSolanaAddress = (address) => {
  try {
    new PublicKey(address);
    return true;
  } catch (error) {
    return false;
  }
};

// Game data routes with enhanced functionality
app.post('/api/game-data/:walletAddress', async (req, res) => {
  try {
    await connectDB();
    const { walletAddress } = req.params;
    const { gameData } = req.body;

    // Validate that we have a full wallet address (should be 44 characters for Solana)
    if (!walletAddress || walletAddress.length !== 44) {
      console.error('Invalid wallet address length:', walletAddress?.length);
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address format',
        message: 'Please provide a complete Solana wallet address'
      });
    }

    // Validate that it's a valid Solana public key
    try {
      new PublicKey(walletAddress);
    } catch (error) {
      console.error('Invalid Solana public key:', error);
      return res.status(400).json({
        success: false,
        error: 'Invalid Solana address',
        message: 'The provided address is not a valid Solana public key'
      });
    }

    // Log the full address being used
    console.log('Saving game data for wallet:', walletAddress);

    const currentTime = new Date();
    
    // Format data dengan timestamp terbaru
    const formattedGameData = {
      plots: Array.isArray(gameData.plots) ? gameData.plots.map(plot => ({
        id: plot.id || 0,
        planted: Boolean(plot.planted),
        plantType: plot.plantType || null,
        growthStage: Number(plot.growthStage) || 0,
        isWatered: Boolean(plot.isWatered),
        plantedAt: plot.plantedAt ? new Date(plot.plantedAt) : null,
        readyToHarvest: Boolean(plot.readyToHarvest)
      })) : [],
      userSeeds: gameData.userSeeds || {},
      hammerPoints: gameData.hammerPoints || 0,
      lastUpdated: currentTime
    };

    // Cari data existing dengan full wallet address
    let existingData = await GameData.findOne({ 
      walletAddress: walletAddress // Menggunakan full wallet address
    });

    if (existingData) {
      // Update existing data dengan full wallet address
      existingData = await GameData.findByIdAndUpdate(
        existingData._id,
        {
          $set: {
            walletAddress: walletAddress, // Memastikan wallet address tersimpan lengkap
            gameData: formattedGameData,
            updatedAt: currentTime
          }
        },
        { new: true }
      );
    } else {
      // Create new data dengan full wallet address
      existingData = await GameData.create({
        walletAddress: walletAddress, // Memastikan wallet address tersimpan lengkap
        gameData: formattedGameData,
        updatedAt: currentTime
      });
    }

    console.log('Saved wallet address:', existingData.walletAddress);

    // Format response
    const responseData = {
      ...existingData.toObject(),
      gameData: {
        ...existingData.gameData,
        lastUpdated: currentTime.toISOString()
      },
      updatedAt: currentTime.toISOString()
    };

    res.json({ 
      success: true, 
      data: responseData,
      message: 'Game data saved successfully' 
    });

  } catch (error) {
    console.error('Save game data error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to save game data'
    });
  }
});

app.get('/api/game-data/:walletAddress', async (req, res) => {
  try {
    await connectDB();
    const { walletAddress } = req.params;
    
    console.log('Loading game data for wallet:', walletAddress);
    
    // Cari dengan full address atau format yang disingkat
    const userData = await GameData.findOne({ 
      $or: [
        { walletAddress },
        { walletAddress: { $regex: `${walletAddress.slice(0, 4)}.*${walletAddress.slice(-4)}` } }
      ]
    });
    
    if (userData) {
      // Update ke full address jika masih dalam format singkat
      if (userData.walletAddress.includes('...')) {
        await GameData.findByIdAndUpdate(userData._id, {
          $set: { walletAddress }
        });
      }

      const currentTime = new Date();
      const formattedData = {
        walletAddress, // Gunakan full address
        plots: userData.gameData.plots.map(plot => ({
          id: plot.id || 0,
          planted: Boolean(plot.planted),
          plantType: plot.plantType || null,
          growthStage: Number(plot.growthStage) || 0,
          isWatered: Boolean(plot.isWatered),
          plantedAt: plot.plantedAt ? plot.plantedAt.toISOString() : null,
          readyToHarvest: Boolean(plot.readyToHarvest)
        })),
        userSeeds: userData.gameData.userSeeds || {},
        hammerPoints: userData.gameData.hammerPoints || 0,
        lastUpdated: currentTime.toISOString()
      };
      
      console.log('Sending formatted user data:', formattedData);
      res.json(formattedData);
    } else {
      const currentTime = new Date();
      
      // Default data dengan timestamp terbaru
      const defaultData = {
        plots: Array(20).fill().map((_, index) => ({ 
          id: index,
          planted: false,
          plantType: null,
          growthStage: 0,
          isWatered: false,
          plantedAt: null,
          readyToHarvest: false
        })),
        userSeeds: {},
        hammerPoints: 0,
        lastUpdated: currentTime.toISOString()
      };
      
      console.log('No data found, returning default:', defaultData);
      res.json(defaultData);
    }
  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      message: 'Failed to load game data' 
    });
  }
});

app.post('/api/harvest', async (req, res) => {
  console.log('=== START HARVEST REQUEST ===');
  
  try {
    await connectDB();
    const { walletAddress, plotIndex, plantType, reward, blockhash } = req.body;

    // Validate input
    if (!walletAddress || plotIndex === undefined || !plantType || !reward || !blockhash) {
      console.error('Invalid harvest request parameters:', { walletAddress, plotIndex, plantType, reward, blockhash });
      return res.status(400).json({ 
        success: false,
        error: 'Missing required parameters'
      });
    }

    try {
      const recipientWallet = new PublicKey(walletAddress);
      const recipientTokenAccount = await getAssociatedTokenAddress(
        TOKEN_MINT,
        recipientWallet
      );

      const storeTokenAccount = await getAssociatedTokenAddress(
        TOKEN_MINT,
        storeWalletKeypair.publicKey
      );

      console.log('Token accounts verified:', {
        recipient: recipientTokenAccount.toString(),
        store: storeTokenAccount.toString(),
        mint: TOKEN_MINT.toString()
      });

      // Create transfer instruction
      const transferInstruction = createTransferCheckedInstruction(
        storeTokenAccount,
        TOKEN_MINT,
        recipientTokenAccount,
        storeWalletKeypair.publicKey,
        reward,
        TOKEN_DECIMALS
      );

      // Create transaction
      const transaction = new Transaction();
      transaction.add(transferInstruction);
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = recipientWallet;

      // Sign with store wallet
      transaction.sign(storeWalletKeypair);

      // Serialize transaction
      const serializedTransaction = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false
      });

      const base64Transaction = serializedTransaction.toString('base64');

      console.log('Transaction created and signed by store wallet');

      res.json({
        success: true,
        transaction: base64Transaction,
        tokenMint: TOKEN_MINT.toString(),
        message: 'Transaction created successfully'
      });

    } catch (error) {
      console.error('Error in harvest process:', error);
      throw new Error(`Failed to process harvest: ${error.message}`);
    }

  } catch (error) {
    console.error('Harvest endpoint error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Update endpoint leaderboard update
app.post('/api/leaderboard/update', async (req, res) => {
  try {
    await connectDB();
    const { walletAddress, harvestCount, totalReward, transactionSignature, plantType, plantName } = req.body;

    console.log('Verifying harvest transaction:', {
      walletAddress,
      harvestCount,
      totalReward,
      transactionSignature
    });

    if (!walletAddress || !transactionSignature) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address and transaction signature are required'
      });
    }

    // Verifikasi transaksi
    const connection = getConnection();
    try {
      const transaction = await connection.getTransaction(transactionSignature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0
      });

      // Verifikasi bahwa transaksi benar-benar berhasil
      if (!transaction) {
        return res.status(400).json({
          success: false,
          error: 'Transaction not found'
        });
      }

      if (transaction.meta.err || !transaction.meta.computeUnitsConsumed) {
        return res.status(400).json({
          success: false,
          error: 'Transaction failed or was rejected'
        });
      }

      // Verifikasi bahwa ini adalah transaksi harvest yang valid
      const isValidHarvestTx = transaction.transaction.message.accountKeys.some(
        key => key.toString() === process.env.REACT_APP_STORE_WALLET
      );

      if (!isValidHarvestTx) {
        return res.status(400).json({
          success: false,
          error: 'Invalid harvest transaction'
        });
      }

      // Konfirmasi update leaderboard setelah verifikasi transaksi
      const updatedLeaderboard = await Leaderboard.findOneAndUpdate(
        { walletAddress },
        {
          $inc: {
            totalHarvests: harvestCount || 0,
            totalRewards: totalReward || 0
          }
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true
        }
      );

      console.log('Leaderboard updated successfully:', {
        walletAddress,
        totalHarvests: updatedLeaderboard.totalHarvests,
        totalRewards: updatedLeaderboard.totalRewards
      });

      // Add history record
      await History.create({
        walletAddress,
        plantType,
        plantName,
        reward: totalReward,
        transactionSignature,
        harvestedAt: new Date()
      });

      res.json({
        success: true,
        data: updatedLeaderboard,
        message: 'Leaderboard updated successfully'
      });

    } catch (error) {
      console.error('Transaction verification failed:', error);
      return res.status(400).json({
        success: false,
        error: 'Failed to verify transaction'
      });
    }

  } catch (error) {
    console.error('Leaderboard/history update error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Helper function to normalize wallet address
const normalizeWalletAddress = (address) => {
  if (!address) return '';
  // Fungsi ini sekarang hanya akan digunakan untuk tampilan/display, bukan untuk penyimpanan
  return address;
};

// Modify debug garden endpoint
app.get('/api/debug/garden/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    console.log('=== DEBUG: CHECKING SPECIFIC GARDEN ===');
    console.log('Original Wallet Address:', walletAddress);
    
    // Try different formats
    const normalizedAddress = normalizeWalletAddress(walletAddress);
    console.log('Normalized Address:', normalizedAddress);
    
    // Try all possible formats
    const possibleAddresses = [
      walletAddress,                    // Full address
      normalizedAddress,                // Shortened address
      `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}` // Alternative format
    ];
    
    console.log('Trying possible addresses:', possibleAddresses);
    
    // Search for any matching format
    let rawData = await GameData.findOne({
      walletAddress: { $in: possibleAddresses }
    }).lean();
    
    console.log('Data found:', !!rawData);
    
    if (rawData) {
      console.log('Found with address format:', rawData.walletAddress);
      console.log('Data structure:', {
        id: rawData._id,
        hasGameData: !!rawData.gameData,
        plotsCount: rawData.gameData?.plots?.length,
        lastUpdated: rawData.gameData?.lastUpdated || rawData.updatedAt
      });
    }
    
    res.json({
      found: !!rawData,
      data: rawData,
      searchedFormats: possibleAddresses,
      matchedFormat: rawData?.walletAddress || null,
      dbState: mongoose.connection.readyState
    });
    
  } catch (error) {
    console.error('Debug garden error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update visit garden endpoint to use normalized address
app.get('/api/visit-garden/:walletAddress', async (req, res) => {
  try {
    await connectDB();
    const { walletAddress } = req.params;
    
    console.log('=== VISIT GARDEN REQUEST ===');
    console.log('Wallet Address:', walletAddress);
    
    // Cari menggunakan full wallet address
    const userData = await GameData.findOne({
      walletAddress: walletAddress
    }).lean();
    
    console.log('Data found:', !!userData);
    
    if (!userData || !userData.gameData) {
      return res.status(404).json({
        success: false,
        error: 'Garden not found'
      });
    }

    // Format response data
    const visitData = {
      ownerAddress: userData.walletAddress, // Full wallet address
      plots: Array.isArray(userData.gameData.plots) ? 
        userData.gameData.plots.map(plot => ({
          id: plot.id || 0,
          planted: Boolean(plot.planted),
          plantType: plot.plantType || null,
          growthStage: Number(plot.growthStage || 0),
          isWatered: Boolean(plot.isWatered),
          readyToHarvest: Boolean(plot.readyToHarvest),
          plantedAt: plot.plantedAt ? plot.plantedAt.toISOString() : null
        })) : [],
      lastUpdated: userData.gameData.lastUpdated || new Date().toISOString()
    };

    return res.json({
      success: true,
      data: visitData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Visit garden error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Add debug endpoint to check all garden data
app.get('/api/debug/gardens', async (req, res) => {
  try {
    console.log('=== DEBUG: CHECKING ALL GARDENS ===');
    
    // Check database connection
    console.log('Database state:', mongoose.connection.readyState);
    
    // Get all data from GameData collection
    const allData = await GameData.find({}).lean();
    
    console.log('Total gardens found:', allData.length);
    
    // Map wallet addresses for easier viewing
    const gardens = allData.map(data => ({
      walletAddress: data.walletAddress,
      hasGameData: !!data.gameData,
      plotsCount: data.gameData?.plots?.length,
      lastUpdated: data.gameData?.lastUpdated || data.updatedAt
    }));
    
    res.json({
      dbState: mongoose.connection.readyState,
      totalGardens: allData.length,
      gardens: gardens
    });
    
  } catch (error) {
    console.error('Debug gardens error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add at the beginning of routes, after middleware setup
app.get('/api/test', (req, res) => {
  try {
    res.json({ 
      status: 'ok',
      message: 'API is running',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({ error: 'Test endpoint failed' });
  }
});

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Modifikasi bagian start server
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
    await connectDB();
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
} else {
  // Dalam production, panggil connectDB tapi jangan block
  connectDB().catch(console.error);
}

// Root endpoint untuk testing
app.get('/', (req, res) => {
  res.json({ 
    message: 'API is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Update only the sell endpoint
app.post('/api/sell', async (req, res) => {
  console.log('=== START SELL REQUEST ===');
  
  try {
    await connectDB();
    const { walletAddress, seedId, quantity, sellPrice, blockhash } = req.body;

    // Validate input
    if (!walletAddress || !seedId || !quantity || !sellPrice || !blockhash) {
      console.error('Invalid sell request parameters:', { walletAddress, seedId, quantity, sellPrice, blockhash });
      return res.status(400).json({ 
        success: false,
        error: 'Missing required parameters'
      });
    }

    // Create transaction first
    const transaction = new Transaction();
    const connection = getConnection();
    
    try {
      const recipientWallet = new PublicKey(walletAddress);
      
      // Get token accounts
      const recipientTokenAccount = await getAssociatedTokenAddress(
        TOKEN_MINT,
        recipientWallet
      );

      const storeTokenAccount = await getAssociatedTokenAddress(
        TOKEN_MINT,
        storeWalletKeypair.publicKey
      );

      console.log('Token accounts:', {
        recipient: recipientTokenAccount.toString(),
        store: storeTokenAccount.toString(),
        mint: TOKEN_MINT.toString()
      });

      // Verify store token account exists and has sufficient balance
      let storeAccount;
      try {
        storeAccount = await getAccount(connection, storeTokenAccount);
        const transferAmount = BigInt(Math.floor(sellPrice));
        const storeBalance = BigInt(storeAccount.amount);
        
        console.log('Store account verification details:', {
          storeBalance: storeBalance.toString(),
          transferAmount: transferAmount.toString(),
          sellPrice,
          rawStoreBalance: storeAccount.amount.toString(),
          calculationDetails: {
            originalSellPrice: sellPrice,
            finalTransferAmount: transferAmount.toString()
          }
        });
        
        if (storeBalance < transferAmount) {
          console.error('Insufficient balance:', {
            storeBalance: storeBalance.toString(),
            transferAmount: transferAmount.toString(),
            difference: (transferAmount - storeBalance).toString()
          });
          return res.status(400).json({
            success: false,
            error: 'Insufficient balance in store account',
            details: {
              available: storeBalance.toString(),
              required: transferAmount.toString(),
              difference: (transferAmount - storeBalance).toString()
            }
          });
        }

        console.log('Balance verification passed:', {
          available: storeBalance.toString(),
          required: transferAmount.toString()
        });
      } catch (error) {
        console.error('Store account verification error:', error);
        
        if (error.name === 'TokenAccountNotFoundError') {
          return res.status(500).json({
            success: false,
            error: 'Store token account not found'
          });
        }
        
        throw error;
      }

      // Check if recipient token account exists
      try {
        await getAccount(connection, recipientTokenAccount);
        console.log('Recipient token account exists');
      } catch (error) {
        if (error.name === 'TokenAccountNotFoundError') {
          console.log('Creating new Associated Token Account for recipient');
          const createAtaIx = createAssociatedTokenAccountInstruction(
            storeWalletKeypair.publicKey,
            recipientTokenAccount,
            recipientWallet,
            TOKEN_MINT
          );
          transaction.add(createAtaIx);
        } else {
          throw error;
        }
      }

      // Add transfer instruction
      const transferAmount = BigInt(Math.floor(sellPrice));
      const transferIx = createTransferCheckedInstruction(
        storeTokenAccount,
        TOKEN_MINT,
        recipientTokenAccount,
        storeWalletKeypair.publicKey,
        transferAmount,
        6 // Token decimals
      );

      transaction.add(transferIx);
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = recipientWallet;

      // Sign with store wallet
      transaction.partialSign(storeWalletKeypair);

      // Serialize transaction
      const serializedTransaction = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false
      });

      const base64Transaction = serializedTransaction.toString('base64');

      console.log('Sell transaction created successfully', {
        recipientTokenAccount: recipientTokenAccount.toString(),
        storeTokenAccount: storeTokenAccount.toString(),
        transferAmount: transferAmount.toString()
      });

      res.json({
        success: true,
        transaction: base64Transaction,
        tokenMint: TOKEN_MINT.toString()
      });

    } catch (error) {
      console.error('Error in sell process:', error);
      return res.status(500).json({
        success: false,
        error: `Failed to process sell: ${error.message}`
      });
    }

  } catch (error) {
    console.error('Sell endpoint error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Add new endpoint for harvest history
app.get('/api/history/:walletAddress', async (req, res) => {
  try {
    await connectDB();
    const { walletAddress } = req.params;

    // Validate wallet address
    try {
      new PublicKey(walletAddress);
    } catch (error) {
      console.error('Invalid wallet address:', error);
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address format'
      });
    }

    console.log('Fetching history for wallet:', walletAddress);

    const history = await History.find({ walletAddress })
      .sort({ harvestedAt: -1 })
      .lean();

    console.log(`Found ${history.length} history records`);

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('History fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch history',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Export the Express API
export default app;
