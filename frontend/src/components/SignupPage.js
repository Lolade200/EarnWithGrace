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
  faUser,
  faEye,
  faEyeSlash,
  faShieldHalved,
  faUserPlus
} from "@fortawesome/free-solid-svg-icons";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from "firebase/auth";
import { ref, set, get } from "firebase/database";
import { auth, db } from "../firebase";
import { useNavigate, Link } from "react-router-dom";

export default function SignupPage() {
  const navigate = useNavigate();

  const [method, setMethod] = useState("email");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Phone Signup States
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const adminEmail = "sa9362673@gmail.com";

  const clearFeedback = () => setErrorMessage("");

  const syncDatabaseUser = async (user) => {
    const userRef = ref(db, `users/${user.uid}`);
    const snap = await get(userRef);

    if (!snap.exists()) {
      await set(userRef, {
        uid: user.uid,
        displayName: user.displayName || fullName.trim() || "Nexus Operator",
        email: user.email || email.trim().toLowerCase() || "",
        phone: user.phoneNumber || phone.trim() || "",
        role: user.email === adminEmail ? "admin" : "user",
        createdAt: new Date().toISOString(),
        provider: user.providerData[0]?.providerId || "custom"
      });
    }
  };

  const handlePostSignupRouting = useCallback(
    async (user) => {
      try {
        await syncDatabaseUser(user);
        const token = await user.getIdToken();
        localStorage.setItem("authToken", token);

        navigate(user.email === adminEmail ? "/admin" : "/newdashboard");
      } catch (err) {
        console.error("DB Sync error:", err);
        navigate("/newdashboard");
      } finally {
        setLoading(false);
      }
    },
    [navigate, fullName, email, phone]
  );

  const handleEmailSignup = async (e) => {
    e.preventDefault();
    clearFeedback();

    if (!fullName.trim() || !email || !password) {
      setErrorMessage("Please complete all fields.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const creds = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      await updateProfile(creds.user, { displayName: fullName.trim() });
      await handlePostSignupRouting(creds.user);
    } catch (err) {
      setLoading(false);
      if (err.code === "auth/email-already-in-use") {
        setErrorMessage("An account with this email already exists.");
      } else {
        setErrorMessage("Registration failed: " + err.message);
      }
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

    if (!fullName.trim()) {
      setErrorMessage("Enter your name before requesting OTP.");
      return;
    }

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
      setErrorMessage("OTP dispatch failed: " + err.message);
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
      await updateProfile(res.user, { displayName: fullName.trim() });
      await handlePostSignupRouting(res.user);
    } catch (err) {
      setLoading(false);
      setErrorMessage("Verification code invalid.");
    }
  };

  const handleSocialSignup = async (providerInstance) => {
    clearFeedback();
    setLoading(true);
    try {
      const res = await signInWithPopup(auth, providerInstance);
      await handlePostSignupRouting(res.user);
    } catch (err) {
      if (err.code === "auth/popup-blocked" || err.code === "auth/popup-closed-by-user") {
        await signInWithRedirect(auth, providerInstance);
      } else {
        setLoading(false);
        setErrorMessage("Social registration error: " + err.message);
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
          <h2 className="cyber-title">CREATE ACCOUNT</h2>
          <p className="cyber-subtitle">INITIALIZE USER CREDENTIALS</p>
        </div>

        {errorMessage && <div className="cyber-banner error">{errorMessage}</div>}

        <div className="cyber-social-grid">
          <button className="cyber-social-btn" onClick={() => handleSocialSignup(new GoogleAuthProvider())} disabled={loading}>
            <FontAwesomeIcon icon={faGoogle} /> Google
          </button>
          <button className="cyber-social-btn" onClick={() => handleSocialSignup(new OAuthProvider("apple.com"))} disabled={loading}>
            <FontAwesomeIcon icon={faApple} /> Apple
          </button>
        </div>

        <div className="cyber-divider">
          <span>OR REGISTER WITH</span>
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
          <form onSubmit={handleEmailSignup} className="cyber-form">
            <div className="cyber-input-group">
              <label>Full Name</label>
              <div className="cyber-input-wrapper">
                <FontAwesomeIcon icon={faUser} className="cyber-input-icon" />
                <input
                  type="text"
                  placeholder="John Doe"
                  className="cyber-input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>

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
              <label>Password</label>
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
              {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faUserPlus} />}
              Create Profile
            </button>
          </form>
        ) : (
          <form onSubmit={confirmationResult ? handleVerifyOtp : handleSendOtp} className="cyber-form">
            <div className="cyber-input-group">
              <label>Full Name</label>
              <div className="cyber-input-wrapper">
                <FontAwesomeIcon icon={faUser} className="cyber-input-icon" />
                <input
                  type="text"
                  placeholder="John Doe"
                  className="cyber-input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={Boolean(confirmationResult)}
                  required
                />
              </div>
            </div>

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
                  {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : "Send Code"}
                </button>
              </>
            ) : (
              <>
                <div className="cyber-input-group">
                  <label>Enter 6-Digit Code</label>
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
                  {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : "Complete Registration"}
                </button>
              </>
            )}
          </form>
        )}

        <div className="cyber-footer-note">
          Already registered? <Link to="/login" className="cyber-link-btn">Sign in here</Link>
        </div>
      </div>

      <Footer />
    </section>
  );
}
