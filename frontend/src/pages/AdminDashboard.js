import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { ref, onValue, update, push, get } from "firebase/database";
import { signOut } from "firebase/auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faShieldHalved,
  faUsers,
  faChartColumn,
  faRectangleAd,
  faGear,
  faMagnifyingGlass,
  faBell,
  faBars,
  faXmark,
  faEllipsisVertical,
  faClipboardCheck,
  faPlus,
  faRightFromBracket,
  faSpinner,
  faPlay,
  faTv,
  faSparkles
} from "@fortawesome/free-solid-svg-icons";
import "./AdminDashboard.css";

// --- EarnWithGrace SVG Logo ---
const EarnWithGraceLogo = () => (
  <div className="ewg-logo-container">
    <FontAwesomeIcon icon={faShieldHalved} className="ewg-logo-icon" />
    <div className="ewg-brand-text">
      <span className="brand-primary">EarnWith<span className="brand-highlight">Grace</span></span>
      <span className="brand-sub">ADMIN PANEL</span>
    </div>
  </div>
);

// --- Sub-components ---
const StatCard = ({ title, value, subtext, icon, theme }) => (
  <div className={`cyber-card ${theme}`}>
    <div className="card-header">
      <span className={`card-icon ${theme}`}>
        <FontAwesomeIcon icon={icon} />
      </span>
      <h3>{title}</h3>
      <button className="more-btn" aria-label="Options">
        <FontAwesomeIcon icon={faEllipsisVertical} />
      </button>
    </div>
    <p className="number">{value}</p>
    <div className="card-footer">
      <span>{subtext}</span>
    </div>
  </div>
);

function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [currentUserData, setCurrentUserData] = useState(null);

  // Data Collections
  const [users, setUsers] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [ads, setAds] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Ad Posting State
  const [adTitle, setAdTitle] = useState("");
  const [adReward, setAdReward] = useState("");
  const [adUrl, setAdUrl] = useState("");

  // UI States
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoading, setActionLoading] = useState({});

  const navigate = useNavigate();

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  // 1. Auth & Admin Role Check
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        // Explicit set for requested Admin Name
        setCurrentUserData({ 
          uid: user.uid, 
          email: user.email, 
          photoURL: user.photoURL, 
          name: "Adebayo Samson" 
        });
        setAuthorized(true);
        setLoading(false);
      } else {
        navigate("/login");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // 2. Realtime Subscriptions
  useEffect(() => {
    if (!authorized) return;

    const usersUnsub = onValue(ref(db, "users"), (snapshot) => {
      const data = snapshot.val();
      setUsers(data ? Object.keys(data).map((key) => ({ id: key, ...data[key] })) : []);
    });

    const notifUnsub = onValue(ref(db, "notifications"), (snapshot) => {
      const data = snapshot.val();
      setNotifications(data ? Object.keys(data).map((key) => ({ id: key, ...data[key] })) : []);
    });

    return () => {
      usersUnsub();
      notifUnsub();
    };
  }, [authorized]);

  if (loading) {
    return (
      <div className="cyber-loading-screen">
        <FontAwesomeIcon icon={faShieldHalved} className="loading-icon" />
        <h3>Initializing Neural Admin Dashboard...</h3>
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <div className="admin-dashboard futuristic-theme">
      {sidebarOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div>
          <EarnWithGraceLogo />
          <nav className="sidebar-nav">
            <a href="#overview" className="active"><FontAwesomeIcon icon={faChartColumn} className="nav-icon" /> Dashboard</a>
            <a href="#users"><FontAwesomeIcon icon={faUsers} className="nav-icon" /> User Management</a>
            <a href="#surveys"><FontAwesomeIcon icon={faClipboardCheck} className="nav-icon" /> Survey Builder</a>
            <a href="#ads"><FontAwesomeIcon icon={faRectangleAd} className="nav-icon" /> Watch Ads</a>
            <a href="#settings"><FontAwesomeIcon icon={faGear} className="nav-icon" /> Settings</a>
          </nav>
        </div>

        <div className="sidebar-bottom">
          <div className="user-profile">
            <img src={currentUserData?.photoURL || "https://via.placeholder.com/40"} alt="Admin Avatar" />
            <div className="profile-info">
              <h4>{currentUserData?.name || "Adebayo Samson"}</h4>
              <p>{currentUserData?.email}</p>
            </div>
            <button className="logout-btn" onClick={() => signOut(auth)} title="Logout">
              <FontAwesomeIcon icon={faRightFromBracket} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="header">
          <div className="header-title">
            <h2>
              <button className="menu-toggle" onClick={toggleSidebar} aria-label="Toggle Navigation">
                <FontAwesomeIcon icon={sidebarOpen ? faXmark : faBars} />
              </button>
              Welcome, Adebayo Samson
              <span className="version-tag">V2050.4</span>
            </h2>
            <p>EarnWithGrace Neural Intelligence & Admin Management Console</p>
          </div>

          <div className="header-actions">
            <div className="search-wrapper">
              <FontAwesomeIcon icon={faMagnifyingGlass} className="search-icon" />
              <input
                type="text"
                className="search-bar"
                placeholder="Search matrix..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Notification Button with 50% Border Radius & Centered Modal */}
            <div className="notification-container">
              <button
                className="notification-btn"
                onClick={() => setShowNotifMenu((prev) => !prev)}
                aria-label="Notifications"
              >
                <FontAwesomeIcon icon={faBell} />
                {notifications.some((n) => !n.read) && <span className="notification-dot"></span>}
              </button>

              {showNotifMenu && (
                <>
                  <div className="notif-backdrop" onClick={() => setShowNotifMenu(false)} />
                  <div className="notification-dropdown">
                    <div className="notif-header">
                      <h4><FontAwesomeIcon icon={faBell} /> System Notifications</h4>
                      <button className="logout-btn" onClick={() => setShowNotifMenu(false)}>
                        <FontAwesomeIcon icon={faXmark} />
                      </button>
                    </div>
                    <div className="notif-list">
                      {notifications.length === 0 ? (
                        <div className="notif-empty">No active notifications</div>
                      ) : (
                        notifications.slice(0, 4).map((n) => (
                          <div key={n.id} className={`notif-item ${!n.read ? "unread" : ""}`}>
                            <p>{n.message}</p>
                            <small>{new Date(n.timestamp).toLocaleTimeString()}</small>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Dashboard Overview Cards */}
        <section id="overview" className="summary-cards">
          <StatCard title="Total Users" value={users.length} subtext="+12% this week" icon={faUsers} theme="blue" />
          <StatCard title="Active Surveys" value={surveys.length} subtext="Realtime Matrix" icon={faClipboardCheck} theme="purple" />
          <StatCard title="Ad Streams" value={ads.length} subtext="High Monetization" icon={faTv} theme="amber" />
          <StatCard title="System Yield" value="98.4%" subtext="Optimal Performance" icon={faSparkles} theme="green" />
        </section>
      </main>
    </div>
  );
}

export default AdminDashboard;
