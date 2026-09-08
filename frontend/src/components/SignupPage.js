import React, { useState } from "react";
import "./SignupPage.css";
import Footer from "./Footer";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { ref, set } from "firebase/database";
import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom";

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

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save user details including phone number to Realtime Database
      await set(ref(db, "users/" + user.uid), {
        name,
        email,
        phone,
        createdAt: new Date().toISOString(),
      });

      // Show success screen and redirect after 2 seconds
      setIsSuccess(true);
      setTimeout(() => {
        navigate("/newdashboard");
      }, 2000);
    } catch (error) {
      setLoading(false);
      if (error.code === "auth/email-already-in-use") {
        setErrorMessage("This email is already registered. Redirecting to login...");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setErrorMessage(error.message);
      }
    }
  };

  return (
    <section className="signup-section">
      <div className="signup-container">
        <div className="signup-form-column">
          {isSuccess ? (
            /* SUCCESS STATE CONTAINER */
            <div className="signup-success-card">
              <div className="success-checkmark">
                <div className="check-icon">
                  <span className="icon-line line-tip"></span>
                  <span className="icon-line line-long"></span>
                  <div className="icon-circle"></div>
                  <div className="icon-fix"></div>
                </div>
              </div>
              <h2 className="success-title">Account Created!</h2>
              <p className="success-text">
                Welcome aboard, <strong>{name}</strong>! Redirecting you to your dashboard...
              </p>
            </div>
          ) : (
            /* FORM STATE CONTAINER */
            <>
              <h2 className="signup-title">Create Your Account</h2>
              <p className="signup-text">
                Sign up today and start earning rewards instantly.
              </p>

              {errorMessage && (
                <div className="signup-error-banner">
                  {errorMessage}
                </div>
              )}

              <form className="signup-form" onSubmit={handleSignup}>
                <input
                  type="text"
                  placeholder="Full Name"
                  className="signup-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={loading}
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  className="signup-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  className="signup-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  disabled={loading}
                />
                <input
                  type="password"
                  placeholder="Password"
                  className="signup-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <button type="submit" className="signup-btn" disabled={loading}>
                  {loading ? "Creating Account..." : "Sign Up"}
                </button>
              </form>

              <p className="signup-footer-text">
                Already have an account?{" "}
                <a href="/login" className="signup-link">Log In</a>
              </p>
            </>
          )}
        </div>

        <div className="signup-image-column">
          <img src="/assets/hhh.jpg" alt="Signup illustration" className="signup-image" />
        </div>
      </div>

      <Footer />
    </section>
  );
}