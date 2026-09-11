import React, { useState, useEffect } from "react";
import "./WatchAds.css";
import Header from "./Header";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlay,
  faCoins,
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
      <Header />

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
