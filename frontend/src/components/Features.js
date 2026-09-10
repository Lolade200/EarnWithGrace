import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartPie,
  faBolt,
  faGift,
  faPeopleGroup,
  faMobileScreenButton
} from "@fortawesome/free-solid-svg-icons";
import "./Features.css";

const features = [
  { 
    icon: faChartPie, 
    title: "Surveys", 
    desc: "Personalized surveys matched to your interests. Share your opinions on everyday products and services, influence how brands improve, and enjoy surveys that feel relevant instead of random." 
  },
  { 
    icon: faBolt, 
    title: "Instant Cash", 
    desc: "Withdraw earnings directly to PayPal or bank. No waiting periods or hidden fees — your rewards are available as soon as you complete tasks, giving you real financial flexibility." 
  },
  { 
    icon: faGift, 
    title: "Gift Cards", 
    desc: "Redeem vouchers for top online brands. From fashion to tech, choose rewards that fit your lifestyle and enjoy exclusive perks from trusted retailers." 
  },
  { 
    icon: faPeopleGroup, 
    title: "Community Impact", 
    desc: "Your feedback helps shape better products and services for everyone. Every survey you complete contributes to meaningful improvements in the marketplace." 
  },
  { 
    icon: faMobileScreenButton, 
    title: "Flexible Participation", 
    desc: "Take surveys anytime, anywhere — on mobile or desktop. Whether you have five minutes or an hour, you can earn rewards at your own pace." 
  }
];

export default function Features() {
  return (
    <section className="features-section" id="products">
      <div className="features-header">
        <span className="features-badge">PLATFORM CAPABILITIES</span>
        <h2 className="features-title">Why EarnWithGrace?</h2>
        <p className="features-subtitle">
          Empowering your opinion with real financial value and seamless digital rewards.
        </p>
      </div>

      <div className="features-grid">
        {features.map((f, i) => (
          <div key={i} className="feature-card">
            <div className="feature-card-glow"></div>
            <div className="feature-icon-wrapper">
              <FontAwesomeIcon icon={f.icon} />
            </div>
            <h3 className="feature-card-title">{f.title}</h3>
            <p className="feature-card-desc">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
