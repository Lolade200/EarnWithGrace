 import React, { useState } from "react";

import { RecaptchaVerifier, signInWithPhoneNumber, updatePassword } from "firebase/auth";

import { auth, db } from "../firebase";

import { ref, query, orderByChild, equalTo, get } from "firebase/database";



export default function PhoneOtpReset() {

  const [phone, setPhone] = useState("");

  const [otp, setOtp] = useState("");

  const [newPassword, setNewPassword] = useState("");

  

  const [step, setStep] = useState(1); // 1: Enter Phone, 2: Enter OTP & New Password

  const [confirmationResult, setConfirmationResult] = useState(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");



  const setupRecaptcha = () => {

    if (window.recaptchaVerifier) window.recaptchaVerifier.clear();

    window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {

      size: "invisible",

    });

  };



  // 1. Verify phone number exists in DB and Send SMS OTP

  const handleSendPhoneOtp = async (e) => {

    e.preventDefault();

    setError("");

    setLoading(true);



    const formattedPhone = phone.trim().replace(/\s+/g, "");



    try {

      // Pre-check: Ensure phone number is registered

      const usersRef = ref(db, "users");

      const phoneQuery = query(usersRef, orderByChild("phone"), equalTo(formattedPhone));

      const snapshot = await get(phoneQuery);



      if (!snapshot.exists()) {

        setError("This phone number is not registered with any account.");

        setLoading(false);

        return;

      }



      setupRecaptcha();

      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);

      setConfirmationResult(confirmation);

      setStep(2);

      setSuccess("OTP sent to your phone number!");

    } catch (err) {

      setError("Failed to send OTP: " + err.message);

    } finally {

      setLoading(false);

    }

  };



  // 2. Verify OTP code and update password

  const handleVerifyOtpAndReset = async (e) => {

    e.preventDefault();

    setError("");

    setLoading(true);



    try {

      // Authenticate user with OTP

      const userCredential = await confirmationResult.confirm(otp.trim());

      const user = userCredential.user;



      // Update password directly on authenticated session

      await updatePassword(user, newPassword);

      setSuccess("Password reset successfully! You are now logged in.");

    } catch (err) {

      setError("Invalid OTP or error updating password: " + err.message);

    } finally {

      setLoading(false);

    }

  };



  return (

    <div>

      <div id="recaptcha-container"></div>

      {error && <div className="signup-error-banner">{error}</div>}

      {success && <div className="login-success-banner">{success}</div>}



      {step === 1 ? (

        <form onSubmit={handleSendPhoneOtp}>

          <input

            type="tel"

            placeholder="Phone Number (e.g. +2348001234567)"

            className="login-input"

            value={phone}

            onChange={(e) => setPhone(e.target.value)}

            required

          />

          <button type="submit" className="login-btn email" disabled={loading}>

            {loading ? "Sending OTP..." : "Send Reset OTP"}

          </button>

        </form>

      ) : (

        <form onSubmit={handleVerifyOtpAndReset}>

          <input

            type="text"

            placeholder="6-Digit OTP Code"

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

            {loading ? "Updating..." : "Reset Password & Log In"}

          </button>

        </form>

      )}

    </div>

  );

} 

