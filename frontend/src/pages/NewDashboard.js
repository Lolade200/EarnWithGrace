
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
  faInfoCircle
} from "@fortawesome/free-solid-svg-icons";
import "./NewDashboard.css";

// --- RANDOM "GRACE" USERNAME GENERATOR (EXACTLY THREE-LETTER WORDS) ---
const THREE_LETTER_WORDS = [
  "Sun", "Sky", "Cat", "Dog", "Fox", "Owl", "Bee", "Ant", "Bat", "Cow",
  "Pig", "Rat", "Ape", "Eel", "Hen", "Jay", "Koi", "Yak", "Cod", "Cub",
  "Cub", "Fawn", "Kid", "Pup", "Ram", "Stag", "Tuna", "Wren", "Ash", "Bay",
  "Dew", "Elm", "Fern", "Fir", "Fog", "Ice", "Ivy", "Leaf", "Mist", "Moon",
  "Moss", "Oak", "Pine", "Rain", "Reef", "Rock", "Root", "Sand", "Sea", "Snow",
  "Star", "Stem", "Stone", "Storm", "Stream", "Tree", "Vine", "Wave", "Wind", "Wood",
  "Ace", "Arc", "Bolt", "Core", "Crown", "Cube", "Edge", "Gems", "Gold", "Key",
  "Loop", "Node", "Orbit", "Peer", "Pulse", "Ring", "Ruby", "Spark", "Sync", "Volt"
];

const generateRandomGraceName = (uid = "") => {
  const randomIndex = Math.floor(Math.random() * THREE_LETTER_WORDS.length);
  const randomWord = THREE_LETTER_WORDS[randomIndex];
  const uniqueSuffix = uid ? uid.substring(0, 4) : Math.floor(1000 + Math.random() * 9000);
  return `Grace${randomWord}_${uniqueSuffix}`;
};

// Generates a unique SVG Avatar URL for each user
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

  // Survey Complete Pop-out Reward Modal State
  const [surveyRewardPopup, setSurveyRewardPopup] = useState(null); // { title: '', reward: 0 }

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
            assignedName = generateRandomGraceName(user.uid);
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

    // Fetch user-specific notifications so users only see their own notification items
    const notifUnsub = onValue(ref(db, "notifications"), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const notifList = Object.keys(data)
          .map((key) => ({ id: key, ...data[key] }))
          .filter((n) => !n.userId || n.userId === currentUserData.uid)
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
          userId: currentUserData.uid,
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
    const surveyTitle = activeSurvey.title;

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
        userId: currentUserData.uid,
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

      // Close survey modal first, then show middle-of-the-page pop-out reward div
      setActiveSurvey(null);
      setSurveyAnswers({});
      setSurveyRewardPopup({ title: surveyTitle, reward: rewardGP });

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

      {/* Survey Complete Pop-out Reward Div (Middle of the Page Popout) */}
      {surveyRewardPopup && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(0, 0, 0, 0.75)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 10000,
          animation: "fadeIn 0.25s ease"
        }}>
          <div style={{
            backgroundColor: "#1f2937",
            border: "2px solid #f97316",
            borderRadius: "16px",
            padding: "2.5rem 2rem",
            width: "90%",
            maxWidth: "420px",
            textAlign: "center",
            boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
            color: "#ffffff",
            position: "relative"
          }}>
            <div style={{
              width: "70px",
              height: "70px",
              backgroundColor: "rgba(249, 115, 22, 0.15)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.2rem auto",
              color: "#f97316",
              fontSize: "2rem"
            }}>
              <FontAwesomeIcon icon={faCoins} />
            </div>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem", color: "#f97316" }}>Survey Completed!</h2>
            <p style={{ color: "#9ca3af", fontSize: "0.95rem", marginBottom: "1.5rem" }}>
              You successfully completed <strong>{surveyRewardPopup.title}</strong>
            </p>
            <div style={{
              backgroundColor: "#111827",
              padding: "1rem",
              borderRadius: "10px",
              marginBottom: "1.5rem",
              border: "1px solid #374151"
            }}>
              <span style={{ fontSize: "0.85rem", color: "#9ca3af", display: "block" }}>Reward Earned</span>
              <span style={{ fontSize: "2rem", fontWeight: "bold", color: "#10B981" }}>+{surveyRewardPopup.reward} GP</span>
            </div>
            <button
              onClick={() => setSurveyRewardPopup(null)}
              style={{
                backgroundColor: "#f97316",
                color: "#ffffff",
                border: "none",
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                fontWeight: "bold",
                fontSize: "1rem",
                cursor: "pointer",
                transition: "background 0.2s"
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = "#ea580c"}
              onMouseOut={(e) => e.target.style.backgroundColor = "#f97316"}
            >
              Awesome, Claim Reward
            </button>
          </div>
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
            {/* Prevent long username overflow on mobile using minWidth: 0 and flex: 1 */}
            <div className="profile-info" style={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
              <h4 style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%", margin: 0, maxWidth: "100%" }}>{displayName}</h4>
              <p style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%", margin: 0, fontSize: "0.8rem", color: "#9ca3af" }}>{currentUserData?.email}</p>
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
            <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, width: "100%", overflow: "hidden" }}>
              <img 
                src={avatarUrl} 
                alt={displayName} 
                style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#1f2937", flexShrink: 0 }} 
              />
              <div style={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
                <h2 style={{ display: "flex", alignItems: "center", flexWrap: "nowrap", gap: "6px", margin: 0, width: "100%", overflow: "hidden" }}>
                  <span className="user-name-text" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%", display: "inline-block" }}>{displayName}</span>
                  <span className="version-tag" style={{ flexShrink: 0 }}>v2.0</span>
                </h2>
                <p style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0, fontSize: "0.85rem" }}>Complete Surveys, Watch Ads, and Earn Rewards</p>
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

            {/* General Notification Div centered in header actions / relative wrapper */}
            <div className="notification-container" style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <button className="notification-btn" onClick={handleToggleNotifMenu}>
                <FontAwesomeIcon icon={faBell} />
                {unreadNotifsCount > 0 && <span className="notification-dot">{unreadNotifsCount}</span>}
              </button>

              {showNotifMenu && (
                <>
                  <div className="notif-modal-overlay" onClick={() => setShowNotifMenu(false)} />
                  <div className="notification-dropdown" style={{
                    position: "absolute",
                    top: "calc(100% + 10px)",
                    right: 0,
                    zIndex: 1000,
                    width: "320px",
                    maxHeight: "420px",
                    display: "flex",
                    flexDirection: "column"
                  }}>
                    <div className="notif-header">
                      <h4>Notifications</h4>
                      <button 
                        className="notif-close-btn" 
                        onClick={() => setShowNotifMenu(false)}
                        style={{ backgroundColor: "#f97316", color: "#ffffff", border: "none", borderRadius: "50%", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontWeight: "bold" }}
                      >
                        ✕
                      </button>
                    </div>

                    {/* Notification list container with invisible scroll (scrollbar hidden across browsers) */}
                    <div 
                      className="notif-list-container" 
                      style={{ 
                        overflowY: "auto", 
                        flex: 1, 
                        scrollbarWidth: "none", 
                        msOverflowStyle: "none" 
                      }}
                    >
                      <style>{`
                        .notif-list-container::-webkit-scrollbar {
                          display: none;
                        }
                      `}</style>

                      {notifications.length === 0 ? (
                        <p className="no-notifs">No notifications yet.</p>
                      ) : (
                        notifications.slice(0, 4).map((n) => {
                          let notifIcon = faBell;
                          if (n.type === "SURVEY_COMPLETED" || n.message?.toLowerCase().includes("survey")) {
                            notifIcon = faClipboardCheck;
                          } else if (n.type === "AD_WATCHED" || n.message?.toLowerCase().includes("watched")) {
                            notifIcon = faTv;
                          } else if (n.message?.toLowerCase().includes("task")) {
                            notifIcon = faCoins;
                          }

                          return (
                            <div
                              key={n.id}
                              className={`notif-item ${!n.read ? "unread" : ""}`}
                              onClick={() => handleNotifClick(n)}
                            >
                              <div className="notif-icon-box">
                                <FontAwesomeIcon icon={notifIcon} />
                              </div>
                              <div className="notif-content" style={{ minWidth: 0, flex: 1 }}>
                                <p style={{ overflowWrap: "anywhere" }}>{n.message}</p>
                                <small>{n.timestamp ? new Date(n.timestamp).toLocaleTimeString() : "Just now"}</small>
                              </div>
                              {!n.read && <div className="unread-indicator-dot" />}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Balance Metrics */}
        <section className="summary-cards">
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
          <section className="dashboard-section">
            <div className="section-title-bar">
              <h3><FontAwesomeIcon icon={faClipboardCheck} /> Active Surveys</h3>
              <span className={`daily-limit-badge ${surveysDoneToday >= DAILY_SURVEY_LIMIT ? "limit-reached" : ""}`}>
                Daily Limit: {surveysDoneToday}/{DAILY_SURVEY_LIMIT} Completed
              </span>
            </div>

            <div className="surveys-grid">
              {filteredSurveys.length === 0 ? (
                <p>No active surveys found.</p>
              ) : (
                filteredSurveys.map((survey, idx) => {
                  const isCompleted = completedSurveyIds.includes(survey.id);

                  return (
                    <div key={survey.id || idx} className={`survey-card ${isCompleted ? "completed-card" : ""}`}>
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

                      <div className="survey-card-details">
                        <h4 className="survey-card-title">{survey.title}</h4>
                        <p className="survey-card-desc">
                          {survey.description || "Complete this survey to share your feedback and earn Grace Points."}
                        </p>

                        {/* LINE RANGE SHOWING SURVEY PROGRESS */}
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
                            <FontAwesomeIcon icon={faCoins} />
                            <span>+{survey.gracePoints || 50} GP</span>
                          </div>

                          {isCompleted ? (
                            <button className="take-survey-btn" style={{ backgroundColor: "#10B981", color: "#fff" }} disabled>
                              <FontAwesomeIcon icon={faCheckCircle} style={{ marginRight: "5px" }} /> Completed
                            </button>
                          ) : (
                            <button 
                              className="take-survey-btn" 
                              onClick={() => handleOpenSurvey(survey)}
                              disabled={surveysDoneToday >= DAILY_SURVEY_LIMIT}
                            >
                              {surveysDoneToday >= DAILY_SURVEY_LIMIT ? "Limit Reached" : "Take Survey"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        )}

        {/* TAB 2: WATCH ADS & EARN */}
        {activeTab === "watch_ads" && (
          <section className="dashboard-section">
            <h3><FontAwesomeIcon icon={faTv} /> Watch Ads to Earn Grace Points</h3>
            <div className="ads-grid">
              {[
                { id: "ad1", title: "Sponsored Video Spot", reward: 25, duration: 30, type: "custom" },
                { id: "ad2", title: "App Showcase Video", reward: 35, duration: 45, type: "custom" },
                { id: "ad3", title: "Brand Promo Reel", reward: 50, duration: 60, type: "custom" }
              ].map((ad, idx) => (
                <div key={ad.id} className="ad-card">
                  <div className="ad-thumb-container">
                    <div className="ad-type-badge">SLOT #{idx + 1}</div>

                    <div className="custom-ad-placeholder">
                      <FontAwesomeIcon icon={faTv} className="placeholder-icon" />
                    </div>

                    <div className="ad-overlay-play">
                      <button
                        className="play-btn"
                        onClick={() => handleWatchAd(ad.reward, ad.title)}
                        disabled={watchingAd !== null}
                      >
                        {watchingAd === ad.title ? (
                          <FontAwesomeIcon icon={faSpinner} spin />
                        ) : (
                          <FontAwesomeIcon icon={faPlay} />
                        )}
                      </button>
                    </div>
                    <span className="ad-duration-tag">{ad.duration}s</span>
                  </div>

                  <div className="ad-card-details">
                    <h4 className="ad-card-title">{ad.title}</h4>
                    <div className="ad-card-footer">
                      <div className="ad-reward-pill">
                        <FontAwesomeIcon icon={faCoins} />
                        <span>+{ad.reward} GP</span>
                      </div>
                      <button
                        className="watch-now-btn"
                        onClick={() => handleWatchAd(ad.reward, ad.title)}
                        disabled={watchingAd !== null}
                      >
                        {watchingAd === ad.title ? "Watching..." : "Watch & Earn"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TAB 3: WALLET */}
        {activeTab === "wallet" && (
          <section className="dashboard-section">
            <div className="cyber-card" style={{ textAlign: "center", padding: "3rem" }}>
              <h2>Your Wallet Balance</h2>
              <h1 style={{ color: "var(--orange)", fontSize: "3rem", margin: "1rem 0" }}>
                {userGP.toLocaleString()} GP
              </h1>
              <p>Cash Equivalent: ₦{userGP.toLocaleString()}</p>
              <button className="primary-btn" style={{ maxWidth: "300px", margin: "1rem auto 0" }}>
                Request Withdrawal
              </button>
            </div>
          </section>
        )}
      </main>

      {/* DYNAMIC SURVEY MODAL WITH LINE RANGE PROGRESS BAR */}
      {activeSurvey && (
        <div className="modal-overlay">
          <div className="survey-modal">
            <div className="modal-header">
              <h3>{activeSurvey.title}</h3>
              <button className="close-btn" onClick={() => setActiveSurvey(null)}>✕</button>
            </div>

            {/* LIVE SURVEY MODAL LINE RANGE PROGRESS */}
            <div className="modal-progress-bar-container" style={{ padding: "0 1.5rem", marginTop: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#9ca3af", marginBottom: "6px" }}>
                <span>Completion Status</span>
                <span>{answeredCountInActive}/{totalQuestionsInActive} ({activeSurveyProgress}%)</span>
              </div>
              <div style={{ width: "100%", height: "8px", backgroundColor: "#374151", borderRadius: "4px", overflow: "hidden" }}>
                <div style={{ width: `${activeSurveyProgress}%`, height: "100%", backgroundColor: "#f97316", transition: "width 0.3s ease" }} />
              </div>
            </div>

            <form onSubmit={handleCompleteSurvey} className="survey-form-content" style={{ padding: "1.5rem", maxHeight: "60vh", overflowY: "auto" }}>
              {activeSurvey.questions && activeSurvey.questions.map((q, qIndex) => (
                <div key={q.id || qIndex} style={{ marginBottom: "1.5rem" }}>
                  <p style={{ fontWeight: "bold", marginBottom: "8px", color: "#ffffff" }}>
                    {qIndex + 1}. {q.text}
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {q.options && q.options.map((opt, optIdx) => (
                      <label 
                        key={optIdx} 
                        style={{ 
                          display: "flex", 
                          alignItems: "center", 
                          gap: "10px", 
                          padding: "10px 14px", 
                          backgroundColor: surveyAnswers[q.id] === opt ? "rgba(249, 115, 22, 0.2)" : "#111827", 
                          border: `1px solid ${surveyAnswers[q.id] === opt ? "#f97316" : "#374151"}`,
                          borderRadius: "8px", 
                          cursor: "pointer",
                          color: "#e5e7eb"
                        }}
                      >
                        <input
                          type="radio"
                          name={q.id}
                          value={opt}
                          checked={surveyAnswers[q.id] === opt}
                          onChange={() => handleOptionSelect(q.id, opt)}
                          style={{ accentColor: "#f97316" }}
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              <div style={{ display: "flex", gap: "10px", marginTop: "2rem" }}>
                <button
                  type="button"
                  onClick={() => setActiveSurvey(null)}
                  style={{ flex: 1, padding: "12px", backgroundColor: "#374151", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSurvey || answeredCountInActive < totalQuestionsInActive}
                  style={{ 
                    flex: 1, 
                    padding: "12px", 
                    backgroundColor: answeredCountInActive < totalQuestionsInActive ? "#4b5563" : "#f97316", 
                    color: "#fff", 
                    border: "none", 
                    borderRadius: "8px", 
                    fontWeight: "bold", 
                    cursor: answeredCountInActive < totalQuestionsInActive ? "not-allowed" : "pointer" 
                  }}
                >
                  {submittingSurvey ? <FontAwesomeIcon icon={faSpinner} spin /> : "Submit Survey"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
