import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { ref, onValue, update, push, get, remove } from "firebase/database";
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
  faTrash
} from "@fortawesome/free-solid-svg-icons";
import "./NewDashboard.css";

// --- STRICT 4-LETTER WORD POOL FOR GRACE + 4-LETTER NAME GENERATOR ---
const STRICT_FOUR_LETTER_WORDS = [
  "Star", "Moon", "Lion", "Bear", "Wolf", "Hawk", "Peak", "Wave",
  "Glow", "Apex", "Ruby", "Jade", "Onyx", "Zeal", "Hero", "Nova",
  "Echo", "Bolt", "Flux", "Soul", "Epic", "Aura", "King", "Duke"
];

const generateRandomGraceName = () => {
  const randomIndex = Math.floor(Math.random() * STRICT_FOUR_LETTER_WORDS.length);
  const randomFourLetterWord = STRICT_FOUR_LETTER_WORDS[randomIndex];
  return `Grace${randomFourLetterWord}`;
};

// Generates a unique SVG Avatar URL based on user identifier (never exposes raw email)
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

  // Custom Toast Banner State (Replaces native alerts)
  const [toast, setToast] = useState(null); // { message: '', type: 'info' | 'error' | 'success' }

  // User & Firebase Data State
  const [currentUserData, setCurrentUserData] = useState(null);
  const [randomGraceName, setRandomGraceName] = useState("");
  const [surveys, setSurveys] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [watchingAd, setWatchingAd] = useState(null);

  // Track completed surveys locally for green check and 1-min removal schedule
  const [completedSurveyIds, setCompletedSurveyIds] = useState([]);
  const [removedSurveyIds, setRemovedSurveyIds] = useState([]);

  // Notification Menu Toggle
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  // Survey Modal State
  const [activeSurvey, setActiveSurvey] = useState(null);
  const [surveyAnswers, setSurveyAnswers] = useState({});
  const [submittingSurvey, setSubmittingSurvey] = useState(false);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  // Show dynamic toast notification replacing native alert()
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

          // Assign and store unique display name if not present
          let assignedName = data.name;
          if (!assignedName) {
            assignedName = generateRandomGraceName();
            await update(userRef, { name: assignedName });
          }

          setRandomGraceName(assignedName);

          // Check & Reset Daily Survey Count if 24 Hours Have Passed
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
    return randomGraceName || "GraceStar";
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

  const handleClearNotifications = async () => {
    try {
      await remove(ref(db, "notifications"));
      setNotifications([]);
      showToast("Notifications cleared!", "info");
    } catch (err) {
      console.error("Error clearing notifications:", err);
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

  // Open survey check
  const handleOpenSurvey = (survey) => {
    const currentCompleted = currentUserData?.dailySurveysCompleted || 0;
    if (currentCompleted >= DAILY_SURVEY_LIMIT) {
      showToast("You have reached your daily limit of 3 surveys! Please come back tomorrow.", "info");
      return;
    }
    setActiveSurvey(survey);
  };

  // Complete Survey with Daily Limit Logic & 1-Minute Removal Timer
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

      // Show green check mark immediately
      setCompletedSurveyIds((prev) => [...prev, completedSurveyId]);

      // Remove survey from view after 1 minute without altering user data
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

  // Filter out surveys matching search term and those removed after 1 minute
  const filteredSurveys = surveys
    .filter((s) => !removedSurveyIds.includes(s.id))
    .filter((s) => s.title?.toLowerCase().includes(searchTerm.toLowerCase()));

  const surveysDoneToday = currentUserData?.dailySurveysCompleted || 0;

  // Calculate survey question progress for line range indicator inside modal
  const totalQuestionsInActive = activeSurvey?.questions?.length || 0;
  const answeredCountInActive = Object.keys(surveyAnswers).length;
  const activeSurveyProgress = totalQuestionsInActive > 0 ? Math.round((answeredCountInActive / totalQuestionsInActive) * 100) : 0;

  return (
    <div className="new-dashboard-container">
      {/* Dynamic Floating Toast Notification */}
      {toast && (
        <div 
          className={`cyber-toast ${toast.type}`}
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            zIndex: 9999,
            backgroundColor: toast.type === "success" ? "#10B981" : toast.type === "error" ? "#EF4444" : "#3B82F6",
            color: "#FFFFFF",
            padding: "12px 20px",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontWeight: "bold",
            fontSize: "0.9rem",
            maxWidth: "90vw",
            animation: "fadeIn 0.3s ease"
          }}
        >
          <FontAwesomeIcon icon={toast.type === "success" ? faCheckCircle : faInfoCircle} />
          <span>{toast.message}</span>
        </div>
      )}

      {sidebarOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-top">
          {/* LOGO WITH ORANGE SHIELD ICON */}
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
            {/* UNIQUE USER AVATAR */}
            <div className="avatar-box" style={{ padding: 0, overflow: "hidden", background: "transparent", flexShrink: 0 }}>
              <img 
                src={avatarUrl} 
                alt={displayName} 
                style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }} 
              />
            </div>
            {/* Displaying Grace + 4 letter random name without raw email text */}
            <div className="profile-info" style={{ minWidth: 0, flex: 1 }}>
              <h4 style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%", margin: 0 }}>{displayName}</h4>
              <p style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%", margin: 0, fontSize: "0.8rem", color: "#9ca3af" }}>Verified Member</p>
            </div>
            <button onClick={handleLogout} className="logout-btn" title="Logout" style={{ flexShrink: 0 }}>
              <FontAwesomeIcon icon={faRightFromBracket} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="header">
          <div className="header-title" style={{ minWidth: 0, flex: 1 }}>
            <button className="menu-toggle" onClick={toggleSidebar} aria-label="Toggle Menu">
              <FontAwesomeIcon icon={sidebarOpen ? faXmark : faBars} />
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, width: "100%" }}>
              <img 
                src={avatarUrl} 
                alt={displayName} 
                style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#1f2937", flexShrink: 0 }} 
              />
              <div style={{ minWidth: 0, flex: 1 }}>
                <h2 style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "6px", margin: 0, width: "100%" }}>
                  <span className="user-name-text" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "180px", display: "inline-block" }}>{displayName}</span>
                </h2>
                <p style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0, fontSize: "0.85rem" }}>Hail GraceTorh</p>
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

            {/* ENHANCED NOTIFICATION MENU */}
            <div className="notification-container">
              <button 
                className="notification-btn" 
                onClick={handleToggleNotifMenu} 
                title="Notifications" 
                aria-label="Notifications"
              >
                <FontAwesomeIcon icon={faBell} />
                {unreadNotifsCount > 0 && (
                  <span className="notification-dot">{unreadNotifsCount}</span>
                )}
              </button>

              {showNotifMenu && (
                <div className="notif-dropdown">
                  <div className="notif-header">
                    <h4>Notifications ({notifications.length})</h4>
                    {notifications.length > 0 && (
                      <button className="clear-notifs-btn" onClick={handleClearNotifications}>
                        <FontAwesomeIcon icon={faTrash} /> Clear All
                      </button>
                    )}
                  </div>

                  <div className="notif-list">
                    {notifications.length === 0 ? (
                      <div className="no-notifs">No notifications yet</div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`notif-item ${!n.read ? "unread" : ""}`}
                          onClick={() => handleNotifClick(n)}
                        >
                          <div className="notif-text">{n.message}</div>
                          <div className="notif-time">
                            {n.timestamp ? new Date(n.timestamp).toLocaleTimeString() : "Just now"}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
