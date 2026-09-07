import React, { useState, useEffect, useCallback } from "react";
import "./LoginPage.css";
import Footer from "./Footer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle, faApple } from "@fortawesome/free-brands-svg-icons";
import { faEnvelope, faSpinner, faPhone, faKey } from "@fortawesome/free-solid-svg-icons";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  sendPasswordResetEmail,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from "firebase/auth";
import { ref, get } from "firebase/database";
import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [loginMethod, setLoginMethod] = useState("email"); // 'email' | 'phone'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Phone Login States
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);

  // Forgot Password States
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const adminEmail = "sa9362673@gmail.com";

  // Reusable Post-Auth Routing Logic
  const handlePostLoginRouting = useCallback(async (user) => {
    try {
      const token = await user.getIdToken();
      localStorage.setItem("authToken", token);

      let isAdminUser = user.email === adminEmail;

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

  useEffect(() => {
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          await handlePostLoginRouting(result.user);
        }
      })
      .catch((error) => console.error("Redirect error:", error));
  }, [handlePostLoginRouting]);

  // Setup reCAPTCHA for phone OTP authentication
  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        callback: () => {},
      });
    }
  };

  // Email Login Handler
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await handlePostLoginRouting(userCredential.user);
    } catch (error) {
      setLoading(false);
      alert("Invalid credentials: " + error.message);
    }
  };

  // Send OTP to Phone Number
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier;
      // Phone number must include country code (e.g., +1234567890)
      const confirmation = await signInWithPhoneNumber(auth, phone, appVerifier);
      setConfirmationResult(confirmation);
      alert("OTP sent to your phone number!");
    } catch (error) {
      alert("Error sending OTP: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Verify Phone OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await confirmationResult.confirm(otp);
      await handlePostLoginRouting(result.user);
    } catch (error) {
      setLoading(false);
      alert("Invalid OTP code: " + error.message);
    }
  };

  // Forgot Password / Reset Link Handler
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      alert("Password reset email sent! Check your inbox.");
      setIsForgotPassword(false);
    } catch (error) {
      alert("Error resetting password: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Social Logins
  const handleGoogleLogin = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await handlePostLoginRouting(result.user);
    } catch (error) {
      if (error.code === "auth/popup-blocked" || error.code === "auth/popup-closed-by-user") {
        await signInWithRedirect(auth, provider);
      } else {
        setLoading(false);
        alert("Google sign-in error: " + error.message);
      }
    }
  };

  const handleAppleLogin = async () => {
    setLoading(true);
    const provider = new OAuthProvider("apple.com");
    try {
      const result = await signInWithPopup(auth, provider);
      await handlePostLoginRouting(result.user);
    } catch (error) {
      if (error.code === "auth/popup-blocked" || error.code === "auth/popup-closed-by-user") {
        await signInWithRedirect(auth, provider);
      } else {
        setLoading(false);
        alert("Apple sign-in error: " + error.message);
      }
    }
  };

  return (
    <section className="login-section">
      <div id="recaptcha-container"></div>
      <div className="login-container">
        <div className="login-form-column">
          <h2 className="login-title">
            {isForgotPassword ? "Reset Password" : "Log In"}
          </h2>

          {!isForgotPassword ? (
            <>
              <p className="login-text">
                By clicking Log In below, I agree to the{" "}
                <a href="#terms" className="login-link">Terms of Use</a> and accept the{" "}
                <a href="#privacy" className="login-link">Privacy Policy</a>.
              </p>

              <div className="login-options">
                <button className="login-btn google" onClick={handleGoogleLogin} disabled={loading}>
                  <FontAwesomeIcon icon={faGoogle} /> Continue with Google
                </button>
                <button className="login-btn apple" onClick={handleAppleLogin} disabled={loading}>
                  <FontAwesomeIcon icon={faApple} /> Continue with Apple
                </button>

                <div className="login-divider">OR</div>

                {/* Tab Switcher for Email vs Phone */}
                <div className="method-toggle">
                  <button
                    type="button"
                    className={`toggle-tab ${loginMethod === "email" ? "active" : ""}`}
                    onClick={() => setLoginMethod("email")}
                  >
                    Email
                  </button>
                  <button
                    type="button"
                    className={`toggle-tab ${loginMethod === "phone" ? "active" : ""}`}
                    onClick={() => setLoginMethod("phone")}
                  >
                    Phone
                  </button>
                </div>

                {/* 1. EMAIL LOGIN FORM */}
                {loginMethod === "email" && (
                  <form onSubmit={handleEmailLogin}>
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
                    <div className="forgot-password-link">
                      <button
                        type="button"
                        className="text-btn"
                        onClick={() => setIsForgotPassword(true)}
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <button type="submit" className="login-btn email" disabled={loading}>
                      <FontAwesomeIcon icon={loading ? faSpinner : faEnvelope} spin={loading} />
                      {loading ? " Logging in..." : " Continue with Email"}
                    </button>
                  </form>
                )}

                {/* 2. PHONE NUMBER LOGIN FORM */}
                {loginMethod === "phone" && (
                  <div>
                    {!confirmationResult ? (
                      <form onSubmit={handleSendOtp}>
                        <input
                          type="tel"
                          placeholder="Phone Number (e.g. +1234567890)"
                          className="login-input"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                          disabled={loading}
                        />
                        <button type="submit" className="login-btn email" disabled={loading}>
                          <FontAwesomeIcon icon={loading ? faSpinner : faPhone} spin={loading} />
                          {loading ? " Sending OTP..." : " Send OTP Code"}
                        </button>
                      </form>
                    ) : (
                      <form onSubmit={handleVerifyOtp}>
                        <input
                          type="text"
                          placeholder="Enter OTP Code"
                          className="login-input"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          required
                          disabled={loading}
                        />
                        <button type="submit" className="login-btn email" disabled={loading}>
                          <FontAwesomeIcon icon={loading ? faSpinner : faKey} spin={loading} />
                          {loading ? " Verifying..." : " Verify & Log In"}
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* 3. FORGOT PASSWORD FORM */
            <form onSubmit={handlePasswordReset}>
              <p className="login-text">
                Enter your email address below and we'll send you a password reset link.
              </p>
              <input
                type="email"
                placeholder="Your Email Address"
                className="login-input"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
                disabled={loading}
              />
              <button type="submit" className="login-btn email" disabled={loading}>
                <FontAwesomeIcon icon={loading ? faSpinner : faEnvelope} spin={loading} />
                {loading ? " Sending..." : " Send Reset Link"}
              </button>
              <button
                type="button"
                className="login-btn secondary-btn"
                onClick={() => setIsForgotPassword(false)}
                style={{ marginTop: "0.5rem" }}
              >
                Back to Login
              </button>
            </form>
          )}

          <p className="login-footer-text">
            Not a member?{" "}
            <a href="/signup" className="login-link">Create an Account</a>
          </p>
        </div>

        <div className="login-image-column">
          <img src="/assets/hhh.jpg" alt="Gift Cards" className="stat-image" />
        </div>
      </div>

      <Footer />
    </section>
  );
}