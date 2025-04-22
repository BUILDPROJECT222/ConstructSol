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
import rewardsIcon from '../../assets/leaderboard.png';
import welcomeLogo from '../../assets/background.PNG'; 

const FEATURES = [
  {
    id: 1,
    title: "Item Shop",
    description: "The Seed Market offers a variety of seeds for players to purchase and plant. Choose wisely, as different seeds may yield different rewards!",
    icon: farmingIcon,
    altText: "Pixel art of item shop"
  },
  {
    id: 2,
    title: "Planting",
    description: "Planting is simple—select the seeds you own and click on the desired plot to start growing.",
    icon: marketplaceIcon,
    altText: "Pixel art of planting"
  },
  {
    id: 3,
    title: "Harvest",
    description: "Once the seeds are fully grown, you can harvest them to claim your rewards based on the time duration you selected. The longer you wait, the bigger the yield!",
    icon: breedingIcon,
    altText: "Pixel art of harvest"
  },
  {
    id: 4,
    title: "Leaderboard",
    description: "The Leaderboard showcases the top farmers based on their planting and harvesting skills. Compete to be the best and prove you're the ultimate farmer!",
    icon: rewardsIcon,
    altText: "Pixel art of leaderboard"
  },
  {
    id: 5,
    title: "Community Gardens",
    description: "Join forces with other players to create and maintain community gardens with shared rewards.",
    icon: seasonsIcon,
    altText: "Pixel art of community garden"
  },
  {
    id: 6,
    title: "Seasonal Events",
    description: "Experience different seasons with unique plants, special events, and limited-time rewards.",
    icon: communityIcon,
    altText: "Pixel art of seasonal events"
  }
];

const ROADMAP_ITEMS = [
  {
    id: 1,
    phase: "Phase 1",
    title: "Foundation & Alpha Test",
    description: [
      "Concept development & tokenomics design",
      "Devnet smart contract deployment & initial security testing",
      "Alpha Test Launch for early testers to experience core mechanics",
      "Bug fixes & gameplay refinements based on tester feedback"
    ],
    status: "done"  
  },
  {
    id: 2,
    phase: "Phase 2",
    title: "Demo Launch & Community Growth",
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
    title: "Core Features & Gameplay Expansion",
    description: [
      "Implementation of Seed Market & Item Shop",
      "Full Planting & Harvesting mechanics integration",
      "Leaderboard system to track top farmers",
      "Further UI/UX refinements for a seamless experience"
    ],
    status: "done"
  },
  {
    id: 4,
    phase: "Phase 4",
    title: "Official Launch & Expansion",
    description: [
      "Construction Token official launch",
      "Farming competitions & exclusive events",
      "Partnerships & collaborations for ecosystem growth",
      "Ongoing updates & feature enhancements"
    ],
    status: "in-progress"
  },
  {
    id: 5,
    phase: "Phase 5",
    title: "Ecosystem Growth & Optimization",
    description: [
      "Advanced farming strategies & new seed types",
      "Gameplay optimizations for sustainability & efficiency",
      "Staking rewards & expanded token utilities",
      "Community-driven governance discussions"
    ],
    status: "upcoming"
  },
  {
    id: 6,
    phase: "Phase 6",
    title: "Long-Term Vision & Sustainability",
    description: [
      "Integration of new game modes & farming mechanics",
      "Cross-platform expansion & metaverse potential",
      "Further decentralization & community-driven updates",
      "Continuous improvements to keep Construction thriving"
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
              LET'S PLAY!
            </Link>
          </div>
        </main>

        {/* Game Features Section */}
        <section className="content-container features-section">
          <h2 className="section-title">Game Features</h2>
          <div className="feature-grid-detailed">
            {FEATURES.map((feature) => (
              <div key={feature.id} className="feature-item">
                <div className="feature-icon-wrapper">
                  <img 
                    src={feature.icon} 
                    alt={feature.altText}
                    className="feature-icon"
                  />
                </div>
                <h4>{feature.title}</h4>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Roadmap Section */}
        <section className="content-container roadmap-section">
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
