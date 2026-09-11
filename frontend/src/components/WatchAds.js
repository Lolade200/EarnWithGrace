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
import "./NewDashboard.css"; // Uses shared 2054 theme design

// Pre-filled ad bank used for the dynamic 20-ad sliding queue
const INITIAL_ADS = Array.from({ length: 20 }, (_, index) => ({
  id: `ad_${index + 1}`,
  title: `Google Ads Slot #${index + 1} - Sponsored Promo`,
  duration: (index % 3 + 1) * 15,
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

  // Monitor Auth State
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Initialize Google Ads Script
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.log("AdSense initialization deferred");
    }
  }, [adsQueue]);

  // FIFO Queue Simulation: Add new ad every 12 seconds, drop oldest
  useEffect(() => {
    const queueInterval = setInterval(() => {
      setAdsQueue((prevQueue) => {
        const newAdId = Date.now();
        const newAd = {
          id: `ad_${newAdId}`,
          title: `Live Sponsor Feature #${Math.floor(Math.random() * 900) + 100}`,
          duration: 15,
          reward: 30,
          client: "Live Ad Network",
          type: "google_adsense"
        };
        // Remove oldest item (index 0) and append new ad at the end (FIFO max 20)
        return [...prevQueue.slice(1), newAd];
      });
    }, 12000);

    return () => clearInterval(queueInterval);
  }, []);

  // Countdown timer for watching ads
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
        message: `Earned +${ad.reward} GP from watching "${ad.title}"`,
        timestamp: Date.now(),
        read: false
      });
    } catch (err) {
      console.error("Ad reward failed:", err);
    }
  };

  return (
    <div className="new-dashboard-container" style={{ flexDirection: "column" }}>
      <Header />

      <main className="main-content" style={{ maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
        {/* Header Section */}
        <div className="header" style={{ marginTop: "1rem" }}>
          <div className="header-title">
            <div>
              <h2>
                <FontAwesomeIcon icon={faTv} style={{ color: "var(--orange)" }} /> Watch Ads & Earn GP
              </h2>
              <p>Stream sponsor video spots and Google Ads to instantly earn Grace Points.</p>
            </div>
          </div>
          <span className="version-tag">20 LIVE ADS SLOTS</span>
        </div>

        {/* Ads Grid (Max 20 Items FIFO) */}
        <div className="surveys-grid">
          {adsQueue.map((ad, idx) => (
            <div key={ad.id} className="survey-card">
              <div className="survey-card-header">
                <span className="category-badge">SLOT #{idx + 1}</span>
                <span className="gp-payout">+{ad.reward} GP</span>
              </div>

              {/* Google Ads Placement Preview Container */}
              <div
                style={{
                  background: "rgba(0, 0, 0, 0.4)",
                  borderRadius: "8px",
                  padding: "1rem",
                  textAlign: "center",
                  margin: "0.75rem 0",
                  border: "1px dashed var(--border-cyan)"
                }}
              >
                <FontAwesomeIcon icon={faPlay} style={{ color: "var(--orange)", fontSize: "2rem" }} />
                {ad.type === "google_adsense" && (
                  <ins
                    className="adsbygoogle"
                    style={{ display: "block" }}
                    data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
                    data-ad-slot="1234567890"
                    data-ad-format="auto"
                    data-full-width-responsive="true"
                  />
                )}
              </div>

              <h4>{ad.title}</h4>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Duration: {ad.duration} Seconds</p>

              <button className="primary-btn" onClick={() => handleStartAd(ad)}>
                {currentUser ? "Watch & Earn" : "Sign In to Earn"}
              </button>
            </div>
          ))}
        </div>
      </main>

      {/* Video Ad Player Modal */}
      {playingAd && (
        <div className="modal-overlay">
          <div className="survey-modal" style={{ textAlign: "center" }}>
            <div className="modal-header">
              <h3>{playingAd.title}</h3>
              <button className="close-btn" onClick={() => setPlayingAd(null)}>
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <div style={{ padding: "2rem 0" }}>
              {!completed ? (
                <div>
                  <FontAwesomeIcon icon={faSpinner} spin style={{ fontSize: "3rem", color: "var(--orange)" }} />
                  <h2 style={{ marginTop: "1rem" }}>Reward Unlocks In: {timer}s</h2>
                  <p>Please keep this window open to receive your points.</p>
                </div>
              ) : (
                <div>
                  <FontAwesomeIcon icon={faCheckCircle} style={{ fontSize: "3rem", color: "#22c55e" }} />
                  <h2 style={{ marginTop: "1rem" }}>+{playingAd.reward} GP Added!</h2>
                  <button className="primary-btn" onClick={() => setPlayingAd(null)}>
                    Claim & Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sign-In Prompt Modal */}
      {showAuthModal && (
        <div className="modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="survey-modal" style={{ textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
            <FontAwesomeIcon icon={faLock} style={{ fontSize: "3rem", color: "var(--orange)", marginBottom: "1rem" }} />
            <h3>Sign In Required</h3>
            <p style={{ color: "var(--text-muted)", margin: "1rem 0" }}>
              You can explore available ads, but you need an active account to watch and claim Grace Points rewards.
            </p>
            <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
              <button className="primary-btn" onClick={() => navigate("/login")}>
                Sign In
              </button>
              <button
                className="primary-btn"
                style={{ background: "transparent", border: "1px solid var(--border-cyan)" }}
                onClick={() => navigate("/signup")}
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
