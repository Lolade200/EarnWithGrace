import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { auth } from "./firebase";

function PrivateRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Listen for Firebase Auth state initialization
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Show loading state while Firebase checks if user is logged in
  if (loading) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100vh",
        fontSize: "16px",
        color: "#4b5563"
      }}>
        Loading...
      </div>
    );
  }

  // Once loading finishes, redirect if no user, otherwise render children
  return user ? children : <Navigate to="/login" replace />;
}

export default PrivateRoute;