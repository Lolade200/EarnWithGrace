import React, { useState } from "react";
import "./LoginPage.css";
import Footer from "./Footer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle, faApple } from "@fortawesome/free-brands-svg-icons";
import { faEnvelope, faSpinner, faUserPlus, faShieldHalved } from "@fortawesome/free-solid-svg-icons";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { ref, set } from "firebase/database";
import { auth, db } from "../firebase";
import { useNavigate, Link } from "react-router-dom";

export default function SignUpPage() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const resetFeedback = () => setErrorMessage("");

  const saveUserToDatabase = async (user, extraData = {}) => {
    const userRef = ref(db, `users/${user.uid}`);
    const payload = {
      uid: user.uid,
      email: user.email ? user.email.toLowerCase() : "",
      fullName: extraData.fullName || user.displayName || "New User",
      phone: extraData.phone || user.phoneNumber || "",
      createdAt: new Date().toISOString(),
      role: "user",
    };
    await set(userRef, payload);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    resetFeedback();

    const cleanEmail = email.trim().toLowerCase();

    if (!fullName || !cleanEmail || !password || !confirmPassword) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      await saveUserToDatabase(userCredential.user, { fullName, phone });

      const token = await userCredential.user.getIdToken();
      localStorage.setItem("authToken", token);

      navigate("/newdashboard");
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        setErrorMessage("An account with this email address already exists.");
      } else {
        setErrorMessage("Registration failed: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    resetFeedback();
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await saveUserToDatabase(result.user);

      const token = await result.user.getIdToken();
      localStorage.setItem("authToken", token);

      navigate("/newdashboard");
    } catch (error) {
      setErrorMessage("Google sign-up error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignUp = async () => {
    resetFeedback();
    setLoading(true);
    const provider = new OAuthProvider("apple.com");
    try {
      const result = await signInWithPopup(auth, provider);
      await saveUserToDatabase(result.user);

      const token = await result.user.getIdToken();
      localStorage.setItem("authToken", token);

      navigate("/newdashboard");
    } catch (error) {
      setErrorMessage("Apple sign-up error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="login-section">
      <div className="login-container">
        {/* LEFT COLUMN: AUTH FORM */}
        <div className="login-form-column">
          <div className="brand-header">
            <div className="brand-logo-box">
              <FontAwesomeIcon icon={faShieldHalved} className="brand-shield-icon" />
            </div>
            <div className="brand-text-details">
              <h1 className="brand-title">EarnWithGrace</h1>
              <p className="brand-tagline">DIGITAL ASSETS PLATFORM</p>
            </div>
          </div>

          <h2 className="login-title">Sign Up</h2>

          {errorMessage && <div className="signup-error-banner">{errorMessage}</div>}

          <p className="login-text">
            By registering below, I agree to the{" "}
            <a href="#terms" className="login-link">Terms of Use</a> and accept the{" "}
            <a href="#privacy" className="login-link">Privacy Policy</a>.
          </p>

          <div className="login-options">
            <form onSubmit={handleSignUp} className="email-login-form">
              <input
                type="text"
                placeholder="Full Name"
                className="login-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={loading}
              />
              <input
                type="email"
                placeholder="Email Address"
                className="login-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
              <input
                type="tel"
                placeholder="Phone Number (e.g., +2348001234567)"
                className="login-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
              />
              <input
                type="password"
                placeholder="Password"
                className="login-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
              <input
                type="password"
                placeholder="Confirm Password"
                className="login-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />

              <button type="submit" className="login-btn email" disabled={loading}>
                <FontAwesomeIcon icon={loading ? faSpinner : faUserPlus} spin={loading} />
                {loading ? " Creating Account..." : " Register Account"}
              </button>
            </form>
          </div>

          <div className="login-footer-links">
            <span className="signup-prompt">
              Already have an account? <Link to="/login" className="login-link">Log In</Link>
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN: SIDE PANEL IMAGE */}
        <div className="login-image-column">
          <img src="/assets/hhh.jpg" alt="Earn with Grace" className="stat-image" />
        </div>
      </div>

      <Footer />
    </section>
  );
}
