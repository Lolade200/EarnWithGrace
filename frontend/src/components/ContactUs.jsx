import React, { useState } from 'react';
import './LegalAndContact.css';

export default function ContactUs() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Message transmitted successfully!');
    setFormData({ name: '', email: '', message: '' });
  };

  return (
    <div className="about-page-wrapper" id="Contact">
      <div className="about-section">
        {/* Ambient Glowing Background Orbs */}
        <div className="about-bg-glow glow-1"></div>
        <div className="about-bg-glow glow-2"></div>
        <div className="about-bg-glow glow-3"></div>

        <div className="about-container">
          {/* Header */}
          <header className="about-header">
            <span className="about-badge">GET IN TOUCH</span>
            <h1 className="about-title">Contact Us</h1>
            <p className="about-subtitle">
              Have a question or want to collaborate? Send a signal into our inbox.
            </p>
          </header>

          <main className="contact-grid">
            {/* Info Box */}
            <div className="pillar-card">
              <div className="pillar-icon-box">✉</div>
              <h3>Reach Out Direct</h3>
              <p>Our communications team is online 24/7 to process your queries.</p>
              
              <div className="contact-info-list">
                <div className="contact-info-item">
                  <div className="pillar-icon-box" style={{ width: 38, height: 38, fontSize: '1rem', margin: 0 }}>📍</div>
                  <div>
                    <h4 style={{ fontSize: '0.9rem', color: 'var(--ab-text-main)' }}>Location</h4>
                    <p style={{ fontSize: '0.85rem' }}>Sector 7 Cyber District, Neo-City</p>
                  </div>
                </div>

                <div className="contact-info-item">
                  <div className="pillar-icon-box" style={{ width: 38, height: 38, fontSize: '1rem', margin: 0 }}>📧</div>
                  <div>
                    <h4 style={{ fontSize: '0.9rem', color: 'var(--ab-text-main)' }}>Email</h4>
                    <p style={{ fontSize: '0.85rem' }}>support@dashboard2054.io</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Box */}
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
                  <label htmlFor="email">EMAIL ADDRESS</label>
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
                  <label htmlFor="message">MESSAGE</label>
                  <textarea
                    id="message"
                    name="message"
                    className="form-input"
                    placeholder="Describe your inquiry..."
                    value={formData.message}
                    onChange={handleChange}
                    required
                  ></textarea>
                </div>

                <button type="submit" className="about-cta-btn" style={{ border: 'none', cursor: 'pointer', width: '100%', justifyContent: 'center' }}>
                  Transmit Signal ➔
                </button>
              </form>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
