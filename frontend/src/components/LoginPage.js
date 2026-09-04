import React, { useState } from "react";
import "./LoginPage.css";
import Footer from "./Footer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle, faApple } from "@fortawesome/free-brands-svg-icons";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, OAuthProvider } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // ✅ Email login
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("Login successful!");
      navigate("/dashboard");
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        alert("No account found with this email. Please sign up first.");
        navigate("/signup");
      } else if (error.code === "auth/wrong-password") {
        alert("Incorrect password. Please try again.");
      } else {
        alert("Error: " + error.message);
      }
    }
  };

  // ✅ Google login
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      alert("Google login successful!");
      navigate("/dashboard");
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  // ✅ Apple login
  const handleAppleLogin = async () => {
    const provider = new OAuthProvider("apple.com");
    try {
      await signInWithPopup(auth, provider);
      alert("Apple login successful!");
      navigate("/dashboard");
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  return (
    <section className="login-section">
      <div className="login-container">
        {/* Left column: form */}
        <div className="login-form-column">
          <h2 className="login-title">Log In</h2>
          <p className="login-text">
            By clicking Log In below, I agree to the{" "}
            <a href="#terms" className="login-link">Terms of Use</a> and accept the{" "}
            <a href="#privacy" className="login-link">Privacy Policy</a>.
          </p>

          <div className="login-options">
            <button className="login-btn google" onClick={handleGoogleLogin}>
              <FontAwesomeIcon icon={faGoogle} /> Continue with Google
            </button>

            <button className="login-btn apple" onClick={handleAppleLogin}>
              <FontAwesomeIcon icon={faApple} /> Continue with Apple
            </button>

            <div className="login-divider">OR</div>

            {/* ✅ Email login form */}
            <form onSubmit={handleLogin}>
              <input
                type="email"
                placeholder="Email Address"
                className="login-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Password"
                className="login-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="submit" className="login-btn email">
                <FontAwesomeIcon icon={faEnvelope} /> Continue with Email
              </button>
            </form>
          </div>

          <p className="login-footer-text">
            Not a member?{" "}
            <a href="/signup" className="login-link">Create an Account</a>
          </p>
        </div>

        {/* Right column: image */}
        <div className="login-image-column">
          <img src="/assets/hhh.jpg" alt="Login illustration" />

        </div>
      </div>

      <Footer />
    </section>
  );
}
