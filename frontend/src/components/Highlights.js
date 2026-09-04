import React from "react";
import "./Highlights.css";

const highlights = [
  { icon: "fas fa-chart-line", text: "Real-time analytics right on your phone." },
  { icon: "fas fa-bell", text: "Instant notifications for new responses." },
  { icon: "fas fa-comments", text: "Chat with participants directly in-app." },
  { icon: "fas fa-globe", text: "Offline mode for field surveys anywhere." }
];

export default function Highlights() {
  return (
    <section className="highlights">

      <div className="highlights-row">
        {highlights.map((h, i) => (
          <div key={i} className="highlight-card">
            <i className={h.icon}></i>
            <p>{h.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
