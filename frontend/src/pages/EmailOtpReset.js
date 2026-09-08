import React, { useState } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";

export default function EmailOtpReset() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [step, setStep] = useState(1); // 1: Send Email, 2: Verify OTP
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const functions = getFunctions();

  // 1. Request Email OTP Call
  const handleSendEmailOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const sendEmailOtpCallable = httpsCallable(functions, "sendEmailOtp");
      await sendEmailOtpCallable({ email });

      setStep(2);
      setSuccess("A 6-digit OTP code was sent to " + email);
    } catch (err) {
      setError(err.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Verify Email OTP Call
  const handleVerifyAndReset = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const verifyEmailOtpCallable = httpsCallable(functions, "verifyEmailOtpAndReset");
      await verifyEmailOtpCallable({ email, otp, newPassword });

      setSuccess("Password updated successfully! You can now log in with your new password.");
    } catch (err) {
      setError(err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && <div className="signup-error-banner">{error}</div>}
      {success && <div className="login-success-banner">{success}</div>}

      {step === 1 ? (
        <form onSubmit={handleSendEmailOtp}>
          <input
            type="email"
            placeholder="Your Email Address"
            className="login-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" className="login-btn email" disabled={loading}>
            {loading ? "Sending..." : "Send OTP Code"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyAndReset}>
          <input
            type="text"
            placeholder="Enter 6-digit Email OTP Code"
            className="login-input"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Enter New Password"
            className="login-input"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
          />
          <button type="submit" className="login-btn email" disabled={loading}>
            {loading ? "Resetting..." : "Confirm & Update Password"}
          </button>
        </form>
      )}
    </div>
  );
}