import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faXmark,
  faHouse,
  faBoxesPacking,
  faLightbulb,
  faTags,
  faBookOpen,
  faRightToBracket,
  faUserPlus,
  faShieldHalved
} from "@fortawesome/free-solid-svg-icons";
import "./Header.css";

export default function Header() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <>
      {/* Dark Overlay when Mobile/Sidebar Drawer is Open */}
      {sidebarOpen && (
        <div className="header-sidebar-overlay" onClick={closeSidebar}></div>
      )}

      {/* Main Top Header Navigation */}
      <header className="home-header">
        <div className="header-left">
          {/* Neon Mobile Menu Toggle */}
          <button
            className="menu-toggle-btn"
            onClick={toggleSidebar}
            aria-label="Toggle Navigation"
          >
            <FontAwesomeIcon icon={sidebarOpen ? faXmark : faBars} />
          </button>

          {/* EWG Brand Logo */}
          <Link to="/" className="header-brand-logo" onClick={closeSidebar}>
            <div className="brand-icon-box">
              <FontAwesomeIcon icon={faShieldHalved} />
            </div>
            <div className="brand-text">
              <span className="brand-primary">
                EarnWith<span className="brand-highlight">Grace</span>
              </span>
              <span className="brand-sub">PLATFORM TERMINAL</span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="desktop-nav-links">
          <a href="#products">Products</a>
          <a href="#solutions">Solutions</a>
          <a href="#pricing">Pricing</a>
          <a href="#resources">Resources</a>
        </nav>

        {/* Desktop Authentication CTA Buttons */}
        <div className="header-cta-buttons">
          <Link to="/login" className="btn-header-outline">
            Sign In
          </Link>
          <Link to="/signup" className="btn-header-primary">
            Get Started
          </Link>
        </div>
      </header>

      {/* Slide-over Sidebar (Dashboard Style Drawer) */}
      <aside className={`home-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-top">
          {/* Drawer Header Brand */}
          <div className="sidebar-brand-container">
            <div className="brand-icon-box">
              <FontAwesomeIcon icon={faShieldHalved} />
            </div>
            <div className="brand-text">
              <span className="brand-primary">
                EarnWith<span className="brand-highlight">Grace</span>
              </span>
              <span className="brand-sub">NAVIGATION PORTAL</span>
            </div>
            <button className="sidebar-close-btn" onClick={closeSidebar}>
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>

          {/* Drawer Links */}
          <nav className="sidebar-nav">
            <a href="#hero" onClick={closeSidebar}>
              <FontAwesomeIcon icon={faHouse} className="nav-icon" /> Home Terminal
            </a>
            <a href="#products" onClick={closeSidebar}>
              <FontAwesomeIcon icon={faBoxesPacking} className="nav-icon" /> Products
            </a>
            <a href="#solutions" onClick={closeSidebar}>
              <FontAwesomeIcon icon={faLightbulb} className="nav-icon" /> Solutions
            </a>
            <a href="#pricing" onClick={closeSidebar}>
              <FontAwesomeIcon icon={faTags} className="nav-icon" /> Pricing
            </a>
            <a href="#resources" onClick={closeSidebar}>
              <FontAwesomeIcon icon={faBookOpen} className="nav-icon" /> Resources
            </a>
          </nav>
        </div>

        {/* Drawer Auth Bottom Strip */}
        <div className="sidebar-bottom-auth">
          <Link to="/login" className="sidebar-auth-btn outline" onClick={closeSidebar}>
            <FontAwesomeIcon icon={faRightToBracket} /> Sign In
          </Link>
          <Link to="/signup" className="sidebar-auth-btn primary" onClick={closeSidebar}>
            <FontAwesomeIcon icon={faUserPlus} /> Get Started
          </Link>
        </div>
      </aside>
    </>
  );
}
