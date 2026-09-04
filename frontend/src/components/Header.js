import React, { useState } from "react";
import "./Header.css";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <header className="header">
      <div className="logo">EarnWithGrace</div>

      {/* Navigation links */}
      <nav className={`nav-links ${isOpen ? "open" : ""}`}>
        <a href="#products">Products</a>
        <a href="#solutions">Solutions</a>
        <a href="#pricing">Pricing</a>
        <a href="#resources">Resources</a>

        {/* Mobile-only links */}
        <div className="mobile-auth">
          <a href="/login" className="mobile-link">Sign In</a>
          <a href="/signup" className="mobile-link">Get Started</a>
        </div>
      </nav>

      {/* Desktop CTA buttons */}
      <div className="cta-buttons">
        <a href="/Login">
          <button className="btn-outline">Sign In</button>
        </a>
        <a href="/Signup">
          <button className="btn-primary">Get Started</button>
        </a>
      </div>

      {/* Mobile menu toggle */}
      <button className="menu-toggle" onClick={toggleMenu}>
        {isOpen ? "✖" : "☰"}
      </button>
    </header>
  );
}
