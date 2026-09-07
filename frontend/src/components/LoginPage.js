import React, { useState, useEffect, useCallback } from "react";
import "./LoginPage.css";
import Footer from "./Footer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle, faApple } from "@fortawesome/free-brands-svg-icons";
import { faEnvelope, faSpinner } from "@fortawesome/free-solid-svg-icons";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from "firebase/auth";
import { ref, get } from "firebase/database";
import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Primary admin email fallback
  const adminEmail = "sa9362673@gmail.com";

  // Reusable Post-Auth Routing Logic (Database Role + Email Fallback)
  const handlePostLoginRouting = useCallback(async (user) => {
    try {
      const token = await user.getIdToken();
      localStorage.setItem("authToken", token);

      let isAdminUser = user.email === adminEmail;

      // Check Realtime Database for role permission
      if (!isAdminUser) {
        const userSnap = await get(ref(db, `users/${user.uid}`));
        const userData = userSnap.val();
        if (userData && (userData.role === "admin" || userData.isAdmin === true)) {
          isAdminUser = true;
        }
      }

      if (isAdminUser) {
        alert("Admin login successful!");
        navigate("/admin");
      } else {
        alert("Login successful!");
        navigate("/newdashboard");
      }
    } catch (error) {
      console.error("Routing resolution error:", error);
      navigate("/newdashboard");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Handle redirect results (Google/Apple)
  useEffect(() => {
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          await handlePostLoginRouting(result.user);
        }
      })
      .catch((error) => console.error("Redirect error:", error));
  }, [handlePostLoginRouting]);

  // Email Login Handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await handlePostLoginRouting(userCredential.user);
    } catch (error) {
      setLoading(false);
      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password"
      ) {
        alert("Invalid email or password. Please check your credentials.");
      } else {
        alert("Error logging in: " + error.message);
      }
    }
  };

  // Google Login Handler
  const handleGoogleLogin = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await handlePostLoginRouting(result.user);
    } catch (error) {
      if (error.code === "auth/popup-blocked" || error.code === "auth/popup-closed-by-user") {
        console.warn("Popup blocked or closed, switching to redirect:", error);
        await signInWithRedirect(auth, provider);
      } else {
        setLoading(false);
        alert("Google sign-in error: " + error.message);
      }
    }
  };

  // Apple Login Handler
  const handleAppleLogin = async () => {
    setLoading(true);
    const provider = new OAuthProvider("apple.com");
    try {
      const result = await signInWithPopup(auth, provider);
      await handlePostLoginRouting(result.user);
    } catch (error) {
      if (error.code === "auth/popup-blocked" || error.code === "auth/popup-closed-by-user") {
        console.warn("Popup blocked or closed, switching to redirect:", error);
        await signInWithRedirect(auth, provider);
      } else {
        setLoading(false);
        alert("Apple sign-in error: " + error.message);
      }
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
            <button
              className="login-btn google"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <FontAwesomeIcon icon={faGoogle} /> Continue with Google
            </button>

            <button
              className="login-btn apple"
              onClick={handleAppleLogin}
              disabled={loading}
            >
              <FontAwesomeIcon icon={faApple} /> Continue with Apple
            </button>

            <div className="login-divider">OR</div>

            {/* Email login form */}
            <form onSubmit={handleLogin}>
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
                <FontAwesomeIcon icon={loading ? faSpinner : faEnvelope} spin={loading} />
                {loading ? " Logging in..." : " Continue with Email"}
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
          <img src="/assets/hhh.jpg" alt="Gift Cards" className="stat-image" />
        </div>
      </div>

      <Footer />
    </section>
  );
}