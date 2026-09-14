import React from 'react';
import './LegalAndContact.css';

export default function TermsOfService() {
  return (
    <div className="about-page-wrapper" id="terms">
      <div className="about-section">
        {/* Ambient Glowing Background Orbs */}
        <div className="about-bg-glow glow-1"></div>
        <div className="about-bg-glow glow-2"></div>
        <div className="about-bg-glow glow-3"></div>

        <div className="about-container">
          {/* Header */}
          <header className="about-header">
            <span className="about-badge">USER AGREEMENT</span>
            <h1 className="about-title">Terms of Service</h1>
            <p className="about-subtitle">
              Please read these terms carefully before utilizing our futuristic suite of applications and APIs.
            </p>
          </header>

          {/* Terms Content Card */}
          <main className="legal-card legal-content">
            <section>
              <h2>1. Acceptance of Terms</h2>
              <p>
                By accessing or using our services, dashboard system, or linked tools, you agree to be bound by these Terms of Service. If you do not agree to all terms, you must cease platform access immediately.
              </p>
            </section>

            <section>
              <h2>2. Account Responsibilities</h2>
              <p>
                You are responsible for maintaining the confidentiality of your credentials and account access. Any operations performed under your key or login fall under your direct responsibility.
              </p>
            </section>

            <section>
              <h2>3. Acceptable Use Policy</h2>
              <p>
                You agree not to use the service for any unlawful activities, including:
              </p>
              <ul>
                <li>Reverse engineering application architecture or neural engines.</li>
                <li>Injecting malicious scripts, botnets, or unauthorized telemetry probes.</li>
                <li>Attempting unauthorized escalation of system privileges.</li>
              </ul>
            </section>

            <section>
              <h2>4. Intellectual Property</h2>
              <p>
                All interface code, dashboard designs, visual art assets, branding, and algorithms remain the exclusive intellectual property of the organization.
              </p>
            </section>

            <section>
              <h2>5. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, the platform and its operators shall not be liable for indirect, incidental, or consequential damages resulting from lost data or service interruptions.
              </p>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
