import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartPie,
  faClipboardList,
  faGear,
  faMagnifyingGlass,
  faBell,
  faBars,
  faXmark,
  faWallet,
  faHistory,
  faCamera,
  faShield,
  faRightFromBracket,
  faUser,
  faArrowUpRightFromSquare,
  faReceipt,
  faCheckCircle,
  faCoins,
  faChartSimple,
  faArrowRight,
  faBullhorn,
  faExternalLinkAlt,
  faFire,
  faStar,
  faBolt,
  faCircleDot
} from "@fortawesome/free-solid-svg-icons";
import "./NewDashboard.css";

// Firebase Auth, DB & Storage Imports
import { auth, db, storage } from "../firebase";
import { ref as dbRef, onValue, update } from "firebase/database";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { signOut } from "firebase/auth";

function NewDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Real-time State
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState({
    name: "Loading...",
    email: "Loading...",
    gracePoints: 0,
    photoURL: "",
    bankDetails: { bankName: "", accountNumber: "", accountName: "" }
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [surveys, setSurveys] = useState([]);
  const [ads, setAds] = useState([]);
  const [activeSurvey, setActiveSurvey] = useState(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [surveyFilter, setSurveyFilter] = useState("All Hubs");

  // Track user's completed surveys locally and globally
  const [userCompletedSurveys, setUserCompletedSurveys] = useState({});

  // Track survey completion timestamps locally for the 3-minute hiding window and daily tracking
  const [completedTimestamps, setCompletedTimestamps] = useState({});

  const MAX_DAILY_SURVEYS = 3;

  // 1. Auth Listener
  useEffect(() => {
    let unsubscribeDb = () => {};

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      unsubscribeDb();

      if (user) {
        setCurrentUser(user);
        const userPath = dbRef(db, `users/${user.uid}`);
        unsubscribeDb = onValue(userPath, (snapshot) => {
          const data = snapshot.val();
          setUserProfile({
            name: data?.name || user.displayName || "User",
            email: data?.email || user.email || "No Email",
            gracePoints: data?.gracePoints || data?.rewards || 0,
            photoURL: data?.photoURL || user.photoURL || "",
            bankDetails: data?.bankDetails || { bankName: "", accountNumber: "", accountName: "" }
          });

          // Fetch user-specific completed surveys
          if (data?.completedSurveys) {
            setUserCompletedSurveys(data.completedSurveys);
          } else {
            setUserCompletedSurveys({});
          }

          // Fetch survey completion timestamps if present
          if (data?.completedTimestamps) {
            setCompletedTimestamps(data.completedTimestamps);
          }
        });
      } else {
        setCurrentUser(null);
        setUserProfile({ name: "Guest", email: "Not logged in", gracePoints: 0, photoURL: "", bankDetails: {} });
        setUserCompletedSurveys({});
      }
    });

    return () => {
      unsubscribeDb();
      unsubscribeAuth();
    };
  }, []);

  // 2. Fetch Surveys
  useEffect(() => {
    const surveysPath = dbRef(db, "surveys");
    const unsubscribeSurveys = onValue(surveysPath, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSurveys(Object.keys(data).map((key) => ({ id: key, ...data[key] })));
      } else {
        setSurveys([]);
      }
    });
    return () => unsubscribeSurveys();
  }, []);

  // 3. Fetch Ads
  useEffect(() => {
    const adsPath = dbRef(db, "ads");
    const unsubscribeAds = onValue(adsPath, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const adsList = Object.keys(data).map((key) => ({ id: key, ...data[key] }));
        setAds(adsList.reverse());
      } else {
        setAds([]);
      }
    });
    return () => unsubscribeAds();
  }, []);

  // Timer refresh ticker for removing completed surveys after 3 minutes
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Calculate surveys completed today
  const todayString = new Date().toDateString();
  const dailyCompletedCount = Object.values(completedTimestamps).filter((ts) => {
    if (!ts) return false;
    return new Date(ts).toDateString() === todayString;
  }).length;

  const hasReachedDailyLimit = dailyCompletedCount >= MAX_DAILY_SURVEYS;

  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !currentUser) return;
    if (file.size > 2 * 1024 * 1024) return alert("Please select an image smaller than 2MB.");
    setUploadingImage(true);
    try {
      const imageStorageRef = storageRef(storage, `profile_pictures/${currentUser.uid}`);
      await uploadBytes(imageStorageRef, file);
      const downloadURL = await getDownloadURL(imageStorageRef);
      await update(dbRef(db, `users/${currentUser.uid}`), { photoURL: downloadURL });
      alert("Profile picture updated!");
    } catch (error) {
      alert("Error uploading profile image.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to log out?")) {
      try {
        await signOut(auth);
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleStartSurvey = (survey) => {
    if (!currentUser) return alert("Please log in to attend surveys.");
    if (hasReachedDailyLimit) return alert("No surveys available for today. You have reached your limit of 3 surveys per day!");
    setActiveSurvey(survey);
    setCurrentQuestionIdx(0);
    setSelectedAnswer("");
  };

  const handleNextQuestion = () => {
    if (!selectedAnswer) return alert("Please select an answer.");
    const questionsList = Array.isArray(activeSurvey.questions) ? activeSurvey.questions : [];
    if (currentQuestionIdx < questionsList.length - 1) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
      setSelectedAnswer("");
    } else {
      const rewardGained = activeSurvey.gracePoints || parseInt(activeSurvey.reward?.replace(/\D/g, "") || "100", 10);
      const newTotalGP = userProfile.gracePoints + rewardGained;
      const completionTime = Date.now();

      // Update User Statistics & Mark Survey as Completed for this User
      update(dbRef(db, `users/${currentUser.uid}`), { 
        gracePoints: newTotalGP, 
        rewards: newTotalGP,
        [`completedSurveys/${activeSurvey.id}`]: true,
        [`completedTimestamps/${activeSurvey.id}`]: completionTime
      });

      // Update Global Survey status
      update(dbRef(db, `surveys/${activeSurvey.id}`), { status: "Completed" });

      // Track completion timestamp locally for 3 minute delay and daily limit checking
      setCompletedTimestamps((prev) => ({
        ...prev,
        [activeSurvey.id]: completionTime
      }));

      alert(`Congratulations! You earned ${rewardGained} Grace Points!`);
      setActiveSurvey(null);
    }
  };

  const getQuestionCount = (survey) => {
    if (Array.isArray(survey.questions)) return survey.questions.length;
    return survey.questionsCount || survey.questions || 1;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return { dateStr: "Jan 18, 2023", timeStr: "09:15 PM" };
    const dateObj = new Date(timestamp);
    return {
      dateStr: dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      timeStr: dateObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    };
  };

  // Check if survey is completed by user or globally
  const isSurveyCompleted = (survey) => {
    return userCompletedSurveys[survey.id] || survey.status === "Completed" || survey.status === "Complete";
  };

  // Filter surveys & handle 3-minute post-completion removal dynamically
  const now = Date.now();
  const THREE_MINUTES = 3 * 60 * 1000;

  const filteredSurveys = surveys.filter((s) => {
    const isCompleted = isSurveyCompleted(s);
    
    // Hide completed survey if 3 minutes have passed since completion
    if (isCompleted && completedTimestamps[s.id]) {
      const elapsed = now - completedTimestamps[s.id];
      if (elapsed > THREE_MINUTES) {
        return false;
      }
    }

    if (surveyFilter === "Completed") return isCompleted;
    if (surveyFilter === "Paused") return s.status === "Paused";
    if (surveyFilter === "In Review") return s.status === "In Review" || s.status === "Under Approval";
    if (surveyFilter === "Active Surveys") return !isCompleted && (s.status === "Active" || !s.status);
    return true;
  });

  const completedCount = surveys.filter((s) => isSurveyCompleted(s)).length;
  const runningCount = surveys.filter((s) => !isSurveyCompleted(s) && (s.status === "Active" || !s.status)).length;
  const totalCount = surveys.length || 1;
  const completionRate = Math.round((completedCount / totalCount) * 100);

  // Dynamic Icon and Theme Color Badge Generator
  const getBadgeStyle = (survey) => {
    const isCompleted = isSurveyCompleted(survey);
    const status = survey?.status;

    if (isCompleted) {
      return { badgeClass: "badge-green", statusClass: "status-tag complete", label: "Completed", icon: faCheckCircle };
    }
    if (status === "Paused") {
      return { badgeClass: "badge-yellow", statusClass: "status-tag paused", label: "Paused", icon: faCircleDot };
    }
    if (status === "In Review" || status === "Under Approval") {
      return { badgeClass: "badge-purple", statusClass: "status-tag in-review", label: "In Review", icon: faShield };
    }

    // Varied colorful themes generated per survey ID/Title
    const str = (survey.id || "") + (survey.title || "");
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorThemes = [
      { badgeClass: "badge-purple", icon: faFire },
      { badgeClass: "badge-green", icon: faBolt },
      { badgeClass: "badge-yellow", icon: faStar },
      { badgeClass: "badge-orange", icon: faFire },
      { badgeClass: "badge-cyan", icon: faBolt },
      { badgeClass: "badge-rose", icon: faStar }
    ];
    const chosenIndex = Math.abs(hash) % colorThemes.length;
    const theme = colorThemes[chosenIndex];

    return { badgeClass: theme.badgeClass, statusClass: "status-tag active", label: "Active", icon: theme.icon };
  };

  return (
    <div className="survey-dashboard">
      {sidebarOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}

      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-top">
          <div className="logo"><span className="logo-icon">✕</span> EarnWithGrace</div>
          <div className="sidebar-section">
            <span className="section-label">PRODUCT</span>
            <nav className="sidebar-nav">
              <a href="#dashboard" className="nav-item active">
                <FontAwesomeIcon icon={faChartPie} className="nav-icon" />
                <span>Dashboard</span>
              </a>
              <a href="#insights" className="nav-item">
                <FontAwesomeIcon icon={faClipboardList} className="nav-icon" />
                <span>Insights</span>
              </a>
              <a href="#surveys" className="nav-item">
                <FontAwesomeIcon icon={faHistory} className="nav-icon" />
                <span>My Surveys</span>
                <span className="nav-badge">{surveys.length}</span>
              </a>
            </nav>
          </div>
          <div className="sidebar-section">
            <span className="section-label">ACCOUNT</span>
            <nav className="sidebar-nav">
              <a href="#wallet" className="nav-item">
                <FontAwesomeIcon icon={faWallet} className="nav-icon" />
                <span>Wallet</span>
              </a>
              <a href="#payments" className="nav-item">
                <FontAwesomeIcon icon={faReceipt} className="nav-icon" />
                <span>Bills & Payments</span>
              </a>
              <a href="#settings" className="nav-item">
                <FontAwesomeIcon icon={faGear} className="nav-icon" />
                <span>Setting</span>
              </a>
            </nav>
          </div>
        </div>
        <div className="sidebar-bottom">
          <button className="logout-button" onClick={handleLogout}>
            <FontAwesomeIcon icon={faRightFromBracket} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="header">
          <div className="header-left">
            <button className="menu-toggle" onClick={toggleSidebar}>
              <FontAwesomeIcon icon={sidebarOpen ? faXmark : faBars} />
            </button>
            <div className="search-wrapper">
              <input type="text" placeholder="Search surveys or ads..." className="search-bar" />
              <FontAwesomeIcon icon={faMagnifyingGlass} className="search-icon" />
            </div>
          </div>

          <div className="header-actions">
            <button className="notification-btn"><FontAwesomeIcon icon={faBell} /></button>
            <div className="user-profile-card">
              <div className="profile-avatar-wrapper">
                {userProfile.photoURL ? (
                  <img src={userProfile.photoURL} alt="Profile" className="profile-avatar-img" style={{ opacity: uploadingImage ? 0.5 : 1 }} />
                ) : (
                  <div className="default-avatar"><FontAwesomeIcon icon={faUser} /></div>
                )}
                <label htmlFor="top-profile-upload" className="avatar-upload-badge">
                  <FontAwesomeIcon icon={faCamera} />
                </label>
                <input type="file" id="top-profile-upload" accept="image/*" onChange={handleProfilePictureChange} style={{ display: "none" }} disabled={uploadingImage || !currentUser} />
              </div>
              <div className="user-profile-info">
                <h4 className="user-name">{userProfile.name}</h4>
                <p className="user-email">{userProfile.email}</p>
              </div>
            </div>
          </div>
        </header>

        {/* User-Friendly Filter Navigation Tabs */}
        <div className="top-filter-bar">
          <div className="filter-tabs">
            {["All Hubs", "Active Surveys", "In Review", "Paused", "Completed"].map((tab) => (
              <button key={tab} className={`filter-tab ${surveyFilter === tab ? "active" : ""}`} onClick={() => setSurveyFilter(tab)}>
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="grid-main-column">
            <div className="stat-cards-row">
              <div className="stat-card green-card">
                <div className="stat-card-header">
                  <span className="stat-label">Available Balance</span>
                  <button className="icon-arrow-btn">
                    <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
                  </button>
                </div>
                <div className="stat-value">₦{userProfile.gracePoints.toLocaleString()}</div>
                <div className="card-sub-text">{userProfile.gracePoints} Grace Points</div>
              </div>

              <div className="stat-card purple-card">
                <div className="stat-card-header">
                  <span className="stat-label">Spent this month</span>
                  <button className="icon-arrow-btn">
                    <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
                  </button>
                </div>
                <div className="stat-value">₦0</div>
                <div className="card-sub-text">Calculated metrics</div>
              </div>
            </div>

            <div className="charts-analytics-grid">
              <div className="chart-card">
                <div className="chart-header">
                  <FontAwesomeIcon icon={faCheckCircle} className="chart-icon green" />
                  <h4>Completed Surveys</h4>
                </div>
                <div className="gauge-container">
                  <svg viewBox="0 0 36 36" className="circular-chart green-stroke">
                    <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className="circle" strokeDasharray={`${completionRate}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <text x="18" y="20.35" className="percentage">{completionRate}%</text>
                  </svg>
                </div>
                <div className="chart-footer-info">
                  <strong>{completedCount}</strong> of <strong>{surveys.length}</strong> total completed
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <FontAwesomeIcon icon={faCoins} className="chart-icon gold" />
                  <h4>Points Growth</h4>
                </div>
                <div className="mini-chart-body">
                  <svg viewBox="0 0 100 40" className="trend-area-chart">
                    <defs>
                      <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#9980ff" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#9980ff" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <polygon points="0,40 0,30 25,25 50,18 75,22 100,8 100,40" fill="url(#grad)" />
                    <polyline points="0,30 25,25 50,18 75,22 100,8" fill="none" stroke="#9980ff" strokeWidth="2.5" />
                  </svg>
                </div>
                <div className="chart-footer-info">
                  <strong>+{userProfile.gracePoints} GP</strong> accumulated total
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <FontAwesomeIcon icon={faChartSimple} className="chart-icon purple" />
                  <h4>Survey Status Ratio</h4>
                </div>
                <div className="gauge-container">
                  <svg viewBox="0 0 36 36" className="circular-chart purple-stroke">
                    <path
                      className="circle-bg"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      style={{ stroke: "#2d2a4a", strokeWidth: 3.8 }}
                    />
                    <path
                      className="circle"
                      strokeDasharray={`${surveys.length ? Math.round((runningCount / surveys.length) * 100) : 0}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      style={{ stroke: "#9980ff", strokeWidth: 3.8 }}
                    />
                    <path
                      className="circle"
                      strokeDasharray={`${surveys.length ? Math.round((completedCount / surveys.length) * 100) : 0}, 100`}
                      strokeDashoffset={`-${surveys.length ? Math.round((runningCount / surveys.length) * 100) : 0}`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      style={{ stroke: "#00e676", strokeWidth: 3.8 }}
                    />
                    <text x="18" y="20.35" className="percentage">
                      {surveys.length ? Math.round((runningCount / surveys.length) * 100) : 0}%
                    </text>
                  </svg>
                </div>
                <div className="chart-footer-info" style={{ display: "flex", justifyContent: "space-around", gap: "5px" }}>
                  <span><span style={{ color: "#9980ff", fontWeight: "bold" }}>●</span> Running ({runningCount})</span>
                  <span><span style={{ color: "#00e676", fontWeight: "bold" }}>●</span> Done ({completedCount})</span>
                </div>
              </div>
            </div>

            {/* SURVEY TABLE SECTION */}
            <div className="surveys-list-section">
              <div className="surveys-list-header">
                <h3>Your Surveys</h3>
                <button className="create-new-link" onClick={() => setSurveyFilter("All Hubs")}>View All</button>
              </div>

              {/* DAILY SURVEY LIMIT BANNER */}
              {hasReachedDailyLimit && (
                <div style={{
                  backgroundColor: "rgba(255, 171, 0, 0.12)",
                  border: "1px solid #ffab00",
                  color: "#ffab00",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  marginBottom: "15px",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  fontWeight: "bold"
                }}>
                  <FontAwesomeIcon icon={faShield} />
                  <span>No survey for today. You have completed the maximum limit of 3 surveys today!</span>
                </div>
              )}

              <div className="surveys-table">
                <div className="table-row table-head">
                  <div className="col col-name">PRODUCT NAME</div>
                  <div className="col col-date">DATE</div>
                  <div className="col col-responses">RESPONSES</div>
                  <div className="col col-spent">REWARD</div>
                  <div className="col col-status">STATUS</div>
                </div>

                {filteredSurveys.length === 0 ? (
                  <div className="no-surveys">No surveys available for "{surveyFilter}".</div>
                ) : (
                  filteredSurveys.map((s) => {
                    const questionCount = getQuestionCount(s);
                    const points = s.gracePoints || parseInt(s.reward?.replace(/\D/g, "") || "5000", 10);
                    const completed = isSurveyCompleted(s);
                    const formatted = formatDate(s.createdAt);
                    const styleConfig = getBadgeStyle(s);

                    return (
                      <div key={s.id} className="table-row">
                        <div className="col col-name">
                          <div className={`survey-icon-badge ${styleConfig.badgeClass}`}>
                            <FontAwesomeIcon icon={styleConfig.icon} />
                          </div>
                          <div>
                            <div className="survey-item-title">{s.title || "Popcorn Survey"}</div>
                            <div className="survey-item-sub">{questionCount} Questions</div>
                          </div>
                        </div>
                        <div className="col col-date">
                          <div className="date-main">{formatted.dateStr}</div>
                          <div className="date-sub">{formatted.timeStr}</div>
                        </div>
                        <div className="col col-responses">{s.responses ? s.responses.toLocaleString() : "12,000"}</div>
                        <div className="col col-spent">₦{points.toLocaleString()}</div>
                        <div className="col col-status">
                          {completed ? (
                            <span className="status-tag complete">Completed</span>
                          ) : s.status === "Paused" || s.status === "In Review" || s.status === "Under Approval" ? (
                            <span className={styleConfig.statusClass}>{styleConfig.label}</span>
                          ) : hasReachedDailyLimit ? (
                            <button disabled style={{ opacity: 0.5, cursor: "not-allowed" }} className="attend-btn">Limit Reached</button>
                          ) : (
                            <button onClick={() => handleStartSurvey(s)} className="attend-btn">Attend</button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="grid-side-column">
            <div className="templates-panel">
              <div className="templates-header">
                <h3><FontAwesomeIcon icon={faBullhorn} className="ad-header-icon" /> Newly Posted Ads</h3>
                <p>Sponsored Offers & Live Promos</p>
              </div>

              {ads.length === 0 ? (
                <div className="no-ads-card" style={{ padding: "15px", textAlign: "center" }}>
                  <p>No new ads posted right now. Check back soon for sponsored offers!</p>
                </div>
              ) : (
                ads.map((ad) => (
                  <div key={ad.id} className="template-card ad-sidebar-card">
                    {ad.imageUrl && <img src={ad.imageUrl} alt={ad.title} className="ad-card-image" style={{ width: "100%", borderRadius: "8px", marginBottom: "10px" }} />}
                    <h4>{ad.title || "Featured Promotion"}</h4>
                    <p>{ad.description || "Discover new offers and bonus points by interacting with this ad."}</p>
                    <div className="template-pills" style={{ marginTop: "10px", marginBottom: "10px" }}>
                      <span className="pill">{ad.category || "Sponsored"}</span>
                      <span className="pill green">+{ad.points || 50} GP</span>
                    </div>
                    {ad.link && (
                      <a href={ad.link} target="_blank" rel="noopener noreferrer" className="view-template-btn" style={{ display: "block", textAlign: "center", textDecoration: "none" }}>
                        View Ad <FontAwesomeIcon icon={faExternalLinkAlt} style={{ marginLeft: "5px" }} />
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Survey Modal */}
        {activeSurvey && (
          <div className="modal-overlay">
            <div className="modal-content-box">
              <div className="modal-header">
                <h3>{activeSurvey.title}</h3>
                <button onClick={() => setActiveSurvey(null)} className="close-btn"><FontAwesomeIcon icon={faXmark} /></button>
              </div>
              {Array.isArray(activeSurvey.questions) && activeSurvey.questions.length > 0 ? (
                <div>
                  <div className="question-count-badge">Question {currentQuestionIdx + 1} of {activeSurvey.questions.length}</div>
                  <h4 className="question-title">{activeSurvey.questions[currentQuestionIdx]?.text || activeSurvey.questions[currentQuestionIdx]}</h4>
                  <div className="options-list">
                    {(activeSurvey.questions[currentQuestionIdx]?.options || ["Option A", "Option B", "Option C", "Option D"]).map((opt, i) => (
                      <label key={i} className={`option-item ${selectedAnswer === opt ? "selected" : ""}`}>
                        <input type="radio" name="survey-option" value={opt} checked={selectedAnswer === opt} onChange={(e) => setSelectedAnswer(e.target.value)} />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                  <button onClick={handleNextQuestion} className="primary-action-btn">
                    {currentQuestionIdx < activeSurvey.questions.length - 1 ? "Next Question" : "Submit & Earn Points"}
                    <FontAwesomeIcon icon={faArrowRight} />
                  </button>
                </div>
              ) : (
                <p>No questions found in this survey.</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default NewDashboard;