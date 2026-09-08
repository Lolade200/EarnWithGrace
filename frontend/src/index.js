const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { Resend } = require("resend");

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

// Initialize Resend with your API key
const resend = new Resend("re_3iRvkavE_6qYPofzHnjPNYr8S4PHwzsWJ");

/**
 * 1. Send OTP Email Function via Resend
 */
exports.sendEmailOtp = onCall({ cors: true }, async (request) => {
  const { email } = request.data;

  if (!email) {
    throw new HttpsError("invalid-argument", "Email address is required.");
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    // 1. Check if user exists in Firebase Auth
    const user = await admin.auth().getUserByEmail(cleanEmail);

    // 2. Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

    // 3. Store OTP in Firebase Realtime Database
    await admin.database().ref(`passwordResets/${user.uid}`).set({
      otp,
      expiresAt,
      email: cleanEmail,
    });

    // 4. Send Email via Resend
    // Note: 'onboarding@resend.dev' works out-of-the-box for testing
    const { error } = await resend.emails.send({
      from: "Password Reset <onboarding@resend.dev>",
      to: [cleanEmail],
      subject: "Your Password Reset OTP",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #111;">Password Reset Request</h2>
          <p>Your 6-digit verification code is:</p>
          <h1 style="color: #007bff; letter-spacing: 5px; font-size: 32px;">${otp}</h1>
          <p>This code will expire in 10 minutes. If you did not request this reset, please ignore this email.</p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend API Error:", error);
      throw new HttpsError("internal", error.message || "Failed to send email via Resend.");
    }

    return { success: true, message: "OTP sent successfully to your email." };
  } catch (error) {
    console.error("sendEmailOtp Error:", error);

    if (error.code === "auth/user-not-found") {
      throw new HttpsError("not-found", "No account found with this email address.");
    }

    if (error instanceof HttpsError) throw error;

    throw new HttpsError("internal", error.message || "Failed to send OTP email.");
  }
});

/**
 * 2. Verify OTP & Reset Password Function
 */
exports.verifyEmailOtpAndReset = onCall({ cors: true }, async (request) => {
  const { email, otp, newPassword } = request.data;

  if (!email || !otp || !newPassword) {
    throw new HttpsError("invalid-argument", "Email, OTP, and new password are required.");
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    // 1. Find user in Firebase Auth
    const user = await admin.auth().getUserByEmail(cleanEmail);

    // 2. Fetch reset data from Realtime Database
    const otpRef = admin.database().ref(`passwordResets/${user.uid}`);
    const snapshot = await otpRef.get();

    if (!snapshot.exists()) {
      throw new HttpsError("not-found", "No password reset request found. Please request a new OTP.");
    }

    const resetData = snapshot.val();

    // 3. Verify OTP Match
    if (resetData.otp !== otp.trim()) {
      throw new HttpsError("invalid-argument", "Invalid OTP code.");
    }

    // 4. Verify OTP Expiration
    if (Date.now() > resetData.expiresAt) {
      await otpRef.remove();
      throw new HttpsError("deadline-exceeded", "OTP code has expired. Please request a new one.");
    }

    // 5. Update user password in Firebase Auth
    await admin.auth().updateUser(user.uid, {
      password: newPassword,
    });

    // 6. Delete used OTP record
    await otpRef.remove();

    return { success: true, message: "Password updated successfully!" };
  } catch (error) {
    console.error("verifyEmailOtpAndReset Error:", error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message || "Failed to reset password.");
  }
});