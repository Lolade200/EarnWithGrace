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
  signInWithPhoneNumber,
} from "firebase/auth";
import { ref, get, child } from "firebase/database";
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

  // Status & Feedback States
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const navigate = useNavigate();
  const adminEmail = "sa9362673@gmail.com";

  // Clear messages when switching tabs or views
  const resetFeedback = () => {
    setErrorMessage("");
    setSuccessMessage("");
  };

  // Reusable Post-Auth Routing Logic
  const handlePostLoginRouting = useCallback(
    async (user) => {
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
          navigate("/admin");
        } else {
          navigate("/newdashboard");
        }
      } catch (error) {
        console.error("Routing resolution error:", error);
        navigate("/newdashboard");
      } finally {
        setLoading(false);
      }
    },
    [navigate]
  );

  useEffect(() => {
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          await handlePostLoginRouting(result.user);
        }
      })
      .catch((error) => setErrorMessage("Redirect sign-in error: " + error.message));
  }, [handlePostLoginRouting]);

  // Setup reCAPTCHA for phone OTP authentication
  const setupRecaptcha = () => {
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
    }

    window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible",
      callback: () => {},
      "expired-callback": () => {
        setErrorMessage("reCAPTCHA expired. Please try requesting the OTP code again.");
      },
    });
  };

  // Email Login Handler
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    resetFeedback();

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setErrorMessage("Please fill in both email and password.");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      await handlePostLoginRouting(userCredential.user);
    } catch (error) {
      setLoading(false);
      console.error("Email Login Error:", error.code);
      
      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        setErrorMessage("Invalid email or password. Please check your credentials and try again.");
      } else if (error.code === "auth/too-many-requests") {
        setErrorMessage("Access disabled temporarily due to many failed attempts. Try resetting your password or wait a moment.");
      } else {
        setErrorMessage("Login failed: " + error.message);
      }
    }
  };

  // Send OTP to Phone Number (With Pre-validation)
  const handleSendOtp = async (e) => {
    e.preventDefault();
    resetFeedback();

    const formattedPhone = phone.trim().replace(/\s+/g, "");

    if (!formattedPhone.startsWith("+")) {
      setErrorMessage("Please include country code starting with '+' (e.g., +2348001234567 or +16505551234).");
      return;
    }

    setLoading(true);

    try {
      // Check Realtime Database to verify phone number exists before sending OTP
      const dbRef = ref(db);
      const snapshot = await get(child(dbRef, "users"));

      let phoneExists = false;
      if (snapshot.exists()) {
        const usersData = snapshot.val();
        phoneExists = Object.values(usersData).some(
          (user) => user.phone && user.phone.trim().replace(/\s+/g, "") === formattedPhone
        );
      }

      if (!phoneExists) {
        setErrorMessage("This phone number is not registered with any account. Please sign up first.");
        setLoading(false);
        return;
      }

      // Initialize reCAPTCHA and request OTP
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier;
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      
      setConfirmationResult(confirmation);
      setSuccessMessage("OTP code sent successfully to " + formattedPhone);
    } catch (error) {
      console.error("Phone Auth Error:", error);
      if (window.grecaptcha && window.recaptchaVerifier) {
        window.recaptchaVerifier.render().then((widgetId) => {
          window.grecaptcha.reset(widgetId);
        });
      }
      setErrorMessage("Error sending OTP: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Verify Phone OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    resetFeedback();

    if (!otp || otp.length < 6) {
      setErrorMessage("Please enter the complete 6-digit verification code.");
      return;
    }

    setLoading(true);
    try {
      const result = await confirmationResult.confirm(otp.trim());
      await handlePostLoginRouting(result.user);
    } catch (error) {
      setLoading(false);
      setErrorMessage("Invalid or expired OTP code. Please try again.");
    }
  };

  // Forgot Password Handler
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    resetFeedback();

    const cleanEmail = resetEmail.trim().toLowerCase();

    if (!cleanEmail) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      setSuccessMessage("Password reset email sent! Check your inbox.");
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        setErrorMessage("No account exists with this email address.");
      } else {
        setErrorMessage("Error resetting password: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Google Login Handler
  const handleGoogleLogin = async () => {
    resetFeedback();
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
        setErrorMessage("Google sign-in error: " + error.message);
      }
    }
  };

  // Apple Login Handler
  const handleAppleLogin = async () => {
    resetFeedback();
    setLoading(true);
    const provider = new OAuthProvider("apple.com");
    provider.addScope("email");
    provider.addScope("name");

    try {
      const result = await signInWithPopup(auth, provider);
      await handlePostLoginRouting(result.user);
    } catch (error) {
      if (error.code === "auth/popup-blocked" || error.code === "auth/popup-closed-by-user") {
        await signInWithRedirect(auth, provider);
      } else {
        setLoading(false);
        setErrorMessage("Apple sign-in error: " + error.message);
      }
    }
  };

  return (
    <section className="login-section">
      <div id="recaptcha-container"></div>
      <div className="login-container">
        {/* LEFT COLUMN: AUTH FORM */}
        <div className="login-form-column">
          <h2 className="login-title">
            {isForgotPassword ? "Reset Password" : "Log In"}
          </h2>

          {/* Feedback Banners */}
          {errorMessage && (
            <div className="signup-error-banner">
              {errorMessage}
            </div>
          )}
          {successMessage && (
            <div className="login-success-banner">
              {successMessage}
            </div>
          )}

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
                    onClick={() => {
                      setLoginMethod("email");
                      setConfirmationResult(null);
                      resetFeedback();
                    }}
                  >
                    Email
                  </button>
                  <button
                    type="button"
                    className={`toggle-tab ${loginMethod === "phone" ? "active" : ""}`}
                    onClick={() => {
                      setLoginMethod("phone");
                      resetFeedback();
                    }}
                  >
                    Phone
                  </button>
                </div>

                {/* 1. EMAIL LOGIN FORM */}
                {loginMethod === "email" && (
                  <form onSubmit={handleEmailLogin} className="email-login-form">
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
                )}

                {/* 2. PHONE NUMBER LOGIN FORM */}
                {loginMethod === "phone" && (
                  <div>
                    {!confirmationResult ? (
                      <form onSubmit={handleSendOtp} className="phone-login-form">
                        <input
                          type="tel"
                          placeholder="Phone Number (e.g. +2348001234567)"
                          className="login-input"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                          disabled={loading}
                        />
                        <button type="submit" className="login-btn email" disabled={loading}>
                          <FontAwesomeIcon icon={loading ? faSpinner : faPhone} spin={loading} />
                          {loading ? " Verifying & Sending..." : " Send OTP Code"}
                        </button>
                      </form>
                    ) : (
                      <form onSubmit={handleVerifyOtp} className="phone-login-form">
                        <input
                          type="text"
                          placeholder="Enter 6-digit OTP Code"
                          className="login-input"
                          maxLength={6}
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          required
                          disabled={loading}
                        />
                        <button type="submit" className="login-btn email" disabled={loading}>
                          <FontAwesomeIcon icon={loading ? faSpinner : faKey} spin={loading} />
                          {loading ? " Verifying..." : " Verify & Log In"}
                        </button>

                        <button
                          type="button"
                          className="text-btn"
                          style={{ marginTop: "0.75rem", display: "block", width: "100%", textAlign: "center" }}
                          onClick={() => {
                            setConfirmationResult(null);
                            setOtp("");
                            resetFeedback();
                          }}
                        >
                          Edit Phone Number
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
                onClick={() => {
                  setIsForgotPassword(false);
                  resetFeedback();
                }}
                style={{ marginTop: "0.5rem" }}
              >
                Back to Login
              </button>
            </form>
          )}

          {/* COMBINED FOOTER LINKS */}
          {!isForgotPassword && (
            <div className="login-footer-links">
              {loginMethod === "email" && (
                <>
                  <button
                    type="button"
                    className="footer-link-btn"
                    onClick={() => {
                      setIsForgotPassword(true);
                      resetFeedback();
                    }}
                  >
                    Forgot Password?
                  </button>
                  <span className="dot-separator">•</span>
                </>
              )}
              <span className="signup-prompt">
                Not a member? <a href="/signup" className="login-link">Create an Account</a>
              </span>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: SIDE PANEL */}
        <div className="login-image-column">
          <img src="/assets/hhh.jpg" alt="Gift Cards" className="stat-image" />
        </div>
      </div>

      <Footer />
    </section>
  );
}