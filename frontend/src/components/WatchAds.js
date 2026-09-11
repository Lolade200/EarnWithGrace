import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { ref, update, push, get } from "firebase/database";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlay,
  faCoins,
  faCheckCircle,
  faSpinner,
  faTv,
  faLock,
  faXmark
} from "@fortawesome/free-solid-svg-icons";
import Header from "./Header";
import "./WatchAds.css";

const INITIAL_ADS = Array.from({ length: 20 }, (_, index) => ({
  id: `ad_${index + 1}`,
  title: `Google Sponsored Promo #${index + 1}`,
  duration: ((index % 3) + 1) * 15,
  reward: (index + 1) * 10,
  client: `Partner Brand ${index + 1}`,
  type: index % 2 === 0 ? "google_adsense" : "custom_video"
}));

export default function WatchAds() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [adsQueue, setAdsQueue] = useState(INITIAL_ADS);
  const [playingAd, setPlayingAd] = useState(null);
  const [timer, setTimer] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => setCurrentUser(user));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.log("AdSense initialization deferred");
    }
  }, [adsQueue]);

  // Dynamic FIFO Queue: Adds new ad, removes oldest (keeps 20 ads max)
  useEffect(() => {
    const queueInterval = setInterval(() => {
      setAdsQueue((prevQueue) => {
        const newAdId = Date.now();
        const newAd = {
          id: `ad_${newAdId}`,
          title: `Live Sponsor Feature #${Math.floor(Math.random() * 900) + 100}`,
          duration: 15,
          reward: 35,
          client: "Live Ad Network",
          type: "google_adsense"
        };
        return [...prevQueue.slice(1), newAd];
      });
    }, 12000);

    return () => clearInterval(queueInterval);
  }, []);

  useEffect(() => {
    let interval = null;
    if (playingAd && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    } else if (timer === 0 && playingAd && !completed) {
      setCompleted(true);
      handleAdReward(playingAd);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [playingAd, timer, completed]);

  const handleStartAd = (ad) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    setPlayingAd(ad);
    setTimer(ad.duration);
    setCompleted(false);
  };

  const handleAdReward = async (ad) => {
    if (!currentUser) return;
    try {
      const userRef = ref(db, `users/${currentUser.uid}`);
      const snap = await get(userRef);
      const currentPts = snap.val()?.gracePoints || 0;
      const newPts = currentPts + ad.reward;

      await update(userRef, { gracePoints: newPts, rewards: newPts });
      await push(ref(db, "notifications"), {
        type: "AD_WATCHED",
        message: `Earned +${ad.reward} GP watching "${ad.title}"`,
        timestamp: Date.now(),
        read: false
      });
    } catch (err) {
      console.error("Reward system error:", err);
    }
  };

  return (
    <div className="ads-page-wrapper">
      <Header />

      <section className="ads-section">
        <div className="ads-bg-glow glow-1"></div>
        <div className="ads-bg-glow glow-2"></div>

        <div className="ads-container">
          <div className="ads-header">
            <span className="ads-badge">20 LIVE SPONSORED ADS</span>
            <h1 className="ads-title">Watch Ads & Earn Rewards</h1>
            <p className="ads-subtitle">
              Browse sponsored campaigns and Google Ads. Watch video spots to collect Grace Points instantly.
            </p>
          </div>

          <div className="ads-grid">
            {adsQueue.map((ad, idx) => (
              <div key={ad.id} className="ad-card">
                <div className="ad-thumb-container">
                  <div className="ad-type-badge">SLOT #{idx + 1}</div>
                  
                  {ad.type === "google_adsense" ? (
                    <div className="adsense-box">
                      <ins
                        className="adsbygoogle"
                        style={{ display: "block" }}
                        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
                        data-ad-slot="1234567890"
                        data-ad-format="auto"
                        data-full-width-responsive="true"
                      />
                    </div>
                  ) : (
                    <div className="custom-ad-placeholder">
                      <FontAwesomeIcon icon={faTv} className="placeholder-icon" />
                    </div>
                  )}

                  <div className="ad-overlay-play">
                    <button className="play-btn" onClick={() => handleStartAd(ad)}>
                      <FontAwesomeIcon icon={faPlay} />
                    </button>
                  </div>
                  <span className="ad-duration-tag">{ad.duration}s</span>
                </div>

                <div className="ad-card-details">
                  <h4 className="ad-card-title">{ad.title}</h4>
                  <div className="ad-card-footer">
                    <div className="ad-reward-pill">
                      <FontAwesomeIcon icon={faCoins} />
                      <span>+{ad.reward} GP</span>
                    </div>
                    <button className="watch-now-btn" onClick={() => handleStartAd(ad)}>
                      {currentUser ? "Watch & Earn" : "Sign In"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Player Modal */}
      {playingAd && (
        <div className="ad-modal-overlay">
          <div className="ad-player-modal">
            <div className="modal-top">
              <h3>{playingAd.title}</h3>
              <button className="close-x" onClick={() => setPlayingAd(null)}>
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <div className="player-screen">
              {!completed ? (
                <div className="player-overlay">
                  <div className="timer-box">
                    <FontAwesomeIcon icon={faSpinner} spin className="timer-spinner" />
                    <span>Reward Unlocks in {timer}s</span>
                  </div>
                </div>
              ) : (
                <div className="player-overlay">
                  <div style={{ textAlign: "center" }}>
                    <FontAwesomeIcon icon={faCheckCircle} className="completed-icon" />
                    <h3>+{playingAd.reward} GP Credited!</h3>
                  </div>
                </div>
              )}
            </div>

            {completed && (
              <button className="btn-close-player" onClick={() => setPlayingAd(null)}>
                Claim & Return
              </button>
            )}
          </div>
        </div>
      )}

      {/* Auth Modal for Unauthenticated Users */}
      {showAuthModal && (
        <div className="ad-modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="auth-gate-modal" onClick={(e) => e.stopPropagation()}>
            <FontAwesomeIcon icon={faLock} className="auth-gate-icon" />
            <h2>Sign In Required</h2>
            <p>You need an active account to earn Grace Points from ads. Sign in or register below to get started.</p>
            <div className="auth-gate-actions">
              <button className="auth-primary-btn" onClick={() => navigate("/login")}>
                Sign In
              </button>
              <button className="auth-secondary-btn" onClick={() => navigate("/signup")}>
                Create Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
