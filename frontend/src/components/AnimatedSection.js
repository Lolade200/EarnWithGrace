import React from "react";
import "./AnimatedSection.css";

const statsData = [
  {
    image: "/assets/gg.jpg",
    alt: "Surveys Completed",
    title: "Surveys Completed",
    value: "1.2M+"
  },
  {
    image: "/assets/kk.jpg",
    alt: "Cash Paid Out",
    title: "Cash Distributed",
    value: "$4.5M+"
  },
  {
    image: "/assets/hg.jpg",
    alt: "Gift Cards Redeemed",
    title: "Gift Cards Claimed",
    value: "850K+"
  },
  {
    image: "/assets/tbb.jpg",
    alt: "Global Community",
    title: "Active Earners",
    value: "300K+"
  }
];

export default function AnimatedSection() {
  return (
    <section className="animated-section">
      {/* Background Ambient Glow FX */}
      <div className="animated-bg-glow glow-1"></div>
      <div className="animated-bg-glow glow-2"></div>

      <div className="animated-content">
        <div className="animated-header">
          <span className="animated-badge">LIVE METRICS</span>
          <h2 className="animated-title">Your Impact in Numbers</h2>
          <p className="animated-subtitle">
            A visual showcase of how your contributions translate into tangible financial rewards.
          </p>
        </div>

        <div className="stats-grid">
          {statsData.map((stat, idx) => (
            <div className="stat-card" key={idx}>
              <div className="stat-image-wrapper">
                <img src={stat.image} alt={stat.alt} className="stat-image" />
                <div className="stat-overlay"></div>
                <div className="stat-card-badge">
                  <span className="stat-value">{stat.value}</span>
                  <span className="stat-label">{stat.title}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
