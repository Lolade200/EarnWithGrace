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
  faSearch
} from "@fortawesome/free-solid-svg-icons";
import "./NewDashboard.css";

// --- RANDOM "GRACE" USERNAME GENERATOR (STRICTLY 4-LETTER NOUNS, ANIMALS & FRUITS) ---
const FOUR_LETTER_WORDS = [
  // Animals (4 letters)
  "Lion", "Bear", "Frog", "Wolf", "Deer", "Duck", "Hawk", "Seal", 
  "Crow", "Toad", "Puma", "Lynx", "Mole", "Hare", "Swan", "Crab",
  
  // Fruits (4 letters)
  "Pear", "Plum", "Kiwi", "Lime", "Date", "Fig", "Acai",
  
  // Nouns (4 letters)
  "Star", "Moon", "Gold", "Wind", "Fire", "Wave", "Rock", "King", 
  "Hero", "Park", "Ship", "Tree", "Peak", "Gem", "Love", "Ruby"
];

const generateRandomGraceName = () => {
  const randomIndex = Math.floor(Math.random() * FOUR_LETTER_WORDS.length);
  return `Grace${FOUR_LETTER_WORDS[randomIndex]}`;
};

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

  // Notification Menu Toggle
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  // Survey Modal State
  const [activeSurvey, setActiveSurvey] = useState(null);
  const [surveyAnswers, setSurveyAnswers] = useState({});
  const [submittingSurvey, setSubmittingSurvey] = useState(false);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  // Generate a Grace-prefixed random name once on load
  useEffect(() => {
    setRandomGraceName(generateRandomGraceName());
  }, []);

  // Auth & User Initial Load Listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const userSnap = await get(ref(db, `users/${user.uid}`));
          const data = userSnap.val() || {};
          setCurrentUserData({ uid: user.uid, email: user.email, ...data });
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

  // Realtime Firebase Subscriptions
  useEffect(() => {
    if (!currentUserData?.uid) return;

    // Listen for balance and profile updates
    const userUnsub = onValue(ref(db, `users/${currentUserData.uid}`), (snapshot) => {
      const val = snapshot.val();
      if (val) {
        setCurrentUserData((prev) => ({ ...prev, ...val }));
      }
    });

    // Listen for Active Surveys
    const surveysUnsub = onValue(ref(db, "surveys"), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const surveyList = Object.keys(data)
          .map((key) => ({ id: key, ...data[key] }))
          .filter((s) => s.status === "Active" || !s.status);
        setSurveys(surveyList);
      } else {
        // Fallback demo survey if database is empty
        setSurveys([
          {
            id: "survey_demo_1",
            title: "Customer Feedback & Usage Survey",
            gracePoints: 100,
            questions: [
              { id: "q1", text: "How often do you use our dashboard?", options: ["Daily", "Weekly", "Monthly"] },
              { id: "q2", text: "What feature would you like to see next?", options: ["Instant Payouts", "More Ads", "Referral Bonuses"] }
            ]
          }
        ]);
      }
    });

    // Listen for Realtime Notifications
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

  // Logout Logic
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Logout Error:", error.message);
    }
  };

  // Helper function: Strictly ensure name starts with "Grace" or use random Grace name
  const getEffectiveDisplayName = () => {
    if (currentUserData?.name && currentUserData.name.startsWith("Grace")) {
      return currentUserData.name;
    }
    return randomGraceName;
  };

  // Option selection handler inside survey modal
  const handleOptionSelect = (questionId, optionValue) => {
    setSurveyAnswers((prev) => ({
      ...prev,
      [questionId]: optionValue
    }));
  };

  // Watch Ad & Earn Logic
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

  // Submit Survey to Realtime Database
  const handleCompleteSurvey = async (e) => {
    e.preventDefault();
    if (!activeSurvey || !currentUserData?.uid) return;

    setSubmittingSurvey(true);
    const rewardGP = parseInt(activeSurvey.gracePoints, 10) || 50;
    const activeDisplayName = getEffectiveDisplayName();

    try {
      // 1. Fetch & update user Grace Points
      const userRef = ref(db, `users/${currentUserData.uid}`);
      const userSnap = await get(userRef);
      const currentPts = userSnap.val()?.gracePoints || userSnap.val()?.rewards || 0;
      const newPts = currentPts + rewardGP;

      await update(userRef, { gracePoints: newPts, rewards: newPts });

      // 2. Record survey completion details
      await push(ref(db, `surveyCompletions/${activeSurvey.id}`), {
        userId: currentUserData.uid,
        userName: activeDisplayName,
        answers: surveyAnswers,
        completedAt: Date.now()
      });

      // 3. Post a notification into Firebase Realtime Database
      await push(ref(db, "notifications"), {
        type: "SURVEY_COMPLETED",
        message: `${activeDisplayName} completed survey "${activeSurvey.title}" and earned +${rewardGP} GP!`,
        timestamp: Date.now(),
        read: false
      });

      alert(`Survey Submitted Successfully! You earned +${rewardGP} Grace Points.`);
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
  
  // FIX: Force display of Grace + 4-Letter random name
  const displayName = getEffectiveDisplayName();
  const filteredSurveys = surveys.filter((s) => s.title?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="new-dashboard-container">
      {sidebarOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-top">
          <div className="ewg-logo-container">
            <div className="ewg-brand-text">
              <span className="brand-primary">EarnWithGrace</span>
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
            <div className="avatar-box">
              <FontAwesomeIcon icon={faUser} />
            </div>
            <div className="profile-info">
              <h4>{displayName}</h4>
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
        {/* Header containing Dynamic "Grace + 4-Letter Word" Title */}
        <header className="header">
          <div className="header-title">
            <button className="menu-toggle" onClick={toggleSidebar} aria-label="Toggle Menu">
              <FontAwesomeIcon icon={sidebarOpen ? faXmark : faBars} />
            </button>
            <div>
              <h2>
                {displayName} <span className="version-tag">v2.0</span>
              </h2>
              <p>Complete Surveys, Watch Ads, and Earn Rewards</p>
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

            <div className="notification-container">
              <button className="notification-btn" onClick={() => setShowNotifMenu(!showNotifMenu)}>
                <FontAwesomeIcon icon={faBell} />
                {unreadNotifsCount > 0 && <span className="notification-dot">{unreadNotifsCount}</span>}
              </button>

              {/* ENHANCED NOTIFICATION DROPDOWN WITH DYNAMIC ICONS */}
              {showNotifMenu && (
                <div className="notification-dropdown">
                  <div className="notif-header">
                    <h4>Notifications</h4>
                    <button className="notif-close-btn" onClick={() => setShowNotifMenu(false)}>✕</button>
                  </div>
                  <div className="notif-list-container">
                    {notifications.length === 0 ? (
                      <p className="no-notifs">No notifications yet.</p>
                    ) : (
                      notifications.map((n) => {
                        let notifIcon = faBell;
                        if (n.type === "SURVEY_COMPLETED" || n.message?.toLowerCase().includes("survey")) {
                          notifIcon = faClipboardCheck;
                        } else if (n.type === "AD_WATCHED" || n.message?.toLowerCase().includes("watched")) {
                          notifIcon = faTv;
                        } else if (n.message?.toLowerCase().includes("task")) {
                          notifIcon = faCoins;
                        }

                        return (
                          <div key={n.id} className="notif-item">
                            <div className="notif-icon-box">
                              <FontAwesomeIcon icon={notifIcon} />
                            </div>
                            <div className="notif-content">
                              <p>{n.message}</p>
                              <small>{n.timestamp ? new Date(n.timestamp).toLocaleTimeString() : "Just now"}</small>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
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
            <h3><FontAwesomeIcon icon={faClipboardCheck} /> Active Surveys</h3>
            <div className="surveys-grid">
              {filteredSurveys.length === 0 ? (
                <p>No active surveys found.</p>
              ) : (
                filteredSurveys.map((survey) => (
                  <div key={survey.id} className="survey-card">
                    <div className="survey-card-header">
                      <span className="category-badge">SURVEY</span>
                      <span className="gp-payout">+{survey.gracePoints || 50} GP</span>
                    </div>
                    <h4>{survey.title}</h4>
                    <p className="q-count">{survey.questions?.length || 1} Question(s)</p>
                    <button className="primary-btn" onClick={() => setActiveSurvey(survey)}>
                      Take Survey & Earn
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* TAB 2: WATCH ADS & EARN */}
        {activeTab === "watch_ads" && (
          <section className="dashboard-section">
            <h3><FontAwesomeIcon icon={faTv} /> Watch Ads to Earn Grace Points</h3>
            <div className="surveys-grid">
              {[
                { id: "ad1", title: "Sponsored Video Spot", reward: 25 },
                { id: "ad2", title: "App Showcase Video", reward: 35 },
                { id: "ad3", title: "Brand Promo Reel", reward: 50 }
              ].map((ad) => (
                <div key={ad.id} className="survey-card">
                  <div style={{ textAlign: "center", padding: "1.5rem 0", color: "var(--orange)", fontSize: "2.5rem" }}>
                    <FontAwesomeIcon icon={faPlay} />
                  </div>
                  <h4>{ad.title}</h4>
                  <p style={{ color: "var(--orange)", fontWeight: "bold" }}>+{ad.reward} GP</p>
                  <button
                    className="primary-btn"
                    onClick={() => handleWatchAd(ad.reward, ad.title)}
                    disabled={watchingAd !== null}
                  >
                    {watchingAd === ad.title ? <FontAwesomeIcon icon={faSpinner} spin /> : "Watch Video Ad"}
                  </button>
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
