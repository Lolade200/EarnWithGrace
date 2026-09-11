import React, { useState, useEffect } from "react";
import "./WatchAds.css";
import React, { useState } from "react";
import "./Surveys.css";
import Header from "./Header";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPollH,
  faClock,
  faCoins,
  faArrowRight,
  faCheckCircle,
  faStar,
} from "@fortawesome/free-solid-svg-icons";

const sampleSurveys = [
  {
    id: 1,
    title: "Consumer Tech & Gadget Preferences",
    category: "Technology",
    duration: "8 mins",
    reward: "$2.50",
    rating: 4.8,
    completionRate: "94%",
  },
  {
    id: 2,
    title: "Streaming Services & Media Habits",
    category: "Entertainment",
    duration: "12 mins",
    reward: "$4.00",
    rating: 4.9,
    completionRate: "98%",
  },
  {
    id: 3,
    title: "Daily Financial & Banking Trends",
    category: "Finance",
    duration: "15 mins",
    reward: "$5.50",
    rating: 4.7,
    completionRate: "91%",
  },
  {
    id: 4,
    title: "Shopping & E-Commerce Feedback",
    category: "Retail",
    duration: "5 mins",
    reward: "$1.75",
    rating: 4.6,
    completionRate: "96%",
  },
];

export default function Surveys() {
  const [activeSurvey, setActiveSurvey] = useState(null);

  const handleStartSurvey = (survey) => {
    setActiveSurvey(survey);
  };

  return (
    <div className="surveys-page-wrapper">
      <Header2 />

      <section className="surveys-section">
        <div className="surveys-bg-glow glow-1"></div>
        <div className="surveys-bg-glow glow-2"></div>

        <div className="surveys-container">
          {/* Header */}
          <div className="surveys-header">
            <span className="surveys-badge">MARKET RESEARCH HUB</span>
            <h1 className="surveys-title">Paid Online Surveys</h1>
            <p className="surveys-subtitle">
              Share your insights on leading global brands, complete brief questionnaires, and get paid instantly to your dashboard wallet.
            </p>
          </div>

          {/* Active Survey Modal / Frame Mockup */}
          {activeSurvey && (
            <div className="active-survey-banner">
              <div className="active-survey-info">
                <span className="live-pill">SURVEY IN PROGRESS</span>
                <h3>{activeSurvey.title}</h3>
                <p>Completing this survey will add <strong>{activeSurvey.reward}</strong> to your account.</p>
              </div>
              <button className="btn-close-survey" onClick={() => setActiveSurvey(null)}>
                Exit Survey
              </button>
            </div>
          )}

          {/* Surveys Grid */}
          <div className="surveys-grid">
            {sampleSurveys.map((survey) => (
              <div key={survey.id} className="survey-card">
                <div className="survey-card-top">
                  <span className="survey-category-badge">{survey.category}</span>
                  <div className="survey-reward-tag">
                    <FontAwesomeIcon icon={faCoins} />
                    <span>{survey.reward}</span>
                  </div>
                </div>

                <h3 className="survey-card-title">{survey.title}</h3>

                <div className="survey-meta-row">
                  <div className="meta-item">
                    <FontAwesomeIcon icon={faClock} />
                    <span>{survey.duration}</span>
                  </div>
                  <div className="meta-item">
                    <FontAwesomeIcon icon={faStar} className="star-icon" />
                    <span>{survey.rating}</span>
                  </div>
                  <div className="meta-item">
                    <FontAwesomeIcon icon={faCheckCircle} className="check-icon" />
                    <span>{survey.completionRate}</span>
                  </div>
                </div>

                <button
                  className="survey-start-btn"
                  onClick={() => handleStartSurvey(survey)}
                >
                  <span>Start Survey</span>
                  <FontAwesomeIcon icon={faArrowRight} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlay,
  faCoins,
  faTv,
  faCheckCircle,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";

const availableAds = [
  {
    id: 1,
    title: "EcoTech Smart Devices 2026 Commercial",
    duration: 30, // seconds
    reward: "$0.50",
    thumbnail: "/assets/gg.jpg",
  },
  {
    id: 2,
    title: "Global FinTech App Features Overview",
    duration: 15,
    reward: "$0.25",
    thumbnail: "/assets/kk.jpg",
  },
  {
    id: 3,
    title: "Next-Gen Gaming Performance Trailer",
    duration: 45,
    reward: "$0.80",
    thumbnail: "/assets/hg.jpg",
  },
];

export default function WatchAds() {
  const [playingAd, setPlayingAd] = useState(null);
  const [timer, setTimer] = useState(0);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    let interval = null;
    if (playingAd && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0 && playingAd) {
      setCompleted(true);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [playingAd, timer]);

  const startAd = (ad) => {
    setPlayingAd(ad);
    setTimer(ad.duration);
    setCompleted(false);
  };

  return (
    <div className="ads-page-wrapper">
      <Header2 />

      <section className="ads-section">
        <div className="ads-bg-glow glow-1"></div>
        <div className="ads-bg-glow glow-2"></div>

        <div className="ads-container">
          <div className="ads-header">
            <span className="ads-badge">VIDEO REWARDS TERMINAL</span>
            <h1 className="ads-title">Watch Ads & Earn</h1>
            <p className="ads-subtitle">
              Stream short, high-reward video advertisements to collect instant points credited straight into your wallet.
            </p>
          </div>

          {/* Active Player Mockup */}
          {playingAd && (
            <div className="ad-player-modal">
              <div className="player-screen">
                <img src={playingAd.thumbnail} alt={playingAd.title} className="player-media-placeholder" />
                <div className="player-overlay">
                  {!completed ? (
                    <div className="timer-box">
                      <FontAwesomeIcon icon={faSpinner} spin className="timer-spinner" />
                      <span>Reward unlocks in <strong>{timer}s</strong></span>
                    </div>
                  ) : (
                    <div className="completion-box">
                      <FontAwesomeIcon icon={faCheckCircle} className="completed-icon" />
                      <h3>Reward Unlocked!</h3>
                      <p>You earned <strong>{playingAd.reward}</strong></p>
                    </div>
                  )}
                </div>
              </div>
              <button className="btn-close-player" onClick={() => setPlayingAd(null)}>
                Close Player
              </button>
            </div>
          )}

          {/* Video Cards Grid */}
          <div className="ads-grid">
            {availableAds.map((ad) => (
              <div key={ad.id} className="ad-card">
                <div className="ad-thumb-container">
                  <img src={ad.thumbnail} alt={ad.title} className="ad-thumb" />
                  <div className="ad-overlay-play">
                    <button className="play-btn" onClick={() => startAd(ad)}>
                      <FontAwesomeIcon icon={faPlay} />
                    </button>
                  </div>
                  <span className="ad-duration-tag">{ad.duration}s</span>
                </div>

                <div className="ad-card-details">
                  <h3 className="ad-card-title">{ad.title}</h3>
                  <div className="ad-card-footer">
                    <div className="ad-reward-pill">
                      <FontAwesomeIcon icon={faCoins} />
                      <span>{ad.reward}</span>
                    </div>
                    <button className="watch-now-btn" onClick={() => startAd(ad)}>
                      Watch Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
