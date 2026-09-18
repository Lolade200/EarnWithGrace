import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { ref, onValue, update, push, get, runTransaction } from "firebase/database";
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
  faSearch,
  faPenToSquare,
  faShieldHalved,
  faCheckCircle,
  faInfoCircle,
  faMousePointer,
  faClock,
  faLock,
  faDollarSign,
  faBuildingColumns,
  faSave
} from "@fortawesome/free-solid-svg-icons";
import "./NewDashboard.css";

// --- REUSABLE ADSTERRA SCRIPT EMBEDDER (Supports all provided link variants) ---
function AdsterraUnit({ zoneKey, width, height, isNative = false, containerId = "" }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";

    if (isNative && containerId) {
      const containerDiv = document.createElement("div");
      containerDiv.id = containerId;
      const nativeScript = document.createElement("script");
      nativeScript.async = true;
      nativeScript.dataset.cfasync = "false";
      nativeScript.src = `https://pl31383641.profitableratecpmnetwork.com/${containerId.replace("container-", "")}/invoke.js`;

      containerRef.current.appendChild(containerDiv);
      containerRef.current.appendChild(nativeScript);
    } else {
      const atOptionsScript = document.createElement("script");
      atOptionsScript.type = "text/javascript";
      atOptionsScript.innerHTML = `
        atOptions = {
          'key' : '${zoneKey}',
          'format' : 'iframe',
          'height' : ${height},
          'width' : ${width},
          'params' : {}
        };
      `;

      const invokeScript = document.createElement("script");
      invokeScript.type = "text/javascript";
      invokeScript.src = `https://www.highrevenueformat.com/${zoneKey}/invoke.js`;

      containerRef.current.appendChild(atOptionsScript);
      containerRef.current.appendChild(invokeScript);
    }
  }, [zoneKey, width, height, isNative, containerId]);

  return <div ref={containerRef} className="click-ad-frame-container" />;
}

// --- REUSABLE MONETAG SCRIPT EMBEDDER (Added alongside Adsterra) ---
function MonetagUnit({ scriptUrl, zoneId }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = scriptUrl;
    script.async = true;
    script.setAttribute("data-zone", zoneId);
    
    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [scriptUrl, zoneId]);

  return <div ref={containerRef} className="click-ad-frame-container monetization-unit" />;
}

// --- RANDOM USERNAME GENERATOR ---
const FOUR_LETTER_WORD_POOL = [
  "Lion", "Bear", "Wolf", "Deer", "Frog", "Swan", "Duck", "Goat", "Moth", "Wasp", "Puma", "Ibex",
  "Star", "Moon", "Wind", "Rain", "Snow", "Fire", "Wave", "Rock", "Sand", "Tree", "Leaf", "Seed",
  "Ruby", "Gold", "Ring", "Bell", "Door", "Ship", "Boat", "Lamp", "Coin", "Gift", "Book", "Desk",
  "Hope", "Soul", "Peak", "Core", "Time", "Zone", "Pulse", "Spark", "Vibe", "Echo", "Flux", "Realm"
];

const generateRandomGraceName = (uid = "") => {
  const randomIndex = Math.floor(Math.random() * FOUR_LETTER_WORD_POOL.length);
  const randomWord = FOUR_LETTER_WORD_POOL[randomIndex];
  const uniqueSuffix = uid ? uid.substring(0, 4) : Math.floor(1000 + Math.random() * 9000);
  return `Grace${randomWord}_${uniqueSuffix}`;
};

// --- SAFE ATOMIC UNIQUE USERNAME RESERVATION IN FIREBASE ---
const reserveUniqueUsername = async (userId) => {
  let isUnique = false;
  let finalUsername = "";

  while (!isUnique) {
    const candidate = generateRandomGraceName(userId);
    const usernameIndexRef = ref(db, `usernames/${candidate}`);

    const result = await runTransaction(usernameIndexRef, (currentVal) => {
      if (currentVal === null) {
        return userId; // Claim the username
      } else {
        return; // Already taken, abort transaction & re-roll
      }
    });

    if (result.committed) {
      isUnique = true;
      finalUsername = candidate;
    }
  }

  return finalUsername;
};

const getUserAvatarUrl = (identifier) => {
  const seed = encodeURIComponent(identifier || "default_user");
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`;
};

const DAILY_SURVEY_LIMIT = 3;
const CLICK_REWARD_POINTS = 5;
const CLICK_COOLDOWN_SECONDS = 60;
const MINIMUM_CASHOUT_POINTS = 100000;

// Configured Provided Adsterra Zones
const ADSTERRA_ZONES = [
  { id: "zone_320_50", title: "Mobile Banner (320x50)", zoneKey: "3c4ac41499833a2af3c140aad7fd2e96", width: 320, height: 50 },
  { id: "zone_300_250", title: "Medium Banner (300x250)", zoneKey: "1b357562f5a0d175c7c91db7524d16c3", width: 300, height: 250 },
  { id: "zone_728_90", title: "Leaderboard Banner (728x90)", zoneKey: "46fb478f24f3293845a42a755c979f26", width: 728, height: 90 },
  { id: "zone_native", title: "Sponsored Native Stream", isNative: true, containerId: "container-302a2a4f097ab5a8e8dcdcbc99072c30" }
];

// Configured Monetag Zones Added Alongside Adsterra
const MONETAG_ZONES = [
  { id: "zone_11829938", title: "Monetag Unit 1 (11829938)", zoneId: "11829938", scriptUrl: "https://al5sm.com/tag.min.js" },
  { id: "zone_281994", title: "Monetag Unit 2 (281994)", zoneId: "281994", scriptUrl: "https://quge5.com/88/tag.min.js" },
  { id: "zone_11822494", title: "Monetag Unit 3 (11822494)", zoneId: "11822494", scriptUrl: "https://al5sm.com/tag.min.js" },
  { id: "zone_11822537", title: "Monetag Unit 4 (11822537)", zoneId: "11822537", scriptUrl: "https://al5sm.com/tag.min.js" }
];

export default function NewDashboard() {
  const navigate = useNavigate();

  // Navigation & States
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("click_ads");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // User & DB State
  const [currentUserData, setCurrentUserData] = useState(null);
  const [headerRandomUsername, setHeaderRandomUsername] = useState("");
  const [surveys, setSurveys] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Centered Account / Bank Details Popup Modal State
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [bankDetails, setBankDetails] = useState({
    bankName: "",
    accountNumber: "",
    accountName: ""
  });
  const [savingBankDetails, setSavingBankDetails] = useState(false);

  // Watch Video Ad Modal State
  const [activeVideoAd, setActiveVideoAd] = useState(null);
  const [videoTimer, setVideoTimer] = useState(0);
  const [canClaimVideoReward, setCanClaimVideoReward] = useState(false);
  const [processingVideoReward, setProcessingVideoReward] = useState(false);

  // Click Ads & Anti-Abuse Tracking
  const [adCooldowns, setAdCooldowns] = useState({});
  const [adClickedState, setAdClickedState] = useState({});
  const [processingAdId, setProcessingAdId] = useState(null);

  // Active Survey Modal State
  const [activeSurvey, setActiveSurvey] = useState(null);
  const [surveyAnswers, setSurveyAnswers] = useState({});
  const [submittingSurvey, setSubmittingSurvey] = useState(false);

  // Completed surveys
  const [completedSurveyIds, setCompletedSurveyIds] = useState([]);
  const [removedSurveyIds, setRemovedSurveyIds] = useState([]);

  // Notifications
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  const showToast = (message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Inject Popunder script globally once
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://pl31383640.profitableratecpmnetwork.com/39/24/cb/3924cbf737ed463124ee135c5979e373.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Auth Subscription with Guaranteed Unique Username Reservation
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const userRef = ref(db, `users/${user.uid}`);
          const userSnap = await get(userRef);
          const data = userSnap.val() || {};

          let assignedName = data.name;
          if (!assignedName) {
            assignedName = await reserveUniqueUsername(user.uid);
            await update(userRef, { name: assignedName });
          }

          if (data.bankDetails) {
            setBankDetails(data.bankDetails);
          }

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

          setHeaderRandomUsername(assignedName);
        } catch (err) {
          console.error("User auth setup error:", err);
        }
      } else {
        navigate("/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  // Real-time Database Listeners
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

        if (val.bankDetails) {
          setBankDetails(val.bankDetails);
        }
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

  // Cooldown Decrement Loop for Click Ads
  useEffect(() => {
    const timer = setInterval(() => {
      setAdCooldowns((prev) => {
        const updated = { ...prev };
        let changed = false;
        Object.keys(updated).forEach((zoneId) => {
          if (updated[zoneId] > 0) {
            updated[zoneId] -= 1;
            changed = true;
          }
        });
        return changed ? updated : prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Countdown timer logic for Video Ads
  useEffect(() => {
    let interval = null;
    if (activeVideoAd && videoTimer > 0) {
      interval = setInterval(() => {
        setVideoTimer((prev) => prev - 1);
      }, 1000);
    } else if (videoTimer === 0 && activeVideoAd) {
      setCanClaimVideoReward(true);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [activeVideoAd, videoTimer]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Logout Error:", error.message);
    }
  };

  const getEffectiveDisplayName = () => {
    return currentUserData?.name || headerRandomUsername || "GraceUser";
  };

  const handleOptionSelect = (questionId, optionValue) => {
    setSurveyAnswers((prev) => ({
      ...prev,
      [questionId]: optionValue
    }));
  };

  // Save Account Details to Firebase
  const handleSaveBankDetails = async (e) => {
    e.preventDefault();
    if (!currentUserData?.uid) return;

    if (!bankDetails.bankName || !bankDetails.accountNumber || !bankDetails.accountName) {
      showToast("Please complete all bank details fields!", "error");
      return;
    }

    setSavingBankDetails(true);
    try {
      const userRef = ref(db, `users/${currentUserData.uid}`);
      await update(userRef, { bankDetails });
      showToast("Account details saved successfully!", "success");
      setShowAccountModal(false);
    } catch (err) {
      showToast(`Error saving account details: ${err.message}`, "error");
    } finally {
      setSavingBankDetails(false);
    }
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
        if (!n.read) handleNotifClick(n);
      });
    }
  };

  const handleAdContainerClick = (zoneId) => {
    if (adCooldowns[zoneId] > 0) return;
    setAdClickedState((prev) => ({ ...prev, [zoneId]: true }));
  };

  // Claim +5 Grace Points - Strict Task Execution Check
  const handleClaimClickReward = async (zone) => {
    const { id: zoneId, title } = zone;

    if (!currentUserData?.uid || processingAdId || adCooldowns[zoneId] > 0) return;

    if (!adClickedState[zoneId]) {
      showToast("You must click the advertisement before claiming your reward!", "error");
      return;
    }

    setProcessingAdId(zoneId);

    try {
      const userRef = ref(db, `users/${currentUserData.uid}`);
      const clickHistoryRef = ref(db, `users/${currentUserData.uid}/clickAdHistory/${zoneId}_${Date.now()}`);

      const userSnap = await get(userRef);
      const lastClickTime = userSnap.val()?.lastAdClicks?.[zoneId] || 0;
      const now = Date.now();

      if (now - lastClickTime < CLICK_COOLDOWN_SECONDS * 1000) {
        showToast("Please wait for the cooldown before claiming again!", "error");
        setProcessingAdId(null);
        return;
      }

      await runTransaction(userRef, (userData) => {
        if (userData) {
          userData.gracePoints = (userData.gracePoints || 0) + CLICK_REWARD_POINTS;
          userData.rewards = (userData.rewards || 0) + CLICK_REWARD_POINTS;
          if (!userData.lastAdClicks) userData.lastAdClicks = {};
          userData.lastAdClicks[zoneId] = now;
        }
        return userData;
      });

      await update(clickHistoryRef, {
        adTitle: title,
        earned: CLICK_REWARD_POINTS,
        timestamp: now
      });

      const activeDisplayName = getEffectiveDisplayName();
      await push(ref(db, "notifications"), {
        type: "AD_CLICKED",
        message: `${activeDisplayName} clicked "${title}" and earned +${CLICK_REWARD_POINTS} GP!`,
        timestamp: now,
        read: false
      });

      showToast(`Success! +${CLICK_REWARD_POINTS} Grace Points added to your wallet!`, "success");

      setAdClickedState((prev) => ({ ...prev, [zoneId]: false }));
      setAdCooldowns((prev) => ({ ...prev, [zoneId]: CLICK_COOLDOWN_SECONDS }));
    } catch (err) {
      console.error("Click Reward Error:", err);
      showToast(`Error rewarding points: ${err.message}`, "error");
    } finally {
      setProcessingAdId(null);
    }
  };

  // Start Watching Video Ad
  const handleStartWatchVideoAd = (ad) => {
    setActiveVideoAd(ad);
    setVideoTimer(ad.duration || 15);
    setCanClaimVideoReward(false);
  };

  // Claim Video Ad Reward - Strict Task Execution Check
  const handleClaimVideoAdReward = async () => {
    if (!currentUserData?.uid || processingVideoReward) return;

    if (!canClaimVideoReward || videoTimer > 0) {
      showToast("You must finish watching the video before claiming your reward!", "error");
      return;
    }

    setProcessingVideoReward(true);
    const rewardSessionId = `vid_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    try {
      const userRef = ref(db, `users/${currentUserData.uid}`);
      const videoHistoryRef = ref(db, `users/${currentUserData.uid}/videoHistory/${rewardSessionId}`);
      const rewardPoints = activeVideoAd.reward || 25;

      await runTransaction(userRef, (userData) => {
        if (userData) {
          userData.gracePoints = (userData.gracePoints || 0) + rewardPoints;
          userData.rewards = (userData.rewards || 0) + rewardPoints;
          userData.totalAdsWatched = (userData.totalAdsWatched || 0) + 1;
        }
        return userData;
      });

      await update(videoHistoryRef, {
        adTitle: activeVideoAd.title,
        earned: rewardPoints,
        timestamp: Date.now()
      });

      const activeDisplayName = getEffectiveDisplayName();
      await push(ref(db, "notifications"), {
        type: "AD_WATCHED",
        message: `${activeDisplayName} completed video ad "${activeVideoAd.title}" and earned +${rewardPoints} GP!`,
        timestamp: Date.now(),
        read: false
      });

      showToast(`Success! +${rewardPoints} GP credited to your wallet!`, "success");
      setActiveVideoAd(null);
    } catch (err) {
      console.error("Video Reward Error:", err);
      showToast(`Error crediting reward: ${err.message}`, "error");
    } finally {
      setProcessingVideoReward(false);
    }
  };

  const handleOpenSurvey = (survey) => {
    const currentCompleted = currentUserData?.dailySurveysCompleted || 0;
    if (currentCompleted >= DAILY_SURVEY_LIMIT) {
      showToast("You have reached your daily limit of 3 surveys! Please come back tomorrow.", "info");
      return;
    }
    setActiveSurvey(survey);
  };

  // Finalize Survey by Clicking Ad Banner - Strict Task Execution Check
  const handleFinalizeSurveyViaAdClick = async () => {
    if (!activeSurvey || !currentUserData?.uid || submittingSurvey) return;

    const totalQuestions = activeSurvey.questions?.length || 0;
    const answeredCount = Object.keys(surveyAnswers).length;

    if (totalQuestions > 0 && answeredCount < totalQuestions) {
      showToast(`Please answer all ${totalQuestions} survey questions before submitting!`, "error");
      return;
    }

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
        message: `${activeDisplayName} clicked ad & completed survey "${activeSurvey.title}" for +${rewardGP} GP!`,
        timestamp: Date.now(),
        read: false
      });

      setCompletedSurveyIds((prev) => [...prev, completedSurveyId]);

      setTimeout(() => {
        setRemovedSurveyIds((prev) => [...prev, completedSurveyId]);
      }, 60000);

      showToast(`Ad Clicked & Survey Finalized! Earned +${rewardGP} GP.`, "success");
      setActiveSurvey(null);
      setSurveyAnswers({});
    } catch (err) {
      console.error("Survey Finalize Error:", err);
      showToast(`Failed to finalize survey: ${err.message}`, "error");
    } finally {
      setSubmittingSurvey(false);
    }
  };

  // Cashout Request
  const handleRequestCashout = () => {
    if (userGP < MINIMUM_CASHOUT_POINTS) {
      showToast(
        `Minimum Cashout Requirement is 100,000 Grace Points. You currently have ${userGP.toLocaleString()} GP (${(
          MINIMUM_CASHOUT_POINTS - userGP
        ).toLocaleString()} GP remaining).`,
        "error"
      );
      return;
    }

    if (!bankDetails.bankName || !bankDetails.accountNumber || !bankDetails.accountName) {
      showToast("Please add your Account Details via the sidebar button first!", "error");
      setShowAccountModal(true);
      return;
    }

    showToast("Cashout request submitted successfully! Pending approval.", "success");
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
  const usdBalance = (userGP / 2000).toFixed(2);
  const displayName = getEffectiveDisplayName();
  const avatarUrl = getUserAvatarUrl(currentUserData?.uid || displayName);

  const filteredSurveys = surveys
    .filter((s) => !removedSurveyIds.includes(s.id))
    .filter((s) => s.title?.toLowerCase().includes(searchTerm.toLowerCase()));

  const surveysDoneToday = currentUserData?.dailySurveysCompleted || 0;

  return (
    <div className="new-dashboard-container">
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
            fontSize: "0.9rem"
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
              className={activeTab === "click_ads" ? "active" : ""}
              onClick={() => { setActiveTab("click_ads"); setSidebarOpen(false); }}
            >
              <FontAwesomeIcon icon={faMousePointer} className="nav-icon" /> Click Ads & Earn
            </button>
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

          {/* Real-time Wallet Display */}
          <div className="sidebar-wallet-badge">
            <div>
              <div className="sidebar-wallet-title">My Wallet</div>
              <div className="sidebar-wallet-amount">
                <FontAwesomeIcon icon={faCoins} /> {userGP.toLocaleString()} GP (${usdBalance})
              </div>
            </div>
          </div>

          {/* CLEAN SIDEBAR BUTTON THAT OPENS POP-OUT MODAL */}
          <button className="sidebar-popout-btn" onClick={() => { setShowAccountModal(true); setSidebarOpen(false); }}>
            <FontAwesomeIcon icon={faBuildingColumns} /> Account Details
          </button>
        </div>

        {/* User Profile in Sidebar Footer */}
        <div className="sidebar-bottom">
          <div className="user-profile">
            <div className="user-profile-left">
              <div className="avatar-box">
                <img src={avatarUrl} alt={displayName} className="avatar-img" />
              </div>
              <div className="profile-info">
                <h4>{displayName}</h4>
                <p>{currentUserData?.email}</p>
              </div>
            </div>
            <div className="user-profile-right">
              <button onClick={handleLogout} className="logout-btn" title="Logout">
                <FontAwesomeIcon icon={faRightFromBracket} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="header">
          <div className="header-title" style={{ minWidth: 0, flex: 1 }}>
            <button className="menu-toggle" onClick={toggleSidebar}>
              <FontAwesomeIcon icon={sidebarOpen ? faXmark : faBars} />
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
              <img
                src={avatarUrl}
                alt={displayName}
                style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#1f2937", flexShrink: 0 }}
              />
              <div style={{ minWidth: 0 }}>
                <h2 style={{ margin: 0, fontSize: "1.2rem" }}>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "220px", display: "inline-block" }}>
                    {displayName}
                  </span>
                </h2>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#9ca3af" }}>HailMamaGrace</p>
              </div>
            </div>
          </div>

          <div className="header-actions">
            <div className="search-wrapper">
              <FontAwesomeIcon icon={faSearch} className="search-icon" />
              <input
                type="text"
                placeholder="Search..."
                className="search-bar"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* NOTIFICATION CONTAINER */}
            <div className="notification-container">
              <button className="notification-btn" onClick={handleToggleNotifMenu}>
                <FontAwesomeIcon icon={faBell} />
                {unreadNotifsCount > 0 && <span className="notification-dot">{unreadNotifsCount}</span>}
              </button>

              {showNotifMenu && (
                <div className="notification-dropdown">
                  <div className="notif-header">
                    <h4>Notifications</h4>
                    <button className="notif-close-btn-v2" onClick={() => setShowNotifMenu(false)}>✕</button>
                  </div>

                  <div>
                    {notifications.length === 0 ? (
                      <p style={{ fontSize: "0.8rem", color: "#64748b", margin: 0 }}>No notifications yet.</p>
                    ) : (
                      notifications.slice(0, 8).map((n) => {
                        let notifIcon = faBell;
                        if (n.type === "SURVEY_COMPLETED" || n.message?.toLowerCase().includes("survey")) {
                          notifIcon = faClipboardCheck;
                        } else if (n.type === "AD_WATCHED" || n.message?.toLowerCase().includes("watched")) {
                          notifIcon = faTv;
                        } else if (n.type === "AD_CLICKED" || n.message?.toLowerCase().includes("clicked")) {
                          notifIcon = faMousePointer;
                        }

                        return (
                          <div
                            key={n.id}
                            className={`notification-row ${!n.read ? "unread" : ""}`}
                            onClick={() => handleNotifClick(n)}
                          >
                            <div className="notif-icon-box">
                              <FontAwesomeIcon icon={notifIcon} />
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <p style={{ margin: 0, fontSize: "0.8rem", color: "#ffffff" }}>{n.message}</p>
                              <small style={{ color: "#9ca3af", fontSize: "0.7rem" }}>
                                {n.timestamp ? new Date(n.timestamp).toLocaleTimeString() : "Just now"}
                              </small>
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

        {/* TAB 1: CLICK ADS & EARN (Containing both Adsterra and newly added Monetag cards) */}
        {activeTab === "click_ads" && (
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Click Ads & Earn Grace Points</h2>
              <p>Interact with the advertisements below, click them to unlock, and claim your rewards!</p>
            </div>

            <div className="click-ads-grid">
              {/* Existing Adsterra Ad Cards */}
              {ADSTERRA_ZONES.map((zone) => {
                const cooldown = adCooldowns[zone.id] || 0;
                const isClicked = adClickedState[zone.id] || false;
                const isProcessing = processingAdId === zone.id;

                return (
                  <div key={zone.id} className="cyber-ad-card">
                    <div className="ad-card-header">
                      <h4>{zone.title}</h4>
                      <span className="reward-badge">
                        <FontAwesomeIcon icon={faCoins} className="coin-icon" /> +{CLICK_REWARD_POINTS} GP
                      </span>
                    </div>

                    <div 
                      className="ad-frame-wrapper"
                      onClick={() => handleAdContainerClick(zone.id)}
                    >
                      <AdsterraUnit
                        zoneKey={zone.zoneKey}
                        width={zone.width}
                        height={zone.height}
                        isNative={zone.isNative}
                        containerId={zone.containerId}
                      />
                    </div>

                    <div className="ad-card-footer">
                      {cooldown > 0 ? (
                        <button className="cyber-btn cooldown" disabled>
                          <FontAwesomeIcon icon={faClock} /> Available in {cooldown}s
                        </button>
                      ) : isClicked ? (
                        <button
                          className="cyber-btn claim-ready"
                          onClick={() => handleClaimClickReward(zone)}
                          disabled={isProcessing}
                        >
                          {isProcessing ? (
                            <>
                              <FontAwesomeIcon icon={faSpinner} spin /> Processing...
                            </>
                          ) : (
                            <>
                              <FontAwesomeIcon icon={faCheckCircle} /> Claim +{CLICK_REWARD_POINTS} GP
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          className="cyber-btn lock-action"
                          onClick={() => showToast("Please click the ad container above first to unlock your reward!", "info")}
                        >
                          <FontAwesomeIcon icon={faLock} /> Click Ad First
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Newly Added Monetag Ad Cards */}
              {MONETAG_ZONES.map((zone) => {
                const cooldown = adCooldowns[zone.id] || 0;
                const isClicked = adClickedState[zone.id] || false;
                const isProcessing = processingAdId === zone.id;

                return (
                  <div key={zone.id} className="cyber-ad-card">
                    <div className="ad-card-header">
                      <h4>{zone.title}</h4>
                      <span className="reward-badge">
                        <FontAwesomeIcon icon={faCoins} className="coin-icon" /> +{CLICK_REWARD_POINTS} GP
                      </span>
                    </div>

                    <div 
                      className="ad-frame-wrapper"
                      onClick={() => handleAdContainerClick(zone.id)}
                    >
                      <MonetagUnit scriptUrl={zone.scriptUrl} zoneId={zone.zoneId} />
                    </div>

                    <div className="ad-card-footer">
                      {cooldown > 0 ? (
                        <button className="cyber-btn cooldown" disabled>
                          <FontAwesomeIcon icon={faClock} /> Available in {cooldown}s
                        </button>
                      ) : isClicked ? (
                        <button
                          className="cyber-btn claim-ready"
                          onClick={() => handleClaimClickReward(zone)}
                          disabled={isProcessing}
                        >
                          {isProcessing ? (
                            <>
                              <FontAwesomeIcon icon={faSpinner} spin /> Processing...
                            </>
                          ) : (
                            <>
                              <FontAwesomeIcon icon={faCheckCircle} /> Claim +{CLICK_REWARD_POINTS} GP
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          className="cyber-btn lock-action"
                          onClick={() => showToast("Please click the ad container above first to unlock your reward!", "info")}
                        >
                          <FontAwesomeIcon icon={faLock} /> Click Ad First
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: SURVEYS & TASKS */}
        {activeTab === "surveys" && (
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Surveys & Special Tasks</h2>
              <p>Complete available surveys today ({surveysDoneToday}/{DAILY_SURVEY_LIMIT} completed) to boost your earnings.</p>
            </div>

            <div className="surveys-grid">
              {filteredSurveys.length === 0 ? (
                <p style={{ color: "#9ca3af" }}>No active surveys found or daily limit reached.</p>
              ) : (
                filteredSurveys.map((survey) => (
                  <div key={survey.id} className="cyber-survey-card">
                    <div className="survey-top">
                      <h3>{survey.title}</h3>
                      <span className="reward-pill"><FontAwesomeIcon icon={faCoins} /> +{survey.gracePoints} GP</span>
                    </div>
                    <p>{survey.description}</p>
                    <div className="survey-meta">
                      <span><FontAwesomeIcon icon={faClock} /> {survey.estimatedTime || "2 mins"}</span>
                      <span><FontAwesomeIcon icon={faClipboardCheck} /> {survey.questions?.length || 2} Questions</span>
                    </div>
                    <button className="cyber-btn primary-btn" onClick={() => handleOpenSurvey(survey)}>
                      Start Survey
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: WATCH ADS */}
        {activeTab === "watch_ads" && (
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Watch Video Ads & Earn</h2>
              <p>Stream short video promotions to gain quick Grace Points.</p>
            </div>

            <div className="watch-ads-grid">
              {[
                { id: "vid_1", title: "Promotional Sponsor Video Alpha", duration: 15, reward: 25 },
                { id: "vid_2", title: "Product Showcase Video Beta", duration: 20, reward: 35 },
                { id: "vid_3", title: "Ecosystem Partner Stream Gamma", duration: 15, reward: 25 }
              ].map((ad) => (
                <div key={ad.id} className="cyber-video-card">
                  <div className="video-thumb-box">
                    <FontAwesomeIcon icon={faPlay} className="play-overlay-icon" />
                  </div>
                  <div className="video-details">
                    <h3>{ad.title}</h3>
                    <p><FontAwesomeIcon icon={faCoins} /> +{ad.reward} GP • {ad.duration}s</p>
                    <button className="cyber-btn primary-btn" onClick={() => handleStartWatchVideoAd(ad)}>
                      <FontAwesomeIcon icon={faTv} /> Watch Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: WALLET */}
        {activeTab === "wallet" && (
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Rewards & Wallet</h2>
              <p>Manage your earnings and submit cashout requests.</p>
            </div>

            <div className="wallet-overview-card">
              <div className="wallet-main-info">
                <span>Total Balance</span>
                <h2>{userGP.toLocaleString()} GP</h2>
                <p>≈ ${usdBalance} USD (Rate: 2,000 GP = $1)</p>
              </div>

              <div className="cashout-section">
                <p className="cashout-requirement-note">
                  Minimum cashout threshold: <strong>{MINIMUM_CASHOUT_POINTS.toLocaleString()} GP</strong>
                </p>
                <button className="cyber-btn cashout-btn" onClick={handleRequestCashout}>
                  <FontAwesomeIcon icon={faDollarSign} /> Request Bank Cashout
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* SURVEY MODAL */}
      {activeSurvey && (
        <div className="modal-overlay">
          <div className="cyber-modal survey-modal">
            <div className="modal-header">
              <h3>{activeSurvey.title}</h3>
              <button className="modal-close" onClick={() => setActiveSurvey(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p className="survey-instr">Please answer the questions below, then click the verification ad button to submit:</p>
              {activeSurvey.questions?.map((q, idx) => (
                <div key={q.id || idx} className="survey-question-block">
                  <p><strong>{idx + 1}. {q.text}</strong></p>
                  <div className="options-grid">
                    {q.options?.map((opt, oIdx) => (
                      <button
                        key={oIdx}
                        type="button"
                        className={`option-btn ${surveyAnswers[q.id] === opt ? "selected" : ""}`}
                        onClick={() => handleOptionSelect(q.id, opt)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <div className="survey-ad-verification-box" style={{ marginTop: "20px", padding: "15px", background: "#111827", borderRadius: "8px", border: "1px solid #374151" }}>
                <p style={{ fontSize: "0.85rem", color: "#9ca3af", marginBottom: "10px" }}>
                  <FontAwesomeIcon icon={faLock} /> Final Step: Click below to verify and claim your +{activeSurvey.gracePoints} GP reward.
                </p>
                <button
                  className="cyber-btn claim-ready"
                  style={{ width: "100%" }}
                  onClick={handleFinalizeSurveyViaAdClick}
                  disabled={submittingSurvey}
                >
                  {submittingSurvey ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin /> Finalizing Survey...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faCheckCircle} /> Click Ad & Submit Survey (+{activeSurvey.gracePoints} GP)
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WATCH VIDEO AD MODAL */}
      {activeVideoAd && (
        <div className="modal-overlay">
          <div className="cyber-modal video-modal">
            <div className="modal-header">
              <h3>{activeVideoAd.title}</h3>
              <button className="modal-close" onClick={() => setActiveVideoAd(null)}>✕</button>
            </div>
            <div className="modal-body text-center">
              <div className="video-player-simulation">
                <FontAwesomeIcon icon={faTv} size="3x" style={{ color: "#3B82F6", marginBottom: "15px" }} />
                {videoTimer > 0 ? (
                  <p className="video-countdown-text">
                    <FontAwesomeIcon icon={faClock} /> Please watch video... <strong>{videoTimer}s</strong> remaining
                  </p>
                ) : (
                  <p className="video-ready-text" style={{ color: "#10B981", fontWeight: "bold" }}>
                    <FontAwesomeIcon icon={faCheckCircle} /> Video completed! You can now claim your reward.
                  </p>
                )}
              </div>

              <button
                className="cyber-btn claim-ready"
                style={{ width: "100%", marginTop: "20px" }}
                onClick={handleClaimVideoAdReward}
                disabled={!canClaimVideoReward || processingVideoReward}
              >
                {processingVideoReward ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin /> Crediting...
                  </>
                ) : canClaimVideoReward ? (
                  <>
                    <FontAwesomeIcon icon={faCheckCircle} /> Claim +{activeVideoAd.reward} GP Reward
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faLock} /> Watch Full Video to Unlock
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ACCOUNT DETAILS POPUP MODAL */}
      {showAccountModal && (
        <div className="modal-overlay">
          <div className="cyber-modal account-modal">
            <div className="modal-header">
              <h3><FontAwesomeIcon icon={faBuildingColumns} /> Bank Account Details</h3>
              <button className="modal-close" onClick={() => setShowAccountModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveBankDetails} className="modal-body">
              <p style={{ fontSize: "0.85rem", color: "#9ca3af", marginBottom: "15px" }}>
                Provide accurate banking details where your cashout payouts will be routed.
              </p>

              <div className="form-group" style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "0.8rem", marginBottom: "5px", color: "#d1d5db" }}>Bank Name</label>
                <input
                  type="text"
                  placeholder="e.g. Access Bank / OPay"
                  value={bankDetails.bankName}
                  onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                  style={{ width: "100%", padding: "10px", background: "#111827", border: "1px solid #374151", borderRadius: "6px", color: "#fff" }}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "0.8rem", marginBottom: "5px", color: "#d1d5db" }}>Account Number</label>
                <input
                  type="text"
                  placeholder="10-digit account number"
                  value={bankDetails.accountNumber}
                  onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                  style={{ width: "100%", padding: "10px", background: "#111827", border: "1px solid #374151", borderRadius: "6px", color: "#fff" }}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "0.8rem", marginBottom: "5px", color: "#d1d5db" }}>Account Holder Name</label>
                <input
                  type="text"
                  placeholder="Full name as registered on bank"
                  value={bankDetails.accountName}
                  onChange={(e) => setBankDetails({ ...bankDetails, accountName: e.target.value })}
                  style={{ width: "100%", padding: "10px", background: "#111827", border: "1px solid #374151", borderRadius: "6px", color: "#fff" }}
                  required
                />
              </div>

              <button
                type="submit"
                className="cyber-btn primary-btn"
                style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}
                disabled={savingBankDetails}
              >
                {savingBankDetails ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin /> Saving...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faSave} /> Save Account Details
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
