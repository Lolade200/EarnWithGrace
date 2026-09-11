import React from "react";
import "./AboutUs.css";
import Header from "./Header"; // Adjust path based on your folder structure
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPollH,
  faTv,
  faWallet,
  faCode,
  faShieldHalved,
  faRocket,
} from "@fortawesome/free-solid-svg-icons";
import {
  faLinkedin,
  faGithub,
  faTwitter,
} from "@fortawesome/free-brands-svg-icons";

export default function AboutUs() {
  return (
    <div className="about-page-wrapper">
      {/* Header Navigation */}
      <Header2 />

      {/* Main Section */}
      <section className="about-section">
        {/* Background Ambient Glow FX */}
        <div className="about-bg-glow glow-1"></div>
        <div className="about-bg-glow glow-2"></div>
        <div className="about-bg-glow glow-3"></div>

        <div className="about-container">
          {/* Section Top Header */}
          <div className="about-header">
            <span className="about-badge">OUR MISSION & VISION</span>
            <h1 className="about-title">Empowering Users Through Daily Insights</h1>
            <p className="about-subtitle">
              EarnWithGrace bridges the gap between global brands and active users. 
              Monetize your spare time by engaging with ads, completing tailored surveys, 
              and earning real money effortlessly.
            </p>
          </div>

          {/* Platform Pillar Grid */}
          <div className="about-pillars-grid">
            <div className="pillar-card">
              <div className="pillar-icon-box">
                <FontAwesomeIcon icon={faPollH} />
              </div>
              <h3>Interactive Surveys</h3>
              <p>
                Share your opinions on products and services you use daily. Get rewarded for every survey completed.
              </p>
            </div>

            <div className="pillar-card">
              <div className="pillar-icon-box">
                <FontAwesomeIcon icon={faTv} />
              </div>
              <h3>Watch Video Ads</h3>
              <p>
                Stream short, high-value brand video advertisements and watch your wallet balance accumulate in real time.
              </p>
            </div>

            <div className="pillar-card">
              <div className="pillar-icon-box">
                <FontAwesomeIcon icon={faWallet} />
              </div>
              <h3>Instant Payouts</h3>
              <p>
                Withdraw your accumulated earnings seamlessly into cash payouts, bank transfers, or instant gift cards.
              </p>
            </div>
          </div>

          {/* Founder Profile Card */}
          <div className="founder-section-wrapper">
            <div className="founder-header">
              <span className="about-badge">LEADERSHIP & DEVELOPMENT</span>
              <h2 className="founder-section-title">Meet the Brain Behind EarnWithGrace</h2>
            </div>

            <div className="founder-card">
              {/* Founder Image Container */}
              <div className="founder-image-wrapper">
                {/* Replace src with your image path (e.g., "/assets/adebayo.jpg") */}
                <img
                  src="/assets/adebayo.jpg"
                  alt="Adebayo Ololade Samson - Founder & Full Stack Developer"
                  className="founder-image"
                  onError={(e) => {
                    // Fallback avatar icon placeholder if image path doesn't exist yet
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "flex";
                  }}
                />
                <div className="founder-image-fallback" style={{ display: "none" }}>
                  <FontAwesomeIcon icon={faCode} />
                </div>
                <div className="founder-badge">FOUNDER & LEAD DEV</div>
              </div>

              {/* Founder Information Details */}
              <div className="founder-details">
                <div className="founder-role-tag">
                  <FontAwesomeIcon icon={faShieldHalved} /> Co-Founder & Full-Stack Developer
                </div>
                <h3 className="founder-name">Adebayo Ololade Samson</h3>
                <p className="founder-bio">
                  A passionate **Full-Stack Software Engineer** dedicated to building secure, 
                  high-performance web architecture and scalable financial tech solutions. Adebayo engineered 
                  EarnWithGrace to provide a seamless user interface paired with reliable backend infrastructure—enabling 
                  thousands of active users to safely monetize their online activity every single day.
                </p>

                <div className="founder-skills-tags">
                  <span className="skill-chip">React / Frontend</span>
                  <span className="skill-chip">Node.js / Express</span>
                  <span className="skill-chip">REST APIs & Webhooks</span>
                  <span className="skill-chip">Cyber Security</span>
                </div>

                <div className="founder-socials">
                  <a href="#linkedin" target="_blank" rel="noreferrer" aria-label="LinkedIn Profile">
                    <FontAwesomeIcon icon={faLinkedin} />
                  </a>
                  <a href="#github" target="_blank" rel="noreferrer" aria-label="GitHub Profile">
                    <FontAwesomeIcon icon={faGithub} />
                  </a>
                  <a href="#twitter" target="_blank" rel="noreferrer" aria-label="Twitter Profile">
                    <FontAwesomeIcon icon={faTwitter} />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action Bar */}
          <div className="about-cta-card">
            <div className="cta-content">
              <h2>Ready to Turn Your Time into Cash?</h2>
              <p>Join thousands of members earning continuous rewards today.</p>
            </div>
            <a href="/signup" className="about-cta-btn">
              <FontAwesomeIcon icon={faRocket} /> Get Started Now
            </a>
          </div>

        </div>
      </section>
    </div>
  );
}
