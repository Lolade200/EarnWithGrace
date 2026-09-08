import React, { useState } from "react";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";

export default function EmailOtpReset() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const auth = getAuth();

  const handleSendResetEmail = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
      setSuccess(`A password reset link has been sent to ${email}. Please check your inbox and spam folder.`);
      setEmail("");
    } catch (err) {
      console.error("Password reset error:", err);
      
      // Clean up Firebase Auth error messages
      if (err.code === "auth/user-not-found") {
        setError("No account found with this email address.");
      } else if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many requests. Please wait a few minutes before trying again.");
      } else {
        setError(err.message || "Failed to send password reset email.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && <div className="signup-error-banner">{error}</div>}
      {success && <div className="login-success-banner">{success}</div>}

      <form onSubmit={handleSendResetEmail}>
        <input
          type="email"
          placeholder="Your Email Address"
          className="login-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit" className="login-btn email" disabled={loading}>
          {loading ? "Sending..." : "Send Password Reset Link"}
        </button>
      </form>
    </div>
  );
}