import React, { useState, useEffect, useRef } from "react";
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
  faCheckCircle,
  faUser,
  faSparkles,
  faSearch
} from "@fortawesome/free-solid-svg-icons";
import "./NewDashboard.css";

// --- 2054 EarnWithGrace Logo ---
const EarnWithGraceLogo = () => (
  <div className="ewg-logo-container">
    <svg width="36" height="36" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cyberGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00f2fe" />
          <stop offset="100%" stopColor="#4facfe" />
        </linearGradient>
        <linearGradient id="goldGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f6d365" />
          <stop offset="100%" stopColor="#fda085" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="45" stroke="url(#cyberGlow)" strokeWidth="4" fill="rgba(10, 20, 35, 0.6)" />
      <path d="M30 35 L50 20 L70 35 L50 50 Z" fill="url(#cyberGlow)" opacity="0.9" />
      <path d="M30 50 L50 65 L70 50 L50 80 Z" fill="url(#goldGlow)" />
    </svg>
    <div className="ewg-brand-text">
      <span className="brand-primary">EarnWith<span className="brand-highlight">Grace</span></span>
      <span className="brand-sub">NEURAL USER DASHBOARD 2054</span>
    </div>
  </div>
);

// --- Spline Tracking Chart ---
const ActivityChart = ({ userBalance }) => {
  const points = [10, 25, 40, 30, 65, 80, 100];
  return (
    <div className="chart-box">
      <div className="chart-header">
        <h4><FontAwesomeIcon icon={faSparkles} /> Neural GP Accumulation Rate</h4>
        <span className="live-pill">LIVE TRACKING</span>
      </div>
      <div className="chart-svg-wrapper">
        <svg viewBox="0 0 500 130" className="futuristic-svg">
          <defs>
            <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.5"/>
              <stop offset="100%" stopColor="#00f2fe" stopOpacity="0.0"/>
            </linearGradient>
          </defs>
          <path d="M 0,130 L 0,100 Q 80,40 160,80 T 320,30 T 450,20 L 500,10 L 500,130 Z" fill="url(#chartGlow)" />
          <path d="M 0,100 Q 80,40 160,80 T 320,30 T 450,20 L 500,10" fill="none" stroke="#00f2fe" strokeWidth="3" />
          {points.map((pt, i) => (
            <circle key={i} cx={i * 80 + 10} cy={120 - pt} r="4" fill="#ffffff" stroke="#00f2fe" strokeWidth="2" />
          ))}
        </svg>
      </div>
      <div className="chart-labels">
        <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
      </div>
    </div>
  );
};

export default function NewDashboard() {
  const navigate = useNavigate();

  // Navigation & Responsiveness State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("surveys");
  const [loading, setLoading] = useState(true);

  // User Auth & Firebase Data
  const [currentUserData, setCurrentUserData] = useState(null);
  const [surveys, setSurveys] = useState([]);
  const [ads, setAds] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Notification Menu Toggle
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const prevNotifCountRef = useRef(0);

  // Watch Ad Stream Logic
  const [watchingAd, setWatchingAd] = useState(false);
  const [adTimer, setAdTimer] = useState(0);
  const [selectedAd, setSelectedAd] = useState(null);

  // Interactive Survey Taking Modal State
  const [activeSurvey, setActiveSurvey] = useState(null);
  const [surveyAnswers, setSurveyAnswers] = useState({});
  const [submittingSurvey, setSubmittingSurvey] = useState(false);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  // 1. Auth Listener Logic
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

  // 2. Realtime Firebase DB Subscriptions (Admin Posted Surveys, Ads, & User Notifications)
  useEffect(() => {
    if (!currentUserData?.uid) return;

    // Listen to real-time User profile changes (Grace Points balance update)
    const userUnsub = onValue(ref(db, `users/${currentUserData.uid}`), (snapshot) => {
      const val = snapshot.val();
      if (val) {
        setCurrentUserData((prev) => ({ ...prev, ...val }));
      }
    });

    // Listen to Admin Posted Surveys
    const surveysUnsub = onValue(ref(db, "surveys"), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const surveyList = Object.keys(data)
          .map((key) => ({ id: key, ...data[key] }))
          .filter((s) => s.status === "Active"); // Display Active surveys posted by Admin
        setSurveys(surveyList);
      } else {
        setSurveys([]);
      }
    });

    // Listen to Admin Posted Monetized Ads
    const adsUnsub = onValue(ref(db, "ads"), (snapshot) => {
      const data = snapshot.val();
      setAds(data ? Object.keys(data).map((key) => ({ id: key, ...data[key] })) : [
        { id: "ad1", title: "Cyberpunk VR Survey Promo", reward: 50 },
        { id: "ad2", title: "EarnWithGrace Global Stream", reward: 75 }
      ]);
    });

    // Listen to Notifications
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
      userUnsub();
      surveysUnsub();
      adsUnsub();
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

  // Watch Ad Stream Timer & Dynamic Reward Logic
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
    if (!currentUserData?.uid) return;
    const rewardAmount = selectedAd?.reward || 50;
    try {
      const userRef = ref(db, `users/${currentUserData.uid}`);
      const userSnap = await get(userRef);
      const currentPts = userSnap.val()?.gracePoints || 0;
      const newPts = currentPts + rewardAmount;

      await update(userRef, { gracePoints: newPts, rewards: newPts });
      await push(ref(db, "notifications"), {
        type: "AD_REWARD",
        message: `Watch Ad Stream Reward: ${rewardAmount} GP claimed by ${currentUserData?.name || "User"}!`,
        timestamp: Date.now(),
        read: false
      });
      alert(`Congratulations! +${rewardAmount} Grace Points (GP) credited to your account!`);
    } catch (err) {
      console.error("Ad Reward Claim Error:", err);
    }
  };

  // Survey Submission Logic
  const handleOptionSelect = (questionId, optionValue) => {
    setSurveyAnswers((prev) => ({
      ...prev,
      [questionId]: optionValue
    }));
  };

  const handleCompleteSurvey = async (e) => {
    e.preventDefault();
    if (!activeSurvey) return;

    setSubmittingSurvey(true);
    const rewardGP = parseInt(activeSurvey.gracePoints, 10) || 50;

    try {
      const userRef = ref(db, `users/${currentUserData.uid}`);
      const userSnap = await get(userRef);
      const currentPts = userSnap.val()?.gracePoints || 0;
      const newPts = currentPts + rewardGP;

      // Credit User GP
      await update(userRef, { gracePoints: newPts, rewards: newPts });

      // Record Survey Completion
      await push(ref(db, `surveyCompletions/${activeSurvey.id}`), {
        userId: currentUserData.uid,
        userName: currentUserData.name || currentUserData.email,
        answers: surveyAnswers,
        completedAt: Date.now()
      });

      // Post Notification
      await push(ref(db, "notifications"), {
        type: "SURVEY_COMPLETED",
        message: `${currentUserData?.name || "A user"} completed survey "${activeSurvey.title}" and earned +${rewardGP} GP!`,
        timestamp: Date.now(),
        read: false
      });

      alert(`Survey Completed! You earned +${rewardGP} Grace Points.`);
      setActiveSurvey(null);
      setSurveyAnswers({});
    } catch (err) {
      alert(`Failed to record survey response: ${err.message}`);
    } finally {
      setSubmittingSurvey(false);
    }
  };

  if (loading) {
    return (
      <div className="cyber-loading-screen">
        <FontAwesomeIcon icon={faSpinner} spin className="loading-icon" />
        <h2>INITIALIZING NEWDASHBOARD 2054...</h2>
      </div>
    );
  }

  const unreadNotifsCount = notifications.filter((n) => !n.read).length;
  const userGP = currentUserData?.gracePoints || currentUserData?.rewards || 0;
  const filteredSurveys = surveys.filter((s) => s.title?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="new-dashboard-container">
      {sidebarOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}

      {/* Responsive Sidebar Navigation */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-top">
          <EarnWithGraceLogo />
          <nav className="sidebar-nav">
            <button
              className={activeTab === "surveys" ? "active" : ""}
              onClick={() => { setActiveTab("surveys"); setSidebarOpen(false); }}
            >
              <FontAwesomeIcon icon={faClipboardCheck} className="nav-icon" /> Admin Surveys
            </button>
            <button
              className={activeTab === "ads" ? "active" : ""}
              onClick={() => { setActiveTab("ads"); setSidebarOpen(false); }}
            >
              <FontAwesomeIcon icon={faTv} className="nav-icon" /> Watch & Earn Ads
            </button>
            <button
              className={activeTab === "wallet" ? "active" : ""}
              onClick={() => { setActiveTab("wallet"); setSidebarOpen(false); }}
            >
              <FontAwesomeIcon icon={faCoins} className="nav-icon" /> GP Balance & Yield
            </button>
          </nav>
        </div>

        <div className="sidebar-bottom">
          <div className="user-profile">
            <div className="avatar-box">
              <FontAwesomeIcon icon={faUser} />
            </div>
            <div className="profile-info">
              <h4>{currentUserData?.name || "Neural User"}</h4>
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
              <h2>NewDashboard <span className="version-tag">v2054.9</span></h2>
              <p>User Telemetry & Reward Earning Center</p>
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

            {/* Notification Dropdown */}
            <div className="notification-container">
              <button className="notification-btn" onClick={() => setShowNotifMenu(!showNotifMenu)}>
                <FontAwesomeIcon icon={faBell} />
                {unreadNotifsCount > 0 && <span className="notification-dot">{unreadNotifsCount}</span>}
              </button>

              {showNotifMenu && (
                <div className="notification-dropdown">
                  <div className="notif-header">
                    <h4>Neural System Feed ({unreadNotifsCount})</h4>
                  </div>
                  <div className="notif-list">
                    {notifications.length === 0 ? (
                      <p className="notif-empty">No updates logged.</p>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className="notif-item">
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

        {/* Real-time Balance Metrics */}
        <section className="summary-cards">
          <div className="cyber-card cyan">
            <div className="card-header">
              <span className="card-icon cyan"><FontAwesomeIcon icon={faCoins} /></span>
              <h3>Grace Points Balance</h3>
            </div>
            <p className="number">{userGP.toLocaleString()} <small>GP</small></p>
            <div className="card-footer">
              <span>Conversion Rate: 100 GP = ₦100</span>
            </div>
          </div>

          <div className="cyber-card gold">
            <div className="card-header">
              <span className="card-icon gold"><FontAwesomeIcon icon={faSparkles} /></span>
              <h3>Naira Cash Value</h3>
            </div>
            <p className="number">₦{userGP.toLocaleString()}</p>
            <div className="card-footer">
              <span>Instant Payout Ready</span>
            </div>
          </div>
        </section>

        {/* Neural Spline Chart */}
        <section className="charts-grid-section">
          <ActivityChart userBalance={userGP} />
        </section>

        {/* TAB 1: ADMIN POSTED SURVEYS */}
        {activeTab === "surveys" && (
          <section className="dashboard-section">
            <div className="section-title">
              <h3><FontAwesomeIcon icon={faClipboardCheck} /> Admin Posted Surveys</h3>
              <p>Complete active tasks to claim instant Grace Points</p>
            </div>

            <div className="surveys-grid">
              {filteredSurveys.length === 0 ? (
                <div className="empty-card">
                  <p>No active surveys posted by Admin at the moment.</p>
                </div>
              ) : (
                filteredSurveys.map((survey) => (
                  <div key={survey.id} className="survey-card">
                    <div className="survey-card-header">
                      <span className="category-badge">ADMIN SURVEY</span>
                      <span className="gp-payout">+{survey.gracePoints || 50} GP</span>
                    </div>
                    <h4>{survey.title}</h4>
                    <p className="q-count">{survey.questionsCount || survey.questions?.length || 1} Question(s)</p>
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
        {activeTab === "ads" && (
          <section className="dashboard-section">
            <div className="section-title">
              <h3><FontAwesomeIcon icon={faTv} /> Watch Sponsored Ad Streams</h3>
              <p>Simulate stream ads to earn node bonus GP</p>
            </div>

            <div className="ads-grid">
              {ads.map((ad) => (
                <div key={ad.id} className="ad-card">
                  <div className="ad-preview">
                    <FontAwesomeIcon icon={faPlay} className="play-icon" />
                    <span className="ad-badge">+{ad.reward || 50} GP</span>
                  </div>
                  <h4>{ad.title || "Featured Sponsored Ad"}</h4>
                  <button
                    className="watch-ad-btn"
                    onClick={() => handleStartWatchAd(ad)}
                    disabled={watchingAd}
                  >
                    <FontAwesomeIcon icon={faPlay} /> {watchingAd && selectedAd?.id === ad.id ? `Streaming (${adTimer}s)` : "Watch Ad Stream"}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TAB 3: WALLET */}
        {activeTab === "wallet" && (
          <section className="dashboard-section">
            <div className="wallet-box">
              <h2>Your Neural Cyber-Wallet</h2>
              <div className="big-balance">{userGP.toLocaleString()} <span>GP</span></div>
              <p className="usd-val">Cash Value: ₦{userGP.toLocaleString()}</p>
              <button
                className="primary-btn"
                onClick={() => alert("Payout request queued to system admin.")}
              >
                Withdraw Funds (Naira)
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

            <form onSubmit={handleCompleteSurvey} className="modal-form">
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
                <button type="submit" className="primary-btn" disabled={submittingSurvey}>
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
