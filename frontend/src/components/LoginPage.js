import React, { useState, useCallback } from "react";
import "./LoginPage.css";
import Footer from "./Footer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle, faApple } from "@fortawesome/free-brands-svg-icons";
import {
  faEnvelope,
  faSpinner,
  faPhone,
  faKey,
  faLock,
  faEye,
  faEyeSlash,
  faShieldHalved,
  faRightToBracket
} from "@fortawesome/free-solid-svg-icons";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signOut
} from "firebase/auth";
import { ref, get, child } from "firebase/database";
import { auth, db } from "../firebase";
import { useNavigate, Link } from "react-router-dom";

export default function LoginPage() {
  const navigate = useNavigate();

  const [method, setMethod] = useState("email"); // 'email' | 'phone'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Phone Authentication States
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);

  // Loading & Feedback
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const adminEmail = "sa9362673@gmail.com";

  const clearFeedback = () => setErrorMessage("");

  const handlePostLoginRouting = useCallback(
    async (user) => {
      try {
        const userSnap = await get(ref(db, `users/${user.uid}`));
        const userData = userSnap.val();

        let userInDb = Boolean(userData);
        if (!userInDb) {
          const allUsersSnap = await get(child(ref(db), "users"));
          if (allUsersSnap.exists()) {
            userInDb = Object.values(allUsersSnap.val()).some(
              (u) => u.uid === user.uid || (u.email && u.email.toLowerCase() === user.email?.toLowerCase())
            );
          }
        }

        if (!userInDb) {
          await signOut(auth);
          setErrorMessage("Account not registered. Please create an account first.");
          setLoading(false);
          return;
        }

        const token = await user.getIdToken();
        localStorage.setItem("authToken", token);

        const isAdmin = user.email === adminEmail || userData?.role === "admin" || userData?.isAdmin === true;
        navigate(isAdmin ? "/admin" : "/newdashboard");
      } catch (err) {
        console.error("Routing error:", err);
        navigate("/newdashboard");
      } finally {
        setLoading(false);
      }
    },
    [navigate]
  );

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    clearFeedback();

    if (!email || !password) {
      setErrorMessage("Please fill in both email and password.");
      return;
    }

    setLoading(true);
    try {
      const creds = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      await handlePostLoginRouting(creds.user);
    } catch (err) {
      setLoading(false);
      setErrorMessage("Invalid email or password. Please verify your credentials.");
    }
  };

  const setupRecaptcha = () => {
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
    }
    window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible"
    });
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    clearFeedback();

    if (!phone.startsWith("+")) {
      setErrorMessage("Include country code starting with '+' (e.g. +16505551234).");
      return;
    }

    setLoading(true);
    try {
      setupRecaptcha();
      const confirmation = await signInWithPhoneNumber(auth, phone.trim(), window.recaptchaVerifier);
      setConfirmationResult(confirmation);
    } catch (err) {
      setErrorMessage("Failed to send OTP code: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    clearFeedback();

    if (otp.length < 6) {
      setErrorMessage("Enter the 6-digit verification code.");
      return;
    }

    setLoading(true);
    try {
      const res = await confirmationResult.confirm(otp.trim());
      await handlePostLoginRouting(res.user);
    } catch (err) {
      setLoading(false);
      setErrorMessage("Invalid code. Please try again.");
    }
  };

  const handleSocialLogin = async (providerInstance) => {
    clearFeedback();
    setLoading(true);
    try {
      const res = await signInWithPopup(auth, providerInstance);
      await handlePostLoginRouting(res.user);
    } catch (err) {
      if (err.code === "auth/popup-blocked" || err.code === "auth/popup-closed-by-user") {
        await signInWithRedirect(auth, providerInstance);
      } else {
        setLoading(false);
        setErrorMessage("Social login error: " + err.message);
      }
    }
  };

  return (
    <section className="cyber-auth-wrapper">
      <div id="recaptcha-container"></div>

      <div className="cyber-auth-container">
        <div className="cyber-brand">
          <div className="cyber-logo-ring">
            <FontAwesomeIcon icon={faShieldHalved} />
          </div>
          <h2 className="cyber-title">EWG NEXUS</h2>
          <p className="cyber-subtitle">TERMINAL ACCESS PORTAL</p>
        </div>

        {errorMessage && <div className="cyber-banner error">{errorMessage}</div>}

        <div className="cyber-social-grid">
          <button className="cyber-social-btn" onClick={() => handleSocialLogin(new GoogleAuthProvider())} disabled={loading}>
            <FontAwesomeIcon icon={faGoogle} /> Google
          </button>
          <button className="cyber-social-btn" onClick={() => handleSocialLogin(new OAuthProvider("apple.com"))} disabled={loading}>
            <FontAwesomeIcon icon={faApple} /> Apple
          </button>
        </div>

        <div className="cyber-divider">
          <span>OR SIGN IN WITH</span>
        </div>

        <div className="cyber-tab-group">
          <button
            type="button"
            className={`cyber-tab ${method === "email" ? "active" : ""}`}
            onClick={() => { setMethod("email"); setConfirmationResult(null); clearFeedback(); }}
          >
            <FontAwesomeIcon icon={faEnvelope} /> Email
          </button>
          <button
            type="button"
            className={`cyber-tab ${method === "phone" ? "active" : ""}`}
            onClick={() => { setMethod("phone"); clearFeedback(); }}
          >
            <FontAwesomeIcon icon={faPhone} /> Phone
          </button>
        </div>

        {method === "email" ? (
          <form onSubmit={handleEmailLogin} className="cyber-form">
            <div className="cyber-input-group">
              <label>Email Address</label>
              <div className="cyber-input-wrapper">
                <FontAwesomeIcon icon={faEnvelope} className="cyber-input-icon" />
                <input
                  type="email"
                  placeholder="operator@nexus.com"
                  className="cyber-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="cyber-input-group">
              <div className="cyber-flex-row">
                <label>Password</label>
                <Link to="/forgot-password" className="cyber-link-btn">Forgot?</Link>
              </div>
              <div className="cyber-input-wrapper">
                <FontAwesomeIcon icon={faLock} className="cyber-input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="cyber-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="cyber-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                </button>
              </div>
            </div>

            <button type="submit" className="cyber-btn-primary" disabled={loading}>
              {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faRightToBracket} />}
              Authenticate
            </button>
          </form>
        ) : (
          <form onSubmit={confirmationResult ? handleVerifyOtp : handleSendOtp} className="cyber-form">
            {!confirmationResult ? (
              <>
                <div className="cyber-input-group">
                  <label>Mobile Number (With Country Code)</label>
                  <div className="cyber-input-wrapper">
                    <FontAwesomeIcon icon={faPhone} className="cyber-input-icon" />
                    <input
                      type="tel"
                      placeholder="+1 650 555 1234"
                      className="cyber-input"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="cyber-btn-primary" disabled={loading}>
                  {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : "Request Verification Code"}
                </button>
              </>
            ) : (
              <>
                <div className="cyber-input-group">
                  <label>Enter 6-Digit Verification Code</label>
                  <div className="cyber-input-wrapper">
                    <FontAwesomeIcon icon={faKey} className="cyber-input-icon" />
                    <input
                      type="text"
                      placeholder="123456"
                      maxLength="6"
                      className="cyber-input"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="cyber-btn-primary" disabled={loading}>
                  {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : "Confirm Access Code"}
                </button>
              </>
            )}
          </form>
        )}

        <div className="cyber-footer-note">
          Need an account? <Link to="/signup" className="cyber-link-btn">Register here</Link>
        </div>
      </div>

      <Footer />
    </section>
  );
}
