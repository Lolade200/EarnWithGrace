import React, { useState } from 'react';
import Header from "./Header";
import Footer from "./Footer";
import './LegalAndContact.css';

export default function ContactUs() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: 'Survey Inquiry', message: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Signal transmitted to EarnWithGrace Support Desk!');
    setFormData({ name: '', email: '', subject: 'Survey Inquiry', message: '' });
  };

  return (
    <div className="about-page-wrapper" id="Contact">
      <Header />
      <div className="about-section">
        {/* Ambient Glowing Background Orbs */}
        <div className="about-bg-glow glow-1"></div>
        <div className="about-bg-glow glow-2"></div>
        <div className="about-bg-glow glow-3"></div>

        <div className="about-container">
          <header className="about-header">
            <span className="about-badge">TERMINAL SUPPORT DESK</span>
            <h1 className="about-title">Contact Support</h1>
            <p className="about-subtitle">
              Need assistance with survey matches, missing task rewards, or instant PayPal and bank cash withdrawals? Reach out to us.
            </p>
          </header>

          <main className="contact-grid">
            {/* Direct Info Card */}
            <div className="pillar-card">
              <div className="pillar-icon-box">⚡</div>
              <h3>EarnWithGrace Desk</h3>
              <p>Our terminal operations team monitors support channels to resolve payout and survey routing issues rapidly.</p>
              
              <div className="contact-info-list">
                <div className="contact-info-item">
                  <div className="pillar-icon-box" style={{ width: 38, height: 38, fontSize: '1rem', margin: 0 }}>📧</div>
                  <div>
                    <h4 style={{ fontSize: '0.9rem', color: 'var(--ab-text-main)' }}>Support Email</h4>
                    <p style={{ fontSize: '0.85rem' }}>support@earnwithgrace.com</p>
                  </div>
                </div>

                <div className="contact-info-item">
                  <div className="pillar-icon-box" style={{ width: 38, height: 38, fontSize: '1rem', margin: 0 }}>📞</div>
                  <div>
                    <h4 style={{ fontSize: '0.9rem', color: 'var(--ab-text-main)' }}>Direct Line</h4>
                    <p style={{ fontSize: '0.85rem' }}>+234 704 460 5404</p>
                  </div>
                </div>

                <div className="contact-info-item">
                  <div className="pillar-icon-box" style={{ width: 38, height: 38, fontSize: '1rem', margin: 0 }}>🛡️</div>
                  <div>
                    <h4 style={{ fontSize: '0.9rem', color: 'var(--ab-text-main)' }}>Payout Verification</h4>
                    <p style={{ fontSize: '0.85rem' }}>Automated Instant Settlement Protocol</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Support Ticket Form */}
            <div className="pillar-card">
              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-group">
                  <label htmlFor="name">NAME</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="form-input"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">ACCOUNT EMAIL</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="form-input"
                    placeholder="name@domain.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="subject">CATEGORY</label>
                  <select
                    id="subject"
                    name="subject"
                    className="form-input"
                    value={formData.subject}
                    onChange={handleChange}
                  >
                    <option value="Survey Inquiry">Survey Matching Issue</option>
                    <option value="Instant Cash Issue">Instant Cash / Withdrawal Issue</option>
                    <option value="Account Security">Account & Security Inquiry</option>
                    <option value="General Support">General Terminal Query</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="message">MESSAGE</label>
                  <textarea
                    id="message"
                    name="message"
                    className="form-input"
                    placeholder="Describe your issue or transaction inquiry..."
                    value={formData.message}
                    onChange={handleChange}
                    required
                  ></textarea>
                </div>

                <button type="submit" className="about-cta-btn" style={{ border: 'none', cursor: 'pointer', width: '100%', justifyContent: 'center' }}>
                  Submit Support Ticket ➔
                </button>
              </form>
            </div>
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}
