import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import SignupPage from "./components/SignupPage";
import LoginPage from "./components/LoginPage";
import NewDashboard from "./pages/NewDashboard";   // ✅ use the new dashboard file
import AdminDashboard from "./pages/AdminDashboard"; // ✅ import admin dashboard
import PrivateRoute from "./PrivateRoute";

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

        {/* New Dashboard (protected) */}
        <Route
          path="/newdashboard"
          element={
            <PrivateRoute>
              <NewDashboard />
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
