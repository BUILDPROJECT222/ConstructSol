import React, { createContext, useState, useContext, useEffect } from 'react';
import { useWallet } from './WalletContext';

const API_BASE_URL = process.env.REACT_APP_API_URL;

export const GameContext = createContext();

export const GameProvider = ({ children }) => {
  const [gameState, setGameState] = useState(null);
  const { walletAddress, isWalletConnected } = useWallet();

  const loadGameState = async () => {
    if (!isWalletConnected || !walletAddress) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/game-data/${walletAddress}`);
      if (!response.ok) {
        throw new Error('Failed to load game data');
      }
      const data = await response.json();
      setGameState(data);
    } catch (error) {
      console.error('Error loading game state:', error);
    }
  };

  const saveGameState = async (newState) => {
    if (!isWalletConnected || !walletAddress) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/game-data/${walletAddress}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gameData: newState })
      });

      if (!response.ok) {
        throw new Error('Failed to save game data');
      }

      const savedData = await response.json();
      setGameState(savedData.data);
    } catch (error) {
      console.error('Error saving game state:', error);
    }
  };

  useEffect(() => {
    loadGameState();
  }, [walletAddress, isWalletConnected]);

  return (
    <GameContext.Provider value={{ gameState, setGameState, loadGameState, saveGameState }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext); 