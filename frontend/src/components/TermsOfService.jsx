import React from 'react';
import Header from "./Header";
import Footer from "./Footer";
import './LegalAndContact.css';

export default function TermsOfService() {
  return (
    <div className="about-page-wrapper" id="terms">
      <Header />
      <div className="about-section">
        {/* Ambient Glowing Background Orbs */}
        <div className="about-bg-glow glow-1"></div>
        <div className="about-bg-glow glow-2"></div>
        <div className="about-bg-glow glow-3"></div>

        <div className="about-container">
          <header className="about-header">
            <span className="about-badge">ENTERPRISE TERMINAL RULES</span>
            <h1 className="about-title">Terms of Service</h1>
            <p className="about-subtitle">
              User guidelines governing survey participation, instant cash reward settlements, and account verification on EarnWithGrace.
            </p>
          </header>

          <main className="legal-card legal-content">
            <section>
              <h2>1. Acceptance of Terms</h2>
              <p>
                By accessing the EarnWithGrace Enterprise Terminal, completing surveys, or requesting cash withdrawals, you agree to comply with these Terms of Service.
              </p>
            </section>

            <section>
              <h2>2. Instant Cash Payout Policy</h2>
              <p>
                EarnWithGrace provides instant cash rewards without waiting periods or hidden fees. By requesting a withdrawal:
              </p>
              <ul>
                <li>You confirm that all receiving payment details (PayPal email or direct bank account) belong strictly to you.</li>
                <li>Payouts are disbursed immediately as soon as a task is validated by the system.</li>
                <li>You acknowledge that third-party processing delays (e.g., bank networks or PayPal system maintenance) are beyond our direct control.</li>
              </ul>
            </section>

            <section>
              <h2>3. Acceptable Use & Fair Survey Integrity</h2>
              <p>
                To maintain high-quality insights for partner brands, you agree not to engage in forbidden activity, including:
              </p>
              <ul>
                <li>Using automated bots, scripts, or proxies to manipulate survey completion.</li>
                <li>Providing false, misleading, or contradictory survey answers to artificially hoard rewards.</li>
                <li>Creating multiple terminal accounts to exploit instant withdrawal limits.</li>
              </ul>
            </section>

            <section>
              <h2>4. Account Suspension & Reward Forfeiture</h2>
              <p>
                Any account detected violating fair survey usage or attempting fraudulent instant cash withdrawals will face immediate terminal suspension and forfeiture of unverified balance.
              </p>
            </section>

            <section>
              <h2>5. Platform Limitation of Liability</h2>
              <p>
                EarnWithGrace is not liable for temporary survey partner outages, third-party API interruptions, or incorrect payment routing caused by user-submitted withdrawal details.
              </p>
            </section>
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}
