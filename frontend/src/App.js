import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import SignupPage from "./components/SignupPage";
import LoginPage from "./components/LoginPage";
import EmailOtpReset from "./pages/EmailOtpReset";
import NewDashboard from "./pages/NewDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import PrivateRoute from "./PrivateRoute";
import Withdrawal from "./components/withdrawal";

// New Page Imports
import AboutUs from "./pages/AboutUs";
import WatchAds from "./pages/WatchAds";
import Surveys from "./pages/Surveys";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/about-us" element={<AboutUs />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<EmailOtpReset />} />

        {/* Earning Pages (Protected so only logged-in users can earn) */}
        <Route
          path="/watch-ads"
          element={
            <PrivateRoute>
              <WatchAds />
            </PrivateRoute>
          }
        />
        <Route
          path="/surveys"
          element={
            <PrivateRoute>
              <Surveys />
            </PrivateRoute>
          }
        />

        {/* Dashboard & User Actions */}
        <Route
          path="/newdashboard"
          element={
            <PrivateRoute>
              <NewDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/withdrawal"
          element={
            <PrivateRoute>
              <Withdrawal />
            </PrivateRoute>
          }
        />

        {/* Admin Dashboard */}
        <Route
          path="/admin"
          element={
            <PrivateRoute adminOnly={true}>
              <AdminDashboard />
            </PrivateRoute>
          }
        />

        {/* Fallback Redirects */}
        <Route path="/dashboard" element={<Navigate to="/newdashboard" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
