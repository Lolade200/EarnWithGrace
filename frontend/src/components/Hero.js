import React from "react";
import "./Hero.css";

export default function Hero() {
  return (
    <section className="hero" id="hero">
      <div className="hero-container">
        {/* Left side: text content */}
        <div className="hero-content">
          <h1>The Ultimate Online Survey Builder</h1>
          <p>
            EarnWithGrace empowers you to create engaging surveys, collect insights,
            and reward participants instantly — all without writing a single line of code.
          </p>
          <div className="hero-buttons">
            <button className="btn-primary">Start Free Trial</button>
            <button className="btn-outline">Request Demo</button>
          </div>
        </div>

        {/* Right side: image */}
        <div className="hero-image">
          <img
            src="/assets/4996665.jpg"
            alt="Survey dashboard preview"
            className="dashboard-preview"
          />
          
        </div>
      </div>
    </section>
  );
}
