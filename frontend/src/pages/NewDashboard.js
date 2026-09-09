
import React, { useState, useEffect } from 'react';
import './NewDashboard.css';

// Pre-populated Futuristic Surveys Data
const INITIAL_SURVEYS = [
  {
    id: 'srv-01',
    title: 'Brain-Computer Interface Ergonomics',
    category: 'Neural Sync',
    payout: 450,
    time: '2 mins',
    rating: 4.9,
    difficulty: 'Low',
    tags: ['BCI', 'Neural', 'Direct Link'],
    featured: true
  },
  {
    id: 'srv-02',
    title: 'Mars Colony Orbital Transit Spatial UX',
    category: 'Spatial AR',
    payout: 850,
    time: '5 mins',
    rating: 4.8,
    difficulty: 'Medium',
    tags: ['Grav-UI', 'Zero-G', 'Spatial'],
    featured: true
  },
  {
    id: 'srv-03',
    title: 'Holographic Interface Visual Fatigue',
    category: 'Cyber Optics',
    payout: 300,
    time: '1 min',
    rating: 4.7,
    difficulty: 'Low',
    tags: ['Holo-Deck', 'Optics'],
    featured: false
  },
  {
    id: 'srv-04',
    title: 'Cybernetic Visual Latency Assessment',
    category: 'Cyberware',
    payout: 1200,
    time: '8 mins',
    rating: 5.0,
    difficulty: 'High',
    tags: ['Ocular', '600fps', 'Biometrics'],
    featured: true
  },
  {
    id: 'srv-05',
    title: 'Quantum Computing Interface Responsiveness',
    category: 'Neural Sync',
    payout: 600,
    time: '3 mins',
    rating: 4.9,
    difficulty: 'Medium',
    tags: ['Q-Bit', 'Latency'],
    featured: false
  }
];

// Activity History Log
const INITIAL_HISTORY = [
  { id: 1, title: 'Synthetic Emotion Palette Survey', earned: 350, time: '12 mins ago' },
  { id: 2, title: 'Deep-Space Audio Haptics Feedback', earned: 500, time: '1 hour ago' },
  { id: 3, title: 'Daily Neural Sync Check-in', earned: 100, time: '3 hours ago' }
];

export default function NewDashboard() {
  // Main State
  const [balance, setBalance] = useState(14850);
  const [dailyEarned, setDailyEarned] = useState(2120);
  const dailyGoal = 2500;
  const [completedSurveys, setCompletedSurveys] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeTab, setActiveTab] = useState('surveys'); // 'surveys' | 'wallet' | 'rewards'
  const [history, setHistory] = useState(INITIAL_HISTORY);
  
  // Simulation Modal State
  const [activeSurveyModal, setActiveSurveyModal] = useState(null);
  const [surveyProgress, setSurveyProgress] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const [notification, setNotification] = useState(null);

  // Show Toast Notification
  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Filter Surveys based on Category selection
  const filteredSurveys = INITIAL_SURVEYS.filter((s) => {
    if (completedSurveys.includes(s.id)) return false;
    if (activeCategory === 'All') return true;
    if (activeCategory === 'High Payout') return s.payout >= 700;
    if (activeCategory === 'Quick (<2m)') return parseInt(s.time) <= 2;
    return s.category === activeCategory;
  });

  // Launch Simulated Survey
  const startSurvey = (survey) => {
    setActiveSurveyModal(survey);
    setSurveyProgress(0);
    setIsCompleting(false);
  };

  // Handle Survey Step Simulation
  const completeSurveyStep = () => {
    if (surveyProgress < 100) {
      const nextProgress = surveyProgress + 35;
      if (nextProgress >= 100) {
        setSurveyProgress(100);
        setIsCompleting(true);
        setTimeout(() => {
          // Add earnings
          const reward = activeSurveyModal.payout;
          setBalance((prev) => prev + reward);
          setDailyEarned((prev) => prev + reward);
          setCompletedSurveys((prev) => [...prev, activeSurveyModal.id]);
          
          // Add to history
          setHistory((prev) => [
            {
              id: Date.now(),
              title: activeSurveyModal.title,
              earned: reward,
              time: 'Just now'
            },
            ...prev
          ]);

          showToast(`+${reward} $NEURO added to Cyber-Wallet!`);
          setActiveSurveyModal(null);
          setIsCompleting(false);
        }, 1200);
      } else {
        setSurveyProgress(nextProgress);
      }
    }
  };

  const calcConversion = (neuro) => (neuro * 0.10).toFixed(2);
  const progressPercent = Math.min(Math.round((dailyEarned / dailyGoal) * 100), 100);

  return (
    <div className="nd-wrapper">
      {/* Background Ambient Glows */}
      <div className="nd-bg-glow nd-glow-1"></div>
      <div className="nd-bg-glow nd-glow-2"></div>

      {/* Toast Notification */}
      {notification && (
        <div className="nd-toast">
          <span className="nd-toast-icon">⚡</span>
          <span>{notification}</span>
        </div>
      )}

      {/* Top Header Navigation */}
      <header className="nd-header">
        <div className="nd-brand">
          <div className="nd-logo-cube">
            <div className="nd-cube-inner"></div>
          </div>
          <div>
            <h1 className="nd-title">NewDashboard <span className="nd-ver">v2054.9</span></h1>
            <p className="nd-subtitle">Neural Survey Yield Engine</p>
          </div>
        </div>

        {/* Global Stats Bar */}
        <div className="nd-stats-row">
          <div className="nd-stat-badge">
            <span className="nd-stat-label">Neural Sync</span>
            <span className="nd-stat-val nd-cyan">99.8%</span>
          </div>
          <div className="nd-stat-badge">
            <span className="nd-stat-label">Cyber-Wallet</span>
            <span className="nd-stat-val nd-gold">
              {balance.toLocaleString()} <small>$NEURO</small>
            </span>
            <span className="nd-usd-equiv">~${calcConversion(balance)} USD</span>
          </div>
          <div className="nd-user-avatar">
            <div className="nd-avatar-ring"></div>
            <div className="nd-avatar-img">CY-94</div>
          </div>
        </div>
      </header>

      {/* Sub Header Navigation Tabs */}
      <nav className="nd-nav">
        <button
          className={`nd-nav-btn ${activeTab === 'surveys' ? 'active' : ''}`}
          onClick={() => setActiveTab('surveys')}
        >
          <span className="nd-icon">🛰️</span> Active Surveys ({filteredSurveys.length})
        </button>
        <button
          className={`nd-nav-btn ${activeTab === 'wallet' ? 'active' : ''}`}
          onClick={() => setActiveTab('wallet')}
        >
          <span className="nd-icon">💳</span> Cyber Wallet & Yield
        </button>
        <button
          className={`nd-nav-btn ${activeTab === 'rewards' ? 'active' : ''}`}
          onClick={() => setActiveTab('rewards')}
        >
          <span className="nd-icon">💎</span> Tier Perks <span className="nd-badge-pill">2x XP</span>
        </button>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="nd-main">
        {/* VIEW 1: ACTIVE SURVEYS */}
        {activeTab === 'surveys' && (
          <div className="nd-grid-layout">
            {/* Left Column: Filter & Feed */}
            <div className="nd-feed-section">
              {/* Category Pill Filters */}
              <div className="nd-filters">
                {['All', 'Neural Sync', 'Spatial AR', 'Cyberware', 'High Payout', 'Quick (<2m)'].map(
                  (cat) => (
                    <button
                      key={cat}
                      className={`nd-filter-chip ${activeCategory === cat ? 'active' : ''}`}
                      onClick={() => setActiveCategory(cat)}
                    >
                      {cat}
                    </button>
                  )
                )}
              </div>

              {/* Survey Cards Grid */}
              <div className="nd-cards-grid">
                {filteredSurveys.length === 0 ? (
                  <div className="nd-empty-state">
                    <h3>All Available Surveys Completed!</h3>
                    <p>New bio-quantum telemetry requests refresh in 04m : 12s.</p>
                  </div>
                ) : (
                  filteredSurveys.map((survey) => (
                    <div
                      key={survey.id}
                      className={`nd-card ${survey.featured ? 'nd-card-featured' : ''}`}
                    >
                      {survey.featured && <div className="nd-tag-featured">HIGH YIELD</div>}
                      <div className="nd-card-header">
                        <span className="nd-category-tag">{survey.category}</span>
                        <span className="nd-rating">★ {survey.rating}</span>
                      </div>
                      
                      <h3 className="nd-card-title">{survey.title}</h3>
                      
                      <div className="nd-card-tags">
                        {survey.tags.map((t) => (
                          <span key={t} className="nd-sub-tag">#{t}</span>
                        ))}
                      </div>

                      <div className="nd-card-footer">
                        <div className="nd-payout-box">
                          <span className="nd-payout-amount">+{survey.payout}</span>
                          <span className="nd-payout-unit">$NEURO</span>
                        </div>
                        <div className="nd-meta-box">
                          <span>⏱️ {survey.time}</span>
                          <span>⚡ {survey.difficulty}</span>
                        </div>
                        <button
                          className="nd-btn-primary"
                          onClick={() => startSurvey(survey)}
                        >
                          Sync & Earn
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Column: Earnings Summary Sidebar */}
            <aside className="nd-sidebar">
              {/* Daily Target Progress Widget */}
              <div className="nd-widget nd-widget-glow">
                <h3 className="nd-widget-title">Daily Yield Target</h3>
                <div className="nd-progress-container">
                  <div className="nd-progress-bar" style={{ width: `${progressPercent}%` }}></div>
                </div>
                <div className="nd-progress-text">
                  <span>{dailyEarned.toLocaleString()} / {dailyGoal.toLocaleString()} $NEURO</span>
                  <span className="nd-cyan">{progressPercent}%</span>
                </div>
                <p className="nd-widget-note">
                  {progressPercent >= 100
                    ? '🎉 Daily cap reached! Bonus 500 $NEURO unlocked.'
                    : `Earn ${(dailyGoal - dailyEarned).toLocaleString()} more $NEURO to unlock Daily Streak Bonus.`}
                </p>
              </div>

              {/* Real-time Yield Activity History */}
              <div className="nd-widget">
                <h3 className="nd-widget-title">Recent Neural Payouts</h3>
                <div className="nd-history-list">
                  {history.map((item) => (
                    <div key={item.id} className="nd-history-item">
                      <div className="nd-history-info">
                        <span className="nd-history-title">{item.title}</span>
                        <span className="nd-history-time">{item.time}</span>
                      </div>
                      <span className="nd-history-earned">+{item.earned} $NEURO</span>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* VIEW 2: CYBER WALLET */}
        {activeTab === 'wallet' && (
          <div className="nd-wallet-view">
            <div className="nd-wallet-card">
              <h2>Cyber-Wallet Overview</h2>
              <div className="nd-wallet-balance-large">
                {balance.toLocaleString()} <span className="nd-gold">$NEURO</span>
              </div>
              <p className="nd-wallet-usd">Estimated Value: ${calcConversion(balance)} USD</p>
              
              <div className="nd-wallet-actions">
                <button
                  className="nd-btn-primary"
                  onClick={() => showToast('Withdrawal request queued to Quantum-Chain!')}
                >
                  Instant Cashout (USD)
                </button>
                <button
                  className="nd-btn-secondary"
                  onClick={() => showToast('Converted to Neural Staking Pool (14% APY)')}
                >
                  Stake $NEURO (14% APY)
                </button>
              </div>
            </div>

            <div className="nd-wallet-stats-grid">
              <div className="nd-widget">
                <h4>Total Completed Surveys</h4>
                <p className="nd-stat-big">{18 + completedSurveys.length}</p>
              </div>
              <div className="nd-widget">
                <h4>All-Time Earnings</h4>
                <p className="nd-stat-big nd-gold">{(48200 + (balance - 14850)).toLocaleString()} $NEURO</p>
              </div>
              <div className="nd-widget">
                <h4>Neural Accuracy Rate</h4>
                <p className="nd-stat-big nd-cyan">99.4%</p>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: REWARDS & TIERS */}
        {activeTab === 'rewards' && (
          <div className="nd-rewards-view">
            <div className="nd-tier-card">
              <span className="nd-tier-level">CURRENT TIER: LEVEL 4 CYBERWARE</span>
              <h2>Holographic Neural VIP</h2>
              <p>Active Perk: +20% extra payout on all "Neural Sync" and "Spatial AR" surveys.</p>
            </div>

            <div className="nd-perks-grid">
              <div className="nd-perk-item active">
                <div className="nd-perk-icon">⚡</div>
                <h3>2x Neural XP Boost</h3>
                <p>Status: Active (Permanent)</p>
              </div>
              <div className="nd-perk-item active">
                <div className="nd-perk-icon">🔓</div>
                <h3>High-Yield Priority Feed</h3>
                <p>Status: Unlocked</p>
              </div>
              <div className="nd-perk-item locked">
                <div className="nd-perk-icon">🔒</div>
                <h3>Quantum Direct-Payout Link</h3>
                <p>Unlocks at Level 5 (Reach 25,000 $NEURO)</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* SIMULATED SURVEY MODAL */}
      {activeSurveyModal && (
        <div className="nd-modal-overlay">
          <div className="nd-modal">
            <div className="nd-modal-header">
              <span className="nd-category-tag">{activeSurveyModal.category}</span>
              <button
                className="nd-close-btn"
                onClick={() => setActiveSurveyModal(null)}
              >
                ✕
              </button>
            </div>

            <h2>{activeSurveyModal.title}</h2>
            <p className="nd-modal-desc">
              Initializing biometric brainwave telemetry stream. Complete feedback node input to process reward.
            </p>

            <div className="nd-modal-progress">
              <div className="nd-modal-progress-fill" style={{ width: `${surveyProgress}%` }}></div>
            </div>

            <div className="nd-modal-payout-info">
              <span>Potential Payout:</span>
              <span className="nd-gold">+{activeSurveyModal.payout} $NEURO</span>
            </div>

            {isCompleting ? (
              <div className="nd-completing-state">
                <div className="nd-spinner"></div>
                <p>Verifying Quantum Brain Signature & Injecting Credits...</p>
              </div>
            ) : (
              <div className="nd-modal-actions">
                <button className="nd-btn-primary" onClick={completeSurveyStep}>
                  {surveyProgress === 0
                    ? 'Begin Neural Telemetry'
                    : surveyProgress < 100
                    ? 'Submit Neural Response'
                    : 'Finalize & Claim'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
