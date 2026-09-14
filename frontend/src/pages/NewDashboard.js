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
  faCheckCircle
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

        alert(`Ad Completed! You earned +${adReward} Grace Points.`);
      } catch (err) {
        alert(`Error rewarding ad: ${err.message}`);
      } finally {
        setWatchingAd(null);
      }
    }, 3000);
  };

  const handleOpenSurvey = (survey) => {
    const currentCompleted = currentUserData?.dailySurveysCompleted || 0;
    if (currentCompleted >= DAILY_SURVEY_LIMIT) {
      alert("You have reached your daily limit of 3 surveys! Please come back tomorrow.");
      return;
    }
    setActiveSurvey(survey);
  };

  const handleCompleteSurvey = async (e) => {
    e.preventDefault();
    if (!activeSurvey || !currentUserData?.uid) return;

    const currentCompleted = currentUserData?.dailySurveysCompleted || 0;
    if (currentCompleted >= DAILY_SURVEY_LIMIT) {
      alert("Daily limit reached! You can only complete 3 surveys per day.");
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

      alert(`Survey Submitted Successfully! You earned +${rewardGP} Grace Points. (${updatedDailyCount}/${DAILY_SURVEY_LIMIT} completed today)`);
      setActiveSurvey(null);
      setSurveyAnswers({});
    } catch (err) {
      console.error("Survey Submit Error:", err);
      alert(`Failed to submit survey: ${err.message}`);
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
    <div className="new-dashboard-container">
      {sidebarOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
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
          <div className="user-profile">
            <div className="avatar-box" style={{ padding: 0, overflow: "hidden", background: "transparent" }}>
              <img 
                src={avatarUrl} 
                alt={displayName} 
                style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} 
              />
            </div>
            <div className="profile-info" style={{ minWidth: 0, flex: 1 }}>
              <h4 style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName}</h4>
              <p style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentUserData?.email}</p>
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
          <div className="header-title" style={{ minWidth: 0, flex: 1, paddingRight: "15px" }}>
            <button className="menu-toggle" onClick={toggleSidebar} aria-label="Toggle Menu">
              <FontAwesomeIcon icon={sidebarOpen ? faXmark : faBars} />
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0, width: "100%" }}>
              <img 
                src={avatarUrl} 
                alt={displayName} 
                style={{ width: "42px", height: "42px", borderRadius: "50%", background: "#1f2937", flexShrink: 0 }} 
              />
              <div style={{ minWidth: 0, flex: 1 }}>
                <h2 style={{ margin: 0, display: "flex", alignItems: "center", minWidth: 0 }}>
                  <span 
                    className="user-name-text" 
                    title={displayName}
                    style={{
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "block",
                      maxWidth: "100%",
                      fontSize: "1.25rem",
                      fontWeight: "700",
                      color: "#ffffff"
                    }}
                  >
                    {displayName}
                  </span>
                </h2>
                <p style={{ margin: "2px 0 0 0", color: "#9ca3af", fontSize: "0.88rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  Hail mama Grace. Keep Earning
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

            {/* ENHANCED NOTIFICATION CONTAINER */}
            <div className="notification-container" style={{ position: "relative" }}>
              <button className="notification-btn enhanced-notif-btn" onClick={handleToggleNotifMenu} aria-label="Notifications">
                <FontAwesomeIcon icon={faBell} />
                {unreadNotifsCount > 0 && <span className="notification-dot pulse-dot">{unreadNotifsCount}</span>}
              </button>

              {showNotifMenu && (
                <>
                  <div className="notif-modal-overlay" onClick={() => setShowNotifMenu(false)} />
                  <div className="notification-dropdown enhanced-notif-dropdown">
                    <div className="notif-header">
                      <div className="notif-header-title">
                        <FontAwesomeIcon icon={faBell} className="notif-title-icon" />
                        <h4>Notifications</h4>
                      </div>
                      <button className="notif-close-btn" onClick={() => setShowNotifMenu(false)}>✕</button>
                    </div>

                    <div className="notif-list-container">
                      {notifications.length === 0 ? (
                        <div className="empty-notif-box">
                          <FontAwesomeIcon icon={faBell} className="empty-notif-icon" />
                          <p className="no-notifs">No notifications yet.</p>
                        </div>
                      ) : (
                        notifications.slice(0, 4).map((n) => {
                          let notifIcon = faBell;
                          let iconClass = "default-type";
                          if (n.type === "SURVEY_COMPLETED" || n.message?.toLowerCase().includes("survey")) {
                            notifIcon = faClipboardCheck;
                            iconClass = "survey-type";
                          } else if (n.type === "AD_WATCHED" || n.message?.toLowerCase().includes("watched")) {
                            notifIcon = faTv;
                            iconClass = "ad-type";
                          } else if (n.message?.toLowerCase().includes("task")) {
                            notifIcon = faCoins;
                            iconClass = "coin-type";
                          }

                          return (
                            <div
                              key={n.id}
                              className={`notif-item ${!n.read ? "unread" : ""}`}
                              onClick={() => handleNotifClick(n)}
                            >
                              <div className={`notif-icon-box ${iconClass}`}>
                                <FontAwesomeIcon icon={notifIcon} />
                              </div>
                              <div className="notif-content">
                                <p>{n.message}</p>
                                <small>{n.timestamp ? new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}</small>
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

      {/* DYNAMIC SURVEY MODAL */}
      {activeSurvey && (
        <div className="modal-overlay">
          <div className="survey-modal">
            <div className="modal-header">
              <h3>{activeSurvey.title}</h3>
              <button className="close-btn" onClick={() => setActiveSurvey(null)}>✕</button>
            </div>

            <div className="modal-progress-bar-container" style={{ padding: "0 1.5rem", marginTop: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#9ca3af", marginBottom: "6px" }}>
                <span>Completion Status</span>
                <span>{answeredCountInActive}/{totalQuestionsInActive} ({activeSurveyProgress}%)</span>
              </div>
              <div style={{ width: "100%", height: "8px", backgroundColor: "#374151", borderRadius: "4px", overflow: "hidden" }}>
                <div 
                  style={{ 
                    width: `${activeSurveyProgress}%`, 
                    height: "100%", 
                    backgroundColor: "#f97316", 
                    transition: "width 0.3s ease" 
                  }} 
                />
              </div>
            </div>

            <form onSubmit={handleCompleteSurvey}>
              {activeSurvey.questions && activeSurvey.questions.map((q, idx) => (
                <div key={idx} className="modal-q-group">
                  <label className="q-label">{idx + 1}. {q.text}</label>
                  <div className="options-stack">
                    {q.options && q.options.map((opt, oIdx) => (
                      <label key={oIdx} className="opt-label">
                        <input
                          type="radio"
                          name={`q-${idx}`}
                          value={opt}
                          required
                          onChange={() => handleOptionSelect(q.id || idx, opt)}
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              <div className="modal-footer">
                <span className="reward-tag">Reward: +{activeSurvey.gracePoints || 50} GP</span>
                <button type="submit" className="primary-btn" style={{ width: "auto" }} disabled={submittingSurvey}>
                  {submittingSurvey ? <FontAwesomeIcon icon={faSpinner} spin /> : "Submit Responses"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
