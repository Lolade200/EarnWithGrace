import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  OAuthProvider, 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  sendPasswordResetEmail 
} from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyC5HwBaX0Uuwii9ilYlNIEdhCHGt_Un-DY",
  authDomain: "earnwithgrace-61615.firebaseapp.com",
  databaseURL: "https://earnwithgrace-61615-default-rtdb.firebaseio.com",
  projectId: "earnwithgrace-61615",
  storageBucket: "earnwithgrace-61615.firebasestorage.app",
  messagingSenderId: "653977405846",
  appId: "1:653977405846:web:a7a44b0e5f59593800f5b7",
  measurementId: "G-XXRQPL3HY3"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Services
export const auth = getAuth(app);
export const db = getDatabase(app);
export const storage = getStorage(app);

// Export Auth Utilities for Phone, Social, and Reset Auth
export { 
  GoogleAuthProvider, 
  OAuthProvider, 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  sendPasswordResetEmail 
};

export default app;