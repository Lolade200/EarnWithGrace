const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

// Set SendGrid API Key (Replace with your actual SendGrid API key or use process.env)
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || "YOUR_SENDGRID_API_KEY_HERE";
sgMail.setApiKey(SENDGRID_API_KEY);

const SENDER_EMAIL = "your-verified-sendgrid-email@domain.com"; // Must be verified in SendGrid!

/**
 * 1. Send OTP Email Function
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

    // 3. Save OTP to Realtime Database
    await admin.database().ref(`passwordResets/${user.uid}`).set({
      otp,
      expiresAt,
      email: cleanEmail,
    });

    // 4. Send Email via SendGrid
    const msg = {
      to: cleanEmail,
      from: SENDER_EMAIL,
      subject: "Your Password Reset OTP",
      text: `Your password reset code is: ${otp}. It will expire in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Password Reset Request</h2>
          <p>Your 6-digit verification code is:</p>
          <h1 style="color: #007bff; letter-spacing: 4px;">${otp}</h1>
          <p>This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
        </div>
      `,
    };

    await sgMail.send(msg);

    return { success: true, message: "OTP sent successfully to your email." };
  } catch (error) {
    console.error("sendEmailOtp Error:", error);

    if (error.code === "auth/user-not-found") {
      throw new HttpsError("not-found", "No account found with this email address.");
    }

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
    // 1. Get user by email
    const user = await admin.auth().getUserByEmail(cleanEmail);

    // 2. Fetch OTP details from Realtime Database
    const otpRef = admin.database().ref(`passwordResets/${user.uid}`);
    const snapshot = await otpRef.get();

    if (!snapshot.exists()) {
      throw new HttpsError("not-found", "No password reset request found. Please request a new OTP.");
    }

    const resetData = snapshot.val();

    // 3. Validate OTP
    if (resetData.otp !== otp.trim()) {
      throw new HttpsError("invalid-argument", "Invalid OTP code.");
    }

    // 4. Check expiration
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