import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

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

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);   // ✅ must pass app here
export const db = getDatabase(app);
