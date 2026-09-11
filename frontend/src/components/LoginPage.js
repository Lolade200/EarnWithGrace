import React, { useState, useEffect, useCallback } from "react";
import "./SignupPage.css";
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
  getRedirectResult,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";
import { ref, set, get, child } from "firebase/database";
import { auth, db } from "../firebase";
import { useNavigate, Link } from "react-router-dom";

export default function SignupPage() {
  const navigate = useNavigate();

  // Mode & Tabs
  const [signupMethod, setSignupMethod] = useState("email"); // 'email' | 'phone'

  // Input States
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Phone Auth States
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);

  // Status & Feedback States
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const adminEmail = "sa9362673@gmail.com";

  // Clear messages when switching tabs
  const resetFeedback = () => {
    setErrorMessage("");
    setSuccessMessage("");
  };

  // Create standard user profile object in Firebase Realtime DB
  const createUserDatabaseRecord = async (user, additionalData = {}) => {
    const userRef = ref(db, `users/${user.uid}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      const newUserRecord = {
        uid: user.uid,
        displayName: user.displayName || fullName || "Nexus User",
        email: user.email || email.trim().toLowerCase() || "",
        phone: user.phoneNumber || phone.trim() || "",
        role: (user.email === adminEmail) ? "admin" : "user",
        createdAt: new Date().toISOString(),
        provider: user.providerData[0]?.providerId || "custom",
        ...additionalData
      };
      await set(userRef, newUserRecord);
    }
  };

  // Post-Signup Routing logic
  const handlePostSignupRouting = useCallback(
    async (user) => {
      try {
        await createUserDatabaseRecord(user);

        const token = await user.getIdToken();
        localStorage.setItem("authToken", token);

        if (user.email === adminEmail) {
          navigate("/admin");
        } else {
          navigate("/newdashboard");
        }
      } catch (error) {
        console.error("Database sync error during signup:", error);
        navigate("/newdashboard");
      } finally {
        setLoading(false);
      }
    },
    [navigate, fullName, email, phone]
  );

  // Handle Redirect Result for Google/Apple sign up
  useEffect(() => {
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          await handlePostSignupRouting(result.user);
        }
      })
      .catch((error) => setErrorMessage("Redirect signup error: " + error.message));
  }, [handlePostSignupRouting]);

  // Invisible reCAPTCHA verifier for Phone Auth
  const setupRecaptcha = () => {
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
    }

    window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible",
      callback: () => {},
      "expired-callback": () => {
        setErrorMessage("reCAPTCHA expired. Please try requesting the code again.");
      },
    });
  };

  // Email/Password Registration Handler
  const handleEmailSignup = async (e) => {
    e.preventDefault();
    resetFeedback();

    const cleanEmail = email.trim().toLowerCase();

    if (!fullName.trim() || !cleanEmail || !password || !confirmPassword) {
      setErrorMessage("Please complete all required fields.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please re-enter.");
      return;
    }

    if (!agreeTerms) {
      setErrorMessage("You must accept the Terms of Service to create an account.");
      return;
    }

    setLoading(true);

    try {
      // Check if user already exists in DB
      const dbRef = ref(db);
      const snapshot = await get(child(dbRef, "users"));
      if (snapshot.exists()) {
        const usersData = snapshot.val();
        const exists = Object.values(usersData).some(
          (u) => u.email && u.email.trim().toLowerCase() === cleanEmail
        );
        if (exists) {
          setErrorMessage("An account with this email already exists. Please log in instead.");
          setLoading(false);
          return;
        }
      }

      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      const user = userCredential.user;

      // Update Firebase Profile Name
      await updateProfile(user, { displayName: fullName.trim() });

      await handlePostSignupRouting(user);
    } catch (error) {
      setLoading(false);
      console.error("Email Signup Error:", error.code);

      if (error.code === "auth/email-already-in-use") {
        setErrorMessage("An account with this email already exists. Please log in.");
      } else if (error.code === "auth/invalid-email") {
        setErrorMessage("Invalid email format provided.");
      } else if (error.code === "auth/weak-password") {
        setErrorMessage("Password is too weak. Choose a stronger password.");
      } else {
        setErrorMessage("Signup failed: " + error.message);
      }
    }
  };

  // Send OTP for Phone Signup
  const handleSendOtp = async (e) => {
    e.preventDefault();
    resetFeedback();

    const formattedPhone = phone.trim().replace(/\s+/g, "");

    if (!fullName.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }

    if (!formattedPhone.startsWith("+")) {
      setErrorMessage("Please include country code starting with '+' (e.g., +2348001234567 or +16505551234).");
      return;
    }

    if (!agreeTerms) {
      setErrorMessage("You must accept the Terms of Service to create an account.");
      return;
    }

    setLoading(true);

    try {
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier;
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);

      setConfirmationResult(confirmation);
      setSuccessMessage("OTP verification code sent to " + formattedPhone);
    } catch (error) {
      console.error("Phone Signup Error:", error);
      if (window.grecaptcha && window.recaptchaVerifier) {
        window.recaptchaVerifier.render().then((widgetId) => {
          window.grecaptcha.reset(widgetId);
        });
      }
      setErrorMessage("Error sending verification code: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Confirm Phone OTP & Create User
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
      await updateProfile(result.user, { displayName: fullName.trim() });
      await handlePostSignupRouting(result.user);
    } catch (error) {
      setLoading(false);
      setErrorMessage("Invalid or expired verification code. Please try again.");
    }
  };

  // OAuth Google Signup
  const handleGoogleSignup = async () => {
    resetFeedback();
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await handlePostSignupRouting(result.user);
    } catch (error) {
      if (error.code === "auth/popup-blocked" || error.code === "auth/popup-closed-by-user") {
        await signInWithRedirect(auth, provider);
      } else {
        setLoading(false);
        setErrorMessage("Google sign-up error: " + error.message);
      }
    }
  };

  // OAuth Apple Signup
  const handleAppleSignup = async () => {
    resetFeedback();
    setLoading(true);
    const provider = new OAuthProvider("apple.com");
    provider.addScope("email");
    provider.addScope("name");

    try {
      const result = await signInWithPopup(auth, provider);
      await handlePostSignupRouting(result.user);
    } catch (error) {
      if (error.code === "auth/popup-blocked" || error.code === "auth/popup-closed-by-user") {
        await signInWithRedirect(auth, provider);
      } else {
        setLoading(false);
        setErrorMessage("Apple sign-up error: " + error.message);
      }
    }
  };

  return (
    <section className="signup-wrapper">
      <div id="recaptcha-container"></div>

      <div className="signup-card">
        {/* LEFT COLUMN: AUTH FORM */}
        <div className="signup-form-column">
          {/* Brand Header */}
          <div className="ewg-logo-container signup-brand-header">
            <div className="avatar-box">
              <FontAwesomeIcon icon={faShieldHalved} />
            </div>
            <div className="ewg-brand-text">
              <span className="brand-primary">
                EWG <span className="brand-highlight">NEXUS</span>
              </span>
              <span className="brand-sub">USER REGISTRATION PORTAL</span>
            </div>
          </div>

          <div className="signup-header">
            <h2 className="signup-title">Create Account</h2>
            <p className="signup-subtitle">
              Join the network to gain immediate access to your terminal dashboard.
            </p>
          </div>

          {/* Feedback Banners */}
          {errorMessage && <div className="feedback-banner error-banner">{errorMessage}</div>}
          {successMessage && <div className="feedback-banner success-banner">{successMessage}</div>}

          {/* Social Signup Options */}
          <div className="social-buttons-container">
            <button className="social-btn google" onClick={handleGoogleSignup} disabled={loading}>
              <FontAwesomeIcon icon={faGoogle} className="social-icon" /> Sign up with Google
            </button>
            <button className="social-btn apple" onClick={handleAppleSignup} disabled={loading}>
              <FontAwesomeIcon icon={faApple} className="social-icon" /> Sign up with Apple
            </button>
          </div>

          <div className="signup-divider">
            <span>OR REGISTER WITH</span>
          </div>

          {/* Tab Switcher for Email vs Phone */}
          <div className="method-toggle">
            <button
              type="button"
              className={`toggle-tab ${signupMethod === "email" ? "active" : ""}`}
              onClick={() => {
                setSignupMethod("email");
                setConfirmationResult(null);
                resetFeedback();
              }}
            >
              <FontAwesomeIcon icon={faEnvelope} /> Email
            </button>
            <button
              type="button"
              className={`toggle-tab ${signupMethod === "phone" ? "active" : ""}`}
              onClick={() => {
                setSignupMethod("phone");
                resetFeedback();
              }}
            >
              <FontAwesomeIcon icon={faPhone} /> Phone
            </button>
          </div>

          {/* EMAIL SIGNUP FORM */}
          {signupMethod === "email" && (
            <form onSubmit={handleEmailSignup} className="auth-form">
              <div className="input-group">
                <label>Full Name</label>
                <div className="input-field-wrapper">
                  <FontAwesomeIcon icon={faUser} className="input-icon" />
                  <input
                    type="text"
                    placeholder="John Doe"
                    className="signup-input"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Email Address</label>
                <div className="input-field-wrapper">
                  <FontAwesomeIcon icon={faEnvelope} className="input-icon" />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    className="signup-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label>Password</label>
                  <div className="input-field-wrapper">
                    <FontAwesomeIcon icon={faLock} className="input-icon" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="signup-input"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                    </button>
                  </div>
                </div>

                <div className="input-group">
                  <label>Confirm Password</label>
                  <div className="input-field-wrapper">
                    <FontAwesomeIcon icon={faLock} className="input-icon" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="signup-input"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <label className="terms-checkbox-label">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                />
                <span>
                  I agree to the <a href="/terms" target="_blank" rel="noreferrer">Terms of Service</a> and{" "}
                  <a href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>.
                </span>
              </label>

              <button type="submit" className="signup-primary-btn" disabled={loading}>
                {loading ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin /> Creating Account...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faUserPlus} /> Register Account
                  </>
                )}
              </button>
            </form>
          )}

          {/* PHONE SIGNUP FORM */}
          {signupMethod === "phone" && (
            <form onSubmit={confirmationResult ? handleVerifyOtp : handleSendOtp} className="auth-form">
              <div className="input-group">
                <label>Full Name</label>
                <div className="input-field-wrapper">
                  <FontAwesomeIcon icon={faUser} className="input-icon" />
                  <input
                    type="text"
                    placeholder="John Doe"
                    className="signup-input"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={Boolean(confirmationResult)}
                    required
                  />
                </div>
              </div>

              {!confirmationResult ? (
                <>
                  <div className="input-group">
                    <label>Phone Number (with country code)</label>
                    <div className="input-field-wrapper">
                      <FontAwesomeIcon icon={faPhone} className="input-icon" />
                      <input
                        type="tel"
                        placeholder="+1 650 555 1234"
                        className="signup-input"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <label className="terms-checkbox-label">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                    />
                    <span>
                      I agree to the <a href="/terms" target="_blank" rel="noreferrer">Terms of Service</a> and{" "}
                      <a href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>.
                    </span>
                  </label>

                  <button type="submit" className="signup-primary-btn" disabled={loading}>
                    {loading ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} spin /> Sending Code...
                      </>
                    ) : (
                      "Send Verification Code"
                    )}
                  </button>
                </>
              ) : (
                <>
                  <div className="input-group">
                    <label>Enter 6-Digit Code</label>
                    <div className="input-field-wrapper">
                      <FontAwesomeIcon icon={faKey} className="input-icon" />
                      <input
                        type="text"
                        placeholder="123456"
                        maxLength="6"
                        className="signup-input otp-input"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <button type="submit" className="signup-primary-btn" disabled={loading}>
                    {loading ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} spin /> Verifying...
                      </>
                    ) : (
                      "Complete Registration"
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
                    Change phone number
                  </button>
                </>
              )}
            </form>
          )}

          {/* Footer Link to Login */}
          <div className="signup-card-footer">
            Already have an account? <Link to="/login">Sign In</Link>
          </div>
        </div>

        {/* RIGHT COLUMN: HERO PANEL */}
        <div className="signup-image-column">
          <div className="hero-overlay">
            <img
              src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80"
              alt="Futuristic Grid Background"
              className="hero-bg-image"
            />
            <div className="hero-gradient-cover"></div>
            <div className="hero-content">
              <span className="mb-2">
                <FontAwesomeIcon icon={faShieldHalved} style={{ color: "var(--orange)", fontSize: "1.5rem" }} />
              </span>
              <h3>Secure Access Infrastructure</h3>
              <p>
                Get encrypted access to real-time metrics, system diagnostics, and central command node routing.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </section>
  );
}
