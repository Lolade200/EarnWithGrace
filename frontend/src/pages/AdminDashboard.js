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

// --- EarnWithGrace SVG Logo ---
const EarnWithGraceLogo = () => (
  <div className="ewg-logo-container">
    <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cyberGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id="primaryGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#4338ca" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="45" stroke="url(#cyberGlow)" strokeWidth="4" fill="rgba(10, 20, 35, 0.6)" />
      <path d="M30 35 L50 20 L70 35 L50 50 Z" fill="url(#cyberGlow)" opacity="0.9" />
      <path d="M30 50 L50 65 L70 50 L50 80 Z" fill="url(#primaryGlow)" />
    </svg>
    <div className="ewg-brand-text">
      <span className="brand-primary">EarnWith<span className="brand-highlight">Grace</span></span>
      <span className="brand-sub">2050 NEURAL DASHBOARD</span>
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
        <h4><FontAwesomeIcon icon={faUsers} /> User Engagement & Neural Signups (2050)</h4>
        <span className="live-pill">LIVE MATRIX</span>
      </div>
      <div className="chart-svg-wrapper">
        <svg viewBox="0 0 500 150" className="futuristic-svg">
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.5"/>
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0"/>
            </linearGradient>
          </defs>
          <path d="M 0,150 L 0,110 Q 70,80 140,100 T 280,60 T 420,30 L 500,10 L 500,150 Z" fill="url(#areaGradient)" />
          <path d="M 0,110 Q 70,80 140,100 T 280,60 T 420,30 L 500,10" fill="none" stroke="#3b82f6" strokeWidth="3" />
          {points.map((pt, i) => (
            <circle key={i} cx={i * 80 + 10} cy={140 - pt} r="4" fill="#ffffff" stroke="#3b82f6" strokeWidth="2" />
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
          <circle cx="50" cy="50" r="40" stroke="#3b82f6" strokeWidth="12" fill="none" strokeDasharray="180 250" strokeDashoffset="0" />
          <circle cx="50" cy="50" r="40" stroke="#8b5cf6" strokeWidth="12" fill="none" strokeDasharray="60 250" strokeDashoffset="-180" />
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

  // --- Handlers for Watch Ad Dynamic Reward System ---
  const handleStartWatchAd = (ad) => {
    setSelectedAd(ad);
    setWatchingAd(true);
    setAdTimer(10); // 10-second countdown demo
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
      alert("Ad completed! 50 Grace Points (GP) earned.");
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
      alert("Congratulations! 50 Grace Points added to your account balance.");
    } catch (err) {
      console.error("Ad Reward Error:", err);
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
      alert("New Sponsored Ad Stream posted successfully!");
    } catch (err) {
      alert(`Error posting ad: ${err.message}`);
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
        alert("Each question must have at least 2 options.");
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

  // 1. Auth & Admin Role Check
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
            alert("Access denied: You do not have administrative privileges.");
            await signOut(auth);
            navigate("/login");
          }
        } catch (err) {
          console.error("Authorization check failed:", err);
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

  // 2. Realtime Firebase DB Subscriptions
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
        { id: "ad1", title: "Cyberpunk 2050 VR Survey Promo", reward: 50 },
        { id: "ad2", title: "EarnWithGrace Global Node Stream", reward: 75 }
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
          try {
            const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
            audio.play().catch(() => {});
          } catch (e) {}
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
    } catch (err) {
      alert(`Failed to update user status: ${err.message}`);
    } finally {
      setKeyLoading(`user-${userId}`, false);
    }
  };

  const updateSurveyStatus = async (id, status) => {
    setKeyLoading(`survey-${id}`, true);
    try {
      await update(ref(db, `surveys/${id}`), { status });
    } catch (err) {
      alert(`Failed to update survey status: ${err.message}`);
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
      alert("Please enter at least one question.");
      return;
    }

    const surveyData = {
      title: surveyTitle,
      questions: formattedQuestions,
      questionsCount: formattedQuestions.length,
      gracePoints: pointsVal,
      reward: `₦${pointsVal}`,
      status: "Active",
      createdAt: Date.now()
    };

    setKeyLoading("survey-submit", true);
    try {
      await push(ref(db, "surveys"), surveyData);
      await push(ref(db, "notifications"), {
        type: "SURVEY_CREATED",
        message: `New task "${surveyTitle}" posted with ${formattedQuestions.length} question(s) and ${pointsVal} GP.`,
        timestamp: Date.now(),
        read: false
      });

      setSurveyTitle("");
      setSurveyPoints("");
      setQuestions([{ text: "", options: ["", ""] }]);
      alert("Task/Survey successfully posted to 2050 Neural Dashboard!");
    } catch (err) {
      alert(`Error creating survey: ${err.message}`);
    } finally {
      setKeyLoading("survey-submit", false);
    }
  };

  const updateUserRewards = async (e) => {
    e.preventDefault();
    if (!rewardUpdate.userId || !rewardUpdate.pointsAmount) return;

    const targetUser = users.find((u) => u.id === rewardUpdate.userId);
    const currentPoints = targetUser?.gracePoints || targetUser?.rewards || 0;
    const addedPoints = parseInt(rewardUpdate.pointsAmount, 10);
    const newTotal = Math.max(0, currentPoints + addedPoints);

    setKeyLoading("reward-submit", true);
    try {
      await update(ref(db, `users/${rewardUpdate.userId}`), {
        gracePoints: newTotal,
        rewards: newTotal
      });

      await push(ref(db, "notifications"), {
        type: "REWARD_UPDATED",
        message: `Updated points for ${targetUser?.name || "User"}: +${addedPoints} GP (Total: ${newTotal} GP)`,
        timestamp: Date.now(),
        read: false
      });

      setRewardUpdate({ userId: "", pointsAmount: "" });
      alert("Grace Points updated successfully!");
    } catch (err) {
      alert(`Error updating points: ${err.message}`);
    } finally {
      setKeyLoading("reward-submit", false);
    }
  };

  const markNotificationRead = (id) => {
    update(ref(db, `notifications/${id}`), { read: true });
  };

  if (loading) {
    return (
      <div className="cyber-loading-screen">
        <FontAwesomeIcon icon={faSpinner} spin className="loading-icon" />
        <h2>INITIALIZING NEURAL INTERFACE 2050...</h2>
      </div>
    );
  }

  if (!authorized) return null;

  const totalUsersCount = users.length;
  const totalSurveysCount = surveys.length;
  const flaggedSurveysCount = surveys.filter((s) => s.status === "Flagged").length;
  const totalAdsCount = ads.length;
  const unreadNotifsCount = notifications.filter((n) => !n.read).length;

  const systemMetrics = [
    { title: "Registered Accounts", value: totalUsersCount.toLocaleString(), subtext: "+12% Active Nodes", icon: faUsers, theme: "blue" },
    { title: "Surveys Posted", value: totalSurveysCount.toLocaleString(), subtext: "Active & Monitored", icon: faClipboardCheck, theme: "purple" },
    { title: "Moderation Alerts", value: flaggedSurveysCount.toLocaleString(), subtext: "Needs Review", icon: faTriangleExclamation, theme: "amber" },
    { title: "Monetized Ad Streams", value: totalAdsCount.toLocaleString(), subtext: "EarnWithGrace Ad Grid", icon: faTv, theme: "green" },
  ];

  const searchLower = searchTerm.toLowerCase();
  const filteredUsers = users.filter((u) => u.name?.toLowerCase().includes(searchLower) || u.email?.toLowerCase().includes(searchLower));

  return (
    <div className="admin-dashboard futuristic-theme">
      {sidebarOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}

      {/* Navigation Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-top">
          <EarnWithGraceLogo />
          <nav className="sidebar-nav">
            <a href="#overview" className="active">
              <FontAwesomeIcon icon={faChartColumn} className="nav-icon" /> Neural Matrix
            </a>
            <a href="#watch-ads">
              <FontAwesomeIcon icon={faTv} className="nav-icon" /> Watch & Earn Ads
            </a>
            <a href="#users">
              <FontAwesomeIcon icon={faUsers} className="nav-icon" /> User Accounts
            </a>
            <a href="#create-survey">
              <FontAwesomeIcon icon={faPlus} className="nav-icon" /> Create Survey
            </a>
            <a href="#audit">
              <FontAwesomeIcon icon={faClipboardCheck} className="nav-icon" /> Survey Moderation
            </a>
            <a href="#rewards">
              <FontAwesomeIcon icon={faCoins} className="nav-icon" /> Grace Points
            </a>
          </nav>
        </div>

        <div className="sidebar-bottom">
          <div className="user-profile">
            <img src={currentUserData?.photoURL || "https://via.placeholder.com/50"} alt="Admin Profile" />
            <div className="profile-info">
              <h4>{currentUserData?.name || "System Admin"}</h4>
              <p>{currentUserData?.email}</p>
            </div>
            <button onClick={handleLogout} className="logout-btn" title="Logout">
              <FontAwesomeIcon icon={faRightFromBracket} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="header">
          <div className="header-title">
            <button className="menu-toggle" onClick={toggleSidebar} aria-label="Toggle navigation">
              <FontAwesomeIcon icon={sidebarOpen ? faXmark : faBars} />
            </button>
            <div>
              <h2>System Control Center <span className="version-tag">v2050.4</span></h2>
              <p>EarnWithGrace Neural Intelligence & Survey Management Engine</p>
            </div>
          </div>

          <div className="header-actions">
            <div className="search-wrapper">
              <FontAwesomeIcon icon={faMagnifyingGlass} className="search-icon" />
              <input
                type="text"
                placeholder="Search users, tasks, surveys..."
                className="search-bar"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="notification-container">
              <button className="notification-btn" onClick={() => setShowNotifMenu(!showNotifMenu)}>
                <FontAwesomeIcon icon={faBell} />
                {unreadNotifsCount > 0 && <span className="notification-dot">{unreadNotifsCount}</span>}
              </button>

              {showNotifMenu && (
                <div className="notification-dropdown">
                  <div className="notif-header">
                    <h4>Neural Activity Log ({unreadNotifsCount})</h4>
                  </div>
                  <div className="notif-list">
                    {notifications.length === 0 ? (
                      <p className="notif-empty">No activity records found.</p>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className={`notif-item ${n.read ? "read" : "unread"}`} onClick={() => markNotificationRead(n.id)}>
                          <p>{n.message}</p>
                          <small>{n.timestamp ? new Date(n.timestamp).toLocaleTimeString() : "Just now"}</small>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Summary Cards */}
        <section className="summary-cards" id="overview">
          {systemMetrics.map((metric, idx) => (
            <StatCard key={idx} {...metric} />
          ))}
        </section>

        {/* --- VISUAL CHARTS SECTION --- */}
        <section className="charts-grid-section">
          <UserGrowthChart users={users} />
          <SurveyMetricsChart surveys={surveys} />
          <AdMonetizationChart ads={ads} />
        </section>

        {/* --- POST NEW AD STREAM FORM --- */}
        <section className="admin-section" id="post-ad">
          <h3><FontAwesomeIcon icon={faTv} /> Post New Sponsored Ad</h3>
          <p className="sub-heading">Publish targeted video or image ads directly to the user watch stream grid.</p>
          <form onSubmit={handleAdSubmit} className="survey-form">
            <input
              type="text"
              placeholder="Ad Title (e.g., Cyberpunk 2050 AI Promo)"
              value={adTitle}
              onChange={(e) => setAdTitle(e.target.value)}
              required
              className="cyber-input"
            />
            <input
              type="number"
              placeholder="Grace Points Reward (e.g., 50)"
              value={adReward}
              onChange={(e) => setAdReward(e.target.value)}
              required
              className="cyber-input"
            />
            <input
              type="url"
              placeholder="Media Video URL (e.g., https://...)"
              value={adUrl}
              onChange={(e) => setAdUrl(e.target.value)}
              className="cyber-input"
            />
            <button type="submit" className="create-btn" disabled={actionLoading["ad-submit"]}>
              <FontAwesomeIcon icon={actionLoading["ad-submit"] ? faSpinner : faPlus} spin={actionLoading["ad-submit"]} /> Publish Ad Stream
            </button>
          </form>
        </section>

        {/* --- WATCH ADS & EARN GRACE POINTS HUB --- */}
        <section className="admin-section watch-ads-section" id="watch-ads">
          <div className="table-header">
            <div>
              <h3><FontAwesomeIcon icon={faTv} /> Watch Ad Stream & Earn Node</h3>
              <p className="sub-heading">Simulate watching sponsored video ads to credit Grace Points directly to accounts.</p>
            </div>
          </div>

          <div className="ads-grid">
            {ads.map((ad) => (
              <div key={ad.id} className="ad-card">
                <div className="ad-preview">
                  <FontAwesomeIcon icon={faPlay} className="play-icon" />
                  <span className="ad-badge">+{ad.reward || 50} GP</span>
                </div>
                <h4>{ad.title || "Featured Sponsored Ad"}</h4>
                <p>Watch full ad stream to instantly credit Grace Points.</p>
                <button className="watch-ad-btn" onClick={() => handleStartWatchAd(ad)} disabled={watchingAd}>
                  <FontAwesomeIcon icon={faPlay} /> {watchingAd && selectedAd?.id === ad.id ? `Watching (${adTimer}s)` : "Watch Ad Stream"}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* User Management Section */}
        <section className="admin-section" id="users">
          <div className="table-header">
            <div>
              <h3>User Accounts & Node Entities</h3>
              <p className="sub-heading">Manage security profiles, access level roles, and Grace Points balances.</p>
            </div>
            <div className="header-buttons">
              <button className="secondary-btn"><FontAwesomeIcon icon={faFilter} /> Filter</button>
              <button className="create-btn"><FontAwesomeIcon icon={faUserPlus} /> Add User</button>
            </div>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>User Details</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Grace Points Balance</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", padding: "1.5rem" }}>No users found.</td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div className="user-detail-cell">
                          <img src={u.photoURL || "https://via.placeholder.com/40"} alt={u.name || "User"} />
                          <div>
                            <span className="user-name">{u.name || "N/A"}</span>
                            <span className="user-email">{u.email || "N/A"}</span>
                          </div>
                        </div>
                      </td>
                      <td><span className="role-pill">{u.role || "User"}</span></td>
                      <td>
                        <span className={`status-badge ${u.status?.toLowerCase() || "active"}`}>
                          {u.status || "Active"}
                        </span>
                      </td>
                      <td>
                        <strong>{u.gracePoints || u.rewards || 0} GP</strong> (₦{u.gracePoints || u.rewards || 0})
                      </td>
                      <td>
                        <div className="action-group">
                          <button
                            className="icon-action approve"
                            onClick={() => updateUserStatus(u.id, "Active")}
                            disabled={actionLoading[`user-${u.id}`]}
                          >
                            <FontAwesomeIcon icon={actionLoading[`user-${u.id}`] ? faSpinner : faCheck} spin={actionLoading[`user-${u.id}`]} />
                          </button>
                          <button
                            className="icon-action suspend"
                            onClick={() => updateUserStatus(u.id, "Suspended")}
                            disabled={actionLoading[`user-${u.id}`]}
                          >
                            <FontAwesomeIcon icon={actionLoading[`user-${u.id}`] ? faSpinner : faBan} spin={actionLoading[`user-${u.id}`]} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Dynamic Create Survey Form */}
        <section className="admin-section" id="create-survey">
          <h3>Create New Task / Survey</h3>
          <p className="sub-heading">Build multi-question surveys with dynamic choices and Grace Points rewards.</p>
          <form onSubmit={handleSurveySubmit} className="survey-form">
            <input
              type="text"
              placeholder="Task / Survey Title (e.g. Consumer Shopping Habits 2050)"
              value={surveyTitle}
              onChange={(e) => setSurveyTitle(e.target.value)}
              required
              className="cyber-input"
            />

            <input
              type="number"
              placeholder="Reward Points (GP)"
              value={surveyPoints}
              onChange={(e) => setSurveyPoints(e.target.value)}
              required
              className="cyber-input"
            />

            {questions.map((q, qIndex) => (
              <div key={qIndex} className="question-box">
                <div className="q-header">
                  <strong>Question {qIndex + 1}</strong>
                  {questions.length > 1 && (
                    <button type="button" className="remove-btn" onClick={() => handleRemoveQuestion(qIndex)}>Remove</button>
                  )}
                </div>

                <input
                  type="text"
                  placeholder={`Question ${qIndex + 1} prompt`}
                  value={q.text}
                  onChange={(e) => handleQuestionTextChange(qIndex, e.target.value)}
                  required
                  className="cyber-input"
                />

                <div className="options-list">
                  {q.options.map((opt, oIndex) => (
                    <div key={oIndex} className="opt-row">
                      <input
                        type="text"
                        placeholder={`Option ${oIndex + 1}`}
                        value={opt}
                        onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                        required
                        className="cyber-input"
                      />
                      <button
                        type="button"
                        className="remove-opt-btn"
                        onClick={() => handleRemoveOption(qIndex, oIndex)}
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                  <button type="button" className="secondary-btn add-opt-btn" onClick={() => handleAddOption(qIndex)}>
                    + Add Option
                  </button>
                </div>
              </div>
            ))}

            <div className="form-actions">
              <button type="button" className="secondary-btn" onClick={handleAddQuestion}>
                <FontAwesomeIcon icon={faPlus} /> Add Question
              </button>
              <button type="submit" className="create-btn" disabled={actionLoading["survey-submit"]}>
                <FontAwesomeIcon icon={actionLoading["survey-submit"] ? faSpinner : faPlus} spin={actionLoading["survey-submit"]} /> Create Task
              </button>
            </div>
          </form>
        </section>

        {/* Grace Points Update Section */}
        <section className="admin-section" id="rewards">
          <h3>Manage User Grace Points Balance</h3>
          <p className="sub-heading">Manually add or adjust user reward point balances.</p>
          <form onSubmit={updateUserRewards} className="reward-form">
            <select
              value={rewardUpdate.userId}
              onChange={(e) => setRewardUpdate({ ...rewardUpdate, userId: e.target.value })}
              required
              className="cyber-input"
            >
              <option value="">Select User Account...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name || u.email} ({u.gracePoints || u.rewards || 0} GP)
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Amount to add (e.g. 100 or -50)"
              value={rewardUpdate.pointsAmount}
              onChange={(e) => setRewardUpdate({ ...rewardUpdate, pointsAmount: e.target.value })}
              required
              className="cyber-input"
            />
            <button type="submit" className="create-btn" disabled={actionLoading["reward-submit"]}>
              <FontAwesomeIcon icon={actionLoading["reward-submit"] ? faSpinner : faCoins} spin={actionLoading["reward-submit"]} /> Update Points
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}

export default AdminDashboard;
