import React from "react";
import "./Footer.css";
// Import Font Awesome
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFacebook,
  faTwitter,
  faLinkedin,
  faInstagram,
} from "@fortawesome/free-brands-svg-icons";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Company Info */}
        <div className="footer-section">
          <h3>EarnWithGrace</h3>
          <p>
            Empowering creators and businesses to collect insights and reward
            participants instantly through engaging online surveys.
          </p>
        </div>

        {/* Quick Links */}
        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li><a href="#about">About</a></li>
            <li><a href="#features">Features</a></li>
            <li><a href="#pricing">Pricing</a></li>
            <li><a href="#faq">FAQ</a></li>
          </ul>
        </div>

        {/* Resources */}
        <div className="footer-section">
          <h4>Resources</h4>
          <ul>
            <li><a href="#blog">Blog</a></li>
            <li><a href="#guides">Guides</a></li>
            <li><a href="#support">Support Center</a></li>
            <li><a href="#api">API Docs</a></li>
          </ul>
        </div>

        {/* Newsletter Signup */}
        <div className="footer-section">
          <h4>Stay Updated</h4>
          <form className="newsletter-form">
            <input type="email" placeholder="Enter your email" />
            <button type="submit">Subscribe</button>
          </form>
        </div>

        {/* Contact */}
        <div className="footer-section">
          <h4>Contact</h4>
          <p>Email: support@earnwithgrace.com</p>
          <p>Phone: +234 800 123 4567</p>
        </div>

        {/* Social Media */}
        <div className="footer-section">
          <h4>Follow Us</h4>
          <div className="social-icons">
            <a href="https://facebook.com">
              <FontAwesomeIcon icon={faFacebook} /> 
            </a>
            <a href="https://twitter.com">
              <FontAwesomeIcon icon={faTwitter} /> 
            </a>
            <a href="https://linkedin.com">
              <FontAwesomeIcon icon={faLinkedin} /> 
            </a>
            <a href="https://instagram.com">
              <FontAwesomeIcon icon={faInstagram} /> 
            </a>
          </div>
        </div>
      </div>

      {/* Legal Links */}
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} EarnWithGrace — All Rights Reserved</p>
        <div className="legal-links">
          <a href="#privacy">Privacy Policy</a>
          <a href="#terms">Terms of Service</a>
          <a href="#cookies">Cookie Policy</a>
        </div>
      </div>
    </footer>
  );
}
