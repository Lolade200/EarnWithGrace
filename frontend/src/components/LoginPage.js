import React, { useState } from "react";
import "./LoginPage.css";
import Footer from "./Footer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle, faApple } from "@fortawesome/free-brands-svg-icons";
import { faSpinner, faSignInAlt, faShieldHalved } from "@fortawesome/free-solid-svg-icons";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { ref, get } from "firebase/database";
import { auth, db } from "../firebase";
import { useNavigate, Link } from "react-router-dom";

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const resetFeedback = () => setErrorMessage("");

  // Check the Database for role: "admin" OR fallback to primary admin email
  const routeUser = async (user) => {
    try {
      if (!user) return;

      const userRef = ref(db, `users/${user.uid}`);
      const snapshot = await get(userRef);

      let userRole = "user";
      if (snapshot.exists()) {
        const userData = snapshot.val();
        userRole = userData.role || "user";
      }

      // Route to admin if role is 'admin' or matches fallback admin email
      if (
        userRole === "admin" ||
        (user.email && user.email.toLowerCase() === "sa9362673@gmail.com")
      ) {
        navigate("/admin");
      } else {
        navigate("/newdashboard");
      }
    } catch (err) {
      console.error("Error checking user role:", err);
      // Fallback route on database read failure
      navigate("/newdashboard");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    resetFeedback();

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const token = await userCredential.user.getIdToken();
      localStorage.setItem("authToken", token);

      await routeUser(userCredential.user);
    } catch (error) {
      setErrorMessage("Login failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    resetFeedback();
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const token = await result.user.getIdToken();
      localStorage.setItem("authToken", token);

      await routeUser(result.user);
    } catch (error) {
      setErrorMessage("Google sign-in error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    resetFeedback();
    setLoading(true);
    const provider = new OAuthProvider("apple.com");
    try {
      const result = await signInWithPopup(auth, provider);
      const token = await result.user.getIdToken();
      localStorage.setItem("authToken", token);

      await routeUser(result.user);
    } catch (error) {
      setErrorMessage("Apple sign-in error: " + error.message);
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

          <h2 className="login-title">Log In</h2>

          {errorMessage && <div className="signup-error-banner">{errorMessage}</div>}

          <p className="login-text">
            Welcome back! Log in to access your digital assets account.
          </p>

          <div className="login-options">
            <button className="login-btn google" onClick={handleGoogleLogin} disabled={loading}>
              <FontAwesomeIcon icon={faGoogle} /> Log in with Google
            </button>
            <button className="login-btn apple" onClick={handleAppleLogin} disabled={loading}>
              <FontAwesomeIcon icon={faApple} /> Log in with Apple
            </button>

            <div className="login-divider">OR</div>

            <form onSubmit={handleLogin} className="email-login-form">
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
                type="password"
                placeholder="Password"
                className="login-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />

              <button type="submit" className="login-btn email" disabled={loading}>
                <FontAwesomeIcon icon={loading ? faSpinner : faSignInAlt} spin={loading} />
                {loading ? " Logging In..." : " Log In to Account"}
              </button>
            </form>
          </div>

          <div className="login-footer-links">
            <span className="signup-prompt">
              Don't have an account? <Link to="/signup" className="login-link">Sign Up</Link>
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
