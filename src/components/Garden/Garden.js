import React, { useEffect, useState } from 'react';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import './Garden.css';
import { useNavigate, Link } from 'react-router-dom';

// Import pixel art icons
import farmingIcon from '../../assets/itemshop.png';
import marketplaceIcon from '../../assets/planting.png';
import breedingIcon from '../../assets/harvest.png';
import seasonsIcon from '../../assets/Premium/Objects/Piknik basket.png';
import communityIcon from '../../assets/Premium/Objects/Items/egg-items.png';
import rewardsIcon from '../../assets/tower.png';
import welcomeLogo from '../../assets/background.PNG'; 

// Import building icons
import houseIcon from '../../assets/house.png';
import apartmentIcon from '../../assets/apartment.png';
import storeIcon from '../../assets/store.png';
import storeIcon1 from '../../assets/store1.png';
import storeIcon2 from '../../assets/store2.png';
import factoryIcon from '../../assets/factory.png';

import { seeds } from '../constants/seeds';

// Create BUILDINGS constant using data from seeds
const BUILDINGS = seeds.map((building, index) => ({
  id: index + 1,
  title: building.name,
  description: building.description,
  icon: building.imgSrc,
  price: building.price,
  reward: building.reward,
  constructionTime: building.growthTime,
  altText: `Pixel art of ${building.name}`
}));

const FEATURES = [
  {
    id: 1,
    title: "Construction",
    description: "Construct and upgrade buildings to improve your assets productivity. Customize your layout and unlock new features as your assets grows.",
    icon: rewardsIcon,
    altText: "Pixel art of Construction"
  },
  {
    id: 2,
    title: "Monopoly",
    description: "Buy land, trade resources, and outmaneuver other players to become the dominant force in the farming economy.",
    icon: seasonsIcon,
    altText: "Pixel art of monopoly",
    comingSoon: true
  },
  {
    id: 3,
    title: "Social",
    description: "Interact with friends, and participate in fun community events. Construction is better together!",
    icon: communityIcon,
    altText: "Pixel art of social",
    comingSoon: true
  }
];

const ROADMAP_ITEMS = [
  {
    id: 1,
    phase: "Phase 1",
    title: "Foundations of the Build",
    description: [
      "Design game mechanics and tokenomics",
      "Deploy smart contracts to devnet for testing",
      "Launch Early Access for limited users",
      "Collect feedback, patch bugs, and refine mechanics"
    ],
    status: "done"  
  },
  {
    id: 2,
    phase: "Phase 2",
    title: "Rise of the Builders",
    description: [
      "Launch of Construction Demo, allowing users to experience the farming system",
      "Community building & social media presence",
      "UI/UX improvements based on alpha test insights"
    ],
    status: "done"
  },
  {
    id: 3,
    phase: "Phase 3",
    title: "Marketplace & Gameplay Core",
    description: [
      "Launch Blueprint Marketplace & Building Shop",
      "Activate full construction-to-revenue gameplay",
      "Launch leaderboard & prestige system",
      "Add visual upgrades & sound elements"
    ],
    status: "done"
  },
  {
    id: 4,
    phase: "Phase 4",
    title: "Official Launch",
    description: [
      "Official ConstructSol Token launch",
      "Start building competitions & leaderboard rewards",
      "Partner with other Solana-based projects",
      "Host limited-time build events"
    ],
    status: "in-progress"
  },
  {
    id: 5,
    phase: "Phase 5",
    title: "Strategic Expansion",
    description: [
      "Introduce smart tech utilities (boost output or reduce build time)",
      "Enable staking utility beyond construction",
      "Explore multiplayer build mechanics"
    ],
    status: "upcoming"
  },
  {
    id: 6,
    phase: "hase 6",
    title: "Future Possibilities",
    description: [
      "Player governance via DAO",
      "Community-chosen mega builds or events",
      "(Optional) Explore deeper systems like population or city zones",
      "Continuous updates based on builder feedback"
    ],
    status: "upcoming"
  }
];

const Garden = () => {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      // Tampilkan button ketika scroll lebih dari 300px
      setShowBackToTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleConnectWallet = () => {
    navigate('/play');
  };

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.2
    };

    const handleIntersect = (entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate');
        } else {
          entry.target.classList.remove('animate'); // Remove class when out of view
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);

    // Observe all content containers
    document.querySelectorAll('.content-container').forEach(el => observer.observe(el));
    
    // Observe feature items
    document.querySelectorAll('.feature-item').forEach(el => observer.observe(el));
    
    // Observe building items
    document.querySelectorAll('.building-item').forEach(el => observer.observe(el));
    
    // Observe roadmap items
    document.querySelectorAll('.roadmap-item').forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="game-container">
      <Header />
      <div className="content-wrapper">
        {/* Welcome Section */}
        <main className="content-container welcome-section">
          <div className="corner corner-tl"></div>
          <div className="corner corner-tr"></div>
          <div className="corner corner-bl"></div>
          <div className="corner corner-br"></div>
          <h1 className="section-title">Welcome to Construct Sol</h1>
          <div className="welcome-logo-wrapper">
            <img src={welcomeLogo} alt="Construction Logo" className="welcome-logo" />
          </div>
          <p className="section-text">
            Shape the virtual cityscape through blockchain technology. Construct buildings, generate income, and become a finest estate tycoon.
          </p>
          <div className="cta-buttons">
            <Link 
              to="/play" 
              className="pixel-button demo-button"
            >
              LET'S BUILD!
            </Link>
          </div>
        </main>

        {/* Game Features Section */}
        <section className="content-container features-section">
          <div className="corner corner-tl"></div>
          <div className="corner corner-tr"></div>
          <div className="corner corner-bl"></div>
          <div className="corner corner-br"></div>
          <h2 className="section-title">Game Features</h2>
          <div className="feature-grid-detailed">
            {FEATURES.map((feature) => (
              <div key={feature.id} className={`feature-item ${feature.comingSoon ? 'feature-coming-soon' : ''}`}>
                <div className="feature-icon-wrapper">
                  <img 
                    src={feature.icon} 
                    alt={feature.altText}
                    className="feature-icon"
                  />
                </div>
                <h4>{feature.title}</h4>
                <p>{feature.description}</p>
                {feature.comingSoon && (
                  <div className="coming-soon-overlay">
                    <span className="coming-soon-text">COMING SOON</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Buildings Section */}
        <section className="content-container buildings-section">
          <div className="corner corner-tl"></div>
          <div className="corner corner-tr"></div>
          <div className="corner corner-bl"></div>
          <div className="corner corner-br"></div>
          <h2 className="section-title">Buildings</h2>
          <div className="feature-grid-detailed">
            {BUILDINGS.map((building) => (
              <div key={building.id} className="feature-item building-item">
                <div className="feature-icon-wrapper">
                  <img 
                    src={building.icon} 
                    alt={building.altText}
                    className="feature-icon"
                  />
                </div>
                <h4>{building.title}</h4>
                <p>{building.description}</p>
              
              </div>
            ))}
          </div>
        </section>

        {/* Roadmap Section */}
        <section className="content-container roadmap-section">
          <div className="corner corner-tl"></div>
          <div className="corner corner-tr"></div>
          <div className="corner corner-bl"></div>
          <div className="corner corner-br"></div>
          <h2 className="section-title">Development Roadmap</h2>
          <div className="roadmap-grid">
            {ROADMAP_ITEMS.map((item) => (
              <div key={item.id} className={`roadmap-item ${item.status}`}>
                <div className="roadmap-header">
                  <span className="phase-tag">{item.phase}</span>
                  <span className={`status-indicator ${item.status}`}></span>
                </div>
                <h4>{item.title}</h4>
                <ul className="roadmap-list">
                  {item.description.map((point, index) => (
                    <li key={index} className="roadmap-point">
                      <span className="bullet">►</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </div>
      <button 
        className={`back-to-top ${showBackToTop ? 'visible' : ''}`}
        onClick={scrollToTop}
        aria-label="Back to top"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24"
        >
          <path d="M12 4l8 8h-6v8h-4v-8H4z"/>
        </svg>
      </button>
      <Footer />
    </div>
  );
};

export default Garden; 
