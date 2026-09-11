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
  faPenToSquare
} from "@fortawesome/free-solid-svg-icons";
import "./NewDashboard.css";

// --- RANDOM "GRACE" USERNAME GENERATOR ---
const FOUR_LETTER_WORDS = [
  "Lion", "Bear", "Frog", "Wolf", "Deer", "Duck", "Hawk", "Seal", 
  "Crow", "Toad", "Puma", "Lynx", "Mole", "Hare", "Swan", "Crab",
  "Pear", "Plum", "Kiwi", "Lime", "Date", "Fig", "Acai",
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

  useEffect(() => {
    setRandomGraceName(generateRandomGraceName());
  }, []);

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

  useEffect(() => {
    if (!currentUserData?.uid) return;

    const userUnsub = onValue(ref(db, `users/${currentUserData.uid}`), (snapshot) => {
      const val = snapshot.val();
      if (val) {
        setCurrentUserData((prev) => ({ ...prev, ...val }));
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
    if (currentUserData?.name && currentUserData.name.startsWith("Grace")) {
      return currentUserData.name;
    }
    return randomGraceName;
  };

  const handleOptionSelect = (questionId, optionValue) => {
    setSurveyAnswers((prev) => ({
      ...prev,
      [questionId]: optionValue
    }));
  };

  // MARK SINGLE NOTIFICATION AS READ ON CLICK
  const handleNotifClick = async (notif) => {
    if (notif.read) return;

    // Local State Update
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
    );

    // Firebase Realtime DB Update
    try {
      await update(ref(db, `notifications/${notif.id}`), { read: true });
    } catch (err) {
      console.error("Error updating notification read status:", err);
    }
  };

  // MARK ALL NOTIFICATIONS AS READ WHEN OPENED
  const handleToggleNotifMenu = () => {
    const nextState = !showNotifMenu;
    setShowNotifMenu(nextState);

    if (nextState) {
      // Automatically reset count to 0 upon opening popup
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

  const handleCompleteSurvey = async (e) => {
    e.preventDefault();
    if (!activeSurvey || !currentUserData?.uid) return;

    setSubmittingSurvey(true);
    const rewardGP = parseInt(activeSurvey.gracePoints, 10) || 50;
    const activeDisplayName = getEffectiveDisplayName();

    try {
      const userRef = ref(db, `users/${currentUserData.uid}`);
      const userSnap = await get(userRef);
      const currentPts = userSnap.val()?.gracePoints || userSnap.val()?.rewards || 0;
      const newPts = currentPts + rewardGP;

      await update(userRef, { gracePoints: newPts, rewards: newPts });

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

  // Count unread notifications dynamically
  const unreadNotifsCount = notifications.filter((n) => !n.read).length;
  const userGP = currentUserData?.gracePoints || currentUserData?.rewards || 0;
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
              {/* Orange Logo Text */}
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
        {/* Header with 35px Border Radius */}
        <header className="header">
          <div className="header-title">
            {/* Orange Mobile Toggle Button */}
            <button className="menu-toggle" onClick={toggleSidebar} aria-label="Toggle Menu">
              <FontAwesomeIcon icon={sidebarOpen ? faXmark : faBars} />
            </button>
            <div>
              <h2>
                <span className="user-name-text">{displayName}</span>
                <span className="version-tag">v2.0</span>
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
              <button className="notification-btn" onClick={handleToggleNotifMenu}>
                <FontAwesomeIcon icon={faBell} />
                {unreadNotifsCount > 0 && <span className="notification-dot">{unreadNotifsCount}</span>}
              </button>

              {/* CENTERED NOTIFICATION POP-OUT MODAL (NO SCROLL) */}
              {showNotifMenu && (
                <>
                  <div className="notif-modal-overlay" onClick={() => setShowNotifMenu(false)} />
                  <div className="notification-dropdown">
                    <div className="notif-header">
                      <h4>Notifications</h4>
                      <button className="notif-close-btn" onClick={() => setShowNotifMenu(false)}>✕</button>
                    </div>

                    <div className="notif-list-container">
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
                              <div className="notif-content">
                                <p>{n.message}</p>
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
            <h3><FontAwesomeIcon icon={faClipboardCheck} /> Active Surveys</h3>
            <div className="surveys-grid">
              {filteredSurveys.length === 0 ? (
                <p>No active surveys found.</p>
              ) : (
                filteredSurveys.map((survey, idx) => (
                  <div key={survey.id || idx} className="survey-card">
                    <div className="survey-thumb-container">
                      <div className="survey-type-badge">{survey.category || "SURVEY"}</div>
                      
                      <div className="survey-placeholder">
                        <FontAwesomeIcon icon={faClipboardQuestion} className="placeholder-icon" />
                      </div>

                      <div className="survey-overlay-action">
                        <button className="play-btn" onClick={() => setActiveSurvey(survey)}>
                          <FontAwesomeIcon icon={faPenToSquare} />
                        </button>
                      </div>
                      <span className="survey-time-tag">{survey.estimatedTime || `${survey.questions?.length || 1} Qs`}</span>
                    </div>

                    <div className="survey-card-details">
                      <h4 className="survey-card-title">{survey.title}</h4>
                      <p className="survey-card-desc">
                        {survey.description || "Complete this survey to share your feedback and earn Grace Points."}
                      </p>
                      <div className="survey-card-footer">
                        <div className="survey-reward-pill">
                          <FontAwesomeIcon icon={faCoins} />
                          <span>+{survey.gracePoints || 50} GP</span>
                        </div>
                        <button className="take-survey-btn" onClick={() => setActiveSurvey(survey)}>
                          Take Survey
                        </button>
                      </div>
                    </div>
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
            <div className="ads-grid">
              {[
                { id: "ad1", title: "Sponsored Video Spot", reward: 25, duration: 30, type: "custom" },
                { id: "ad2", title: "App Showcase Video", reward: 35, duration: 45, type: "custom" },
                { id: "ad3", title: "Brand Promo Reel", reward: 50, duration: 60, type: "custom" }
              ].map((ad, idx) => (
                <div key={ad.id} className="ad-card">
                  <div className="ad-thumb-container">
                    <div className="ad-type-badge">SLOT #{idx + 1}</div>

                    {ad.type === "google_adsense" ? (
                      <div className="adsense-box">
                        <ins
                          className="adsbygoogle"
                          style={{ display: "block" }}
                          data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
                          data-ad-slot="1234567890"
                          data-ad-format="auto"
                          data-full-width-responsive="true"
                        />
                      </div>
                    ) : (
                      <div className="custom-ad-placeholder">
                        <FontAwesomeIcon icon={faTv} className="placeholder-icon" />
                      </div>
                    )}

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
