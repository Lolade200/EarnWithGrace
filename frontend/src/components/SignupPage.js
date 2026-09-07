import React, { useState } from "react";
import "./SignupPage.css";
import Footer from "./Footer";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { ref, set } from "firebase/database";
import { auth, db } from "../firebase"; // ✅ make sure firebase.js is in src/
import { useNavigate } from "react-router-dom";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save user details including phone number to Realtime Database
      await set(ref(db, "users/" + user.uid), {
        name,
        email,
        phone,
        createdAt: new Date().toISOString(),
      });

      alert("Signup successful!");
      navigate("/newdashboard");
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        alert("This email is already registered. Please log in instead.");
        navigate("/login");
      } else {
        alert("Error: " + error.message);
      }
    }
  };

  return (
    <section className="signup-section">
      <div className="signup-container">
        <div className="signup-form-column">
          <h2 className="signup-title">Create Your Account</h2>
          <p className="signup-text">
            Sign up today and start earning rewards instantly.
          </p>

          <form className="signup-form" onSubmit={handleSignup}>
            <input
              type="text"
              placeholder="Full Name"
              className="signup-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              type="email"
              placeholder="Email Address"
              className="signup-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="tel"
              placeholder="Phone Number"
              className="signup-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="signup-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit" className="signup-btn">Sign Up</button>
          </form>

          <p className="signup-footer-text">
            Already have an account?{" "}
            <a href="/login" className="signup-link">Log In</a>
          </p>
        </div>

        <div className="signup-image-column">
          <img src="/assets/hhh.jpg" alt="Signup illustration" className="signup-image" />
        </div>
      </div>

      <Footer />
    </section>
  );
}