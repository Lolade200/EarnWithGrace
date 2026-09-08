import React, { useState, useEffect, useCallback } from "react";
import "./LoginPage.css";
import Footer from "./Footer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle, faApple } from "@fortawesome/free-brands-svg-icons";
import { faEnvelope, faSpinner, faPhone, faKey, faMobileAlt } from "@fortawesome/free-solid-svg-icons";
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
  signOut,
} from "firebase/auth";
import { ref, get, child } from "firebase/database";
import { auth, db } from "../firebase";
import { useNavigate, useLocation, Link } from "react-router-dom";

export default function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [loginMethod, setLoginMethod] = useState("email"); // 'email' | 'phone'
  const [email, setEmail] = useState(location.state?.resetEmail || "");
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

  const adminEmail = "sa9362673@gmail.com";

  // Check if routed from password reset with state
  useEffect(() => {
    if (location.state?.resetEmail) {
      setSuccessMessage("Password reset successful! Please log in with your new password.");
    }
  }, [location.state]);

  // Clear messages when switching tabs or views
  const resetFeedback = () => {
    setErrorMessage("");
    setSuccessMessage("");
  };

  // Reusable Post-Auth Routing Logic with DB validation check
  const handlePostLoginRouting = useCallback(
    async (user) => {
      try {
        const userSnap = await get(ref(db, `users/${user.uid}`));
        const userData = userSnap.val();

        // Check if database user profile exists or if users list contains this user
        let userInDb = false;
        if (userData) {
          userInDb = true;
        } else {
          // Fallback check: look through users collection by UID or email
          const dbRef = ref(db);
          const allUsersSnap = await get(child(dbRef, "users"));
          if (allUsersSnap.exists()) {
            const usersData = allUsersSnap.val();
            userInDb = Object.values(usersData).some(
              (u) =>
                u.uid === user.uid ||
                (u.email && user.email && u.email.toLowerCase() === user.email.toLowerCase())
            );
          }
        }

        if (!userInDb) {
          await signOut(auth);
          setErrorMessage("Account does not exist in our database. Please create an account first.");
          setLoading(false);
          return;
        }

        const token = await user.getIdToken();
        localStorage.setItem("authToken", token);

        let isAdminUser = user.email === adminEmail;

        if (!isAdminUser && userData && (userData.role === "admin" || userData.isAdmin === true)) {
          isAdminUser = true;
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

  // Email Login Handler with DB Verification
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
      // 1. Check if user exists in the Realtime Database before proceeding
      const dbRef = ref(db);
      const snapshot = await get(child(dbRef, "users"));

      let emailExistsInDb = false;
      if (snapshot.exists()) {
        const usersData = snapshot.val();
        emailExistsInDb = Object.values(usersData).some(
          (user) => user.email && user.email.trim().toLowerCase() === cleanEmail
        );
      }

      if (!emailExistsInDb) {
        setErrorMessage("Account does not exist in our database. Please create an account first.");
        setLoading(false);
        return;
      }

      // 2. Authenticate user
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      await handlePostLoginRouting(userCredential.user);
    } catch (error) {
      setLoading(false);
      console.error("Email Login Error:", error.code);

      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/invalid-credential"
      ) {
        setErrorMessage("Invalid email or password. Please check your credentials and try again.");
      } else if (error.code === "auth/too-many-requests") {
        setErrorMessage("Access disabled temporarily due to many failed attempts. Try resetting your password or wait a moment.");
      } else {
        setErrorMessage("Login failed: " + error.message);
      }
    }
  };

  // Send OTP to Phone Number
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
        setErrorMessage("Account does not exist in our database. Please create an account first.");
        setLoading(false);
        return;
      }

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

  // Standard Firebase Email Link Password Reset
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
      setSuccessMessage("Password reset link sent! Check your email inbox.");
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

  // Social Auth Handlers
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
          {errorMessage && <div className="signup-error-banner">{errorMessage}</div>}
          {successMessage && <div className="login-success-banner">{successMessage}</div>}

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
            /* 3. FORGOT PASSWORD OPTIONS FORM */
            <div>
              <p className="login-text">Choose your preferred method to reset your password:</p>

              {/* Reset via Custom 6-Digit Email OTP */}
              <Link to="/forgot-password" className="login-btn email" style={{ display: "block", textAlign: "center", marginBottom: "0.75rem", textDecoration: "none" }}>
                <FontAwesomeIcon icon={faEnvelope} /> Reset via Email OTP Code
              </Link>

              {/* Reset via Phone SMS OTP */}
              <Link to="/forgot-password-phone" className="login-btn secondary-btn" style={{ display: "block", textAlign: "center", marginBottom: "1rem", textDecoration: "none" }}>
                <FontAwesomeIcon icon={faMobileAlt} /> Reset via Phone SMS OTP
              </Link>

              <div className="login-divider">OR SEND RESET LINK</div>

              {/* Standard Reset Email Link Form */}
              <form onSubmit={handlePasswordReset}>
                <input
                  type="email"
                  placeholder="Your Registered Email Address"
                  className="login-input"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  disabled={loading}
                />
                <button type="submit" className="login-btn email" disabled={loading}>
                  <FontAwesomeIcon icon={loading ? faSpinner : faEnvelope} spin={loading} />
                  {loading ? " Sending Link..." : " Send Email Link"}
                </button>
              </form>

              <button
                type="button"
                className="login-btn secondary-btn"
                onClick={() => {
                  setIsForgotPassword(false);
                  resetFeedback();
                }}
                style={{ marginTop: "0.75rem" }}
              >
                Back to Login
              </button>
            </div>
          )}

          {/* FOOTER LINKS */}
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