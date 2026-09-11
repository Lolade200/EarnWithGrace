import React from "react";
import "./Highlights.css";

const highlights = [
  { icon: "fas fa-chart-line", text: "Real-time analytics right on your phone." },
  { icon: "fas fa-bell", text: "Instant notifications for new responses." },
  { icon: "fas fa-comments", text: "Chat with participants directly in-app." },
  { icon: "fas fa-globe", text: "Offline mode for field surveys anywhere." }
];

export default function Highlights() {
  return (
    <section className="highlights-section">
      {/* Background Ambient Glow FX */}
      <div className="highlights-bg-glow glow-1"></div>
      <div className="highlights-bg-glow glow-2"></div>

      <div className="highlights-container">
        {/* Section Top Header */}
        <div className="highlights-header">
          <span className="highlights-badge">CORE FEATURES</span>
          <h2 className="highlights-title">Engineered for Seamless Control</h2>
          <p className="highlights-subtitle">
            Everything you need to monitor, engage, and collect real-time data on the go.
          </p>
        </div>

        {/* Circular Cards Flex/Grid Layout */}
        <div className="highlights-grid">
          {highlights.map((h, i) => (
            <div key={i} className="highlight-circle-card">
              <div className="highlight-circle-inner">
                <div className="highlight-icon-wrapper">
                  <i className={h.icon}></i>
                </div>
                <p className="highlight-text">{h.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
