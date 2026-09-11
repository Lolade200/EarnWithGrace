import React, { useState } from "react";
import "./SignupPage.css";
import Footer from "./Footer";
import { createUserWithEmailAndPassword, deleteUser } from "firebase/auth";
import { ref, query, orderByChild, equalTo, get, set } from "firebase/database";
import { auth, db } from "../firebase";
import { useNavigate, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faEnvelope,
  faPhone,
  faLock,
  faArrowRight,
  faSpinner
} from "@fortawesome/free-solid-svg-icons";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim().replace(/\s+/g, "");

    let createdUser = null;

    try {
      // 1. Create Authentication Account in Firebase FIRST
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        cleanEmail,
        password
      );
      createdUser = userCredential.user;

      // 2. Perform targeted check to see if phone number is already registered by another account
      const usersRef = ref(db, "users");
      const phoneQuery = query(
        usersRef,
        orderByChild("phone"),
        equalTo(cleanPhone)
      );
      const phoneSnapshot = await get(phoneQuery);

      if (phoneSnapshot.exists()) {
        await deleteUser(createdUser);
        setErrorMessage("This phone number is already registered with another account.");
        setLoading(false);
        return;
      }

      // 3. Save User Details in Realtime Database under their authenticated UID
      await set(ref(db, "users/" + createdUser.uid), {
        name: name.trim(),
        email: cleanEmail,
        phone: cleanPhone,
        role: "user",
        createdAt: new Date().toISOString()
      });

      // 4. Trigger Success State & Redirect
      setIsSuccess(true);
      setTimeout(() => {
        navigate("/newdashboard");
      }, 5000);
    } catch (error) {
      setLoading(false);

      if (error.code === "auth/email-already-in-use") {
        setErrorMessage("This email is already registered. Please enter a different email or log in.");
      } else if (error.code === "auth/weak-password") {
        setErrorMessage("Password should be at least 6 characters long.");
      } else if (error.code === "auth/invalid-email") {
        setErrorMessage("Please enter a valid email address.");
      } else if (
        error.code === "PERMISSION_DENIED" ||
        error.message?.includes("PERMISSION_DENIED")
      ) {
        setErrorMessage("Permission denied. Please check your database security rules in Firebase Console.");
      } else {
        setErrorMessage(error.message || "An error occurred during registration. Please try again.");
      }
    }
  };

  return (
    <section className="signup-section">
      {/* Background Neon Orbs */}
      <div className="signup-bg-glow glow-1"></div>
      <div className="signup-bg-glow glow-2"></div>

      <div className="signup-container">
        <div className="signup-form-column">
          {isSuccess ? (
            /* SUCCESS STATE CONTAINER */
            <div className="signup-success-card">
              <div className="success-animation-wrapper">
                <svg
                  className="checkmark-svg"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 52 52"
                >
                  <circle
                    className="checkmark-circle"
                    cx="26"
                    cy="26"
                    r="25"
                    fill="none"
                  />
                  <path
                    className="checkmark-check"
                    fill="none"
                    d="M14.1 27.2l7.1 7.2 16.7-16.8"
                  />
                </svg>

                <span className="confetti-particle p1"></span>
                <span className="confetti-particle p2"></span>
                <span className="confetti-particle p3"></span>
                <span className="confetti-particle p4"></span>
                <span className="confetti-particle p5"></span>
                <span className="confetti-particle p6"></span>
              </div>

              <h2 className="success-title">Account Created!</h2>
              <p className="success-text">
                Welcome aboard, <strong>{name}</strong>! Getting your terminal ready...
              </p>

              {/* Redirect Countdown Bar */}
              <div className="redirect-progress-bar">
                <div className="progress-fill"></div>
              </div>
            </div>
          ) : (
            /* FORM STATE CONTAINER */
            <div className="signup-card">
              <h2 className="signup-title">Create Your Account</h2>
              <p className="signup-text">
                Sign up today and start earning rewards instantly.
              </p>

              {errorMessage && (
                <div className="signup-error-banner">{errorMessage}</div>
              )}

              <form className="signup-form" onSubmit={handleSignup}>
                <div className="input-field-group">
                  <FontAwesomeIcon icon={faUser} className="input-icon" />
                  <input
                    type="text"
                    placeholder="Full Name"
                    className="signup-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="input-field-group">
                  <FontAwesomeIcon icon={faEnvelope} className="input-icon" />
                  <input
                    type="email"
                    placeholder="Email Address"
                    className="signup-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="input-field-group">
                  <FontAwesomeIcon icon={faPhone} className="input-icon" />
                  <input
                    type="tel"
                    placeholder="Phone Number (e.g. +2348001234567)"
                    className="signup-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="input-field-group">
                  <FontAwesomeIcon icon={faLock} className="input-icon" />
                  <input
                    type="password"
                    placeholder="Password"
                    className="signup-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <button type="submit" className="signup-btn" disabled={loading}>
                  {loading ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin className="btn-spinner" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign Up</span>
                      <FontAwesomeIcon icon={faArrowRight} className="btn-icon" />
                    </>
                  )}
                </button>
              </form>

              <p className="signup-footer-text">
                Already have an account?{" "}
                <Link to="/login" className="signup-link">
                  Log In
                </Link>
              </p>
            </div>
          )}
        </div>

        <div className="signup-image-column">
          <div className="signup-image-wrapper">
            <img
              src="/assets/hhh.jpg"
              alt="Signup terminal interface"
              className="signup-image"
            />
            <div className="signup-image-overlay"></div>
          </div>
        </div>
      </div>

      <Footer />
    </section>
  );
}
