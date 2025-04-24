import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import './About.css';

const About = () => {
  return (
    <div className="about-page">
      <Header />
      <div className="about-container">
        <div className="about-content">
          <h1 className="about-title">About ConstructSol</h1>
{/*           
          <div className="contract-info">
            <h2>Contract Address</h2>
            <div className="contract-address-display">
              <span className="address">-</span>
              <button 
                className="copy-button"
                onClick={() => {
                  navigator.clipboard.writeText('GD13wibcM7sZsxRAXEuG861M2Fhhv7G5rDPFxa8Qe8Tn');
                  alert('Contract address copied to clipboard!');
                }}
              >
                Copy
              </button>
            </div>
          </div> */}
          
          <div className="about-section">
            <h2>🧱 What is ConstructSol?</h2>
            <p>
              ConstructSol is a strategic city-building game powered by Solana, where players acquire land, 
              construct buildings, and earn rewards through smart urban planning and token-based utility.
            </p>
          </div>
          
          <div className="about-section">
            <h2>👤 Who is it for?</h2>
            <p>
              ConstructSol is built for Web3 gamers, strategic thinkers, crypto enthusiasts, and anyone who 
              enjoys building, earning, and managing digital economies.
            </p>
          </div>
          
          <div className="about-section">
            <h2>🕒 When is it launching?</h2>
            <p>
              Currently in preparation for early access with limited testers. The full launch is coming soon—stay 
              tuned and follow our socials for updates.
            </p>
          </div>
          
          <div className="about-section">
            <h2>🌍 Where does it happen?</h2>
            <p>
              Everything takes place on the Solana blockchain, with assets, rewards, and gameplay all running 
              on-chain for transparency and speed.
            </p>
          </div>
          
          <div className="about-section">
            <h2>❓ Why ConstructSol?</h2>
            <p>
              To offer a fun, rewarding, and competitive experience that goes beyond traditional P2E. 
              ConstructSol combines staking mechanics, real value, and long-term strategy in a city 
              simulation format.
            </p>
          </div>
          
          <div className="about-section">
            <h2>🛠 How does it work?</h2>
            <p>
              Players stake CST tokens to acquire land, unlock building blueprints, and construct structures 
              that generate income over time. The longer the build, the higher the reward. All progress 
              contributes to leaderboard rankings and token utility.
            </p>
          </div>
          
          {/* <div className="cta-buttons">
            <Link to="/play" className="cta-button">Start Playing</Link>
            <a 
              href="https://t.me/ConstructSolSupport" 
              className="cta-button"
              target="_blank"
              rel="noopener noreferrer"
            >
              Join Community
            </a>
          </div> */}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default About; 