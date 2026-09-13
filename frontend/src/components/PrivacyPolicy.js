import React from 'react';

const PrivacyPolicy = () => {
  const policies = [
    {
      id: 1,
      title: 'Data Collection',
      value: 'Encrypted Records',
      image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=800&auto=format&fit=crop',
    },
    {
      id: 2,
      title: 'AdSense & Cookies',
      value: 'Google Policy Compliant',
      image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop',
    },
    {
      id: 3,
      title: 'User Protection',
      value: 'Zero Third-Party Sales',
      image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=800&auto=format&fit=crop',
    },
  ];

  return (
    <section className="animated-section">
      <div className="animated-bg-glow glow-1"></div>
      <div className="animated-bg-glow glow-2"></div>

      <div className="animated-content">
        <div className="animated-header">
          <span className="animated-badge">LEGAL PROTECTION</span>
          <h1 className="animated-title">Privacy Policy</h1>
          <p className="animated-subtitle">
            We value your privacy. Your account details and interaction history are strictly protected. We utilize standard browser cookies and Google AdSense vendor identifiers to personalize and serve contextual ads without compromising your sensitive personal identification.
          </p>
        </div>

        <div className="stats-grid">
          {policies.map((item) => (
            <div className="stat-card" key={item.id}>
              <div className="stat-image-wrapper">
                <img src={item.image} alt={item.title} className="stat-image" />
                <div className="stat-overlay"></div>
                <div className="stat-card-badge">
                  <span className="stat-value">{item.value}</span>
                  <span className="stat-label">{item.title}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PrivacyPolicy;
