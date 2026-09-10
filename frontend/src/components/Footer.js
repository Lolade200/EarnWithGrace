import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ref, push } from "firebase/database";
import { db } from "../firebase";
import "./Footer.css";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFacebookF,
  faXTwitter,
  faLinkedinIn,
  faInstagram,
} from "@fortawesome/free-brands-svg-icons";
import { 
  faEnvelope, 
  faPaperPlane, 
  faShieldHalved, 
  faPhone, 
  faSpinner, 
  faCheck,
  faExclamationCircle
} from "@fortawesome/free-solid-svg-icons";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({ loading: false, message: "", type: "" });

  const handleSubscribe = async (e) => {
    e.preventDefault();
    
    if (!email) return;

    setStatus({ loading: true, message: "Transmitting subscription...", type: "info" });

    try {
      const subscribersRef = ref(db, "subscribers");
      await push(subscribersRef, {
        email: email.trim().toLowerCase(),
        subscribedAt: new Date().toISOString(),
      });

      setStatus({
        loading: false,
        message: "Successfully joined the EarnWithGrace network!",
        type: "success",
      });
      setEmail("");

      setTimeout(() => {
        setStatus({ loading: false, message: "", type: "" });
      }, 4000);
    } catch (error) {
      console.error("Newsletter Subscription Error:", error);
      setStatus({
        loading: false,
        message: "Failed to subscribe. Please try again.",
        type: "error",
      });
    }
  };

  return (
    <footer className="footer">
      <div className="footer-glow-line"></div>

      <div className="footer-container">
        
        {/* Brand & Mission Column */}
        <div className="footer-section brand-section">
          <div className="footer-brand-logo">
            <div className="brand-icon-box">
              <FontAwesomeIcon icon={faShieldHalved} />
            </div>
            <div className="brand-text">
              <span className="brand-primary">EarnWithGrace</span>
              <span className="brand-sub">DIGITAL ASSETS PLATFORM</span>
            </div>
          </div>

          <p className="footer-description">
            Empowering creators and businesses to collect insights and reward participants 
            instantly through engaging online surveys and automated digital transactions.
          </p>

          <div className="social-icons">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <FontAwesomeIcon icon={faFacebookF} />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
              <FontAwesomeIcon icon={faXTwitter} />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <FontAwesomeIcon icon={faLinkedinIn} />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <FontAwesomeIcon icon={faInstagram} />
            </a>
          </div>
        </div>

        {/* Quick Links Column */}
        <div className="footer-section">
          <h4 className="footer-heading">
            <span className="heading-accent">//</span> Quick Links
          </h4>
          <ul className="footer-nav-list">
            <li><Link to="/">Home Terminal</Link></li>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/login">Log In</Link></li>
            <li><Link to="/signup">Sign Up</Link></li>
          </ul>
        </div>

        {/* Contact Column */}
        <div className="footer-section">
          <h4 className="footer-heading">
            <span className="heading-accent">//</span> Contact Us
          </h4>
          <div className="contact-details">
            <div className="contact-item">
              <FontAwesomeIcon icon={faEnvelope} className="contact-icon" />
              <div>
                <span className="contact-label">Support Email</span>
                <a href="mailto:support@earnwithgrace.com" className="contact-value">support@earnwithgrace.com</a>
              </div>
            </div>

            <div className="contact-item">
              <FontAwesomeIcon icon={faPhone} className="contact-icon" />
              <div>
                <span className="contact-label">Direct Line</span>
                <span className="contact-value">+234 704 460 5404</span>
              </div>
            </div>
          </div>
        </div>

        {/* Newsletter Column */}
        <div className="footer-section newsletter-section">
          <h4 className="footer-heading">
            <span className="heading-accent">//</span> Stay Updated
          </h4>
          <p className="newsletter-subtitle">
            Subscribe to our newsletter for exclusive deals, survey updates, and tips.
          </p>
          
          <form className="newsletter-form" onSubmit={handleSubscribe}>
            <div className={`newsletter-input-wrapper ${status.loading ? "is-loading" : ""}`}>
              <FontAwesomeIcon icon={faEnvelope} className="mail-icon" />
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={status.loading}
              />
              <button type="submit" disabled={status.loading} aria-label="Subscribe">
                {status.loading ? (
                  <FontAwesomeIcon icon={faSpinner} spin />
                ) : (
                  <FontAwesomeIcon icon={faPaperPlane} />
                )}
              </button>
            </div>
          </form>

          {/* Status Messages */}
          {status.message && (
            <div className={`newsletter-status ${status.type}`}>
              {status.type === "success" && <FontAwesomeIcon icon={faCheck} />}
              {status.type === "error" && <FontAwesomeIcon icon={faExclamationCircle} />}
              {status.type === "info" && <FontAwesomeIcon icon={faSpinner} spin />}
              <span>{status.message}</span>
            </div>
          )}
        </div>

      </div>

      {/* Bottom Legal Section */}
      <div className="footer-bottom">
        <div className="footer-bottom-container">
          <p className="copyright-text">
            © {new Date().getFullYear()} <span className="highlight-text">EarnWithGrace</span> — All Rights Reserved.
          </p>
          <div className="legal-links">
            <a href="#privacy">Privacy Policy</a>
            <span className="divider">•</span>
            <a href="#terms">Terms of Service</a>
            <span className="divider">•</span>
            <a href="#cookies">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
