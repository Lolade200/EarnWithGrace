import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import SignupPage from "./components/SignupPage";
import LoginPage from "./components/LoginPage";
import EmailOtpReset from "./pages/EmailOtpReset"; // ✅ Added Email OTP Reset import
import NewDashboard from "./pages/NewDashboard";   // ✅ use the new dashboard file
import AdminDashboard from "./pages/AdminDashboard"; // ✅ import admin dashboard
import PrivateRoute from "./PrivateRoute";
import Withdrawal from "./components/withdrawal"; // ✅ Capitalized import name

function App() {
  return (
    <Router>
      <Routes>
        {/* Home page */}
        <Route path="/" element={<Home />} />

        {/* Signup page */}
        <Route path="/signup" element={<SignupPage />} />

        {/* Login page */}
        <Route path="/login" element={<LoginPage />} />

        {/* Forgot Password / OTP Reset page */}
        <Route path="/forgot-password" element={<EmailOtpReset />} />

        {/* New Dashboard (protected) */}
        <Route
          path="/newdashboard"
          element={
            <PrivateRoute>
              <NewDashboard />
            </PrivateRoute>
          }
        />

        {/* Withdrawal page (protected) */}
        <Route
          path="/withdrawal"
          element={
            <PrivateRoute>
              <Withdrawal />
            </PrivateRoute>
          }
        />

        {/* Admin Dashboard (protected) */}
        <Route
          path="/admin"
          element={
            <PrivateRoute adminOnly={true}>
              <AdminDashboard />
            </PrivateRoute>
          }
        />

        {/* Redirect old /dashboard route to /newdashboard */}
        <Route path="/dashboard" element={<Navigate to="/newdashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;