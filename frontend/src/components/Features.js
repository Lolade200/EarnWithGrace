import React from "react";
import "./Features.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChartPie, faBolt, faGift } from "@fortawesome/free-solid-svg-icons";

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
    icon: faChartPie, 
    title: "Community Impact", 
    desc: "Your feedback helps shape better products and services for everyone. Every survey you complete contributes to meaningful improvements in the marketplace." 
  },
  { 
    icon: faBolt, 
    title: "Flexible Participation", 
    desc: "Take surveys anytime, anywhere — on mobile or desktop. Whether you have five minutes or an hour, you can earn rewards at your own pace." 
  }
];


export default function Features() {
  return (
    <section className="features">
      <h2>Why EarnWithGrace?</h2>
      <div className="feature-grid">
        {features.map((f, i) => (
          <div key={i} className="feature-card">
            <div className="icon">
              <FontAwesomeIcon icon={f.icon} size="2x" />
            </div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}