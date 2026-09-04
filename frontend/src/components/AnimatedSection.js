import React from "react";
import "./AnimatedSection.css";

export default function AnimatedSection() {
  return (
    <section className="animated-section">
      <div className="animated-bg"></div>
      <div className="animated-content">
        <h2 className="animated-title">Your Impact in Numbers</h2>
        <p className="animated-subtitle">
          A visual showcase of how your contributions translate into rewards.
        </p>
        <div className="stats-grid">
          <div className="stat-card">
            <img src="/assets/gg.jpg" alt="Surveys" className="stat-image" />
          </div>
          <div className="stat-card">
            <img src="/assets/kk.jpg" alt="Cash Rewards" className="stat-image" />
          </div>
          <div className="stat-card">
            <img src="/assets/hg.jpg" alt="Gift Cards" className="stat-image" />
           
          </div>
             <div className="stat-card">
    <img src="/assets/tbb.jpg" alt="Gift Cards" className="stat-image" />
          </div>
        </div>
      </div>
    </section>
  );
}
