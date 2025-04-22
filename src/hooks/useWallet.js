import React, { useState, useEffect } from 'react';

const useWallet = () => {
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);

  useEffect(() => {
    const checkWalletConnection = async () => {
      const { solana } = window;
      
      if (solana?.isPhantom) {
        try {
          const connected = await solana.connect({ onlyIfTrusted: true });
          if (connected) {
            setIsWalletConnected(true);
            setWalletAddress(connected.publicKey.toString());
          }
        } catch (error) {
          console.error('Auto-connect error:', error);
        }
      }
    };

    checkWalletConnection();
  }, []);

  // ... rest of the hook code ...
};

export default useWallet; 