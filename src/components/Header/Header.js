import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Header.css';
import logo from '../../assets/header.png'; // Adjust with your logo path
import { useWallet } from '../../context/WalletContext';

const Header = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const isPlayPage = location.pathname === '/play';
  const { isWalletConnected } = useWallet();

  // Hide leaderboard only when on play page AND wallet is connected
  const shouldHideLeaderboard = isPlayPage && isWalletConnected;

  return (
    <header className="game-header">
      {isHomePage && (
        <div className="contract-address">
          <span className="address-label">CA:</span>
          <span className="address-value">-</span>
        </div>
      )}
      
      <div className="header-content">
        {/* <div className="title-wrapper">
          <img src={logo} alt="Farm Fun Logo" className="game-logo" />
        </div> */}
        <nav className="game-nav">
          <div className="nav-links">
            <Link to="/" className="pixel-button">HOME</Link> 
            <Link to="/about" className="pixel-button">ABOUT</Link>
            {/* <span className="pixel-button disabled">PLAY</span> */}
            <Link to="/play" className="pixel-button">PLAY</Link>
            <a 
              href="https://constructs-organization.gitbook.io/constructsol" 
              className="pixel-button" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              WHITEPAPER
            </a>
            {!shouldHideLeaderboard && ( //leaderboard tidak ada di play page jika wallet sudah terkoneksi
              <Link to="/leaderboard" className="pixel-button">LEADERBOARD</Link>
            )}
           
          </div>
          <div className="nav-social">
            <a 
              href="https://x.com/ConstructSOL" 
              className="social-icon twitter" 
              aria-label="Twitter"
              target="_blank" 
              rel="noopener noreferrer"
            >
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            {/* <a 
              href="https://github.com/" 
              className="social-icon github" 
              aria-label="GitHub"
              target="_blank" 
              rel="noopener noreferrer"
            >
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="currentColor" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
              </svg>
            </a> */}
            <a 
              href="https://t.me/ConstructSolSupport" 
              className="social-icon telegram" 
              aria-label="Telegram"
              target="_blank" 
              rel="noopener noreferrer"
            >
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="currentColor" d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header; 
