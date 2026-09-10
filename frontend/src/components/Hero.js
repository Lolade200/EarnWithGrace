import React from "react";
import { Link } from "react-router-dom";
import "./Hero.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faRocket, 
  faShieldHalved, 
  faArrowRight, 
  faChartLine, 
  faBolt 
} from "@fortawesome/free-solid-svg-icons";

export default function Hero() {
  return (
    <section className="hero" id="hero">
      {/* Background Neon Grid Accent Lines */}
      <div className="hero-grid-overlay"></div>
      <div className="hero-glow-sphere sphere-1"></div>
      <div className="hero-glow-sphere sphere-2"></div>

      <div className="hero-container">
        {/* Left side: text content */}
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-pulse"></span>
            <FontAwesomeIcon icon={faShieldHalved} className="badge-icon" />
            <span>SYSTEM v2054.1 // EARNWITHGRACE PLATFORM</span>
          </div>

          <h1 className="hero-title">
            The Ultimate Digital <br />
            <span className="title-gradient">Asset & Survey Terminal</span>
          </h1>

          <p className="hero-description">
            EarnWithGrace empowers creators, researchers, and enterprises to build high-converting 
            surveys, analyze automated data insights, and execute instant rewards globally.
          </p>

          <div className="hero-buttons">
            <Link to="/signup" className="btn-primary">
              <span>Start Free Terminal</span>
              <FontAwesomeIcon icon={faArrowRight} className="btn-icon" />
            </Link>

            <Link to="/login" className="btn-outline">
              <FontAwesomeIcon icon={faRocket} className="btn-icon-left" />
              <span>Access Portal</span>
            </Link>
          </div>

          {/* Quick Metrics Strip */}
          <div className="hero-stats-strip">
            <div className="stat-item">
              <span className="stat-number">99.9%</span>
              <span className="stat-label">System Uptime</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">&lt; 1s</span>
              <span className="stat-label">Instant Settlement</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">256-bit</span>
              <span className="stat-label">Encrypted Data</span>
            </div>
          </div>
        </div>

        {/* Right side: image with cyber HUD elements */}
        <div className="hero-image">
          <div className="hero-card-glow-wrapper">
            <img
              src="/assets/4996665.jpg"
              alt="EarnWithGrace Dashboard Terminal Preview"
              className="dashboard-preview"
            />
            <div className="image-overlay-gradient"></div>

            {/* Floating Futuristic HUD Badges */}
            <div className="floating-hud-card hud-top-right">
              <FontAwesomeIcon icon={faBolt} className="hud-icon orange" />
              <div>
                <strong>Instant Payouts</strong>
                <span>Real-time Execution</span>
              </div>
            </div>

            <div className="floating-hud-card hud-bottom-left">
              <FontAwesomeIcon icon={faChartLine} className="hud-icon indigo" />
              <div>
                <strong>Live Insights</strong>
                <span>Automated Analytics</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
