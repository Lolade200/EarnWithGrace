import React from "react";
import "./Encouragement.css";

export default function Encouragement() {
  return (
    <section className="encouragement-section">
      {/* Background Ambient Glow FX */}
      <div className="encouragement-bg-glow glow-1"></div>
      <div className="encouragement-bg-glow glow-2"></div>

      <div className="encouragement-container">
        {/* Section Top Header (Matches AnimatedSection Style) */}
        <div className="encouragement-header">
          <span className="encouragement-badge">VALUABLE INSIGHTS</span>
          <h2 className="encouragement-main-title">Make Your Voice Count</h2>
          <p className="encouragement-subtitle">
            Transform your everyday feedback into continuous digital growth and real-world value.
          </p>
        </div>

        {/* Hero Banner Card with Image & Text Overlay */}
        <div className="encouragement-card">
          <div className="encouragement-image-wrapper">
            <img
              src="/assets/pexels-diva-plavalaguna-6937848.jpg"
              alt="Turn Opinions Into Rewards"
              className="encouragement-image"
            />
            <div className="encouragement-overlay"></div>

            <div className="encouragement-content-overlay">
              <h2 className="encouragement-banner-title">
                Turn Opinions Into Rewards!
              </h2>
              <p className="encouragement-description">
                Our online surveys aren’t just questions — they’re opportunities. Share your
                thoughts on brands you already use, influence future products, and earn
                instant rewards while doing it. Every response brings you closer to cash
                payouts, gift cards, and exclusive perks.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
