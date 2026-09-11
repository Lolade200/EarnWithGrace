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

// --- EarnWithGrace Logo using Orange Accents & faShieldHalved ---
const EarnWithGraceLogo = () => (
  <div className="ewg-logo-container">
    <FontAwesomeIcon icon={faShieldHalved} style={{ color: "#ff5500", fontSize: "2rem" }} />
    <div className="ewg-brand-text">
      <span className="brand-primary">EarnWith<span className="brand-highlight">Grace</span></span>
      <span className="brand-sub">ADMIN DASHBOARD</span>
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
        <h4><FontAwesomeIcon icon={faUsers} /> User Engagement Signups</h4>
        <span className="live-pill">LIVE MATRIX</span>
      </div>
      <div className="chart-svg-wrapper">
        <svg viewBox="0 0 500 150" className="futuristic-svg">
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff5500" stopOpacity="0.5"/>
              <stop offset="100%" stopColor="#ff5500" stopOpacity="0.0"/>
            </linearGradient>
          </defs>
          <path d="M 0,150 L 0,110 Q 70,80 140,100 T 280,60 T 420,30 L 500,10 L 500,150 Z" fill="url(#areaGradient)" />
          <path d="M 0,110 Q 70,80 140,100 T 280,60 T 420,30 L 500,10" fill="none" stroke="#ff5500" strokeWidth="3" />
          {points.map((pt, i) => (
            <circle key={i} cx={i * 80 + 10} cy={140 - pt} r="4" fill="#ffffff" stroke="#ff5500" strokeWidth="2" />
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
          <div className="bar-wrapper">
            <div className="bar pending-bar" style={{ height: `${Math.min(pendingCount * 15 + 20, 100)}%` }}></div>
          </div>
          <span>Pending ({pendingCount})</span>
        </div>
        <div className="bar-group">
          <div className="bar-wrapper">
            <div className="bar flagged-bar" style={{ height: `${Math.min(flaggedCount * 15 + 20, 100)}%` }}></div>
          </div>
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
          <circle cx="50" cy="50" r="40" stroke="#ff5500" strokeWidth="12" fill="none" strokeDasharray="180 250" strokeDashoffset="0" />
          <circle cx="50" cy="50" r="40" stroke="#f59e0b" strokeWidth="12" fill="none" strokeDasharray="60 250" strokeDashoffset="-180" />
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

  // Middle Page Modal Notification State (Matching Console Error Video Alert)
  const [activeNotificationModal, setActiveNotificationModal] = useState(null);

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

  // Trigger Center Page Modal Notification
  const triggerCenterNotification = (msg, style = "warning") => {
    setActiveNotificationModal({ message: msg, style });
  };

  // --- Handlers for Watch Ad Dynamic Reward System ---
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
    if (!currentUserData?.uid) {
      triggerCenterNotification("Ad completed! 50 Grace Points (GP) earned.", "info");
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
      triggerCenterNotification("Congratulations! 50 Grace Points added to your account balance.", "info");
    } catch (err) {
      triggerCenterNotification(`Ad Reward Error: ${err.message}`, "error");
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
      triggerCenterNotification("New Sponsored Ad Stream posted successfully!", "info");
    } catch (err) {
      triggerCenterNotification(`Error posting ad: ${err.message}`, "error");
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
        triggerCenterNotification("Each question must have at least 2 options.", "warning");
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

  // Auth & Admin Check
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
            triggerCenterNotification("Access denied: You do not have administrative privileges.", "error");
            await signOut(auth);
            navigate("/login");
          }
        } catch (err) {
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

  // Realtime Firebase DB Subscriptions
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
        { id: "ad1", title: "Cyberpunk VR Survey Promo", reward: 50 },
        { id: "ad2", title: "EarnWithGrace Global Stream", reward: 75 }
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
          triggerCenterNotification(notifList[0]?.message || "New notification received!", "warning");
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
    await signOut(auth);
    navigate("/login");
  };

  return (
    <div className="admin-dashboard futuristic-theme">
      {/* Header Container */}
      <div className="header-container">
        <div className="header-top-row">
          <button className="menu-toggle orange-style" onClick={toggleSidebar}>
            <FontAwesomeIcon icon={faBars} />
          </button>
          
          <div className="header-brand-group">
            <span className="brand-title">adebayo ololade samson</span>
            <FontAwesomeIcon icon={faShieldHalved} className="brand-shield-icon" />
          </div>
        </div>

        <span className="version-tag">v2050.8</span>

        <button 
          className="notification-btn orange-style" 
          onClick={() => triggerCenterNotification("Notifications Triggered", "info")}
        >
          <FontAwesomeIcon icon={faBell} />
        </button>
      </div>

      {/* Center-Page Modal Notification Display */}
      {activeNotificationModal && (
        <div className="center-notif-backdrop" onClick={() => setActiveNotificationModal(null)}>
          <div className={`center-notif-card ${activeNotificationModal.style}-style`} onClick={(e) => e.stopPropagation()}>
            <FontAwesomeIcon icon={faTriangleExclamation} />
            <div>
              <p>{activeNotificationModal.message}</p>
              <button onClick={() => setActiveNotificationModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
