import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { ref, onValue, update, push, get } from "firebase/database";
import { signOut } from "firebase/auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faXmark,
  faCoins,
  faTv,
  faClipboardCheck,
  faBell,
  faPlay,
  faRightFromBracket,
  faSpinner,
  faUser,
  faWandMagicSparkles,
  faSearch,
  faClipboardQuestion,
  faPenToSquare,
  faShieldHalved,
  faCheckCircle,
  faInfoCircle,
  faCheckDouble
} from "@fortawesome/free-solid-svg-icons";
import "./NewDashboard.css";

// --- EXPANDED RANDOM "GRACE" USERNAME GENERATOR ---
const EXPANDED_WORD_POOL = [
  "Lion", "Bear", "Falcon", "Panther", "Eagle", "Wolf", "Jaguar", "Phoenix", "Tiger", "Dolphin", "Otter", "Cheetah",
  "Andromeda", "Orion", "Sirius", "Polaris", "Nebula", "Cosmos", "Vega", "Pulsar", "MilkyWay", "Nova", "Quasar",
  "Brazil", "Japan", "Canada", "Norway", "Egypt", "Spain", "Kenya", "Greece", "Peru", "France",
  "Anchor", "Compass", "Shield", "Prism", "Scepter", "Crystal", "Emerald", "Sapphire", "Diamond", "Beacon",
  "Thunder", "Eclipse", "Horizon", "Summit", "Tempest", "Vortex", "Glacier", "Solace", "Valiance", "Zenith"
];

const generateRandomGraceName = (uid = "") => {
  const randomIndex = Math.floor(Math.random() * EXPANDED_WORD_POOL.length);
  const randomWord = EXPANDED_WORD_POOL[randomIndex];
  const uniqueSuffix = uid ? uid.substring(0, 4) : Math.floor(1000 + Math.random() * 9000);
  return `Grace${randomWord}_${uniqueSuffix}`;
};

const getUserAvatarUrl = (identifier) => {
  const seed = encodeURIComponent(identifier || "default_user");
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`;
};

const DAILY_SURVEY_LIMIT = 3;

export default function NewDashboard() {
  const navigate = useNavigate();

  // Navigation & Responsiveness State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("surveys");
  const [loading, setLoading] = useState(true);

  // Custom Toast Banner State
  const [toast, setToast] = useState(null);

  // User & Firebase Data State
  const [currentUserData, setCurrentUserData] = useState(null);
  const [randomGraceName, setRandomGraceName] = useState("");
  const [surveys, setSurveys] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [watchingAd, setWatchingAd] = useState(null);

  // Track completed surveys locally
  const [completedSurveyIds, setCompletedSurveyIds] = useState([]);
  const [removedSurveyIds, setRemovedSurveyIds] = useState([]);

  // Notification Menu Toggle
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  // Survey Modal State
  const [activeSurvey, setActiveSurvey] = useState(null);
  const [surveyAnswers, setSurveyAnswers] = useState({});
  const [submittingSurvey, setSubmittingSurvey] = useState(false);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  const showToast = (message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const userRef = ref(db, `users/${user.uid}`);
          const userSnap = await get(userRef);
          const data = userSnap.val() || {};

          let assignedName = data.name;
          if (!assignedName) {
            assignedName = generateRandomGraceName(user.uid);
            await update(userRef, { name: assignedName });
          }

          setRandomGraceName(assignedName);

          const now = Date.now();
          const lastDate = data.lastSurveyDate || 0;
          const isSameDay = new Date(now).toDateString() === new Date(lastDate).toDateString();

          const completionsToday = isSameDay ? (data.dailySurveysCompleted || 0) : 0;

          setCurrentUserData({ 
            uid: user.uid, 
            email: user.email, 
            ...data,
            name: assignedName,
            dailySurveysCompleted: completionsToday
          });
        } catch (err) {
          console.error("User fetch error:", err);
        }
      } else {
        navigate("/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!currentUserData?.uid) return;

    const userUnsub = onValue(ref(db, `users/${currentUserData.uid}`), (snapshot) => {
      const val = snapshot.val();
      if (val) {
        const now = Date.now();
        const lastDate = val.lastSurveyDate || 0;
        const isSameDay = new Date(now).toDateString() === new Date(lastDate).toDateString();
        const completionsToday = isSameDay ? (val.dailySurveysCompleted || 0) : 0;

        setCurrentUserData((prev) => ({ 
          ...prev, 
          ...val, 
          dailySurveysCompleted: completionsToday 
        }));
      }
    });

    const surveysUnsub = onValue(ref(db, "surveys"), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const surveyList = Object.keys(data)
          .map((key) => ({ id: key, ...data[key] }))
          .filter((s) => s.status === "Active" || !s.status);
        setSurveys(surveyList);
      } else {
        setSurveys([
          {
            id: "survey_demo_1",
            title: "Customer Feedback & Usage Survey",
            gracePoints: 100,
            description: "Provide feedback on your experience using our platform to help us improve.",
            estimatedTime: "3 mins",
            questions: [
              { id: "q1", text: "How often do you use our dashboard?", options: ["Daily", "Weekly", "Monthly"] },
              { id: "q2", text: "What feature would you like to see next?", options: ["Instant Payouts", "More Ads", "Referral Bonuses"] }
            ]
          }
        ]);
      }
    });

    const notifUnsub = onValue(ref(db, "notifications"), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const notifList = Object.keys(data)
          .map((key) => ({ id: key, ...data[key] }))
          .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setNotifications(notifList);
      } else {
        setNotifications([]);
      }
    });

    return () => {
      userUnsub();
      surveysUnsub();
      notifUnsub();
    };
  }, [currentUserData?.uid]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Logout Error:", error.message);
    }
  };

  const getEffectiveDisplayName = () => {
    if (currentUserData?.name) {
      return currentUserData.name;
    }
    return randomGraceName || "GraceUser";
  };

  const handleOptionSelect = (questionId, optionValue) => {
    setSurveyAnswers((prev) => ({
      ...prev,
      [questionId]: optionValue
    }));
  };

  const handleNotifClick = async (notif) => {
    if (notif.read) return;

    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
    );

    try {
      await update(ref(db, `notifications/${notif.id}`), { read: true });
    } catch (err) {
      console.error("Error updating notification read status:", err);
    }
  };

  const handleToggleNotifMenu = () => {
    const nextState = !showNotifMenu;
    setShowNotifMenu(nextState);

    if (nextState) {
      notifications.forEach((n) => {
        if (!n.read) {
          handleNotifClick(n);
        }
      });
    }
  };

  const handleWatchAd = async (adReward, adTitle) => {
    if (!currentUserData?.uid) return;
    setWatchingAd(adTitle);

    setTimeout(async () => {
      try {
        const userRef = ref(db, `users/${currentUserData.uid}`);
        const userSnap = await get(userRef);
        const currentPts = userSnap.val()?.gracePoints || userSnap.val()?.rewards || 0;
        const newPts = currentPts + adReward;

        await update(userRef, { gracePoints: newPts, rewards: newPts });

        const activeDisplayName = getEffectiveDisplayName();
        await push(ref(db, "notifications"), {
          type: "AD_WATCHED",
          message: `${activeDisplayName} watched "${adTitle}" and earned +${adReward} GP!`,
          timestamp: Date.now(),
          read: false
        });

        showToast(`Ad Completed! You earned +${adReward} Grace Points.`, "success");
      } catch (err) {
        showToast(`Error rewarding ad: ${err.message}`, "error");
      } finally {
        setWatchingAd(null);
      }
    }, 3000);
  };

  const handleOpenSurvey = (survey) => {
    const currentCompleted = currentUserData?.dailySurveysCompleted || 0;
    if (currentCompleted >= DAILY_SURVEY_LIMIT) {
      showToast("You have reached your daily limit of 3 surveys! Please come back tomorrow.", "info");
      return;
    }
    setActiveSurvey(survey);
  };

  const handleCompleteSurvey = async (e) => {
    e.preventDefault();
    if (!activeSurvey || !currentUserData?.uid) return;

    const currentCompleted = currentUserData?.dailySurveysCompleted || 0;
    if (currentCompleted >= DAILY_SURVEY_LIMIT) {
      showToast("Daily limit reached! You can only complete 3 surveys per day.", "info");
      setActiveSurvey(null);
      return;
    }

    setSubmittingSurvey(true);
    const rewardGP = parseInt(activeSurvey.gracePoints, 10) || 50;
    const activeDisplayName = getEffectiveDisplayName();
    const completedSurveyId = activeSurvey.id;

    try {
      const userRef = ref(db, `users/${currentUserData.uid}`);
      const userSnap = await get(userRef);
      const currentPts = userSnap.val()?.gracePoints || userSnap.val()?.rewards || 0;
      const newPts = currentPts + rewardGP;
      const updatedDailyCount = currentCompleted + 1;

      await update(userRef, { 
        gracePoints: newPts, 
        rewards: newPts,
        dailySurveysCompleted: updatedDailyCount,
        lastSurveyDate: Date.now()
      });

      await push(ref(db, `surveyCompletions/${activeSurvey.id}`), {
        userId: currentUserData.uid,
        userName: activeDisplayName,
        answers: surveyAnswers,
        completedAt: Date.now()
      });

      await push(ref(db, "notifications"), {
        type: "SURVEY_COMPLETED",
        message: `${activeDisplayName} completed survey "${activeSurvey.title}" and earned +${rewardGP} GP!`,
        timestamp: Date.now(),
        read: false
      });

      setCompletedSurveyIds((prev) => [...prev, completedSurveyId]);

      setTimeout(() => {
        setRemovedSurveyIds((prev) => [...prev, completedSurveyId]);
      }, 60000);

      showToast(`Survey Submitted! You earned +${rewardGP} GP. (${updatedDailyCount}/${DAILY_SURVEY_LIMIT} completed today)`, "success");
      setActiveSurvey(null);
      setSurveyAnswers({});
    } catch (err) {
      console.error("Survey Submit Error:", err);
      showToast(`Failed to submit survey: ${err.message}`, "error");
    } finally {
      setSubmittingSurvey(false);
    }
  };

  if (loading) {
    return (
      <div className="cyber-loading-screen">
        <FontAwesomeIcon icon={faSpinner} spin className="loading-icon" />
        <h2>LOADING DASHBOARD...</h2>
      </div>
    );
  }

  const unreadNotifsCount = notifications.filter((n) => !n.read).length;
  const userGP = currentUserData?.gracePoints || currentUserData?.rewards || 0;
  const displayName = getEffectiveDisplayName();
  const avatarUrl = getUserAvatarUrl(currentUserData?.uid || displayName);

  const filteredSurveys = surveys
    .filter((s) => !removedSurveyIds.includes(s.id))
    .filter((s) => s.title?.toLowerCase().includes(searchTerm.toLowerCase()));

  const surveysDoneToday = currentUserData?.dailySurveysCompleted || 0;

  const totalQuestionsInActive = activeSurvey?.questions?.length || 0;
  const answeredCountInActive = Object.keys(surveyAnswers).length;
  const activeSurveyProgress = totalQuestionsInActive > 0 ? Math.round((answeredCountInActive / totalQuestionsInActive) * 100) : 0;

  return (
    <div className="new-dashboard-container" style={{ overflow: "hidden" }}>
      {/* Inline style to completely remove scrollbars site-wide */}
      <style>{`
        ::-webkit-scrollbar {
          display: none !important;
          width: 0px !important;
          height: 0px !important;
        }
        * {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
      `}</style>

      {/* Toast Notification Centered on Page */}
      {toast && (
        <div 
          className={`cyber-toast ${toast.type}`}
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 9999,
            backgroundColor: toast.type === "success" ? "#10B981" : toast.type === "error" ? "#EF4444" : "#3B82F6",
            color: "#FFFFFF",
            padding: "16px 24px",
            borderRadius: "12px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            fontWeight: "bold",
            fontSize: "1rem",
            maxWidth: "90vw",
            textAlign: "center",
            animation: "popIn 0.3s ease-out"
          }}
        >
          <FontAwesomeIcon icon={toast.type === "success" ? faCheckCircle : faInfoCircle} style={{ fontSize: "1.2rem" }} />
          <span>{toast.message}</span>
        </div>
      )}

      {/* CENTERED NOTIFICATION MODAL & OVERLAY */}
      {showNotifMenu && (
        <>
          <div 
            className="notif-modal-overlay" 
            onClick={() => setShowNotifMenu(false)}
            style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0, 0, 0, 0.6)", zIndex: 9998 }}
          />
          <div 
            className="notification-dropdown"
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "360px",
              maxWidth: "90vw",
              backgroundColor: "#111827",
              border: "1px solid #374151",
              borderRadius: "16px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(249, 115, 22, 0.2)",
              zIndex: 9999,
              overflow: "hidden",
              backdropFilter: "blur(12px)",
              animation: "fadeInScale 0.25s ease-out"
            }}
          >
            {/* Header */}
            <div 
              className="notif-header"
              style={{
                padding: "16px 20px",
                background: "linear-gradient(135deg, #1f2937 0%, #111827 100%)",
                borderBottom: "1px solid #1f2937",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <FontAwesomeIcon icon={faBell} style={{ color: "#f97316" }} />
                <h4 style={{ margin: 0, color: "#f3f4f6", fontSize: "1.05rem", fontWeight: "700" }}>Notifications</h4>
              </div>
              <button 
                className="notif-close-btn" 
                onClick={() => setShowNotifMenu(false)}
                style={{
                  background: "#1f2937",
                  border: "1px solid #374151",
                  color: "#9ca3af",
                  borderRadius: "8px",
                  width: "28px",
                  height: "28px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                ✕
              </button>
            </div>

            {/* Notifications List */}
            <div 
              className="notif-list-container"
              style={{
                maxHeight: "380px",
                overflowY: "auto",
                padding: "8px 12px"
              }}
            >
              {notifications.length === 0 ? (
                <div style={{ padding: "30px 20px", textAlign: "center", color: "#6b7280" }}>
                  <FontAwesomeIcon icon={faCheckDouble} style={{ fontSize: "2rem", marginBottom: "8px", opacity: 0.5 }} />
                  <p style={{ margin: 0, fontSize: "0.9rem" }}>No notifications yet.</p>
                </div>
              ) : (
                notifications.slice(0, 5).map((n) => {
                  let notifIcon = faBell;
                  let iconBg = "#374151";
                  let iconColor = "#f3f4f6";

                  if (n.type === "SURVEY_COMPLETED" || n.message?.toLowerCase().includes("survey")) {
                    notifIcon = faClipboardCheck;
                    iconBg = "rgba(16, 185, 129, 0.15)";
                    iconColor = "#10B981";
                  } else if (n.type === "AD_WATCHED" || n.message?.toLowerCase().includes("watched")) {
                    notifIcon = faTv;
                    iconBg = "rgba(59, 130, 246, 0.15)";
                    iconColor = "#3B82F6";
                  } else if (n.message?.toLowerCase().includes("task")) {
                    notifIcon = faCoins;
                    iconBg = "rgba(249, 115, 22, 0.15)";
                    iconColor = "#f97316";
                  }

                  return (
                    <div
                      key={n.id}
                      className={`notif-item ${!n.read ? "unread" : ""}`}
                      onClick={() => handleNotifClick(n)}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "12px",
                        padding: "12px 14px",
                        margin: "6px 0",
                        borderRadius: "10px",
                        backgroundColor: !n.read ? "rgba(249, 115, 22, 0.08)" : "#1f2937",
                        borderLeft: !n.read ? "3px solid #f97316" : "3px solid transparent",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        overflow: "hidden"
                      }}
                    >
                      <div 
                        className="notif-icon-box"
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "10px",
                          backgroundColor: iconBg,
                          color: iconColor,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          fontSize: "0.95rem"
                        }}
                      >
                        <FontAwesomeIcon icon={notifIcon} />
                      </div>

                      <div className="notif-content" style={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
                        <p style={{ margin: "0 0 4px 0", color: "#e5e7eb", fontSize: "0.88rem", lineHeight: "1.3", overflowWrap: "anywhere" }}>
                          {n.message}
                        </p>
                        <small style={{ color: "#9ca3af", fontSize: "0.75rem" }}>
                          {n.timestamp ? new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : "Just now"}
                        </small>
                      </div>

                      {!n.read && (
                        <div 
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            backgroundColor: "#f97316",
                            boxShadow: "0 0 8px #f97316",
                            flexShrink: 0,
                            marginTop: "6px"
                          }} 
                        />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}

      {sidebarOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`} style={{ overflow: "hidden" }}>
        <div className="sidebar-top">
          <div className="ewg-logo-container">
            <div className="brand-icon-box">
              <FontAwesomeIcon icon={faShieldHalved} className="logo-shield-icon" />
            </div>
            <div className="ewg-brand-text">
              <span className="brand-primary">
                EarnWith<span className="brand-highlight">Grace</span>
              </span>
              <span className="brand-sub">USER DASHBOARD</span>
            </div>
          </div>

          <nav className="sidebar-nav">
            <button
              className={activeTab === "surveys" ? "active" : ""}
              onClick={() => { setActiveTab("surveys"); setSidebarOpen(false); }}
            >
              <FontAwesomeIcon icon={faClipboardCheck} className="nav-icon" /> Surveys & Tasks
            </button>
            <button
              className={activeTab === "watch_ads" ? "active" : ""}
              onClick={() => { setActiveTab("watch_ads"); setSidebarOpen(false); }}
            >
              <FontAwesomeIcon icon={faTv} className="nav-icon" /> Watch Ads & Earn
            </button>
            <button
              className={activeTab === "wallet" ? "active" : ""}
              onClick={() => { setActiveTab("wallet"); setSidebarOpen(false); }}
            >
              <FontAwesomeIcon icon={faCoins} className="nav-icon" /> Rewards & Wallet
            </button>
          </nav>
        </div>

        <div className="sidebar-bottom">
          <div className="user-profile" style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", overflow: "hidden" }}>
            <div className="avatar-box" style={{ padding: 0, overflow: "hidden", background: "transparent", flexShrink: 0 }}>
              <img 
                src={avatarUrl} 
                alt={displayName} 
                style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }} 
              />
            </div>
            <div className="profile-info" style={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
              <h4 style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%", margin: 0 }}>{displayName}</h4>
              <p style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%", margin: 0, fontSize: "0.8rem", color: "#9ca3af" }}>{currentUserData?.email}</p>
            </div>
            <button onClick={handleLogout} className="logout-btn" title="Logout" style={{ flexShrink: 0 }}>
              <FontAwesomeIcon icon={faRightFromBracket} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content" style={{ overflow: "hidden" }}>
        <header className="header" style={{ overflow: "hidden" }}>
          <div className="header-title" style={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
            <button className="menu-toggle" onClick={toggleSidebar} aria-label="Toggle Menu">
              <FontAwesomeIcon icon={sidebarOpen ? faXmark : faBars} />
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, width: "100%", overflow: "hidden" }}>
              <img 
                src={avatarUrl} 
                alt={displayName} 
                style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#1f2937", flexShrink: 0 }} 
              />
              <div style={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
                <h2 style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "6px", margin: 0, width: "100%", overflow: "hidden" }}>
                  <span className="user-name-text" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "180px", display: "inline-block" }}>{displayName}</span>
                  <span className="version-tag" style={{ flexShrink: 0 }}>v2.0</span>
                </h2>
                <p style={{ margin: "2px 0 0 0", fontSize: "0.82rem", color: "#9ca3af", whiteSpace: "normal", wordBreak: "break-word", lineHeight: "1.2" }}>
                  All Hail Mommy Grace
                </p>
              </div>
            </div>
          </div>

          <div className="header-actions">
            <div className="search-wrapper">
              <FontAwesomeIcon icon={faSearch} className="search-icon" />
              <input
                type="text"
                placeholder="Search surveys..."
                className="search-bar"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* NOTIFICATION BUTTON */}
            <div className="notification-container" style={{ position: "relative" }}>
              <button className="notification-btn" onClick={handleToggleNotifMenu}>
                <FontAwesomeIcon icon={faBell} />
                {unreadNotifsCount > 0 && <span className="notification-dot">{unreadNotifsCount}</span>}
              </button>
            </div>
          </div>
        </header>

        {/* Balance Metrics */}
        <section className="summary-cards" style={{ overflow: "hidden" }}>
          <div className="cyber-card indigo">
            <div className="card-header">
              <span className="card-icon indigo"><FontAwesomeIcon icon={faCoins} /></span>
              <h3>Grace Points Balance</h3>
            </div>
            <p className="number">{userGP.toLocaleString()} <small style={{ fontSize: "1rem" }}>GP</small></p>
          </div>

          <div className="cyber-card orange">
            <div className="card-header">
              <span className="card-icon orange"><FontAwesomeIcon icon={faWandMagicSparkles} /></span>
              <h3>Naira Cash Value</h3>
            </div>
            <p className="number">₦{userGP.toLocaleString()}</p>
          </div>
        </section>

        {/* TAB 1: SURVEYS & TASKS */}
        {activeTab === "surveys" && (
          <section className="dashboard-section" style={{ overflow: "hidden" }}>
            <div className="section-title-bar">
              <h3><FontAwesomeIcon icon={faClipboardCheck} /> Active Surveys</h3>
              <span className={`daily-limit-badge ${surveysDoneToday >= DAILY_SURVEY_LIMIT ? "limit-reached" : ""}`}>
                Daily Limit: {surveysDoneToday}/{DAILY_SURVEY_LIMIT} Completed
              </span>
            </div>

            <div className="surveys-grid" style={{ overflow: "hidden" }}>
              {filteredSurveys.length === 0 ? (
                <p>No active surveys found.</p>
              ) : (
                filteredSurveys.map((survey, idx) => {
                  const isCompleted = completedSurveyIds.includes(survey.id);

                  return (
                    <div key={survey.id || idx} className={`survey-card ${isCompleted ? "completed-card" : ""}`} style={{ overflow: "hidden" }}>
                      <div className="survey-thumb-container">
                        <div className="survey-type-badge">{survey.category || "SURVEY"}</div>
                        
                        <div className="survey-placeholder">
                          <FontAwesomeIcon icon={faClipboardQuestion} className="placeholder-icon" />
                        </div>

                        <div className="survey-overlay-action">
                          {!isCompleted ? (
                            <button 
                              className="play-btn" 
                              onClick={() => handleOpenSurvey(survey)}
                              disabled={surveysDoneToday >= DAILY_SURVEY_LIMIT}
                            >
                              <FontAwesomeIcon icon={faPenToSquare} />
                            </button>
                          ) : (
                            <div className="green-check-badge">
                              <FontAwesomeIcon icon={faCheckCircle} style={{ color: "#10B981", fontSize: "2rem" }} />
                            </div>
                          )}
                        </div>
                        <span className="survey-time-tag">{survey.estimatedTime || `${survey.questions?.length || 1} Qs`}</span>
                      </div>

                      <div className="survey-card-details" style={{ overflow: "hidden" }}>
                        <h4 className="survey-card-title">{survey.title}</h4>
                        <p className="survey-card-desc">
                          {survey.description || "Complete this survey to share your feedback and earn Grace Points."}
                        </p>

                        <div className="survey-progress-bar-container" style={{ margin: "10px 0" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "#9ca3af", marginBottom: "4px" }}>
                            <span>Survey Progress</span>
                            <span>{isCompleted ? "100%" : "0%"}</span>
                          </div>
                          <div style={{ width: "100%", height: "6px", backgroundColor: "#374151", borderRadius: "3px", overflow: "hidden" }}>
                            <div 
                              style={{ 
                                width: isCompleted ? "100%" : "0%", 
                                height: "100%", 
                                backgroundColor: isCompleted ? "#10B981" : "#f97316", 
                                transition: "width 0.4s ease" 
                              }} 
                            />
                          </div>
                        </div>

                        <div className="survey-card-footer">
                          <div className="survey-reward-pill">
                            <FontAwesomeIcon icon={faCoins} /> +{survey.gracePoints || 50} GP
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
