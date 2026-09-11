import React, { useState, useEffect, useRef } from "react";
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
  faUserPlus,
  faFilter,
  faBan,
  faCheck,
  faTriangleExclamation,
  faClipboardCheck,
  faPlus,
  faCoins,
  faStar,
  faRightFromBracket,
  faSpinner,
  faPlay,
  faTv,
  faLightbulb,
  faSparkles
} from "@fortawesome/free-solid-svg-icons";
import "./AdminDashboard.css";

// --- EarnWithGrace Logo using Orange Accents & faShieldHalved ---
const EarnWithGraceLogo = () => (
  <div className="ewg-logo-container">
    <FontAwesomeIcon icon={faShieldHalved} style={{ color: "#ff5500", fontSize: "2rem" }} />
    <div className="ewg-brand-text">
      <span className="brand-primary">EarnWith<span className="brand-highlight">Grace</span></span>
      <span className="brand-sub">ADMIN DASHBOARD</span>
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

// --- 2050 Neural Chart 1: Spline Area Chart ---
const UserGrowthChart = ({ users }) => {
  const points = [20, 35, 45, 60, 55, 80, 95];
  return (
    <div className="chart-box">
      <div className="chart-header">
        <h4><FontAwesomeIcon icon={faUsers} /> User Engagement Signups</h4>
        <span className="live-pill">LIVE MATRIX</span>
      </div>
      <div className="chart-svg-wrapper">
        <svg viewBox="0 0 500 150" className="futuristic-svg">
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff5500" stopOpacity="0.5"/>
              <stop offset="100%" stopColor="#ff5500" stopOpacity="0.0"/>
            </linearGradient>
          </defs>
          <path d="M 0,150 L 0,110 Q 70,80 140,100 T 280,60 T 420,30 L 500,10 L 500,150 Z" fill="url(#areaGradient)" />
          <path d="M 0,110 Q 70,80 140,100 T 280,60 T 420,30 L 500,10" fill="none" stroke="#ff5500" strokeWidth="3" />
          {points.map((pt, i) => (
            <circle key={i} cx={i * 80 + 10} cy={140 - pt} r="4" fill="#ffffff" stroke="#ff5500" strokeWidth="2" />
          ))}
        </svg>
      </div>
      <div className="chart-labels">
        <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
      </div>
    </div>
  );
};

// --- 2050 Neural Chart 2: Holographic Bar Chart ---
const SurveyMetricsChart = ({ surveys }) => {
  const activeCount = surveys.filter(s => s.status === "Active").length || 5;
  const pendingCount = surveys.filter(s => s.status === "Pending").length || 3;
  const flaggedCount = surveys.filter(s => s.status === "Flagged").length || 1;

  return (
    <div className="chart-box">
      <div className="chart-header">
        <h4><FontAwesomeIcon icon={faClipboardCheck} /> Survey Completion Matrix</h4>
        <span className="live-pill">REALTIME AUDIT</span>
      </div>
      <div className="bar-chart-container">
        <div className="bar-group">
          <div className="bar-wrapper">
            <div className="bar active-bar" style={{ height: `${Math.min(activeCount * 15 + 20, 100)}%` }}></div>
          </div>
          <span>Active ({activeCount})</span>
        </div>
        <div className="bar-group">
          <div className="bar pending-bar" style={{ height: `${Math.min(pendingCount * 15 + 20, 100)}%` }}></div>
          <span>Pending ({pendingCount})</span>
        </div>
        <div className="bar-group">
          <div className="bar flagged-bar" style={{ height: `${Math.min(flaggedCount * 15 + 20, 100)}%` }}></div>
          <span>Flagged ({flaggedCount})</span>
        </div>
      </div>
    </div>
  );
};

// --- 2050 Neural Chart 3: Radial Ads Monetization Ring ---
const AdMonetizationChart = ({ ads }) => {
  return (
    <div className="chart-box">
      <div className="chart-header">
        <h4><FontAwesomeIcon icon={faTv} /> Watch Ad Stream Distribution</h4>
        <span className="live-pill">REVENUE GRID</span>
      </div>
      <div className="radial-chart-wrapper">
        <svg viewBox="0 0 100 100" className="radial-svg">
          <circle cx="50" cy="50" r="40" stroke="#1e293b" strokeWidth="12" fill="none" />
          <circle cx="50" cy="50" r="40" stroke="#ff5500" strokeWidth="12" fill="none" strokeDasharray="180 250" strokeDashoffset="0" />
          <circle cx="50" cy="50" r="40" stroke="#f59e0b" strokeWidth="12" fill="none" strokeDasharray="60 250" strokeDashoffset="-180" />
        </svg>
        <div className="radial-center-text">
          <span className="percentage">84%</span>
          <span className="label">Ad Yield</span>
        </div>
      </div>
    </div>
  );
};

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

  // Middle Page Modal Notification State (Matching Console Error Video Alert)
  const [activeNotificationModal, setActiveNotificationModal] = useState(null);

  // Ad Watcher Interactive Simulator State
  const [watchingAd, setWatchingAd] = useState(false);
  const [adTimer, setAdTimer] = useState(0);
  const [selectedAd, setSelectedAd] = useState(null);

  // Dynamic Ad Posting Form State
  const [adTitle, setAdTitle] = useState("");
  const [adReward, setAdReward] = useState("");
  const [adUrl, setAdUrl] = useState("");

  // UI & Search States
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoading, setActionLoading] = useState({});

  // Dynamic Forms State
  const [surveyTitle, setSurveyTitle] = useState("");
  const [surveyPoints, setSurveyPoints] = useState("");
  const [questions, setQuestions] = useState([{ text: "", options: ["", ""] }]);
  const [rewardUpdate, setRewardUpdate] = useState({ userId: "", pointsAmount: "" });

  const navigate = useNavigate();
  const prevNotifCountRef = useRef(0);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  const setKeyLoading = (key, val) => {
    setActionLoading((prev) => ({ ...prev, [key]: val }));
  };

  // Trigger Center Page Modal Notification
  const triggerCenterNotification = (msg, style = "warning") => {
    setActiveNotificationModal({ message: msg, style });
  };

  // --- Handlers for Watch Ad Dynamic Reward System ---
  const handleStartWatchAd = (ad) => {
    setSelectedAd(ad);
    setWatchingAd(true);
    setAdTimer(10);
  };

  useEffect(() => {
    let interval = null;
    if (watchingAd && adTimer > 0) {
      interval = setInterval(() => {
        setAdTimer((prev) => prev - 1);
      }, 1000);
    } else if (watchingAd && adTimer === 0) {
      clearInterval(interval);
      setWatchingAd(false);
      claimAdReward();
    }
    return () => clearInterval(interval);
  }, [watchingAd, adTimer]);

  const claimAdReward = async () => {
    if (!currentUserData?.uid) {
      triggerCenterNotification("Ad completed! 50 Grace Points (GP) earned.", "info");
      return;
    }
    try {
      const userRef = ref(db, `users/${currentUserData.uid}`);
      const userSnap = await get(userRef);
      const currentPts = userSnap.val()?.gracePoints || 0;
      const newPts = currentPts + 50;

      await update(userRef, { gracePoints: newPts });
      await push(ref(db, "notifications"), {
        type: "AD_REWARD",
        message: `Watch Ad Reward: 50 GP claimed successfully!`,
        timestamp: Date.now(),
        read: false
      });
      triggerCenterNotification("Congratulations! 50 Grace Points added to your account balance.", "info");
    } catch (err) {
      triggerCenterNotification(`Ad Reward Error: ${err.message}`, "error");
    }
  };

  // --- Post Ad Handler ---
  const handleAdSubmit = async (e) => {
    e.preventDefault();
    if (!adTitle.trim()) return;

    const rewardVal = parseInt(adReward, 10) || 50;
    const newAd = {
      title: adTitle.trim(),
      reward: rewardVal,
      videoUrl: adUrl.trim() || "https://www.w3schools.com/html/mov_bbb.mp4",
      createdAt: Date.now(),
      status: "Active"
    };

    setKeyLoading("ad-submit", true);
    try {
      await push(ref(db, "ads"), newAd);
      await push(ref(db, "notifications"), {
        type: "AD_CREATED",
        message: `New Ad Stream "${adTitle}" posted with ${rewardVal} GP reward.`,
        timestamp: Date.now(),
        read: false
      });

      setAdTitle("");
      setAdReward("");
      setAdUrl("");
      triggerCenterNotification("New Sponsored Ad Stream posted successfully!", "info");
    } catch (err) {
      triggerCenterNotification(`Error posting ad: ${err.message}`, "error");
    } finally {
      setKeyLoading("ad-submit", false);
    }
  };

  // --- Handlers for Dynamic Question and Option Builder ---
  const handleAddQuestion = () => setQuestions((prev) => [...prev, { text: "", options: ["", ""] }]);

  const handleRemoveQuestion = (qIndex) => {
    if (questions.length === 1) return;
    setQuestions((prev) => prev.filter((_, idx) => idx !== qIndex));
  };

  const handleQuestionTextChange = (qIndex, value) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[qIndex].text = value;
      return updated;
    });
  };

  const handleAddOption = (qIndex) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[qIndex].options.push("");
      return updated;
    });
  };

  const handleRemoveOption = (qIndex, oIndex) => {
    setQuestions((prev) => {
      const updated = [...prev];
      if (updated[qIndex].options.length <= 2) {
        triggerCenterNotification("Each question must have at least 2 options.", "warning");
        return prev;
      }
      updated[qIndex].options = updated[qIndex].options.filter((_, idx) => idx !== oIndex);
      return updated;
    });
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[qIndex].options[oIndex] = value;
      return updated;
    });
  };

  // Auth & Admin Check
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const adminEmail = "sa9362673@gmail.com";

        if (user.email === adminEmail) {
          setCurrentUserData({ uid: user.uid, email: user.email, photoURL: user.photoURL, name: "Super Admin" });
          setAuthorized(true);
          setLoading(false);
          return;
        }

        try {
          const userSnap = await get(ref(db, `users/${user.uid}`));
          const userData = userSnap.val();

          if (userData && (userData.role === "admin" || userData.isAdmin === true)) {
            setCurrentUserData({ uid: user.uid, ...userData, email: user.email, photoURL: user.photoURL });
            setAuthorized(true);
          } else {
            triggerCenterNotification("Access denied: You do not have administrative privileges.", "error");
            await signOut(auth);
            navigate("/login");
          }
        } catch (err) {
          await signOut(auth);
          navigate("/login");
        }
      } else {
        navigate("/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  // Realtime Firebase DB Subscriptions
  useEffect(() => {
    if (!authorized) return;

    const usersUnsub = onValue(ref(db, "users"), (snapshot) => {
      const data = snapshot.val();
      setUsers(data ? Object.keys(data).map((key) => ({ id: key, ...data[key] })) : []);
    });

    const surveysUnsub = onValue(ref(db, "surveys"), (snapshot) => {
      const data = snapshot.val();
      setSurveys(data ? Object.keys(data).map((key) => ({ id: key, ...data[key] })) : []);
    });

    const adsUnsub = onValue(ref(db, "ads"), (snapshot) => {
      const data = snapshot.val();
      setAds(data ? Object.keys(data).map((key) => ({ id: key, ...data[key] })) : [
        { id: "ad1", title: "Cyberpunk VR Survey Promo", reward: 50 },
        { id: "ad2", title: "EarnWithGrace Global Stream", reward: 75 }
      ]);
    });

    const notifUnsub = onValue(ref(db, "notifications"), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const notifList = Object.keys(data)
          .map((key) => ({ id: key, ...data[key] }))
          .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        const unreadCount = notifList.filter((n) => !n.read).length;
        if (unreadCount > prevNotifCountRef.current && prevNotifCountRef.current !== 0) {
          triggerCenterNotification(notifList[0]?.message || "New notification received!", "warning");
        }
        prevNotifCountRef.current = unreadCount;
        setNotifications(notifList);
      } else {
        setNotifications([]);
      }
    });

    return () => {
      usersUnsub();
      surveysUnsub();
      adsUnsub();
      notifUnsub();
    };
  }, [authorized]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error.message);
    }
  };

  const updateUserStatus = async (userId, status) => {
    setKeyLoading(`user-${userId}`, true);
    try {
      await update(ref(db, `users/${userId}`), { status });
      triggerCenterNotification(`User status updated to ${status}`, "info");
    } catch (err) {
      triggerCenterNotification(`Failed to update user status: ${err.message}`, "error");
    } finally {
      setKeyLoading(`user-${userId}`, false);
    }
  };

  const updateSurveyStatus = async (id, status) => {
    setKeyLoading(`survey-${id}`, true);
    try {
      await update(ref(db, `surveys/${id}`), { status });
      triggerCenterNotification(`Survey status updated to ${status}`, "info");
    } catch (err) {
      triggerCenterNotification(`Failed to update survey status: ${err.message}`, "error");
    } finally {
      setKeyLoading(`survey-${id}`, false);
    }
  };

  const handleSurveySubmit = async (e) => {
    e.preventDefault();
    const pointsVal = parseInt(surveyPoints, 10) || 0;

    const formattedQuestions = questions
      .filter((q) => q.text.trim() !== "")
      .map((q, idx) => ({
        id: idx + 1,
        text: q.text.trim(),
        options: q.options.map((opt) => opt.trim()).filter((opt) => opt !== "")
      }));

    if (formattedQuestions.length === 0) {
      triggerCenterNotification("Please enter at least one question.", "warning");
      return;
    }

    const newSurvey = {
      title: surveyTitle.trim(),
      points: pointsVal,
      questions: formattedQuestions,
      createdAt: Date.now(),
      status: "Active"
    };

    setKeyLoading("survey-submit", true);
    try {
      await push(ref(db, "surveys"), newSurvey);
      await push(ref(db, "notifications"), {
        type: "SURVEY_CREATED",
        message: `New Survey "${surveyTitle}" published with ${pointsVal} GP reward.`,
        timestamp: Date.now(),
        read: false
      });

      setSurveyTitle("");
      setSurveyPoints("");
      setQuestions([{ text: "", options: ["", ""] }]);
      triggerCenterNotification("New Survey published successfully!", "info");
    } catch (err) {
      triggerCenterNotification(`Error creating survey: ${err.message}`, "error");
    } finally {
      setKeyLoading("survey-submit", false);
    }
  };

  const handleRewardSubmit = async (e) => {
    e.preventDefault();
    const { userId, pointsAmount } = rewardUpdate;
    if (!userId || !pointsAmount) {
      triggerCenterNotification("Please select a user and enter point value.", "warning");
      return;
    }

    setKeyLoading("reward-submit", true);
    try {
      const userRef = ref(db, `users/${userId}`);
      const userSnap = await get(userRef);
      const currentPoints = userSnap.val()?.gracePoints || 0;
      const addedPoints = parseInt(pointsAmount, 10);
      const updatedTotal = currentPoints + addedPoints;

      await update(userRef, { gracePoints: updatedTotal });
      await push(ref(db, "notifications"), {
        type: "POINTS_CREDITED",
        message: `Credited ${addedPoints} GP to User ID: ${userId}.`,
        timestamp: Date.now(),
        read: false
      });

      setRewardUpdate({ userId: "", pointsAmount: "" });
      triggerCenterNotification(`Successfully credited ${addedPoints} Grace Points!`, "info");
    } catch (err) {
      triggerCenterNotification(`Error updating rewards: ${err.message}`, "error");
    } finally {
      setKeyLoading("reward-submit", false);
    }
  };

  if (loading) {
    return (
      <div className="cyber-loading-screen">
        <FontAwesomeIcon icon={faShieldHalved} className="loading-icon spin" />
        <h2>Authenticating Neural Portal...</h2>
      </div>
    );
  }

  return (
    <div className="admin-dashboard futuristic-theme">
      {/* SIDEBAR OVERLAY FOR MOBILE */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}

      {/* --- CENTER PAGE NOTIFICATION MODAL (MATCHING DEV CONSOLE VIDEO) --- */}
      {activeNotificationModal && (
        <div className="center-notif-backdrop" onClick={() => setActiveNotificationModal(null)}>
          <div 
            className={`center-notif-card ${activeNotificationModal.style === "warning" ? "warning-style" : activeNotificationModal.style === "info" ? "info-style" : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            <FontAwesomeIcon 
              icon={activeNotificationModal.style === "error" ? faTriangleExclamation : faShieldHalved} 
              style={{ fontSize: "1.5rem" }} 
            />
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: "0 0 4px 0", fontWeight: "bold", fontSize: "0.95rem" }}>
                {activeNotificationModal.style === "error" ? "System Alert" : "Neural Alert"}
              </h4>
              <p style={{ margin: 0, fontSize: "0.85rem" }}>{activeNotificationModal.message}</p>
            </div>
            <button 
              onClick={() => setActiveNotificationModal(null)}
              style={{ background: "transparent", border: "none", color: "currentColor", cursor: "pointer" }}
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
        </div>
      )}

      {/* SIDEBAR NAVIGATION */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div>
          <EarnWithGraceLogo />
          <nav className="sidebar-nav">
            <a href="#dashboard" className="active">
              <FontAwesomeIcon icon={faShieldHalved} className="nav-icon" /> Dashboard
            </a>
            <a href="#users">
              <FontAwesomeIcon icon={faUsers} className="nav-icon" /> User Management
            </a>
            <a href="#surveys">
              <FontAwesomeIcon icon={faClipboardCheck} className="nav-icon" /> Surveys & Tasks
            </a>
            <a href="#ads">
              <FontAwesomeIcon icon={faRectangleAd} className="nav-icon" /> Watch Ads Manager
            </a>
            <a href="#settings">
              <FontAwesomeIcon icon={faGear} className="nav-icon" /> System Config
            </a>
          </nav>
        </div>

        <div className="sidebar-bottom">
          <div className="user-profile">
            <img 
              src={currentUserData?.photoURL || "https://ui-avatars.com/api/?name=Admin&background=ff5500&color=fff"} 
              alt="Profile" 
            />
            <div className="profile-info">
              <h4>{currentUserData?.name || "Super Admin"}</h4>
              <p>{currentUserData?.email}</p>
            </div>
            <button className="logout-btn" onClick={handleLogout} title="Sign Out">
              <FontAwesomeIcon icon={faRightFromBracket} />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="main-content">
        <header className="header">
          <div className="header-title">
            <button className="menu-toggle" onClick={toggleSidebar}>
              <FontAwesomeIcon icon={faBars} />
            </button>
            <h2>
              <FontAwesomeIcon icon={faShieldHalved} style={{ color: "#ff5500" }} /> Admin Neural Hub 
              <span className="version-tag">v2050.8</span>
            </h2>
          </div>

          <div className="header-actions">
            <div className="search-wrapper">
              <FontAwesomeIcon icon={faMagnifyingGlass} className="search-icon" />
              <input 
                type="text" 
                placeholder="Search matrix records..." 
                className="search-bar"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Notification Menu */}
            <div className="notification-container">
              <button className="notification-btn" onClick={() => setShowNotifMenu(!showNotifMenu)}>
                <FontAwesomeIcon icon={faBell} />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="notification-dot">{notifications.filter(n => !n.read).length}</span>
                )}
              </button>

              {showNotifMenu && (
                <div className="notification-dropdown">
                  <div className="notif-header">
                    <h4>Neural System Log</h4>
                  </div>
                  <div className="notif-list">
                    {notifications.length === 0 ? (
                      <div className="notif-empty">No new system alerts</div>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className={`notif-item ${!n.read ? "unread" : ""}`}>
                          <p>{n.message}</p>
                          <small>{new Date(n.timestamp).toLocaleTimeString()}</small>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* SUMMARY STATS GRID */}
        <div className="summary-cards">
          <StatCard title="Active Users" value={users.length} subtext="+12% from last cycle" icon={faUsers} theme="orange" />
          <StatCard title="Active Surveys" value={surveys.length} subtext="Live in feed" icon={faClipboardCheck} theme="purple" />
          <StatCard title="Watch Ad Yield" value={`${ads.length} Streams`} subtext="84% completion rate" icon={faTv} theme="amber" />
          <StatCard title="Total GP Credited" value="1.24M GP" subtext="Distributed system-wide" icon={faCoins} theme="green" />
        </div>

        {/* 2050 CHARTS SECTION */}
        <div className="charts-grid-section">
          <UserGrowthChart users={users} />
          <SurveyMetricsChart surveys={surveys} />
          <AdMonetizationChart ads={ads} />
        </div>

        {/* WATCH ADS MANAGEMENT SECTION */}
        <section id="ads" className="admin-section">
          <h3><FontAwesomeIcon icon={faRectangleAd} style={{ color: "#ff5500" }} /> Watch Ads Stream Portal</h3>
          <p className="sub-heading">Post dynamic ads for users to view and earn Grace Points (GP).</p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
            <form onSubmit={handleAdSubmit} className="reward-form">
              <h4>Post New Ad Stream</h4>
              <input 
                type="text" 
                placeholder="Ad Campaign Title" 
                className="cyber-input"
                value={adTitle}
                onChange={(e) => setAdTitle(e.target.value)}
                required 
              />
              <input 
                type="number" 
                placeholder="Reward Points (GP)" 
                className="cyber-input"
                value={adReward}
                onChange={(e) => setAdReward(e.target.value)}
                required 
              />
              <input 
                type="url" 
                placeholder="Video Stream URL (MP4 / WebM)" 
                className="cyber-input"
                value={adUrl}
                onChange={(e) => setAdUrl(e.target.value)}
              />
              <button type="submit" className="create-btn" disabled={actionLoading["ad-submit"]}>
                {actionLoading["ad-submit"] ? <FontAwesomeIcon icon={faSpinner} className="spin" /> : <FontAwesomeIcon icon={faPlus} />} Post Ad
              </button>
            </form>

            {/* AD WATCH PREVIEWER / SIMULATOR */}
            <div className="ad-card" style={{ justifyContent: "center" }}>
              <h4>Live Watch Ad Test Window</h4>
              {watchingAd ? (
                <div style={{ textAlign: "center", padding: "1rem" }}>
                  <p style={{ color: "#ff5500", fontWeight: "bold" }}>Streaming Ad: {selectedAd?.title}</p>
                  <p style={{ fontSize: "2rem", fontWeight: "800" }}>{adTimer}s remaining</p>
                </div>
              ) : (
                <p style={{ fontSize: "0.85rem", color: "var(--text-dim)" }}>
                  Select an active ad stream below to simulate ad viewing and reward disbursement.
                </p>
              )}
            </div>
          </div>

          <div className="ads-grid">
            {ads.map((ad) => (
              <div key={ad.id} className="ad-card">
                <div className="ad-preview">
                  <FontAwesomeIcon icon={faPlay} className="play-icon" />
                  <span className="ad-badge">+{ad.reward || 50} GP</span>
                </div>
                <h4>{ad.title}</h4>
                <p>Status: <span style={{ color: "#10b981" }}>Active</span></p>
                <button 
                  className="watch-ad-btn"
                  onClick={() => handleStartWatchAd(ad)}
                  disabled={watchingAd}
                >
                  <FontAwesomeIcon icon={faPlay} /> {watchingAd && selectedAd?.id === ad.id ? "Watching..." : "Simulate Ad Watch"}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* SURVEY & REWARD MANAGEMENT SECTION */}
        <section id="surveys" className="admin-section">
          <h3><FontAwesomeIcon icon={faClipboardCheck} style={{ color: "#ff5500" }} /> Neural Survey & Task Creator</h3>
          <p className="sub-heading">Build multi-question questionnaires and disburse reward points.</p>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.5rem" }}>
            <form onSubmit={handleSurveySubmit} className="survey-form">
              <h4>Create New Survey</h4>
              <input 
                type="text" 
                placeholder="Survey Title" 
                className="cyber-input"
                value={surveyTitle}
                onChange={(e) => setSurveyTitle(e.target.value)}
                required
              />
              <div className="points-input-group">
                <input 
                  type="number" 
                  placeholder="Points Reward (GP)" 
                  className="cyber-input"
                  value={surveyPoints}
                  onChange={(e) => setSurveyPoints(e.target.value)}
                  required
                />
                <span>Grace Points</span>
              </div>

              {questions.map((q, qIndex) => (
                <div key={qIndex} className="question-box">
                  <div className="q-header">
                    <span>Question {qIndex + 1}</span>
                    {questions.length > 1 && (
                      <button type="button" onClick={() => handleRemoveQuestion(qIndex)} className="remove-btn">
                        Remove Question
                      </button>
                    )}
                  </div>
                  <input 
                    type="text" 
                    placeholder="Enter question prompt..." 
                    className="cyber-input"
                    value={q.text}
                    onChange={(e) => handleQuestionTextChange(qIndex, e.target.value)}
                    required
                  />

                  {q.options.map((opt, oIndex) => (
                    <div key={oIndex} className="opt-row">
                      <input 
                        type="text" 
                        placeholder={`Option ${oIndex + 1}`} 
                        className="cyber-input"
                        value={opt}
                        onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                        required
                      />
                      {q.options.length > 2 && (
                        <button type="button" onClick={() => handleRemoveOption(qIndex, oIndex)} className="remove-opt">
                          <FontAwesomeIcon icon={faXmark} />
                        </button>
                      )}
                    </div>
                  ))}

                  <button type="button" onClick={() => handleAddOption(qIndex)} className="add-opt-btn">
                    + Add Option
                  </button>
                </div>
              ))}

              <div style={{ display: "flex", gap: "1rem" }}>
                <button type="button" onClick={handleAddQuestion} className="secondary-btn">
                  + Add Another Question
                </button>
                <button type="submit" className="create-btn" disabled={actionLoading["survey-submit"]}>
                  {actionLoading["survey-submit"] ? <FontAwesomeIcon icon={faSpinner} className="spin" /> : <FontAwesomeIcon icon={faPlus} />} Publish Survey
                </button>
              </div>
            </form>

            {/* MANUAL REWARD DISBURSEMENT FORM */}
            <form onSubmit={handleRewardSubmit} className="reward-form">
              <h4>Direct GP Disbursement</h4>
              <select 
                className="cyber-input"
                value={rewardUpdate.userId}
                onChange={(e) => setRewardUpdate({ ...rewardUpdate, userId: e.target.value })}
                required
              >
                <option value="">Select User Target...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name || u.email || u.id}</option>
                ))}
              </select>

              <input 
                type="number" 
                placeholder="Grace Points (GP) Amount" 
                className="cyber-input"
                value={rewardUpdate.pointsAmount}
                onChange={(e) => setRewardUpdate({ ...rewardUpdate, pointsAmount: e.target.value })}
                required
              />

              <button type="submit" className="create-btn" disabled={actionLoading["reward-submit"]}>
                {actionLoading["reward-submit"] ? <FontAwesomeIcon icon={faSpinner} className="spin" /> : <FontAwesomeIcon icon={faCoins} />} Credit Points
              </button>
            </form>
          </div>
        </section>

        {/* USER MANAGEMENT SECTION */}
        <section id="users" className="admin-section">
          <h3><FontAwesomeIcon icon={faUsers} style={{ color: "#ff5500" }} /> System User Registry</h3>
          <p className="sub-heading">Manage registered accounts and assign role privileges.</p>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>User Profile</th>
                  <th>Role</th>
                  <th>Grace Points</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="user-detail-cell">
                        <img 
                          src={u.photoURL || `https://ui-avatars.com/api/?name=${u.name || "User"}&background=ff5500&color=fff`} 
                          alt="Avatar" 
                        />
                        <div>
                          <span className="user-name">{u.name || "Anonymous User"}</span>
                          <span className="user-email">{u.email || u.id}</span>
                        </div>
                      </div>
                    </td>
                    <td><span className="role-pill">{u.role || "User"}</span></td>
                    <td style={{ fontWeight: "700", color: "#ff5500" }}>{u.gracePoints || 0} GP</td>
                    <td>
                      <span className={`status-badge ${u.status === "suspended" ? "suspended" : "active"}`}>
                        {u.status || "active"}
                      </span>
                    </td>
                    <td>
                      <div className="action-group">
                        <button 
                          className="icon-action approve" 
                          onClick={() => updateUserStatus(u.id, "active")}
                          title="Activate Account"
                        >
                          <FontAwesomeIcon icon={faCheck} />
                        </button>
                        <button 
                          className="icon-action suspend" 
                          onClick={() => updateUserStatus(u.id, "suspended")}
                          title="Suspend Account"
                        >
                          <FontAwesomeIcon icon={faBan} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

export default AdminDashboard;
