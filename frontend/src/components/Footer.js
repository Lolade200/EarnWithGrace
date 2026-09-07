import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ref, push } from "firebase/database";
import { db } from "../firebase"; // Adjust path if your firebase.js is located elsewhere
import "./Footer.css";

// Import Font Awesome Icons
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFacebook,
  faTwitter,
  faLinkedin,
  faInstagram,
} from "@fortawesome/free-brands-svg-icons";
import { faEnvelope, faPaperPlane } from "@fortawesome/free-solid-svg-icons";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({ loading: false, message: "", type: "" });

  const handleSubscribe = async (e) => {
    e.preventDefault();
    
    if (!email) return;

    setStatus({ loading: true, message: "Subscribing...", type: "info" });

    try {
      // Save email to Firebase Realtime Database under "subscribers"
      const subscribersRef = ref(db, "subscribers");
      await push(subscribersRef, {
        email: email.trim().toLowerCase(),
        subscribedAt: new Date().toISOString(),
      });

      setStatus({
        loading: false,
        message: "Thank you for subscribing!",
        type: "success",
      });
      setEmail(""); // Reset input field

      // Clear success message after 4 seconds
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
      <div className="footer-container">
        
        {/* Brand & Mission Column */}
        <div className="footer-section brand-section">
          <h3 className="footer-brand-title">EarnWithGrace</h3>
          <p className="footer-description">
            Empowering creators and businesses to collect insights and reward
            participants instantly through engaging online surveys.
          </p>
          <div className="social-icons">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <FontAwesomeIcon icon={faFacebook} />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
              <FontAwesomeIcon icon={faTwitter} />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <FontAwesomeIcon icon={faLinkedin} />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <FontAwesomeIcon icon={faInstagram} />
            </a>
          </div>
        </div>

        {/* Quick Links Column */}
        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/login">Log In</Link></li>
            <li><Link to="/signup">Sign Up</Link></li>
          </ul>
        </div>

        {/* Contact Column */}
        <div className="footer-section">
          <h4>Contact Us</h4>
          <p>
            <strong>Email:</strong><br />
            <a href="mailto:support@earnwithgrace.com">support@earnwithgrace.com</a>
          </p>
          <p>
            <strong>Phone:</strong><br />
            +234 704 460 5404
          </p>
        </div>

        {/* Working Newsletter Column */}
        <div className="footer-section newsletter-section">
          <h4>Stay Updated</h4>
          <p className="newsletter-subtitle">
            Subscribe to our newsletter for exclusive deals, survey updates, and tips.
          </p>
          
          <form className="newsletter-form" onSubmit={handleSubscribe}>
            <div className="newsletter-input-wrapper">
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
                <FontAwesomeIcon icon={faPaperPlane} />
              </button>
            </div>
          </form>

          {/* Status Message Display */}
          {status.message && (
            <p className={`newsletter-status ${status.type}`}>
              {status.message}
            </p>
          )}
        </div>

      </div>

      {/* Bottom Legal Section */}
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} EarnWithGrace — All Rights Reserved</p>
        <div className="legal-links">
          <a href="#privacy">Privacy Policy</a>
          <span className="divider">•</span>
          <a href="#terms">Terms of Service</a>
          <span className="divider">•</span>
          <a href="#cookies">Cookie Policy</a>
        </div>
      </div>
    </footer>
  );
}