import React, { createContext, useState, useContext, useEffect } from 'react';
import { Connection, clusterApiUrl, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount, getMint } from '@solana/spl-token';

const WalletContext = createContext();

// Update RPC URL constant
const MAINNET_RPC_URL = process.env.REACT_APP_MAINNET_RPC_URL;
// console.log('RPC URL:', MAINNET_RPC_URL); // untuk debugging

const getConnection = () => {
  if (!MAINNET_RPC_URL) {
    console.error('RPC URL is undefined');
    throw new Error('RPC URL is not configured');
  }

  if (!MAINNET_RPC_URL.startsWith('http://') && !MAINNET_RPC_URL.startsWith('https://')) {
    console.error('Invalid RPC URL format:', MAINNET_RPC_URL);
    throw new Error('Invalid RPC URL format');
  }

  return new Connection(MAINNET_RPC_URL, {
    commitment: 'confirmed',
    confirmTransactionInitialTimeout: 60000
  });
};

// Update Token constants
const TOKEN_MINT = new PublicKey(process.env.REACT_APP_TOKEN_MINT);
const DECIMALS = parseInt(process.env.REACT_APP_TOKEN_DECIMALS);

export const WalletProvider = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [fullWalletAddress, setFullWalletAddress] = useState(null);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [notification, setNotification] = useState(null);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [tokenBalance, setTokenBalance] = useState(0);

  const shortenAddress = (address) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const showWalletNotification = (message, isError = false) => {
    if (notificationVisible) return;
    
    setNotificationVisible(true);
    setNotification({ message, isError });
    
    setTimeout(() => {
      setNotification(null);
      setNotificationVisible(false);
    }, 3000);
  };

  // Add useEffect to monitor token balance changes
  useEffect(() => {
    const updateTokenBalance = async () => {
      if (isWalletConnected && walletAddress) {
        try {
          const { solana } = window;
          if (solana?.publicKey) {
            console.log('Updating token balance for wallet:', solana.publicKey.toString());
            await checkTokenBalance(solana.publicKey);
          }
        } catch (error) {
          console.error('Error updating token balance:', error);
        }
      }
    };

    updateTokenBalance();
  }, [isWalletConnected, walletAddress]);

  // Update checkTokenBalance function with better error handling and logging
  const checkTokenBalance = async (publicKey) => {
    try {
      const connection = getConnection();
      
      // Get associated token account
      const associatedTokenAddress = await getAssociatedTokenAddress(
        TOKEN_MINT,
        publicKey
      );

      console.log('Checking token account:', associatedTokenAddress.toString());

      try {
        // Get token account info
        const tokenAccount = await getAccount(connection, associatedTokenAddress);
        const mintInfo = await getMint(connection, TOKEN_MINT);
        
        // Calculate actual balance
        const balance = Number(tokenAccount.amount) / Math.pow(10, mintInfo.decimals);
        console.log('Token balance found:', balance);
        
        // Update state with new balance
        setTokenBalance(prevBalance => {
          if (prevBalance !== balance) {
            console.log('Updating token balance from', prevBalance, 'to', balance);
            return balance;
          }
          return prevBalance;
        });
        
        return balance;
      } catch (e) {
        console.error('Error getting token account:', e);
        if (e.name === 'TokenAccountNotFoundError') {
          console.log('Token account not found, creating new one...');
          // Handle token account creation if needed
        }
        setTokenBalance(0);
        return 0;
      }
    } catch (error) {
      console.error('Error in checkTokenBalance:', error);
      setTokenBalance(0);
      return 0;
    }
  };

  // Add new function to handle local storage
  const saveWalletStateToLocalStorage = (address, connected) => {
    if (connected && address) {
      localStorage.setItem('walletState', JSON.stringify({
        address,
        connected,
        timestamp: Date.now()
      }));
    } else {
      localStorage.removeItem('walletState');
    }
  };

  // Update checkWalletConnection function
  const checkWalletConnection = async () => {
    try {
      const { solana } = window;
      
      if (!solana?.isPhantom) {
        return false;
      }

      // Check local storage first
      const savedWalletState = localStorage.getItem('walletState');
      if (savedWalletState) {
        const { address, timestamp } = JSON.parse(savedWalletState);
        // Check if the stored state is not older than 24 hours
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          console.log('Restoring wallet state for address:', address);
          setFullWalletAddress(address);
          setWalletAddress(shortenAddress(address));
          setIsWalletConnected(true);
          
          // Immediately check token balance using the full address
          const publicKey = new PublicKey(address);
          await checkTokenBalance(publicKey);
          
          return true;
        } else {
          console.log('Wallet state expired, clearing...');
          localStorage.removeItem('walletState');
        }
      }

      const connected = solana.isConnected;
      if (connected) {
        const publicKey = solana.publicKey;
        const fullAddress = publicKey.toString();
        console.log('Wallet connected:', fullAddress);
        
        // Always set full address first
        setFullWalletAddress(fullAddress);
        // Then set shortened version for display only
        setWalletAddress(shortenAddress(fullAddress));
        
        // Save to local storage with full address
        saveWalletStateToLocalStorage(fullAddress, true);
        
        // Check token balance using the PublicKey object
        await checkTokenBalance(publicKey);
      }
      setIsWalletConnected(connected);
      return connected;
    } catch (error) {
      console.error("Error checking wallet connection:", error);
      return false;
    }
  };

  // Update connectWallet function
  const connectWallet = async () => {
    try {
      const { solana } = window;

      if (solana?.isPhantom) {
        // Check if already connected
        if (solana.isConnected) {
          const fullAddress = solana.publicKey.toString();
          setFullWalletAddress(fullAddress);
          setWalletAddress(shortenAddress(fullAddress));
          setIsWalletConnected(true);
          saveWalletStateToLocalStorage(fullAddress, true);
          return;
        }

        const response = await solana.connect();
        const fullAddress = response.publicKey.toString();
        
        // Use mainnet connection
        const connection = new Connection(MAINNET_RPC_URL, {
          commitment: 'confirmed',
          wsEndpoint: undefined,
          confirmTransactionInitialTimeout: 60000
        });

        setFullWalletAddress(fullAddress);
        setWalletAddress(shortenAddress(fullAddress));
        setIsWalletConnected(true);
        
        // Save to local storage with full address
        saveWalletStateToLocalStorage(fullAddress, true);
        
        setNotification({
          message: 'Wallet connected successfully!',
          isError: false
        });
      } else {
        setNotification({
          message: 'Phantom wallet is not installed',
          isError: true
        });
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
      setNotification({
        message: `Failed to connect wallet: ${error.message}`,
        isError: true
      });
    }
  };

  // Update disconnectWallet function
  const disconnectWallet = async () => {
    try {
      const { solana } = window;
      if (solana) {
        await solana.disconnect();
        setIsWalletConnected(false);
        setWalletAddress('');
        setFullWalletAddress(null);
        setTokenBalance(0);
        
        // Clear from local storage
        saveWalletStateToLocalStorage(null, false);
        
        if (!notificationVisible) {
          showWalletNotification('Wallet disconnected');
        }
      }
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      if (!notificationVisible) {
        showWalletNotification('Failed to disconnect wallet', true);
      }
    }
  };

  // Add network check on component mount
  useEffect(() => {
    const checkAndSwitchNetwork = async () => {
      const { solana } = window;
      if (solana?.isPhantom && isWalletConnected) {
        try {
          // Check current network
          const resp = await solana.request({
            method: 'wallet_getNetwork'
          });
            
          // If not on mainnet-beta, switch to it
          if (resp !== 'mainnet-beta') {
            await solana.request({
              method: 'wallet_switchNetwork',
              params: [{ networkName: 'mainnet-beta' }],
            });
            console.log('Switched to mainnet-beta');
          }
        } catch (error) {
          console.error('Network switch error:', error);
          setNotification({
            message: 'Please switch to Mainnet in your Phantom wallet',
            isError: true
          });
        }
      }
    };

    checkAndSwitchNetwork();
  }, [isWalletConnected]);

  useEffect(() => {
    checkWalletConnection();

    // Add listener for wallet connection changes
    const { solana } = window;
    if (solana) {
      solana.on('connect', async () => {
        console.log('Wallet connected event');
        await checkWalletConnection();
      });

      solana.on('disconnect', () => {
        console.log('Wallet disconnected event');
        setIsWalletConnected(false);
        setWalletAddress('');
        setTokenBalance(0);
      });

      solana.on('accountChanged', async () => {
        console.log('Wallet account changed event');
        await checkWalletConnection();
      });
    }

    return () => {
      if (solana) {
        solana.removeAllListeners('connect');
        solana.removeAllListeners('disconnect');
        solana.removeAllListeners('accountChanged');
      }
    };
  }, []);

  return (
    <WalletContext.Provider value={{
      walletAddress,
      fullWalletAddress,
      isWalletConnected: !!walletAddress,
      connectWallet,
      disconnectWallet,
      showWalletNotification,
      tokenBalance,
      checkTokenBalance,
      TOKEN_MINT,
      DECIMALS
    }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}; 