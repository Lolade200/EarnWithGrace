import React from 'react';
import Header from "./Header";
import Footer from "./Footer";
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
          <header className="about-header">
            <span className="about-badge">DATA & SURVEY PRIVACY</span>
            <h1 className="about-title">Privacy Policy</h1>
            <p className="about-subtitle">
              Learn how EarnWithGrace collects survey demographics, protects account profile data, and secures instant cash payouts.
            </p>
          </header>

          <main className="legal-card legal-content">
            <section>
              <h2>1. Information We Collect</h2>
              <p>
                To match you with personalized surveys that feel relevant instead of random, EarnWithGrace collects:
              </p>
              <ul>
                <li><strong>Profile & Interest Data:</strong> Age, general location, and consumer preferences used to route matching survey opportunities.</li>
                <li><strong>Survey Responses:</strong> Opinions and feedback provided during active survey tasks.</li>
                <li><strong>Payout Telemetry:</strong> Encrypted financial account indicators (such as PayPal email or direct bank account numbers) required to fulfill instant cash withdrawals.</li>
              </ul>
            </section>

            <section>
              <h2>2. How We Use Survey & Profile Data</h2>
              <p>
                Your data directly powers your terminal experience. We utilize collected information to:
              </p>
              <ul>
                <li>Filter out irrelevant survey tasks and serve matches targeted to your interests.</li>
                <li>Help consumer brands analyze product feedback and improve services based on your opinions.</li>
                <li>Process instant cash rewards immediately upon successful task completion.</li>
              </ul>
            </section>

            <section>
              <h2>3. Data Protection & Encryption</h2>
              <p>
                We employ 256-bit TLS encryption protocols across the EarnWithGrace Enterprise Terminal. Your survey activity and financial withdrawal details are processed through secure end-to-end encrypted layers.
              </p>
            </section>

            <section>
              <h2>4. Third-Party Sharing & Brand Analytics</h2>
              <p>
                Survey responses submitted on EarnWithGrace are aggregated and anonymized before being shared with partner brands. We never sell or share your unencrypted payment details or personal identifying information with external survey providers.
              </p>
            </section>

            <section>
              <h2>5. User Rights & Data Eradication</h2>
              <p>
                You retain complete control over your survey profile. You may request account deletion, payout detail removal, or profile preference updates at any time via your dashboard settings or support operations.
              </p>
            </section>
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}
