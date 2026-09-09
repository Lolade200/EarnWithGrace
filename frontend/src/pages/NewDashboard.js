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
  faCircleDot,
  faLock,
  faCalendarAlt,
  faBuildingColumns,
  faBitcoinSign,
  faAt,
  faPenToSquare,
  faWandMagicSparkles,
  faExclamationTriangle
} from "@fortawesome/free-solid-svg-icons";
import "./NewDashboard.css";

// Firebase Auth, DB & Storage Imports
import { auth, db, storage } from "../firebase";
import { ref as dbRef, onValue, update, push } from "firebase/database";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { signOut } from "firebase/auth";

function NewDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Search & Notification States
  const [searchTerm, setSearchTerm] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);

  // Real-time State
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState({
    name: "Loading...",
    email: "Loading...",
    gracePoints: 0,
    photoURL: "",
    bankDetails: { bankName: "", accountNumber: "", accountName: "" },
    cryptoDetails: { walletAddress: "", network: "" }
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [surveys, setSurveys] = useState([]);
  const [ads, setAds] = useState([]);
  const [activeSurvey, setActiveSurvey] = useState(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [surveyFilter, setSurveyFilter] = useState("Active Surveys");

  // Track user's completed surveys locally and globally
  const [userCompletedSurveys, setUserCompletedSurveys] = useState({});

  // Track survey completion timestamps locally for the 3-minute hiding window and daily tracking
  const [completedTimestamps, setCompletedTimestamps] = useState({});

  const MAX_DAILY_SURVEYS = 3;

  // Modals State
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showActiveSurveysModal, setShowActiveSurveysModal] = useState(false);
  const [showCompletedSurveysModal, setShowCompletedSurveysModal] = useState(false);
  const [showPausedSurveysModal, setShowPausedSurveysModal] = useState(false);

  // Wallet Modal Active Tab State
  const [walletTab, setWalletTab] = useState("bank");

  // Settings Edit Form States
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [animatedHandle, setAnimatedHandle] = useState("");

  // Bank Details Form States
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");

  // Crypto Details Form States
  const [cryptoAddress, setCryptoAddress] = useState("");
  const [cryptoNetwork, setCryptoNetwork] = useState("");

  // Payout Payment Amount State
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutLoading, setPayoutLoading] = useState(false);

  // Helper to generate a fun animated handle from user details/UID
  const generateAnimatedHandle = (nameStr, uidStr) => {
    const prefixes = ["alpha", "cyber", "star", "grace", "nexus", "quantum", "vortex"];
    const base = (nameStr || "user").toLowerCase().replace(/[^a-z0-9]/g, "");
    const hash = (uidStr || "123").split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const prefix = prefixes[hash % prefixes.length];
    const num = (hash % 899) + 100;
    return `@${prefix}_${base}_${num}`;
  };

  // Filter click handler
  const handleFilterTabClick = (tab) => {
    setSurveyFilter(tab);
    if (tab === "Active Surveys") {
      setShowActiveSurveysModal(true);
    } else if (tab === "Completed") {
      setShowCompletedSurveysModal(true);
    } else if (tab === "Paused") {
      setShowPausedSurveysModal(true);
    }
  };

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
          const currentName = data?.name || user.displayName || "User";
          const currentEmail = data?.email || user.email || "No Email";
          const currentBank = data?.bankDetails || { bankName: "", accountNumber: "", accountName: "" };
          const currentCrypto = data?.cryptoDetails || { walletAddress: "", network: "" };

          setUserProfile({
            name: currentName,
            email: currentEmail,
            gracePoints: data?.gracePoints || data?.rewards || 0,
            photoURL: data?.photoURL || user.photoURL || "",
            bankDetails: currentBank,
            cryptoDetails: currentCrypto
          });

          setEditName(currentName);
          setEditEmail(currentEmail);
          setAnimatedHandle(generateAnimatedHandle(currentName, user.uid));

          setBankName(currentBank.bankName || "");
          setAccountNumber(currentBank.accountNumber || "");
          setAccountName(currentBank.accountName || "");
          setCryptoAddress(currentCrypto.walletAddress || "");
          setCryptoNetwork(currentCrypto.network || "");

          if (data?.completedSurveys) {
            setUserCompletedSurveys(data.completedSurveys);
          } else {
            setUserCompletedSurveys({});
          }

          if (data?.completedTimestamps) {
            setCompletedTimestamps(data.completedTimestamps);
          }
        });
      } else {
        setCurrentUser(null);
        setUserProfile({ name: "Guest", email: "Not logged in", gracePoints: 0, photoURL: "", bankDetails: {}, cryptoDetails: {} });
        setUserCompletedSurveys({});
        setAnimatedHandle("@guest_user");
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

  const handleUpdateProfileSettings = async (e) => {
    e.preventDefault();
    if (!currentUser) return alert("Please log in.");
    try {
      await update(dbRef(db, `users/${currentUser.uid}`), {
        name: editName,
        email: editEmail
      });
      alert("Profile settings updated successfully!");
      setShowSettingsModal(false);
    } catch (error) {
      alert("Error updating profile: " + error.message);
    }
  };

  const handleSaveBankDetails = async (e) => {
    e.preventDefault();
    if (!currentUser) return alert("Please log in.");
    try {
      await update(dbRef(db, `users/${currentUser.uid}/bankDetails`), {
        bankName,
        accountNumber,
        accountName
      });
      alert("Bank details saved successfully!");
    } catch (error) {
      alert("Error saving bank details: " + error.message);
    }
  };

  const handleSaveCryptoDetails = async (e) => {
    e.preventDefault();
    if (!currentUser) return alert("Please log in.");
    try {
      await update(dbRef(db, `users/${currentUser.uid}/cryptoDetails`), {
        walletAddress: cryptoAddress,
        network: cryptoNetwork
      });
      alert("Crypto wallet details saved successfully!");
    } catch (error) {
      alert("Error saving crypto details: " + error.message);
    }
  };

  const handleRequestPayout = async (e) => {
    e.preventDefault();
    if (!currentUser) return alert("Please log in.");

    const amountNum = parseFloat(payoutAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return alert("Please enter a valid payout amount.");
    }

    if (amountNum > userProfile.gracePoints) {
      return alert("Insufficient balance for this payout request.");
    }

    if (!userProfile.bankDetails.accountNumber && !userProfile.cryptoDetails.walletAddress) {
      return alert("Please configure your bank or crypto details in your Wallet before requesting payout.");
    }

    setPayoutLoading(true);
    try {
      const payoutRef = dbRef(db, "payouts");
      await push(payoutRef, {
        userId: currentUser.uid,
        userName: userProfile.name,
        userEmail: userProfile.email,
        amount: amountNum,
        bankDetails: userProfile.bankDetails,
        cryptoDetails: userProfile.cryptoDetails,
        status: "Pending",
        requestedAt: Date.now()
      });

      alert("Payout request submitted successfully!");
      setPayoutAmount("");
      setShowPaymentModal(false);
    } catch (error) {
      alert("Failed to submit payout request: " + error.message);
    } finally {
      setPayoutLoading(false);
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
    if (hasReachedDailyLimit) return alert("Maximum daily survey limit reached (3/3)! Please check back tomorrow.");
    setActiveSurvey(survey);
    setShowActiveSurveysModal(false);
    setShowPausedSurveysModal(false);
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

      update(dbRef(db, `users/${currentUser.uid}`), { 
        gracePoints: newTotalGP, 
        rewards: newTotalGP,
        [`completedSurveys/${activeSurvey.id}`]: true,
        [`completedTimestamps/${activeSurvey.id}`]: completionTime
      });

      update(dbRef(db, `surveys/${activeSurvey.id}`), { status: "Completed" });

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
    return survey.questionsCount || survey.questions || 12;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return { dateStr: "Jan 18, 2023", timeStr: "09:15 PM" };
    const dateObj = new Date(timestamp);
    return {
      dateStr: dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      timeStr: dateObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    };
  };

  const isSurveyCompleted = (survey) => {
    return userCompletedSurveys[survey.id] || survey.status === "Completed" || survey.status === "Complete";
  };

  const now = Date.now();
  const THREE_MINUTES = 3 * 60 * 1000;

  // Filter surveys based on tab & search term
  const filteredSurveys = surveys.filter((s) => {
    const isCompleted = isSurveyCompleted(s);
    
    if (isCompleted && completedTimestamps[s.id]) {
      const elapsed = now - completedTimestamps[s.id];
      if (elapsed > THREE_MINUTES) {
        return false;
      }
    }

    // Search term filtering
    if (searchTerm.trim() !== "") {
      const titleMatch = (s.title || "").toLowerCase().includes(searchTerm.toLowerCase());
      if (!titleMatch) return false;
    }

    if (surveyFilter === "Completed") return isCompleted;
    if (surveyFilter === "Paused") return s.status === "Paused";
    if (surveyFilter === "Active Surveys") return !isCompleted && (s.status === "Active" || !s.status);
    return true;
  });

  // Active surveys list
  const activeSurveysList = surveys.filter((s) => !isSurveyCompleted(s) && (s.status === "Active" || !s.status));
  // Completed surveys list
  const completedSurveysList = surveys.filter((s) => isSurveyCompleted(s));
  // Paused surveys list
  const pausedSurveysList = surveys.filter((s) => !isSurveyCompleted(s) && s.status === "Paused");

  // Filtered ads based on search term
  const filteredAds = ads.filter((ad) => {
    if (!searchTerm.trim()) return true;
    return (ad.title || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
           (ad.description || "").toLowerCase().includes(searchTerm.toLowerCase());
  });

  const completedCount = surveys.filter((s) => isSurveyCompleted(s)).length;
  const runningCount = surveys.filter((s) => !isSurveyCompleted(s) && (s.status === "Active" || !s.status)).length;
  const totalCount = surveys.length || 1;
  const completionRate = Math.round((completedCount / totalCount) * 100);

  const getBadgeStyle = (survey) => {
    const isCompleted = isSurveyCompleted(survey);
    const status = survey?.status;

    if (isCompleted) {
      return { 
        circleBg: "#00e676", 
        circleIconColor: "#000", 
        statusBg: "#00e676", 
        statusTextColor: "#000", 
        label: "Complete", 
        icon: faFire 
      };
    }
    if (status === "Paused") {
      return { 
        circleBg: "#ffab00", 
        circleIconColor: "#000", 
        statusBg: "#b388ff", 
        statusTextColor: "#000", 
        label: "Paused", 
        icon: faFire 
      };
    }
    if (status === "In Review") {
      return { 
        circleBg: "#b388ff", 
        circleIconColor: "#000", 
        statusBg: "#ffd54f", 
        statusTextColor: "#000", 
        label: "In Review", 
        icon: faFire 
      };
    }

    const str = (survey.id || "") + (survey.title || "");
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorThemes = [
      { circleBg: "#00e676", circleIconColor: "#000", statusBg: "#00e676", statusTextColor: "#000", label: "Active" },
      { circleBg: "#ffab00", circleIconColor: "#000", statusBg: "#b388ff", statusTextColor: "#000", label: "Active" },
      { circleBg: "#b388ff", circleIconColor: "#000", statusBg: "#ffd54f", statusTextColor: "#000", label: "Active" }
    ];
    const theme = colorThemes[Math.abs(hash) % colorThemes.length];

    return { 
      circleBg: theme.circleBg, 
      circleIconColor: theme.circleIconColor, 
      statusBg: theme.statusBg, 
      statusTextColor: theme.statusTextColor, 
      label: theme.label, 
      icon: faFire 
    };
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
              <a href="#dashboard" className="nav-item active" onClick={() => setSurveyFilter("Active Surveys")}>
                <FontAwesomeIcon icon={faChartPie} className="nav-icon" />
                <span>Dashboard</span>
              </a>
              <button 
                type="button" 
                className="nav-item btn-nav" 
                onClick={() => { setShowCompletedSurveysModal(true); setSurveyFilter("Completed"); }} 
              >
                <FontAwesomeIcon icon={faHistory} className="nav-icon" />
                <span>Completed Surveys</span>
                <span className="survey-badge badge-green badge-margin-left">
                  <FontAwesomeIcon icon={faCheckCircle} />
                  {completedCount}
                </span>
              </button>
            </nav>
          </div>
          <div className="sidebar-section">
            <span className="section-label">ACCOUNT</span>
            <nav className="sidebar-nav">
              <button type="button" className="nav-item btn-nav" onClick={() => setShowWalletModal(true)}>
                <FontAwesomeIcon icon={faWallet} className="nav-icon" />
                <span>Wallet</span>
              </button>
              <button type="button" className="nav-item btn-nav" onClick={() => setShowPaymentModal(true)}>
                <FontAwesomeIcon icon={faReceipt} className="nav-icon" />
                <span>Bills & Payments</span>
              </button>
              <button type="button" className="nav-item btn-nav" onClick={() => setShowSettingsModal(true)}>
                <FontAwesomeIcon icon={faGear} className="nav-icon" />
                <span>Setting</span>
              </button>
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
        {/* Header container */}
        <header className="header header-curved">
          <div className="header-left">
            <button className="menu-toggle" onClick={toggleSidebar}>
              <FontAwesomeIcon icon={sidebarOpen ? faXmark : faBars} />
            </button>
            <div className="search-wrapper">
              <input 
                type="text" 
                placeholder="Search surveys or ads..." 
                className="search-bar" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FontAwesomeIcon icon={faMagnifyingGlass} className="search-icon" />
            </div>
          </div>

          <div className="header-actions header-actions-pos">
            <button className="notification-btn" onClick={() => setShowNotifications(!showNotifications)}>
              <FontAwesomeIcon icon={faBell} />
              <span className="notification-dot"></span>
            </button>

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
            </div>
          </div>
        </header>

        {/* Dashboard Content Container */}
        <div className="dashboard-content-wrapper">
          <div className="user-info-section">
            <span className="animated-user-handle">{animatedHandle}</span>
            <h2>Welcome back, {userProfile.name}!</h2>
          </div>

          <div className="your-surveys-card-container">
            <div className="your-surveys-card-header">
              <h2>Your Surveys</h2>
              <div className="your-surveys-header-actions">
                <button className="view-all-btn" onClick={() => handleFilterTabClick("Active Surveys")}>
                  Active ({runningCount})
                </button>
              </div>
            </div>

            {hasReachedDailyLimit && (
              <div className="daily-limit-banner">
                <FontAwesomeIcon icon={faExclamationTriangle} />
                <span>You have reached your daily limit of {MAX_DAILY_SURVEYS} surveys!</span>
              </div>
            )}

            <div className="surveys-table-container">
              <div className="surveys-table-header">
                <span>Survey Name</span>
                <span>Date</span>
                <span>Questions</span>
                <span>Grace Points</span>
                <span>Status</span>
              </div>

              {filteredSurveys.map((survey) => {
                const badge = getBadgeStyle(survey);
                const isCompleted = isSurveyCompleted(survey);
                const dates = formatDate(survey.timestamp);

                return (
                  <div 
                    key={survey.id} 
                    className={`surveys-table-row ${isCompleted ? "disabled-row" : ""}`}
                    onClick={() => !isCompleted && handleStartSurvey(survey)}
                  >
                    <div className="product-name-col">
                      <div className="product-icon-circle" style={{ backgroundColor: badge.circleBg, color: badge.circleIconColor }}>
                        <FontAwesomeIcon icon={badge.icon} />
                      </div>
                      <div className="product-title-group">
                        <h4>{survey.title || "Untitled Survey"}</h4>
                        <span>{survey.category || "General"}</span>
                      </div>
                    </div>

                    <div className="date-col">
                      <span className="primary-date">{dates.dateStr}</span>
                      <span className="secondary-time">{dates.timeStr}</span>
                    </div>

                    <div className="numeric-col">
                      {getQuestionCount(survey)} Qs
                    </div>

                    <div className="numeric-col">
                      +{survey.gracePoints || 100} GP
                    </div>

                    <div className="status-col">
                      <span className="status-pill" style={{ backgroundColor: badge.statusBg, color: badge.statusTextColor }}>
                        {badge.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default NewDashboard;
