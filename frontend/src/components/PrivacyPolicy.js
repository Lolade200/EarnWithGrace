import React from 'react';
import Header from "./Header";
import './LegalAndContact.css';

export default function PrivacyPolicy() {
  return (
    <div className="about-page-wrapper" id="privacy">
      <Header />
      <div className="about-section">
        {/* Ambient Glowing Background Orbs */}
        <div className="about-bg-glow glow-1"></div>
        <div className="about-bg-glow glow-2"></div>
        <div className="about-bg-glow glow-3"></div>

        <div className="about-container">
          {/* Header */}
          <header className="about-header">
            <span className="about-badge">LEGAL COMPLIANCE</span>
            <h1 className="about-title">Privacy Policy</h1>
            <p className="about-subtitle">
              Learn how we handle, protect, and encrypt your digital footprint.
            </p>
          </header>

          {/* Policy Content Card */}
          <main className="legal-card legal-content">
            <section>
              <h2>1. Information We Collect</h2>
              <p>
                We collect personal information that you provide directly to us when registering, updating your profile, or utilizing our telemetry dashboard tools. This may include email address, usage metrics, device information, and encrypted access tokens.
              </p>
            </section>

            <section>
              <h2>2. How We Use Your Data</h2>
              <p>
                Your data powers your personalized experience. We utilize collected information to:
              </p>
              <ul>
                <li>Maintain, optimize, and analyze platform performance.</li>
                <li>Secure your account against unauthorized neural-link and unauthorized network access.</li>
                <li>Send technical alerts, updates, and customer support communications.</li>
              </ul>
            </section>

            <section>
              <h2>3. Data Protection & Security</h2>
              <p>
                We employ quantum-grade 256-bit encryption protocols to protect your personal information. Data transmission across servers occurs entirely through secure, encrypted TLS layers.
              </p>
            </section>

            <section>
              <h2>4. Third-Party Sharing</h2>
              <p>
                We do not sell, trade, or rent your personal identification data to third parties. We may share anonymous aggregated demographic information with trusted analytical partners.
              </p>
            </section>

            <section>
              <h2>5. Your Rights & Control</h2>
              <p>
                You retain complete control over your data. You may request access, modification, or complete erasure of your platform records at any time via your dashboard settings or by contacting privacy operations.
              </p>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
