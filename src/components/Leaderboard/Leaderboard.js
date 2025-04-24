import React, { useState, useEffect } from 'react';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import './Leaderboard.css';
import testfunIcon from '../../assets/background.PNG';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_BASE_URL = process.env.REACT_APP_API_URL;

const Leaderboard = () => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add formatBalance helper function
  const formatBalance = (balance) => {
    return Number(balance).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 6
    });
  };

  // Add shortenAddress helper function
  const shortenAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  // Add function to handle wallet click
  const handleWalletClick = (address) => {
    window.open(`https://solscan.io/account/${address}`, '_blank');
  };

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        setIsLoading(true);
        console.log('Fetching from:', `${API_BASE_URL}/api/leaderboard`);
        const response = await fetch(`${API_BASE_URL}/api/leaderboard`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Server response:', errorText);
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Received data:', data);
        setLeaderboardData(data);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setError(err.message);
        toast.error('Failed to load leaderboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="leaderboard-page">
        <Header />
        <div className="leaderboard-loading">
          <div className="loading-spinner">🔄</div>
          <p>Loading leaderboard...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="leaderboard-page">
        <Header />
        <div className="leaderboard-error">
          <p>Error loading leaderboard: {error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="leaderboard-page">
      <Header />
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
      <Footer />
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
  );
};

export default Leaderboard; 