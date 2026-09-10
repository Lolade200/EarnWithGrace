import React, { useState, useEffect, useCallback } from "react";
import "./LoginPage.css";
import Footer from "./Footer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle, faApple } from "@fortawesome/free-brands-svg-icons";
import { 
  faEnvelope, 
  faSpinner, 
  faPhone, 
  faKey, 
  faMobileAlt, 
  faArrowLeft, 
  faLock,
  faShieldHalved
} from "@fortawesome/free-solid-svg-icons";
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

        let userInDb = false;
        if (userData) {
          userInDb = true;
        } else {
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
    <section className="login-wrapper">
      <div id="recaptcha-container"></div>
      
      <div className="login-card">
        {/* LEFT COLUMN: AUTH FORM */}
        <div className="login-form-column">
          {/* Brand Header */}
          <div className="ewg-logo-container login-brand-header">
            <div className="avatar-box">
              <FontAwesomeIcon icon={faShieldHalved} />
            </div>
            <div className="ewg-brand-text">
              <span className="brand-primary">
                EWG <span className="brand-highlight">NEXUS</span>
              </span>
              <span className="brand-sub">USER AUTHENTICATION PORTAL</span>
            </div>
          </div>

          <div className="login-header">
            <h2 className="login-title">
              {isForgotPassword ? "Reset Password" : "Welcome Back"}
            </h2>
            <p className="login-subtitle">
              {isForgotPassword 
                ? "Select a recovery option to regain secure access."
                : "Enter your credentials to access your terminal dashboard."}
            </p>
          </div>

          {/* Feedback Banners */}
          {errorMessage && <div className="feedback-banner error-banner">{errorMessage}</div>}
          {successMessage && <div className="feedback-banner success-banner">{successMessage}</div>}

          {!isForgotPassword ? (
            <>
              {/* Social Login Options */}
              <div className="social-buttons-container">
                <button className="social-btn google" onClick={handleGoogleLogin} disabled={loading}>
                  <FontAwesomeIcon icon={faGoogle} className="social-icon" /> Continue with Google
                </button>
                <button className="social-btn apple" onClick={handleAppleLogin} disabled={loading}>
                  <FontAwesomeIcon icon={faApple} className="social-icon" /> Continue with Apple
                </button>
              </div>

              <div className="login-divider">
                <span>OR AUTHENTICATE WITH</span>
              </div>

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
                  <FontAwesomeIcon icon={faEnvelope} /> Email
                </button>
                <button
                  type="button"
                  className={`toggle-tab ${loginMethod === "phone" ? "active" : ""}`}
                  onClick={() => {
                    setLoginMethod("phone");
                    resetFeedback();
                  }}
                >
                  <FontAwesomeIcon icon={faPhone} /> Phone
                </button>
              </div>

              {/* EMAIL LOGIN FORM */}
              {loginMethod === "email" && (
                <form onSubmit={handleEmailLogin} className="auth-form">
                  <div className="input-group">
                    <label>Email Address</label>
                    <div className="input-field-wrapper">
                      <FontAwesomeIcon icon={faEnvelope} className="input-icon" />
                      <input
                        type="email"
                        placeholder="name@example.com"
                        className="login-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <div className="label-row">
                      <label>Password</label>
                      <button
                        type="button"
                        className="forgot-link-btn"
                        onClick={() => {
                          setIsForgotPassword(true);
                          resetFeedback();
                        }}
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="input-field-wrapper">
                      <FontAwesomeIcon icon={faLock} className="input-icon" />
                      <input
                        type="password"
                        placeholder="••••••••"
                        className="login-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <button type="submit" className="login-primary-btn" disabled={loading}>
                    {loading ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} spin /> Authenticating...
                      </>
                    ) : (
                      "Sign In with Email"
                    )}
                  </button>
                </form>
              )}

              {/* PHONE NUMBER LOGIN FORM */}
              {loginMethod === "phone" && (
                <div className="auth-form">
                  {!confirmationResult ? (
                    <form onSubmit={handleSendOtp}>
                      <div className="input-group">
                        <label>Phone Number</label>
                        <div className="input-field-wrapper">
                          <FontAwesomeIcon icon={faPhone} className="input-icon" />
                          <input
                            type="tel"
                            placeholder="+2348001234567"
                            className="login-input"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                            disabled={loading}
                          />
                        </div>
                      </div>

                      <button type="submit" className="login-primary-btn" disabled={loading}>
                        {loading ? (
                          <>
                            <FontAwesomeIcon icon={faSpinner} spin /> Transmitting Code...
                          </>
                        ) : (
                          "Send OTP Code"
                        )}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyOtp}>
                      <div className="input-group">
                        <label>6-Digit Verification Code</label>
                        <div className="input-field-wrapper">
                          <FontAwesomeIcon icon={faKey} className="input-icon" />
                          <input
                            type="text"
                            placeholder="123456"
                            className="login-input otp-input"
                            maxLength={6}
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            required
                            disabled={loading}
                          />
                        </div>
                      </div>

                      <button type="submit" className="login-primary-btn" disabled={loading}>
                        {loading ? (
                          <>
                            <FontAwesomeIcon icon={faSpinner} spin /> Verifying...
                          </>
                        ) : (
                          "Verify & Sign In"
                        )}
                      </button>

                      <button
                        type="button"
                        className="text-link-btn center-text"
                        onClick={() => {
                          setConfirmationResult(null);
                          setOtp("");
                          resetFeedback();
                        }}
                      >
                        Change Phone Number
                      </button>
                    </form>
                  )}
                </div>
              )}

              <p className="terms-notice">
                By logging in, you accept our <a href="#terms">Terms of Service</a> &{" "}
                <a href="#privacy">Privacy Policy</a>.
              </p>
            </>
          ) : (
            /* FORGOT PASSWORD FORM */
            <div className="auth-form forgot-password-section">
              <div className="forgot-options">
                <Link to="/forgot-password" className="forgot-option-card">
                  <FontAwesomeIcon icon={faEnvelope} className="option-icon" />
                  <div>
                    <strong>Reset via Email OTP Code</strong>
                    <span>Receive a 6-digit verification code in your inbox</span>
                  </div>
                </Link>

                <Link to="/forgot-password-phone" className="forgot-option-card">
                  <FontAwesomeIcon icon={faMobileAlt} className="option-icon" />
                  <div>
                    <strong>Reset via Phone SMS OTP</strong>
                    <span>Receive a verification code on your phone</span>
                  </div>
                </Link>
              </div>

              <div className="login-divider">
                <span>OR SEND DIRECT EMAIL LINK</span>
              </div>

              <form onSubmit={handlePasswordReset}>
                <div className="input-group">
                  <label>Registered Email Address</label>
                  <div className="input-field-wrapper">
                    <FontAwesomeIcon icon={faEnvelope} className="input-icon" />
                    <input
                      type="email"
                      placeholder="name@example.com"
                      className="login-input"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <button type="submit" className="login-primary-btn" disabled={loading}>
                  {loading ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin /> Transmitting...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </button>
              </form>

              <button
                type="button"
                className="back-btn"
                onClick={() => {
                  setIsForgotPassword(false);
                  resetFeedback();
                }}
              >
                <FontAwesomeIcon icon={faArrowLeft} /> Return to Sign In
              </button>
            </div>
          )}

          {/* FOOTER NAV */}
          {!isForgotPassword && (
            <div className="login-card-footer">
              Don't have an account? <Link to="/signup">Create Account</Link>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: FUTURISTIC SIDE HERO PANEL */}
        <div className="login-image-column">
          <div className="hero-overlay">
            <img src="/assets/hhh.jpg" alt="Gift Cards Showcase" className="hero-bg-image" />
            <div className="hero-gradient-cover"></div>
            <div className="hero-content">
              <span className="version-tag mb-2">SYSTEM v2054.1</span>
              <h3>Fast, Secure & Automated Trading</h3>
              <p>Manage digital card assets, instant payouts, and account security within our futuristic terminal.</p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </section>
  );
}
