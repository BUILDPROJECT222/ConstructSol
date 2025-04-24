import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import Header from '../Header/Header.js';
import Footer from '../Footer/Footer.js';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../../context/WalletContext.js';
import WalletInfo from '../WalletInfo/WalletInfo.js';
import './Play.css';
import { Connection, LAMPORTS_PER_SOL, clusterApiUrl, PublicKey, Transaction, SystemProgram, Message, TransactionMessage, TransactionInstruction } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { seeds as seedsData } from '../constants/seeds.js';
import { getStoreWallet, getNetwork } from '../../utils/storeWallet.js';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  createTransferCheckedInstruction,
  getAssociatedTokenAddress,
  getMint,
  getAccount,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction
} from '@solana/spl-token';
import BN from 'bn.js';
import testfunIcon from '../../assets/background.PNG';
import classNames from 'classnames';

// Add Buffer to window object
window.Buffer = Buffer;

// Add this constant at the top of the file, after the imports
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Move WalletNotification outside the Join component
const WalletNotification = ({ notification }) => {
  if (!notification) return null;
  
  return (
    <div className={`wallet-notification ${notification.isError ? 'error' : 'success'}`}>
      {notification.message}
    </div>
  );
};

const HarvestConfirmPopup = ({ onConfirm, onCancel, plantName, plantIcon, isLoading }) => {
  return (
    <div className="harvest-confirm-popup">
      <div className="harvest-confirm-content">
        <h3 className="harvest-confirm-title">Confirm Sell</h3>
        <p className="harvest-confirm-message">
          Are you sure you want to Sell your:
        </p>
        <div className="plant-info-container">
          <span className="plant-name">{plantName}</span>
          <span className="plant-icon-container">{plantIcon}</span>
        </div>
        <p className="harvest-confirm-message">
          You will receive rewards after Selling.
        </p>
        <div className="harvest-confirm-buttons">
          <button 
            className="harvest-confirm-btn harvest-confirm-no"
            onClick={onCancel}
            disabled={isLoading}
          >
            No
          </button>
          <button 
            className="harvest-confirm-btn harvest-confirm-yes"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="loading-spinner">🔄</span>
                Processing...
              </>
            ) : (
              'Yes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const HarvestSuccessPopup = ({ onClose, plantName, reward, plantIcon }) => {
  // Add state for closing animation
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Timer to start closing animation
    const closeTimer = setTimeout(() => {
      setIsClosing(true);
    }, 2700); // Start closing animation 300ms before popup actually hides

    // Timer to close popup
    const hideTimer = setTimeout(() => {
      onClose();
    }, 3000);

    // Cleanup all timers
    return () => {
      clearTimeout(closeTimer);
      clearTimeout(hideTimer);
    };
  }, [onClose]);

  // Handle close button click
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 300); // Wait for animation to finish
  };

  return (
    <div className={`harvest-success-popup ${isClosing ? 'closing' : ''}`}>
      <div className="harvest-success-content">
        <h3 className="harvest-success-title">Sell Successful!</h3>
        <p className="harvest-success-message">
          You have successfully sold your {plantName}{plantIcon}
        </p>
        <div className="reward-amount">
          + <img 
                      src={testfunIcon} 
                      alt="testfun" 
                      className="testfun-icon-leaderboard"
                    /> 
          {reward}
        </div>
        <p className="harvest-success-message">
          The rewards have been added to your wallet.
        </p>
        <div className="timer-bar"></div>
        <button 
          className="harvest-success-btn"
          onClick={handleClose}
        >
          Congrats!
        </button>
      </div>
    </div>
  );
};

const LeaderboardContent = () => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { walletAddress } = useWallet();

  // Add formatBalance helper function
  const formatBalance = (balance) => {
    return Number(balance).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 6
    });
  };

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        setIsLoading(true);
        console.log('Fetching from:', `${API_BASE_URL}/api/leaderboard`); // Debug log
        const response = await fetch(`${API_BASE_URL}/api/leaderboard`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Server response:', errorText); // Debug log
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Received data:', data); // Debug log
        setLeaderboardData(data);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="leaderboard-loading">
        <div className="loading-spinner">🔄</div>
        <p>Loading leaderboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="leaderboard-error">
        <p>Error loading leaderboard: {error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  // Add function to handle wallet click
  const handleWalletClick = (address) => {
    window.open(`https://solscan.io/account/${address}`, '_blank');
  };

  // Add shortenAddress helper function if not already present
  const shortenAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <div className="leaderboard-container">
      <h2 className="leaderboard-title">🏆 Top Assets Sold 🏆</h2>
      <div className="leaderboard-table">
        <div className="leaderboard-header">
          <div className="rank-column">Rank</div>
          <div className="wallet-column">Wallet</div>
          <div className="score-column">Total Construction</div>
          <div className="rewards-column">Total Rewards</div>
        </div>
        {leaderboardData.map((entry, index) => {
          const isCurrentUser = window.solana?.publicKey?.toString() === entry.walletAddress;
          
          return (
            <div 
              key={entry.walletAddress} 
              className={`leaderboard-row ${isCurrentUser ? 'current-user' : ''}`}
            >
              <div className="rank-column">
                {index + 1}
                {index < 3 && <span className="rank-medal">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                </span>}
              </div>
              <div 
                className="wallet-column clickable"
                onClick={() => handleWalletClick(entry.walletAddress)}
                title="Click to view on Solscan"
              >
                {shortenAddress(entry.walletAddress)}
              </div>
              <div className="score-column">
                {entry.totalHarvests}
              </div>
              <div className="rewards-column">
              <img src={testfunIcon} alt="testfun" className="testfun-icon-leaderboard" />
              &nbsp;
                {formatBalance(entry.totalRewards)} 
              
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Add memo for plot component to prevent unnecessary re-renders
const Plot = React.memo(({ 
  plot, 
  index, 
  onPlotClick, 
  isHoveredPlot,
  onMouseEnter,
  onMouseLeave 
}) => {
  return (
    <div
      className={`plot 
        ${plot.planted ? 'planted' : ''} 
        ${plot.isWatered ? 'watered' : ''}
        ${plot.wateringAnimation ? 'watering' : ''}
        ${plot.readyToHarvest ? 'ready-harvest' : ''}
        growth-stage-${plot.growthStage}`
      }
      onClick={() => onPlotClick(index)}
      onMouseEnter={() => onMouseEnter(index)}
      onMouseLeave={onMouseLeave}
    >
      {plot.planted && (
        <div className="plant-sprite">
          {plot.plantType && seedsData.find(s => s.id === plot.plantType)?.icon}
        </div>
      )}
      {plot.wateringAnimation && <div className="water-droplets" />}
      {plot.isWatered && <div className="water-effect" />}
      {plot.readyToHarvest && <div className="harvest-effect" />}
      
      {isHoveredPlot && plot.planted && (
        <div className="plot-info-popup">
          <div className="plot-info-content">
            <div className="plot-info-header">
              {seedsData.find(s => s.id === plot.plantType)?.icon}
              <span className="plot-info-name">
                {seedsData.find(s => s.id === plot.plantType)?.name} 
              </span>
            </div>
            <div className="plot-info-details">
              <div className="plot-info-row">
                <span>Growth:</span>
                <span>{plot.growthStage}/3</span>
              </div>
              <div className="plot-info-row">
                <span>Status:</span>
                <span>
                  {plot.readyToHarvest ? 'Ready to Harvest' : 
                   plot.isWatered ? 'Watered' : 'Growing'}
                </span>
              </div>
              <div className="plot-info-row">
                <span>Reward:</span>
                <img 
                      src={testfunIcon} 
                      alt="testfun" 
                      className="testfun-icon-leaderboard"
                    />
                <span>{seedsData.find(s => s.id === plot.plantType)?.reward}</span>
              </div>
              <div className="plot-info-row">
                <span>Time:</span>
                <span>
                  {(() => {
                    if (!plot.planted || !plot.plantedAt) return 'Not planted';
                    if (plot.readyToHarvest) return 'Complete!';
                    
                    const selectedSeed = seedsData.find(s => s.id === plot.plantType);
                    if (!selectedSeed) return 'N/A';
                    
                    try {
                      // Convert plantedAt to timestamp
                      const plantedTime = new Date(plot.plantedAt).getTime();
                      if (isNaN(plantedTime)) {
                        console.error('Invalid plantedAt:', plot.plantedAt);
                        return 'Invalid time';
                      }

                      // Calculate total growth time in milliseconds with watering status
                      let totalGrowthTime = selectedSeed.growthTime * 1000;
                      if (plot.isWatered) {
                        totalGrowthTime = totalGrowthTime / 2; // Cut growth time in half if watered
                      }
                      
                      // Calculate time elapsed since planting
                      const now = Date.now();
                      const timePassed = now - plantedTime;
                      
                      // Calculate remaining time
                      const timeRemaining = Math.max(0, totalGrowthTime - timePassed);
                      
                      if (timeRemaining <= 0) return 'Ready!';
                      
                      // Format the remaining time
                      const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
                      const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
                      const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
                      
                      let timeString = '';
                      if (hours > 0) timeString += `${hours}h `;
                      if (minutes > 0 || hours > 0) timeString += `${minutes}m `;
                      timeString += `${seconds}s`;
                      
                      return timeString;
                    } catch (error) {
                      console.error('Time calculation error:', error);
                      return 'Error';
                    }
                  })()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

// Add new tool for visiting gardens
const tools = [
  { id: 'store', name: 'CONSTRUCTION SHOP', icon: '🏘️' },
  { id: 'garden', name: 'CONSTRUCTION AREA', icon: '🚜' },
  { id: 'history', name: 'HISTORY', icon: '📜' },
  { id: 'leaderboard', name: ' LEADERBOARD', icon: '🏆' },
  { id: 'farm', name: 'MONOPOLY', icon: '🎲' },
  // { id: 'visit', name: 'VISIT CONSTRUCTION', icon: '👥' }
];

// Add new component for garden visiting
const VisitGarden = ({ onVisit }) => {
  const [gardenAddress, setGardenAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const cleanAddress = gardenAddress.trim();
    
    if (!cleanAddress) {
      toast.error('Please enter a wallet address');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Testing API connection...');
      const testUrl = `${API_BASE_URL}/api/test`;
      console.log('Test URL:', testUrl);
      
      const testResponse = await fetch(testUrl);
      if (!testResponse.ok) {
        console.error('API test failed:', testResponse.status);
        throw new Error('API server is not responding');
      }
      
      console.log('API test successful, fetching garden data...');
      const gardenUrl = `${API_BASE_URL}/api/visit-garden/${cleanAddress}`;
      console.log('Garden URL:', gardenUrl);
      
      const response = await fetch(gardenUrl);
      console.log('Garden response status:', response.status);
      
      const data = await response.json();
      console.log('Garden response data:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load garden');
      }
      
      if (!data.data || !Array.isArray(data.data.plots)) {
        throw new Error('Invalid garden data received');
      }
      
      onVisit(data.data);
    } catch (error) {
      console.error('Error visiting garden:', error);
      setError(error.message);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="visit-garden-container">
      <h2>Visit Another Player's Construction</h2>
      <form onSubmit={handleSubmit} className="visit-garden-form">
        <input
          type="text"
          value={gardenAddress}
          onChange={(e) => setGardenAddress(e.target.value)}
          placeholder="Enter wallet address"
          className="visit-garden-input"
        />
        <button 
          type="submit" 
          className="visit-garden-button"
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Visit Construction'}
        </button>
      </form>
      {error && <p className="visit-garden-error">{error}</p>}
    </div>
  );
};

// Add new component for viewing visited garden
const VisitedGarden = ({ gardenData, onBack }) => {
  // Tambahkan logging untuk memeriksa data yang diterima
  console.log('Received garden data:', gardenData);
  
  // Definisikan validPlots di sini
  const validPlots = gardenData.plots.filter(plot => {
    const isValid = plot && typeof plot.planted !== 'undefined';
    if (!isValid) {
      console.warn('Invalid plot data:', plot);
    }
    return isValid;
  });

  // Add shortenAddress helper function inside component
  const shortenAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <div className="visited-garden-container">
      <div className="visited-garden-header">
        <button onClick={onBack} className="back-button">
          ← Back
        </button>
        <h2>Visiting Garden</h2>
        <p className="garden-owner">
          Owner: {shortenAddress(gardenData.ownerAddress)}
        </p>
      </div>
      <div className="plots-container">
        <div className="plots-grid">
          {validPlots.map((plot, index) => {
            // Tambahkan logging untuk setiap plot
            console.log(`Rendering plot ${index}:`, plot);
            
            return (
              <div
                key={index}
                className={`plot visitor-plot
                  ${plot.planted ? 'planted' : ''} 
                  ${plot.isWatered ? 'watered' : ''}
                  ${plot.readyToHarvest ? 'ready-harvest' : ''}
                  growth-stage-${plot.growthStage}`
                }
              >
                {plot.planted && plot.plantType && (
                  <div className="plant-sprite">
                    {seedsData.find(s => s.id === plot.plantType)?.icon}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Update History component
const History = () => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isWalletConnected, fullWalletAddress } = useWallet();

  // Add check for wallet connection restoration
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 5;
    const retryInterval = 1000; // 1 second

    const checkWalletAndFetchHistory = async () => {
      const { solana } = window;
      
      // Wait for wallet context to be fully initialized
      if (!fullWalletAddress && retryCount < maxRetries) {
        console.log('Waiting for wallet context to be restored...', retryCount);
        retryCount++;
        setTimeout(checkWalletAndFetchHistory, retryInterval);
        return;
      }

      if (!fullWalletAddress) {
        console.log('No wallet address available');
        setIsLoading(false);
        return;
      }

      try {
        console.log('Fetching history with wallet:', fullWalletAddress);
        const response = await fetch(`${API_BASE_URL}/api/history/${fullWalletAddress}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch history');
        }

        setHistory(data.data || []);
      } catch (error) {
        console.error('Error fetching history:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (isWalletConnected) {
      checkWalletAndFetchHistory();
    } else {
      setIsLoading(false);
    }

    return () => {
      retryCount = maxRetries; // Stop retrying if component unmounts
    };
  }, [isWalletConnected, fullWalletAddress]);

  // Update wallet connection check
  const { solana } = window;
  const isActuallyConnected = fullWalletAddress && isWalletConnected;

  if (isLoading) {
    return (
      <div className="history-container">
        <h2>📜 Construction Sell History</h2>
        <center>
        <div className="loading-spinner">🔄</div> 
        <p>Loading your Construction Sell history...</p>
        </center>
      </div>
    );
  }

  if (!isActuallyConnected) {
    return (
      <div className="history-container">
        <h2>📜 Construction Sell History</h2>
        <p className="connect-wallet-message">
          {!solana ? 
            "Please install Phantom wallet to view your construction sell history." :
            "Please connect your wallet to view your construction sell history."}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="history-container">
        <h2>📜 Construction Sell History</h2>
        <p className="error-message">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="history-container">
      <h2>📜 Construction Sell History</h2>
      <div className="history-table">
        <div className="history-header">
          <div className="history-cell">Construction</div>
          <div className="history-cell">Reward</div>
          <div className="history-cell">Date</div>
          <div className="history-cell">Transaction</div>
        </div>
        {history.length > 0 ? (
          history.map((item) => (
            <div key={item.transactionSignature} className="history-row">
              <div className="history-cell">
                {seedsData.find(seed => seed.id === item.plantType)?.icon}
                {' '}
              </div>
              <div className="history-cell">
                <img 
                  src={testfunIcon} 
                  alt="testfun" 
                  className="testfun-icon-history"
                />
                {item.reward}
              </div>
              <div className="history-cell">
                {new Date(item.harvestedAt).toLocaleDateString()} 
                {' '}
                {new Date(item.harvestedAt).toLocaleTimeString()}
              </div>
              <div className="history-cell">
                <a 
                  href={`https://solscan.io/tx/${item.transactionSignature}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transaction-link"
                >
                  View ↗
                </a>
              </div>
            </div>
          ))
        ) : (
          <div className="no-history">
            <p>No Construction history yet. Start Building to see your history!</p>
          </div>
        )}
      </div>
    </div>
  );
};

const initializePlots = () => {
  // Create 16 plots for 4x4 grid
  return Array(16).fill(null).map(() => ({
    planted: false,
    plantType: null,
    growthStage: 0,
    isWatered: false,
    plantedAt: null,
    readyToHarvest: false
  }));
};

const Play = () => {
  const navigate = useNavigate();
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);
  const [selectedTool, setSelectedTool] = useState('store');
  const [currentAction, setCurrentAction] = useState(null);
  const [selectedSeed, setSelectedSeed] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [plots, setPlots] = useState(initializePlots());
  const [hoveredPlot, setHoveredPlot] = useState(null);
  const [harvestNotification, setHarvestNotification] = useState(null);
  const [showWalletPrompt, setShowWalletPrompt] = useState(true);
  const [userSeeds, setUserSeeds] = useState({}); // Track owned seeds
  const [userBalance, setUserBalance] = useState(0); // Track SOL balance
  const STORE_WALLET = new PublicKey(process.env.REACT_APP_STORE_WALLET);
  const TOKEN_DECIMALS = parseInt(process.env.REACT_APP_TOKEN_DECIMALS);
  const [harvestingPlots, setHarvestingPlots] = useState({}); // Track harvesting state per plot
  const [showHarvestConfirm, setShowHarvestConfirm] = useState(false);
  const [selectedPlotForHarvest, setSelectedPlotForHarvest] = useState(null);
  const [showHarvestSuccess, setShowHarvestSuccess] = useState(false);
  const [harvestSuccessInfo, setHarvestSuccessInfo] = useState(null);
  const [harvestLoading, setHarvestLoading] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [visitedGarden, setVisitedGarden] = useState(null);
  // Add click handling state
  const [isProcessing, setIsProcessing] = useState(false);

  // Destructure fullWalletAddress from useWallet
  const { 
    walletAddress, 
    fullWalletAddress,  // Add this
    isWalletConnected, 
    connectWallet, 
    disconnectWallet,
    tokenBalance,
    notification,
    checkTokenBalance,
    TOKEN_MINT,     // Add back - digunakan untuk transaksi token
    DECIMALS        // Add back - digunakan untuk format balance
  } = useWallet();

  const tools = [
    { id: 'store', name: 'CONSTRUCTION SHOP', icon: '🏘️' },
    { id: 'garden', name: 'CONSTRUCTION AREA', icon: '🚜' },
    { id: 'history', name: 'HISTORY', icon: '📜' },
    { id: 'leaderboard', name: ' LEADERBOARD', icon: '🏆' },
    { id: 'farm', name: 'MONOPOLY', icon: '🎲' },
    // { id: 'visit', name: 'VISIT CONSTRUCTION', icon: '👥' }
  ]

  // Update RPC URL constant
  const DEVNET_RPC_URL = process.env.REACT_APP_DEVNET_RPC_URL;  // Changed from MAINNET to DEVNET
  
  // Update getConnection function
  const getConnection = () => {
    return new Connection(DEVNET_RPC_URL, {
      commitment: 'confirmed',
      wsEndpoint: undefined,
      confirmTransactionInitialTimeout: 60000
    });
  };

  // Update checkGrowth function dalam useEffect
  useEffect(() => {
    let isChecking = false;

    const checkGrowth = () => {
      if (isChecking) return;
      isChecking = true;
      
      setPlots(currentPlots => {
        const updatedPlots = currentPlots.map(plot => {
          if (!plot.planted || !plot.plantedAt || plot.readyToHarvest) {
            return plot;
          }

          const plantedSeed = seedsData.find(seed => seed.id === plot.plantType);
          if (!plantedSeed) return plot;

          try {
            const now = new Date().getTime();
            const plantedTime = new Date(plot.plantedAt).getTime();
            
            // Count time seeds when status watered
            let growthTimeMs = plantedSeed.growthTime * 1000;
            if (plot.isWatered) {
              // when status watered, time growth seeds will be faster
              growthTimeMs = growthTimeMs / 2;
            }
            
            const timePassed = now - plantedTime;
            
            // Skip update if no significant change
            if (Math.floor(timePassed/1000) === Math.floor(plot.lastChecked/1000)) {
              return plot;
            }

            const progress = Math.min((timePassed / growthTimeMs) * 100, 100);
            const growthStage = progress >= 100 ? 3 : 
                               progress >= 66 ? 2 : 
                               progress >= 33 ? 1 : 0;
            
            const readyToHarvest = timePassed >= growthTimeMs;

            // Only return new object if there are changes
            if (plot.growthStage !== growthStage || plot.readyToHarvest !== readyToHarvest) {
              return {
                ...plot,
                growthStage,
                readyToHarvest,
                progress,
                lastChecked: now
              };
            }
          } catch (error) {
            console.error('Error calculating growth:', error);
          }

          return plot;
        });

        // Only update state if there are actual changes
        const hasChanges = updatedPlots.some((plot, index) => 
          plot.growthStage !== currentPlots[index].growthStage || 
          plot.readyToHarvest !== currentPlots[index].readyToHarvest
        );

        isChecking = false;
        return hasChanges ? updatedPlots : currentPlots;
      });
    };

    // Reduce check frequency when tab is not visible
    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearInterval(growthInterval);
        growthInterval = setInterval(checkGrowth, 10000); // Check every 5 seconds when hidden
      } else {
        clearInterval(growthInterval);
        growthInterval = setInterval(checkGrowth, 1000); // Check every second when visible
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Initial interval
    let growthInterval = setInterval(checkGrowth, 1000);
    
    // Initial check
    checkGrowth();

    return () => {
      clearInterval(growthInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    // Check wallet connection when component mounts
    const checkInitialWalletConnection = async () => {
      const { solana } = window;
      
      if (solana?.isPhantom) {
        setShowWalletPrompt(!solana.isConnected);
      } else {
        setShowWalletPrompt(true);
      }
    };

    checkInitialWalletConnection();
  }, []);

  // Update showWalletPrompt when wallet connection status changes
  useEffect(() => {
    setShowWalletPrompt(!isWalletConnected);
  }, [isWalletConnected]);

  const createTokenAccount = async (connection, wallet) => {
    try {
      const associatedTokenAccount = await getAssociatedTokenAddress(
        TOKEN_MINT,
        wallet,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      console.log('Creating ATA on Helius mainnet:', associatedTokenAccount.toString());

      const transaction = new Transaction().add(
        createAssociatedTokenAccountInstruction(
          wallet,
          associatedTokenAccount,
          wallet,
          TOKEN_MINT,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )
      );

      const { blockhash } = await connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = wallet;

      const signed = await window.solana.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signed.serialize(), {
        skipPreflight: true,
        preflightCommitment: 'confirmed'
      });

      console.log('Token account creation signature:', signature);
      await connection.confirmTransaction(signature, 'confirmed');
      return associatedTokenAccount;
    } catch (error) {
      console.error('Detailed error in createTokenAccount:', error);
      throw error;
    }
  };

  const checkBalance = async () => {
    try {
      const { solana } = window;
      if (!solana?.isConnected) return;

      const connection = getConnection();
      
      try {
        const tokenAccount = await getAssociatedTokenAddress(
          TOKEN_MINT,
          solana.publicKey,
          false,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        );

        console.log('Checking token account on Helius:', tokenAccount.toString());

        try {
          const accountInfo = await getAccount(connection, tokenAccount);
          const balance = Number(accountInfo.amount) / Math.pow(10, TOKEN_DECIMALS);
          console.log('Current balance:', balance);
          setUserBalance(balance);
        } catch (e) {
          if (e.name === 'TokenAccountNotFoundError') {
            console.log('Token account not found, creating...');
            toast.info('Creating your token account...');
            
            try {
              await createTokenAccount(connection, solana.publicKey);
              console.log('Token account created successfully');
              toast.success('Token account created!');
              setUserBalance(0);
            } catch (createError) {
              console.error('Failed to create token account:', createError);
              toast.error('Could not create token account');
              setUserBalance(0);
            }
          } else {
            console.error('Unexpected error:', e);
            toast.error('Error checking balance');
            setUserBalance(0);
          }
        }
      } catch (e) {
        console.error('Error in token account process:', e);
        setUserBalance(0);
      }
    } catch (error) {
      console.error("Error checking balance:", error);
      setUserBalance(0);
    }
  };

  // Add useEffect to check/create token account on wallet connect
  useEffect(() => {
    if (isWalletConnected) {
      checkBalance();
    }
  }, [isWalletConnected]);

  // Update purchaseSeed function
  const purchaseSeed = async (seedWithQuantity) => {
    const { quantity, ...seed } = seedWithQuantity;
    
    // Add quantity validation with proper toast configuration
    if (quantity > 5) {
      toast.error("Maximum purchase limit is 5 seeds at a time!", {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
      return;
    }

    const totalPrice = seed.price * quantity;

    try {
      if (!isWalletConnected) {
        toast.error("Please connect your wallet first!", {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
        });
        return;
      }

      // Double check wallet connection and get full address
      const { solana } = window;
      if (!solana?.publicKey) {
        console.log('Reconnecting wallet...');
        await connectWallet();
        if (!solana?.publicKey) {
          toast.error("Unable to access wallet. Please try reconnecting.");
          return;
        }
      }

      // Get full wallet address
      const currentWalletAddress = solana.publicKey.toString();
      console.log('Processing purchase with wallet:', currentWalletAddress);

      // Verify balance again before purchase
      if (tokenBalance < totalPrice) {
        toast.error(`Insufficient balance! You have ${formatBalance(tokenBalance)} Construction, needed: ${formatBalance(totalPrice)} Construction`);
        return;
      }

      const connection = getConnection();
      const buyerTokenAccount = await getAssociatedTokenAddress(
        TOKEN_MINT,
        solana.publicKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const storeTokenAccount = await getAssociatedTokenAddress(
        TOKEN_MINT,
        STORE_WALLET,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      console.log('Purchase attempt:', {
        buyerTokenAccount: buyerTokenAccount.toString(),
        storeTokenAccount: storeTokenAccount.toString(),
        currentBalance: tokenBalance,
        totalPrice,
        quantity
      });

      const transaction = new Transaction();
      const transferAmount = new BN(totalPrice * Math.pow(10, TOKEN_DECIMALS));

      transaction.add(
        createTransferCheckedInstruction(
          buyerTokenAccount,
          TOKEN_MINT,
          storeTokenAccount,
          solana.publicKey,
          transferAmount.toNumber(),
          TOKEN_DECIMALS,
          [],
          TOKEN_PROGRAM_ID
        )
      );

      const { blockhash } = await connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = solana.publicKey;

      const loadingToast = toast.loading("Processing purchase...");

      try {
        const signed = await solana.signTransaction(transaction);
        const signature = await connection.sendRawTransaction(signed.serialize(), {
          skipPreflight: true,
          preflightCommitment: 'confirmed'
        });

        console.log('Transaction sent:', signature);
        
        // Tunggu konfirmasi transaksi
        const confirmation = await connection.confirmTransaction(signature, 'confirmed');
        
        if (confirmation.value?.err) {
          throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
        }

        // Update local state setelah transaksi berhasil
        const updatedUserSeeds = {
          ...userSeeds,
          [seed.id]: (userSeeds[seed.id] || 0) + quantity
        };
        setUserSeeds(updatedUserSeeds);

        // Save game state with full wallet address
        const gameState = {
          plots,
          userSeeds: updatedUserSeeds,
          lastUpdated: new Date().toISOString()
        };

        // Verify address length before saving
        if (currentWalletAddress.length !== 44) {
          throw new Error('Invalid wallet address format');
        }

        // Save ke server dengan full wallet address
        const saveResponse = await fetch(`${API_BASE_URL}/api/game-data/${currentWalletAddress}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ gameData: gameState })
        });

        if (!saveResponse.ok) {
          throw new Error('Failed to save game state');
        }

        console.log('Game state saved successfully for wallet:', currentWalletAddress);

        toast.update(loadingToast, {
          render: `Successfully purchased ${quantity} ${seed.name}${quantity > 1 ? 's' : ''}!`,
          type: "success",
          isLoading: false,
          autoClose: 3000
        });

        // Update token balance setelah transaksi berhasil
        if (checkTokenBalance) {
          await checkTokenBalance(solana.publicKey);
        }

      } catch (error) {
        console.error('Transaction error:', error);
        toast.update(loadingToast, {
          render: `Transaction failed: ${error.message}`,
          type: "error",
          isLoading: false,
          autoClose: 5000
        });
      }

    } catch (error) {
      console.error("Purchase error:", error);
      toast.error(`Purchase failed: ${error.message}`, {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    }
  };

  // Add this helper function to format numbers
  const formatBalance = (balance) => {
    return Number(balance).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: TOKEN_DECIMALS
    });
  };

  const handleToolSelect = (toolId) => {
    setSelectedTool(toolId);
    setCurrentAction(null);
  };

  const showHarvestNotification = (seedType, reward) => {
    setHarvestNotification({ seedType, reward });
    setTimeout(() => {
      setHarvestNotification(null);
    }, 3000); // Notification will disappear after 3 seconds
  };

  // Load initial data when wallet connects
  useEffect(() => {
    const loadGameData = async () => {
      if (!isWalletConnected || !fullWalletAddress) return;  // Check fullWalletAddress

      try {
        console.log('Loading game data for wallet:', fullWalletAddress);
        
        const response = await fetch(`${API_BASE_URL}/api/game-data/${fullWalletAddress}`);
        if (!response.ok) throw new Error('Failed to load game data');
        
        const data = await response.json();
        console.log('Raw loaded game data:', data); // Tambahkan log ini

        // Verifikasi data seeds
        console.log('Current userSeeds before load:', userSeeds);
        console.log('Loaded userSeeds:', data.userSeeds);

        setPlots(data.plots);
        setUserSeeds(data.userSeeds);

        console.log('UserSeeds after setState:', data.userSeeds);
        
        return data;
      } catch (error) {
        console.error('Error loading game data:', error);
        toast.error('Failed to load game data');
      }
    };

    loadGameData();
  }, [isWalletConnected, fullWalletAddress]);  // Update dependency array

  // Update saveGameData function
  const saveGameData = async (updatedPlots, updatedSeeds) => {
    try {
      // Get wallet address directly from window.solana to ensure we have the full address
      const currentWalletAddress = window.solana?.publicKey?.toString();
      
      if (!isWalletConnected || !currentWalletAddress) {
        console.error('No wallet connection available');
        return;
      }

      // Debug logs
      console.log('Current wallet states:', {
        windowSolanaAddress: currentWalletAddress,
        contextFullAddress: fullWalletAddress,
        contextWalletAddress: walletAddress
      });

      // Use the full address from window.solana
      const addressToUse = currentWalletAddress;
      console.log('Using wallet address for save:', addressToUse);

      const gameData = {
        plots: updatedPlots.map(plot => {
          // Handle plantedAt date conversion safely
          let plantedAtISO = null;
          if (plot.plantedAt) {
            try {
              if (plot.plantedAt instanceof Date) {
                plantedAtISO = plot.plantedAt.toISOString();
              } else if (typeof plot.plantedAt === 'string') {
                plantedAtISO = new Date(plot.plantedAt).toISOString();
              }
            } catch (error) {
              console.error('Error converting plantedAt date:', error);
              plantedAtISO = null;
            }
          }

          return {
            id: plot.id,
            planted: Boolean(plot.planted),
            plantType: plot.plantType,
            growthStage: Number(plot.growthStage) || 0,
            isWatered: Boolean(plot.isWatered),
            plantedAt: plantedAtISO,
            readyToHarvest: Boolean(plot.readyToHarvest)
          };
        }),
        userSeeds: updatedSeeds || {},
        lastUpdated: new Date().toISOString()
      };

      // Verify address length before making request
      if (addressToUse.length !== 44) {
        console.error('Invalid wallet address length:', addressToUse.length);
        console.error('Full address:', addressToUse);
        throw new Error('Invalid wallet address format');
      }

      const response = await fetch(`${API_BASE_URL}/api/game-data/${addressToUse}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gameData })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save game data');
      }

      console.log('Game data saved successfully for wallet:', addressToUse);
    } catch (error) {
      console.error('Error saving game data:', error);
      toast.error(error.message || 'Failed to save game progress');
    }
  };

  const handleWatering = async (plotIndex) => {
    try {
      const updatedPlots = [...plots];
      updatedPlots[plotIndex] = {
        ...updatedPlots[plotIndex],
        isWatered: true
      };
      setPlots(updatedPlots);
      
      // Replace saveUserData with saveGameData
      await saveGameData(updatedPlots, userSeeds);
      
    } catch (error) {
      console.error('Error watering plot:', error);
      toast.error('Failed to water plot');
    }
  };

  const handlePlanting = async (index, buildingType) => {
    try {
      console.log('Starting construction process...', { index, buildingType });
      
      // Verifikasi wallet connection terlebih dahulu
      const { solana } = window;
      console.log('Wallet status:', { 
        isWalletConnected, 
        hasPublicKey: !!solana?.publicKey,
        publicKey: solana?.publicKey?.toString() 
      });

      if (!isWalletConnected || !solana?.publicKey) {
        console.log('Reconnecting wallet...');
        await connectWallet();
        if (!solana?.publicKey) {
          toast.error("Please connect your wallet first!");
          return;
        }
      }

      // Log token balance check
      console.log('Token balance check:', {
        userTokenBalance: tokenBalance,
        plantedPlotsCount: plots.filter(plot => plot.planted).length,
        requiredTokensPerPlot: 50000
      });

      // Validasi token minimum per plot (50000 token)
      const requiredTokensPerPlot = 50000;
      const userTokenBalance = tokenBalance || 0;
      
      // Hitung jumlah plot yang sudah dibangun
      const plantedPlotsCount = plots.filter(plot => plot.planted).length;
      
      // Hitung total token yang dibutuhkan untuk plot baru
      const requiredTokens = (plantedPlotsCount + 1) * requiredTokensPerPlot;

      // Log building availability check
      console.log('Building availability check:', {
        buildingType,
        currentBuildingCount: userSeeds[buildingType] || 0,
        allUserBuildings: userSeeds
      });

      if (userTokenBalance < requiredTokens) {
        console.log('Insufficient tokens:', { userTokenBalance, requiredTokens });
        toast.error(`You need ${requiredTokens} farmfun tokens to unlock a new plot. Current balance: ${userTokenBalance}`);
        return;
      }

      // Periksa jumlah seed yang tersedia
      const currentSeedCount = userSeeds[buildingType] || 0;
      if (currentSeedCount <= 0) {
        console.log('No seeds available');
        toast.error("You don't have any seeds of this type!");
        return;
      }

      // Update userSeeds - kurangi jumlah seed yang digunakan
      const updatedSeeds = {
        ...userSeeds,
        [buildingType]: currentSeedCount - 1
      };
      setUserSeeds(updatedSeeds);

      // Update plots
      const updatedPlots = plots.map((plot, i) => {
        if (i === index) {
          return {
            ...plot,
            planted: true,
            plantType: buildingType,
            growthStage: 0,
            isWatered: false,
            plantedAt: new Date().toISOString(),
            readyToHarvest: false
          };
        }
        return plot;
      });
      setPlots(updatedPlots);

      console.log('Planting seed at:', new Date().toISOString());

      // Simpan ke server dengan userSeeds yang sudah diupdate
      const currentWalletAddress = solana.publicKey.toString();
      console.log('Saving with wallet address:', currentWalletAddress);

      await saveGameData(updatedPlots, updatedSeeds);

      toast.success('Seed planted successfully!');
    } catch (error) {
      console.error('Error planting seed:', error);
      
      // Rollback state jika gagal
      const currentSeedCount = userSeeds[buildingType] || 0;
      setUserSeeds({
        ...userSeeds,
        [buildingType]: currentSeedCount + 1  // Kembalikan seed yang gagal ditanam
      });
      
      toast.error('Failed to plant seed');
    }
  };

  const updatePlotGrowth = async (plotIndex, newGrowthStage, isReadyToHarvest = false) => {
    try {
      const updatedPlots = [...plots];
      updatedPlots[plotIndex] = {
        ...updatedPlots[plotIndex],
        growthStage: newGrowthStage,
        readyToHarvest: isReadyToHarvest
      };
      setPlots(updatedPlots);
      
      // Replace saveUserData with saveGameData
      await saveGameData(updatedPlots, userSeeds);
      
    } catch (error) {
      console.error('Error updating growth stage:', error);
    }
  };

  // Update handleHarvest function
  const handleHarvest = async (plot, index) => {
    try {
      if (!plot || !plot.readyToHarvest) {
        toast.error("This plot is not ready to harvest!");
        return;
      }

      if (!isWalletConnected) {
        toast.error("Please connect your wallet first!");
        return;
      }

      const { solana } = window;
      if (!solana?.publicKey) {
        console.log('Wallet state:', { isWalletConnected, publicKey: solana?.publicKey });
        await connectWallet();
        if (!solana?.publicKey) {
          toast.error("Unable to access wallet. Please try reconnecting.");
          return;
        }
      }

      setHarvestLoading(true);
      setHarvestingPlots(prev => ({ ...prev, [index]: true }));

      const plantedSeed = seedsData.find(seed => seed.id === plot.plantType);
      if (!plantedSeed) {
        throw new Error('Invalid plant type');
      }

      const connection = getConnection();
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      
      const rewardAmount = plantedSeed.reward * Math.pow(10, TOKEN_DECIMALS);

      console.log('Harvest initiated:', {
        isWalletConnected,
        walletAddress: solana.publicKey.toString(),
        plotIndex: index,
        plantType: plot.plantType,
        reward: rewardAmount,
        blockhash
      });

      const response = await fetch(`${API_BASE_URL}/api/harvest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: solana.publicKey.toString(),
          plotIndex: index,
          plantType: plot.plantType,
          reward: rewardAmount,
          blockhash
        })
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to create harvest transaction');
      }

      const transactionBuffer = Buffer.from(result.transaction, 'base64');
      const transaction = Transaction.from(transactionBuffer);

      transaction.feePayer = solana.publicKey;
      transaction.recentBlockhash = blockhash;

      const signedTransaction = await solana.signTransaction(transaction);
      
      if (!signedTransaction.signatures.every(sig => sig.signature)) {
        throw new Error('Transaction not properly signed');
      }

      const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
        maxRetries: 3
      });

      console.log('Transaction sent:', signature);

      const confirmation = await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      }, 'confirmed');

      if (confirmation.value?.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      }

      try {
        const leaderboardUpdate = await fetch(`${API_BASE_URL}/api/leaderboard/update`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            walletAddress: window.solana.publicKey.toString(),
            harvestCount: 1,
            totalReward: plantedSeed.reward,
            transactionSignature: signature,
            plantType: plantedSeed.id,    // Add plant type
            plantName: plantedSeed.name   // Add plant name
          })
        });

        if (!leaderboardUpdate.ok) {
          console.error('Failed to update leaderboard:', await leaderboardUpdate.text());
        }
      } catch (error) {
        console.error('Error updating leaderboard:', error);
      }

      // Update plot state
      const updatedPlots = plots.map((p, i) => {
        if (i === index) {
          return {
            ...p,
            planted: false,
            plantType: null,
            growthStage: 0,
            isWatered: false,
            plantedAt: null,
            readyToHarvest: false
          };
        }
        return p;
      });
      setPlots(updatedPlots);

      // Save game data dan tampilkan success notification
      await saveGameData(updatedPlots, userSeeds);
      setHarvestSuccessInfo({
        plantName: plantedSeed.name,
        plantIcon: plantedSeed.icon,
        reward: plantedSeed.reward
      });
      setShowHarvestSuccess(true);

      if (checkTokenBalance) {
        await checkTokenBalance(solana.publicKey);
      }
      
      toast.success('Harvest successful!');

    } catch (error) {
      console.error('Harvest error:', error);
      
      if (error.message.includes('User rejected')) {
        toast.error('Transaction was rejected by user');
        return; 
      } else {
        toast.error(`Harvest failed: ${error.message}`);
      }
    } finally {
      setHarvestLoading(false);
      setHarvestingPlots(prev => ({ ...prev, [index]: false }));
      setShowHarvestConfirm(false);
      setSelectedPlotForHarvest(null);
    }
  };

  // Add function to fetch leaderboard data
  const fetchLeaderboardData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/leaderboard`);
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard data');
      }
      const data = await response.json();
      setLeaderboardData(data);
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
      toast.error('Failed to update leaderboard');
    }
  };

  // Add helper function to check network
  const checkDevnetConnection = async () => {
    try {
      const connection = getConnection();
      const { blockhash } = await connection.getLatestBlockhash('confirmed');
      return !!blockhash;
    } catch (error) {
      console.error('Network check failed:', error);
      return false;
    }
  };

  // Add network check before harvest
  useEffect(() => {
    const checkNetwork = async () => {
      const isConnected = await checkDevnetConnection();
      if (!isConnected) {
        toast.error('Please make sure you are connected to Devnet');
      }
    };
    
    if (isWalletConnected) { 
      checkNetwork();
    }
  }, [isWalletConnected]);

  // Update handlePlotClick to be async
  const handlePlotClick = async (index) => {
    // Prevent multiple clicks while processing
    if (isProcessing) return;

    // Add console log to debug
    console.log('Plot clicked:', {
      index,
      currentAction,
      selectedSeed,
      plotData: plots[index],
      userSeeds,
      isWalletConnected
    });

    if (!currentAction) {
      console.log('No current action selected');
      return;
    }

    if (!isWalletConnected) {
      toast.error("Please connect your wallet first!");
      return;
    }

    try {
      setIsProcessing(true);
      const plot = plots[index];

      if (currentAction === 'plant') {
        if (!selectedSeed) {
          toast.error("Please select a building first!");
          return;
        }

        if (plot.planted) {
          toast.error("This plot already has a building!");
          return;
        }

        if (!userSeeds[selectedSeed] || userSeeds[selectedSeed] <= 0) {
          toast.error("You don't own this building! Please purchase it from the store first.");
          return;
        }

        await handlePlanting(index, selectedSeed);
      }

      if (currentAction === 'harvest') {
        if (plot.planted && plot.readyToHarvest) {
          setSelectedPlotForHarvest({ plot, index });
          setShowHarvestConfirm(true);
        } else if (plot.planted && !plot.readyToHarvest) {
          toast.info("Construction is not complete yet!");
        }
      }
    } catch (error) {
      console.error('Error handling plot click:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Add harvest confirmation modal JSX
  const renderHarvestConfirmation = () => {
    if (!showHarvestConfirm || !selectedPlotForHarvest) return null;

    const plantedSeed = seedsData.find(seed => seed.id === selectedPlotForHarvest.plot.plantType);
    if (!plantedSeed) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-content harvest-confirm-modal">
          <h2>Confirm Sell</h2>
          <div className="harvest-info">
            <div className="plant-info-container">
              <span className="plant-name">{plantedSeed.name}</span>
              <span className="plant-icon-container">{plantedSeed.icon}</span>
            </div>
            <p className="reward-info">
              Reward: 
              <img 
                src={testfunIcon} 
                alt="testfun" 
                className="testfun-icon-leaderboard"
              />
              {plantedSeed.reward} 
            </p>
          </div>
          <div className="modal-buttons">
            <button 
              className="confirm-button"
              onClick={handleHarvestConfirm}
              disabled={harvestLoading}
            >
              {harvestLoading ? 'Selling...' : 'Sell'}
            </button>
            <button 
              className="cancel-button"
              onClick={handleHarvestCancel}
              disabled={harvestLoading}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handleHarvestConfirm = () => {
    if (selectedPlotForHarvest) {
      handleHarvest(selectedPlotForHarvest.plot, selectedPlotForHarvest.index);
      setShowHarvestConfirm(false);
      setSelectedPlotForHarvest(null);
    }
  };

  const handleHarvestCancel = () => {
    setShowHarvestConfirm(false);
    setSelectedPlotForHarvest(null);
  };

  const handleSuccessClose = useCallback(() => {
    setShowHarvestSuccess(false);
    setHarvestSuccessInfo(null);
  }, []);

  const renderGardenTools = () => (
    <div className="garden-tools">
      <div className="seed-selector">
        <button 
          className={`garden-tool build-tool ${currentAction === 'plant' ? 'active' : ''}`}
          data-tool="build"
          onClick={() => {
            setCurrentAction('plant');
            setDropdownOpen(!dropdownOpen);
          }}
        >
          <span className="tool-icon">🏗️</span>
          <span className="tool-name">Build</span>
        </button>
        {currentAction === 'plant' && dropdownOpen && (
          <div className="seed-options">
            {seedsData.map(seed => (
              <button
                key={seed.id}
                className={`seed-option ${selectedSeed === seed.id ? 'selected' : ''} ${
                  !userSeeds[seed.id] || userSeeds[seed.id] <= 0 ? 'disabled' : ''
                }`}
                onClick={() => {
                  if (userSeeds[seed.id] && userSeeds[seed.id] > 0) {
                    setSelectedSeed(seed.id);
                    setDropdownOpen(false);
                  } else {
                    alert("You don't own this building! Please purchase it from the store first.");
                  }
                }}
              >
                <span className="seed-icon">{seed.icon}</span>
                <span className="seed-name">{seed.name}</span>
                <span className="seed-owned">Owned: {userSeeds[seed.id] || 0}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <button 
        className={`garden-tool harvest-tool ${currentAction === 'harvest' ? 'active' : ''}`}
        data-tool="harvest"
        onClick={() => {
          setCurrentAction('harvest');
          setSelectedSeed(null);
          setDropdownOpen(false);
        }}
      >
        <span className="tool-icon">💲</span>
        <span className="tool-name">Sell</span>
      </button>
    </div>
  );

  const renderPlotProgress = (plot) => {
    if (!plot.planted || !plot.plantedAt) return null;

    const seed = seedsData.find(s => s.id === plot.plantType);
    if (!seed) return null;

    try {
      // Pastikan plantedAt adalah timestamp yang valid
      const plantedTime = new Date(plot.plantedAt).getTime();
      if (isNaN(plantedTime)) {
        console.error('Invalid plantedAt time:', plot.plantedAt);
        return null;
      }

      const now = Date.now();
      const growthTimeMs = seed.growthTime * 1000;
      const timePassed = now - plantedTime;
      const progress = Math.min((timePassed / growthTimeMs) * 100, 100);
      const timeRemaining = Math.max(growthTimeMs - timePassed, 0);

      // Format remaining time
      const formatTimeRemaining = (ms) => {
        if (ms <= 0) return 'Ready to harvest!';
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((ms % (1000 * 60)) / 1000);
        
        let timeString = '';
        if (hours > 0) timeString += `${hours}h `;
        if (minutes > 0 || hours > 0) timeString += `${minutes}m `;
        timeString += `${seconds}s`;
        return timeString;
      };

      return (
        <div className="plot-progress-popup">
          <div className="plot-progress-content">
            <h4>{seed.name}</h4>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="time-remaining">{formatTimeRemaining(timeRemaining)}</p>
          </div>
        </div>
      );
    } catch (error) {
      console.error('Error rendering plot progress:', error);
      return null;
    }
  };

  const renderHarvestNotification = () => {
    if (!harvestNotification) return null;

    return (
      <div className="harvest-notification">
        <div className="notification-content">
          <div className="notification-icon">
            {harvestNotification.seedType.icon}
          </div>
          <div className="notification-text">
            <h3>Harvest Success!</h3>
            <p>You harvested {harvestNotification.seedType.name}</p>
            <p className="reward-text">
              +{harvestNotification.reward} coins
            </p>
          </div>
        </div>
      </div>
    );
  };

  const WalletPrompt = () => (
    <div className="wallet-prompt">
      <div className="wallet-prompt-content">
        <div className="wallet-prompt-icon"></div>
        <img 
            src={testfunIcon} 
            alt="testfun" 
            className="wallet-icon"
          /> 
        <h2>Connect Wallet Required</h2>
        <div className="wallet-prompt-devnet">
        <p>Please connect your Phantom wallet using Mainnet to access the game</p>
        </div>
        <button onClick={connectWallet} className="connect-wallet-btn">
          {!window.solana?.isPhantom ? 'Install Phantom Wallet' : 'Connect Wallet'}
        </button>
      </div>
    </div>
  );

  // Add this new state to track quantities for all seeds
  const [seedQuantities, setSeedQuantities] = useState(
    Object.fromEntries(seedsData.map(seed => [seed.id, 1]))
  );

  // Add function to handle quantity changes
  const handleQuantityChange = (seedId, value) => {
    const limitedValue = Math.min(Math.max(1, value), 5);
    setSeedQuantities(prev => ({
      ...prev,
      [seedId]: limitedValue
    }));
  };
  
    

  const renderStoreContent = () => (
    <div className="store-wrapper">
      <div className="store-container">
        <div className="current-balance">
          Balance:  
          <img 
            src={testfunIcon} 
            alt="testfun" 
            className="testfun-icon"
          /> 
          {formatBalance(tokenBalance)}
        </div>
        <div className="store-items">
          {seedsData.map(seed => {
            const quantity = seedQuantities[seed.id];
            const totalPrice = seed.price * quantity;
            const totalReward = seed.reward * quantity;
            const ownedQuantity = userSeeds[seed.id] || 0;
            const sellPrice = seed.price * quantity * 0.95; // 5% price cut
            
            return (
              <div key={seed.id} className="store-item">
                <div className="price-tag">
                  Price: 
                  <img 
                    src={testfunIcon} 
                    alt="testfun" 
                    className="testfun-icon"
                  /> 
                  {formatBalance(totalPrice)}
                </div>
                <div className="seed-count">
                  Owned: {userSeeds[seed.id] || 0}
                </div>
                <div className="item-icon">{seed.icon}</div>
                <div className="item-details">
                  <h3>{seed.name}</h3>
                  <p>{seed.description}</p>
                  <p>Construction Time: {formatGrowthTime(seed.growthTime)}</p>
                  <p>Income: 
                    <img 
                      src={testfunIcon} 
                      alt="testfun" 
                      className="testfun-icon"
                    /> 
                    {formatBalance(totalReward)}
                  </p>
                  <div className="quantity-selector">
                    <button 
                      className="quantity-btn"
                      onClick={() => handleQuantityChange(seed.id, quantity - 1)}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        handleQuantityChange(seed.id, val);
                      }}
                      className="quantity-input"
                    />
                    <button 
                      className="quantity-btn"
                      onClick={() => handleQuantityChange(seed.id, quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
                <button 
                  className={`buy-seed-btn ${tokenBalance < totalPrice ? 'insufficient-funds' : ''}`}
                  onClick={() => purchaseSeed({ ...seed, quantity })}
                  disabled={!isWalletConnected || tokenBalance < totalPrice}
                >
                  {tokenBalance < totalPrice ? 
                    `Need ${formatBalance(totalPrice - tokenBalance)} Construction token` : 
                    `Buy ${quantity} Construction${quantity > 1 ? 's' : ''}`}
                </button>

                {/* Add Sell button */}
                {ownedQuantity > 0 && (
                  <button 
                    className="sell-seed-btn"
                    onClick={() => sellSeed({ ...seed, quantity })}
                    disabled={!isWalletConnected || quantity > ownedQuantity}
                  >
                    {`Sell ${quantity} Construction${quantity > 1 ? 's' : ''} for ${formatBalance(sellPrice)}`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <ToastContainer 
          position="top-center"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />
      </div>
    </div>
  );

  const renderPlantContent = (plot, index) => {
    if (!plot) return null;
    
    const seed = seedsData.find(s => s.id === plot.plantType);
    if (!seed) return null;

    // Show construction animation if building is in progress
    if (plot.planted && !plot.readyToHarvest) {
      // Meningkatkan jumlah partikel dari 10 menjadi 15
      const dustParticles = [...Array(15)].map((_, i) => {
        // Menentukan apakah partikel akan menjadi asap tebal
        const isThick = i % 3 === 0; // Setiap partikel ke-3 menjadi asap tebal
        
        return {
          key: i,
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          // Delay yang lebih pendek untuk memulai lebih cepat
          delay: `${Math.random() * 0.8}s`,
          // Durasi lebih singkat agar bergerak lebih cepat
          duration: `${1.2 + Math.random() * 0.8}s`,
          // Menandai mana yang merupakan asap tebal
          isThick
        };
      });

      return (
        <>
          <div className="construction-container">
            <div className="construction-overlay">
              {/* Ikon seed dengan efek transparan dan pulse */}
              <div className="seed-icon-wrapper seed-behind">
                {seedsData.find(s => s.id === plot.plantType)?.icon}
              </div>
              <div className="construction-effect"></div>
              
              {/* Efek debu konstruksi dengan optimasi */}
              <div className="construction-dust">
                {dustParticles.map(particle => (
                  <div 
                    key={particle.key} 
                    // Menambahkan kelas 'thick' untuk partikel asap tebal
                    className={`dust-particle ${particle.isThick ? 'thick' : ''}`}
                    style={{
                      left: particle.left,
                      top: particle.top,
                      animationDelay: particle.delay,
                      animationDuration: particle.duration
                    }}
                  />
                ))}
              </div>
            </div>
            {hoveredPlot === index && renderPlotProgress(plot)}
          </div>
        </>
      );
    }

    // Show completed building
    return (
      <>
        <div className="plant-icon">{seed.icon}</div>
        {plot.readyToHarvest && (
          <div className="harvest-ready-indicator">✨</div>
        )}
        {hoveredPlot === index && renderPlotProgress(plot)}
      </>
    );
  };

  const renderPlotWithRoads = (plot, index) => {
    const roadType = isRoadPlot(index);
    let plotClass = 'plot';
    
    if (roadType.intersection) {
      plotClass += ' plot-road plot-road-intersection';
    } else if (roadType.horizontal) {
      plotClass += ' plot-road plot-road-horizontal';
    } else if (roadType.vertical) {
      plotClass += ' plot-road plot-road-vertical';
    } else {
      plotClass += ' plot-land';
      if (plot.planted) plotClass += ' planted';
    }

    return (
      <div 
        key={`plot-${index}`}
        className={plotClass}
        onClick={() => !roadType.horizontal && !roadType.vertical && !roadType.intersection && handlePlotClick(index)}
        onMouseEnter={() => setHoveredPlot(index)}
        onMouseLeave={() => setHoveredPlot(null)}
      >
        {plot.planted && renderPlantContent(plot, index)}
      </div>
    );
  };

  const renderGardenArea = () => (
    <div className="garden-area">
      <div className="current-balance-garden">
        <div className="balance-content">
          Balance:  
          <img 
            src={testfunIcon} 
            alt="testfun" 
            className="testfun-icon"
          /> 
          {formatBalance(tokenBalance)}
        </div>
        
        <div className="garden-tools">
          <div className="seed-selector">
            <button 
              className={`garden-tool build-tool ${currentAction === 'plant' ? 'active' : ''}`}
              data-tool="build"
              onClick={() => {
                setCurrentAction('plant');
                setDropdownOpen(!dropdownOpen);
              }}
            >
              <span className="tool-icon">🏗️</span>
              <span className="tool-name">Build</span>
            </button>
            
            {/* Move the dropdown inside the seed-selector */}
            {currentAction === 'plant' && dropdownOpen && (
              <div className="seed-options">
                {seedsData.map(seed => (
                  <button
                    key={seed.id}
                    className={`seed-option ${selectedSeed === seed.id ? 'selected' : ''} ${
                      !userSeeds[seed.id] || userSeeds[seed.id] <= 0 ? 'disabled' : ''
                    }`}
                    onClick={() => {
                      if (userSeeds[seed.id] && userSeeds[seed.id] > 0) {
                        setSelectedSeed(seed.id);
                        setDropdownOpen(false);
                      } else {
                        alert("You don't own this building! Please purchase it from the store first.");
                      }
                    }}
                  >
                    <span className="seed-icon">{seed.icon}</span>
                    <span className="seed-name">{seed.name}</span>
                    <span className="seed-owned">Owned: {userSeeds[seed.id] || 0}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <button 
            className={`garden-tool harvest-tool ${currentAction === 'harvest' ? 'active' : ''}`}
            data-tool="harvest"
            onClick={() => {
              setCurrentAction('harvest');
              setSelectedSeed(null);
              setDropdownOpen(false);
            }}
          >
            <span className="tool-icon">💲</span>
            <span className="tool-name">Sell</span>
          </button>
        </div>
      </div>
      
      <div className="plots-container">
        <div className="plots-grid">
          {renderPlots()}
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    if (!isWalletConnected) {
      return <WalletPrompt />;
    }

    if (isBalanceLoading) {
      return (
        <div className="balance-loading">
          <div className="loading-spinner">🔄</div>
          <p>Loading balance...</p>
        </div>
      );
    }

    switch(selectedTool) {
      case 'store':
        return renderStoreContent();
      case 'garden':
        return renderGardenArea();
      case 'farm':
      case 'nft':
        return (
          <div className="coming-soon">
            <div className="coming-soon-content">
              <div className="coming-soon-icon">🚧</div>
              <h2>Coming Soon!</h2>
              <p>This feature is under development</p>
            </div>
          </div>
        );
      case 'leaderboard':
        return <LeaderboardContent />;
      case 'visit':
        return visitedGarden ? (
          <VisitedGarden 
            gardenData={visitedGarden} 
            onBack={() => setVisitedGarden(null)}
          />
        ) : (
          <VisitGarden 
            onVisit={(gardenData) => setVisitedGarden(gardenData)}
          />
        );
      case 'history':
        return <History />;
      default:
        return renderStoreContent();
    }
  };

  // Add CSS for loading state
  const styles = `
    .loading-indicator {
      animation: spin 1s linear infinite;
      color: #FFD700;
      font-weight: bold;
    }

    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    .plot.ready:not(.harvesting):hover {
      cursor: pointer;
      transform: scale(1.05);
      transition: transform 0.2s;
    }

    .plot.harvesting {
      pointer-events: none;
      opacity: 0.8;
    }

    .plot.locked {
      background-color: rgba(0, 0, 0, 0.5);
      cursor: not-allowed;
    }

    .locked-overlay {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #fff;
      text-align: center;
    }

    .lock-icon {
      font-size: 24px;
      margin-bottom: 5px;
    }

    .tokens-needed {
      font-size: 12px;
      color: #ccc;
    }

    .quantity-selector {
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 10px 0;
      gap: 8px;
    }

    .quantity-btn {
      background: #2a2a2a;
      border: 1px solid #4a4a4a;
      color: white;
      width: 30px;
      height: 30px;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      transition: all 0.2s;
    }

    .quantity-btn:hover {
      background: #3a3a3a;
    }

    .quantity-btn:active {
      transform: scale(0.95);
    }

    .quantity-input {
      width: 50px;
      height: 30px;
      text-align: center;
      background: #2a2a2a;
      border: 1px solid #4a4a4a;
      color: white;
      border-radius: 4px;
      font-size: 14px;
    }

    .quantity-input::-webkit-inner-spin-button,
    .quantity-input::-webkit-outer-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    .quantity-input {
      -moz-appearance: textfield;
    }

    .testfun-icon {
      width: 20px;
      height: 20px;
      vertical-align: middle;
      margin: 0 4px;
    }

     .wallet-icon {
        width: 175px;
        height: 175px;
        vertical-align: middle;
        margin-bottom: 25px;
         animation: bounce 1s infinite;
      }

    .current-balance {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .loading-spinner {
      display: inline-block;
      animation: spin 1s linear infinite;
      margin-right: 8px;
    }

    .harvest-confirm-btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .balance-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
      color: white;
    }

    .loading-spinner {
      animation: spin 1s linear infinite;
      font-size: 24px;
      margin-bottom: 10px;
    }

    .current-balance, .current-balance-garden {
      opacity: ${isBalanceLoading ? 0.5 : 1};
      transition: opacity 0.3s ease;
    }

    .visit-garden-container {
      padding: 20px;
      max-width: 600px;
      margin: 0 auto;
      margin-top: 50px;
      margin-bottom: 100px;
    }

    .visit-garden-input {
      flex: 1;
      padding: 10px;
      border: 1px solid #4a4a4a;
      border-radius: 4px;
      background: #2a2a2a;
      color: white;
    }

    .visit-garden-button {
      padding: 10px 20px;
      background: #4a4a4a;
      border: none;
      border-radius: 4px;
      color: white;
      cursor: pointer;
    }

    .visit-garden-button:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .history-container {
  width: 1200px;
  margin: 20px auto;
  padding: 80px;
  background: rgba(0, 137, 123, 0.9);
  box-shadow: 0 2px 10px #FFD700;
  animation: glow 1s infinite;
  font-family: 'Press Start 2P', cursive;
}

.history-container h2 {
  text-align: center;
  color:rgb(255, 255, 255);
  font-size: 32px;
  margin-bottom: 20px;
}

.history-table {
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  border-color: #FFD700;
  margin-top: 20px;
}

.history-header {
  display: grid;
  grid-template-columns: 2fr 2.5fr 3fr 1fr;
  background: #2a2a2a;
  padding: 12px 20px;
  font-weight: bold;
  color: #FFD700;
  text-align: center;
}

.history-row {
  display: grid;
  grid-template-columns: 1fr 1fr 2fr 1fr;
  padding: 12px 20px;
  border-bottom: 1px solid #FFD700;
  transition: background-color 0.2s;
  color: yellow;
  position: relative;
}

.history-row:hover {
  background: rgba(255, 255, 255, 0.05);
}

.history-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
}

.transaction-link {
  color:rgb(0, 213, 255);
  text-decoration: none;
  padding: 4px 8px;
  border-radius: 4px;
  background: rgba(76, 175, 80, 0.1);
  transition: all 0.3s ease;
}

.transaction-link:hover {
  background: rgba(0, 0, 0, 0.2);
  transform: translateY(-2px);
}

.testfun-icon-history {
  width: 20px;
  height: 20px;
  image-rendering: pixelated;
}

.no-history {
  text-align: center;
  padding: 40px;
  color: #FFD700;
  font-size: 14px;
}


.error-message {
  color: #f44336;
  text-align: center;
  padding: 20px;
  font-size: 14px;
}

.connect-wallet-message {
  text-align: center;
  color: #FFD700;
  padding: 40px;
  font-size: 14px;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .history-container {
    width: 95%;
    padding: 40px;
  }
}

@media (max-width: 768px) {
  .history-container {
    padding: 20px;
  }

  .history-header, .history-row {
    grid-template-columns: 2fr 1fr 2fr 0.5fr;
    font-size: 12px;
    padding: 8px 12px;
  }

  .history-cell {
    padding: 4px;
  }

  `;

  // Add style tag to head
  const styleSheet = document.createElement("style");
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);

  // Add CSS for toast customization
  const toastStyles = `
    .Toastify__toast {
      border-radius: 8px;
      background: #2a2a2a;
      color: #fff;
    }

    .Toastify__toast--success {
      background: #2a2a2a;
      border: 1px solid #4caf50;
    }

    .Toastify__toast--error {
      background: #2a2a2a;
      border: 1px solid #f44336;
    }

    .Toastify__toast--loading {
      background: #2a2a2a;
      border: 1px solid #2196f3;
    }

    .Toastify__progress-bar {
      background: #4caf50;
    }

    .Toastify__toast-icon {
      font-size: 20px;
    }

    .sell-seed-btn {
    width: 100%;
    padding: 8px;
    margin-top: 8px;
    background: #FF4444;  /* Warna merah untuk membedakan dengan buy button yang gold */
    border: 3px solid #000;
    font-family: 'Bungee', cursive !important;
    font-size: 12px;
    color: #000;
    cursor: pointer;
    box-shadow: 
        inset -3px -3px 0 0 #8B0000,  /* Warna merah yang lebih gelap untuk shadow */
        inset 3px 3px 0 0 #FFA07A;    /* Warna merah muda untuk highlight */
    transition: all 0.1s ease;
}

.sell-seed-btn:hover:not(:disabled) {
    transform: scale(1.02);
    box-shadow: 
        inset -2px -2px 0 0 #8B0000,
        inset 2px 2px 0 0 #FFA07A;
}

.sell-seed-btn:disabled {
    background: #666;
    color: #999;
    cursor: not-allowed;
    border: 2px solid #444;
    box-shadow: none;
    transform: none;
    opacity: 0.7;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .sell-seed-btn {
        padding: 6px;
        font-size: 10px;
    }
}
  `;

  const toastStyleSheet = document.createElement("style");
  toastStyleSheet.innerText = toastStyles;
  document.head.appendChild(toastStyleSheet);

  // Add this helper function
  const formatGrowthTime = (seconds) => {
    if (seconds >= 3600) {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const remainingSeconds = seconds % 60;
      
      if (minutes > 0 || remainingSeconds > 0) {
        return `${hours}h ${minutes}m ${remainingSeconds}s`;
      }
      return `${hours}h`;
    } else if (seconds >= 60) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  };

  // Add validatePlot function
  const validatePlot = (plot) => {
    if (!plot) return false;
    
    // Check if plot exists and has required properties
    if (!plot.hasOwnProperty('planted') || 
        !plot.hasOwnProperty('plantType') || 
        !plot.hasOwnProperty('growthStage') || 
        !plot.hasOwnProperty('isWatered') || 
        !plot.hasOwnProperty('plantedAt') || 
        !plot.hasOwnProperty('readyToHarvest')) {
      return false;
    }

    // If plot is planted, validate required fields
    if (plot.planted) {
      if (plot.plantType === null || 
          typeof plot.growthStage !== 'number' || 
          typeof plot.isWatered !== 'boolean' || 
          !plot.plantedAt) {
        return false;
      }
    }

    return true;
  };

  // Add effect to sync wallet state and balance
  useEffect(() => {
    const syncWalletAndBalance = async () => {
      if (isWalletConnected && window.solana?.publicKey) {
        try {
          console.log('Syncing wallet and balance...');
          await checkTokenBalance(window.solana.publicKey);
        } catch (error) {
          console.error('Error syncing wallet and balance:', error);
        }
      }
    };

    syncWalletAndBalance();
  }, [isWalletConnected, checkTokenBalance]);

  const handleVisitGarden = async (gardenAddress) => {
    try {
      console.log('Visiting garden with address:', gardenAddress);
      
      // Bersihkan address sebelum digunakan
      const cleanAddress = gardenAddress.trim();
      
      if (!cleanAddress) {
        toast.error('Please enter a wallet address');
        return;
      }

      // Validasi address format (basic Solana address validation)
      if (cleanAddress.length !== 44) {
        toast.error('Please enter a valid Solana wallet address');
        return;
      }

      console.log('Fetching garden data for address:', cleanAddress);
      
      const response = await fetch(`${API_BASE_URL}/api/visit-garden/${cleanAddress}`);
      const data = await response.json();
      
      console.log('Received response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load garden');
      }
      
      // Validasi data sebelum mengatur state
      if (!data.data || !Array.isArray(data.data.plots)) {
        throw new Error('Invalid garden data received');
      }
      
      setVisitedGarden(data.data);
    } catch (error) {
      console.error('Error visiting garden:', error);
      toast.error(error.message);
    }
  };

  // Add state to track if there are unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const lastSaveTimeRef = useRef(Date.now());

  // Add new useEffect for smart auto-save
  useEffect(() => {
    if (!isWalletConnected || !fullWalletAddress) return;

    console.log('Auto-saving game state...', fullWalletAddress); // Log untuk debugging
    const autoSaveGameState = async () => {
      const timeSinceLastSave = Date.now() - lastSaveTimeRef.current;
      if (!hasUnsavedChanges || timeSinceLastSave < 60000) {
        return;
      }

      try {
        const gameState = {
          plots,
          userSeeds,
          lastUpdated: new Date().toISOString()
        };

        const response = await fetch(`${API_BASE_URL}/api/game-data/${fullWalletAddress}`, { // Gunakan fullWalletAddress
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ gameData: gameState })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to auto-save game state');
        }

        lastSaveTimeRef.current = Date.now();
        setHasUnsavedChanges(false);
      } catch (error) {
        console.error('Auto-save error:', error);
      }
    };

    const autoSaveInterval = setInterval(autoSaveGameState, 3 * 60 * 1000);

    const handleBeforeUnload = () => {
      if (hasUnsavedChanges) {
        autoSaveGameState();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(autoSaveInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isWalletConnected, fullWalletAddress, plots, userSeeds, hasUnsavedChanges]);

  // Update hasUnsavedChanges when relevant game state changes
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [plots, userSeeds]);

  // Add new sellSeed function
  const sellSeed = async (seedWithQuantity) => {
    const { quantity, ...seed } = seedWithQuantity;
    const sellPrice = seed.price * quantity * 0.95; // 5% price cut

    try {
      if (!isWalletConnected) {
        toast.error("Please connect your wallet first!");
        return;
      }

      // Verify owned seeds more strictly
      const ownedQuantity = userSeeds[seed.id] || 0;
      if (ownedQuantity <= 0) {
        toast.error(`You don't have any ${seed.name} to sell!`);
        return;
      }

      if (ownedQuantity < quantity) {
        toast.error(`You only have ${ownedQuantity} ${seed.name}${ownedQuantity !== 1 ? 's' : ''} to sell`);
        return;
      }

      // Double check wallet connection
      const { solana } = window;
      if (!solana?.publicKey) {
        console.log('Reconnecting wallet...');
        await connectWallet();
        if (!solana?.publicKey) {
          toast.error("Unable to access wallet. Please try reconnecting.");
          return;
        }
      }

      const connection = getConnection();
      const { blockhash } = await connection.getLatestBlockhash('confirmed');
      
      const loadingToast = toast.loading("Processing sale...");

      try {
        // Get sell transaction from backend
        const sellResponse = await fetch(`${API_BASE_URL}/api/sell`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            walletAddress: solana.publicKey.toString(),
            seedId: seed.id,
            quantity,
            ownedQuantity, // Send current owned quantity for server-side validation
            sellPrice: Math.floor(sellPrice * Math.pow(10, TOKEN_DECIMALS)),
            blockhash
          })
        });

        if (!sellResponse.ok) {
          const errorData = await sellResponse.json();
          throw new Error(errorData.error || 'Failed to create sell transaction');
        }

        const { transaction: base64Transaction } = await sellResponse.json();

        // Verify again before proceeding with transaction
        const currentOwnedQuantity = userSeeds[seed.id] || 0;
        if (currentOwnedQuantity < quantity) {
          throw new Error(`Insufficient seeds: You only have ${currentOwnedQuantity} ${seed.name}${currentOwnedQuantity !== 1 ? 's' : ''}`);
        }

        // Convert base64 transaction to Transaction object
        const transaction = Transaction.from(Buffer.from(base64Transaction, 'base64'));

        // Sign and send transaction
        const signed = await solana.signTransaction(transaction);
        const signature = await connection.sendRawTransaction(signed.serialize(), {
          skipPreflight: true,
          preflightCommitment: 'confirmed'
        });

        console.log('Transaction sent:', signature);
        
        const confirmation = await connection.confirmTransaction(signature, 'confirmed');
        
        if (confirmation.value?.err) {
          throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
        }

        // Final verification before updating state
        const finalOwnedQuantity = userSeeds[seed.id] || 0;
        if (finalOwnedQuantity < quantity) {
          throw new Error('State error: Seed quantity changed during transaction');
        }

        // Update local state after successful transaction
        const updatedUserSeeds = {
          ...userSeeds,
          [seed.id]: finalOwnedQuantity - quantity
        };
        setUserSeeds(updatedUserSeeds);

        // Save game state
        const gameState = {
          plots,
          userSeeds: updatedUserSeeds,
          lastUpdated: new Date().toISOString()
        };

        // Save to server
        const saveResponse = await fetch(`${API_BASE_URL}/api/game-data/${solana.publicKey.toString()}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ gameData: gameState })
        });

        if (!saveResponse.ok) {
          throw new Error('Failed to save game state');
        }

        // Update token balance
        if (checkTokenBalance) {
          await checkTokenBalance(solana.publicKey);
        }

        toast.update(loadingToast, {
          render: `Successfully sold ${quantity} ${seed.name}${quantity > 1 ? 's' : ''} for ${formatBalance(sellPrice)} Construction!`,
          type: "success",
          isLoading: false,
          autoClose: 3000
        });

      } catch (error) {
        console.error('Transaction error:', error);
        toast.update(loadingToast, {
          render: `Transaction failed: ${error.message}`,
          type: "error",
          isLoading: false,
          autoClose: 5000
        });
      }

    } catch (error) {
      console.error("Sale error:", error);
      toast.error(`Sale failed: ${error.message}`);
    }
  };

  const isRoadPlot = (index) => {
    const row = Math.floor(index / 4);
    const col = index % 4;
    
    // Roads are only the gray lines between plots
    return {
      horizontal: false,
      vertical: false,
      intersection: false,
      // All plots are buildable
      isBuildable: true
    };
  };

  const renderPlots = () => {
    const gridSize = 4; // 4x4 grid
    const gridPlots = [];
    
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const index = row * gridSize + col;
        const plot = plots[index];
        
        // All main plots are land plots
        let plotClass = 'plot plot-land';
        if (plot?.planted) plotClass += ' planted';
        if (plot?.isWatered) plotClass += ' watered';
        if (plot?.readyToHarvest) plotClass += ' ready-harvest';
        if (plot?.growthStage) plotClass += ` growth-stage-${plot.growthStage}`;

        gridPlots.push(
          <div key={`plot-${index}`} className="grid-cell">
            <div 
              className={plotClass}
              onClick={() => !isProcessing && handlePlotClick(index)}
              onMouseEnter={() => setHoveredPlot(index)}
              onMouseLeave={() => setHoveredPlot(null)}
            >
              {/* All plots can have content */}
              {renderPlantContent(plot, index)}
            </div>

            {/* Roads are just decorative dividers between plots */}
            {row < gridSize - 1 && <div className="road-horizontal"></div>}
            {col < gridSize - 1 && <div className="road-vertical"></div>}
            {row < gridSize - 1 && col < gridSize - 1 && <div className="road-intersection"></div>}
          </div>
        );
      }
    }
    
    return gridPlots;
  };

  return (
    <div className="play-container">
      <Header />
      {isWalletConnected && (
        <WalletInfo 
          walletAddress={walletAddress} 
          onDisconnect={disconnectWallet} 
        />
      )}
      <div className="tools-container">
        <div className="tools-bar">
          {tools.map(tool => (
            <button
              key={tool.id}
              className={`tool-btn ${selectedTool === tool.id ? 'selected' : ''}`}
              onClick={() => handleToolSelect(tool.id)}
            >
              <span className="tool-icon">{tool.icon}</span>
              <span className="tool-name">{tool.name}</span>
            </button>
          ))}
        </div>
      </div>
      {renderContent()}
      {notification && (
        <WalletNotification notification={notification} />
      )}
      {renderHarvestConfirmation()}
      {showHarvestSuccess && harvestSuccessInfo && (
        <HarvestSuccessPopup
          plantName={harvestSuccessInfo.plantName}
          plantIcon={harvestSuccessInfo.plantIcon}
          reward={harvestSuccessInfo.reward}
          onClose={handleSuccessClose}
        />
      )}
      <Footer />
      <ToastContainer
        position="top-center"
        autoClose={3000}
        limit={3}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        style={{ zIndex: 9999 }}
      />
    </div>
  );
};


export default Play; 
