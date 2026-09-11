import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Header2.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faTimes,
  faShieldHalved,
  faHouse,
  faInfoCircle,
  faTv,
  faPollH,
  faRightToBracket,
  faUserPlus,
} from "@fortawesome/free-solid-svg-icons";

export default function Header2() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Close sidebar automatically when navigating to a new route
  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  // Prevent background scrolling when sidebar drawer is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [sidebarOpen]);

  return (
    <>
      {/* TOP DESKTOP & MOBILE NAVIGATION BAR */}
      <header className="home-header">
        <div className="header-left">
          {/* Mobile Menu Toggle Icon */}
          <button
            className="menu-toggle-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open Navigation Menu"
          >
            <FontAwesomeIcon icon={faBars} />
          </button>

          {/* Brand Logo */}
          <Link to="/" className="header-brand-logo">
            <div className="brand-icon-box">
              <FontAwesomeIcon icon={faShieldHalved} />
            </div>
            <div className="brand-text">
              <span className="brand-primary">
                EarnWith<span className="brand-highlight">Grace</span>
              </span>
              <span className="brand-sub">ENTERPRISE TERMINAL</span>
            </div>
          </Link>
        </div>

        {/* Middle Navigation Links (Desktop Only) */}
        <nav className="desktop-nav-links">
          <Link to="/">Home</Link>
          <Link to="/about-us">About Us</Link>
          <Link to="/watch-ads">Watch Ads</Link>
          <Link to="/surveys">Surveys</Link>
        </nav>

        {/* Top Right Action Buttons (Desktop Only - Hidden on Mobile) */}
        <div className="header-cta-buttons">
          <Link to="/login" className="btn-header-outline">
            Sign In
          </Link>
          <Link to="/signup" className="btn-header-primary">
            Get Started
          </Link>
        </div>
      </header>

      {/* MOBILE SIDEBAR DRAWER & OVERLAY */}
      {sidebarOpen && (
        <div
          className="header-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`home-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-top">
          <div className="sidebar-brand-container">
            <div className="brand-icon-box">
              <FontAwesomeIcon icon={faShieldHalved} />
            </div>
            <div className="brand-text">
              <span className="brand-primary">
                EarnWith<span className="brand-highlight">Grace</span>
              </span>
              <span className="brand-sub">MOBILE TERMINAL</span>
            </div>
            <button
              className="sidebar-close-btn"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close Navigation Menu"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          {/* Mobile Navigation Links */}
          <nav className="sidebar-nav">
            <Link to="/">
              <FontAwesomeIcon icon={faHouse} className="nav-icon" />
              <span>Home</span>
            </Link>
            <Link to="/about-us">
              <FontAwesomeIcon icon={faInfoCircle} className="nav-icon" />
              <span>About Us</span>
            </Link>
            <Link to="/watch-ads">
              <FontAwesomeIcon icon={faTv} className="nav-icon" />
              <span>Watch Ads</span>
            </Link>
            <Link to="/surveys">
              <FontAwesomeIcon icon={faPollH} className="nav-icon" />
              <span>Surveys</span>
            </Link>
          </nav>
        </div>

        {/* Mobile Auth Bottom Section (Sign In + Get Started) */}
        <div className="sidebar-bottom-auth">
          <Link to="/login" className="sidebar-auth-btn outline">
            <FontAwesomeIcon icon={faRightToBracket} />
            <span>Sign In</span>
          </Link>

          <Link to="/signup" className="sidebar-auth-btn primary">
            <FontAwesomeIcon icon={faUserPlus} />
            <span>Get Started</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
