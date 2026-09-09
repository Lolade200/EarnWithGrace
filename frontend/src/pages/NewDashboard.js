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
      <style>{`
        @keyframes popupSlideInMobile {
          from {
            transform: translateX(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes popupFadeInDesktop {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes tagGlowPulse {
          0%, 100% {
            box-shadow: 0 0 8px rgba(153, 128, 255, 0.4);
            border-color: rgba(153, 128, 255, 0.6);
          }
          50% {
            box-shadow: 0 0 16px rgba(0, 230, 118, 0.6);
            border-color: rgba(0, 230, 118, 0.8);
          }
        }

        .menu-toggle {
          transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          cursor: pointer;
        }
        .menu-toggle:hover {
          transform: scale(1.1);
        }
        .menu-toggle:active {
          transform: rotate(90deg) scale(0.95);
        }

        .animated-user-handle {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 20px;
          background: linear-gradient(135deg, rgba(153, 128, 255, 0.15), rgba(0, 230, 118, 0.15));
          border: 1px solid rgba(153, 128, 255, 0.4);
          color: #00e676;
          font-weight: 600;
          font-size: 13px;
          animation: tagGlowPulse 3s infinite ease-in-out;
        }

        .responsive-popup-modal {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: 280px;
          height: 100vh;
          z-index: 2000;
          background-color: #1b1b28;
          border-right: 1px solid rgba(255, 255, 255, 0.1);
          padding: 24px 20px;
          overflow-y: auto;
          box-shadow: 10px 0 30px rgba(0, 0, 0, 0.7);
          animation: popupSlideInMobile 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          color: #fff;
        }

        @media (min-width: 992px) {
          .responsive-popup-backdrop {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.65);
            backdrop-filter: blur(4px);
            z-index: 1999;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .responsive-popup-modal {
            position: relative;
            top: auto;
            left: auto;
            bottom: auto;
            width: 100%;
            max-width: 520px;
            height: auto;
            max-height: 85vh;
            border-radius: 20px;
            border: 1px solid rgba(255, 255, 255, 0.15);
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
            animation: popupFadeInDesktop 0.25s ease-out forwards;
          }
        }

        /* --- STYLES FOR INTEGRATED YOUR SURVEYS CONTAINER --- */
        .your-surveys-card-container {
          background-color: #141416;
          border-radius: 16px;
          padding: 24px 28px;
          color: #ffffff;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          margin-top: 10px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .your-surveys-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: nowrap;
          gap: 12px;
        }

        .your-surveys-card-header h2 {
          margin: 0;
          font-size: 22px;
          font-weight: 600;
          color: #ffffff;
          letter-spacing: -0.3px;
          white-space: nowrap;
        }

        .your-surveys-header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .view-all-btn {
          background-color: #9880ff;
          color: #ffffff;
          border: none;
          padding: 8px 18px;
          border-radius: 24px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s ease, transform 0.1s ease;
          white-space: nowrap;
        }

        .view-all-btn:hover {
          background-color: #876bf0;
          transform: translateY(-1px);
        }

        .daily-limit-banner {
          background: rgba(255, 171, 0, 0.15);
          border: 1px solid #ffab00;
          border-radius: 10px;
          padding: 12px 16px;
          margin-bottom: 16px;
          color: #ffab00;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .surveys-table-container {
          width: 100%;
          overflow-x: auto;
        }

        .surveys-table-header {
          display: grid;
          grid-template-columns: 2.2fr 1.5fr 1fr 1fr 1.2fr;
          padding: 0 12px 14px 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          margin-bottom: 8px;
        }

        .surveys-table-header span {
          font-size: 11px;
          font-weight: 700;
          color: #6a6c75;
          letter-spacing: 0.8px;
          text-transform: uppercase;
        }

        .surveys-table-row {
          display: grid;
          grid-template-columns: 2.2fr 1.5fr 1fr 1fr 1.2fr;
          align-items: center;
          padding: 16px 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          transition: background-color 0.15s ease;
          cursor: pointer;
        }

        .surveys-table-row.disabled-row {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .surveys-table-row:hover:not(.disabled-row) {
          background-color: rgba(255, 255, 255, 0.02);
        }

        .surveys-table-row:last-child {
          border-bottom: none;
        }

        .product-name-col {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .product-icon-circle {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .product-title-group h4 {
          margin: 0 0 4px 0;
          font-size: 14px;
          font-weight: 600;
          color: #ffffff;
        }

        .product-title-group span {
          font-size: 12px;
          color: #6a6c75;
          display: block;
        }

        .date-col {
          display: flex;
          flex-direction: column;
        }

        .date-col .primary-date {
          font-size: 13px;
          font-weight: 500;
          color: #ffffff;
          margin-bottom: 4px;
        }

        .date-col .secondary-time {
          font-size: 11px;
          color: #6a6c75;
        }

        .numeric-col {
          font-size: 14px;
          font-weight: 600;
          color: #ffffff;
        }

        .status-col {
          display: flex;
          justify-content: flex-start;
          align-items: center;
        }

        .status-pill {
          padding: 8px 22px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          display: inline-block;
          text-align: center;
          white-space: nowrap;
        }

        /* --- RESPONSIVE MOBILE LAYOUT FOR SURVEYS SECTION --- */
        @media (max-width: 768px) {
          .your-surveys-card-container {
            padding: 16px;
          }

          .your-surveys-card-header {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 16px;
          }

          .your-surveys-card-header h2 {
            font-size: 18px;
          }

          .surveys-table-header {
            display: none;
          }

          /* Force row items onto a single horizontal line on mobile */
          .surveys-table-row {
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 12px 8px;
            overflow-x: auto;
            white-space: nowrap;
          }

          .product-name-col {
            flex: 1 1 auto;
            min-width: 140px;
            gap: 10px;
          }

          .product-icon-circle {
            width: 34px;
            height: 34px;
          }

          .product-title-group h4 {
            font-size: 13px;
          }

          .product-title-group span {
            font-size: 11px;
          }

          .date-col {
            flex: 0 0 auto;
            min-width: 80px;
          }

          .date-col .primary-date {
            font-size: 11px;
          }

          .date-col .secondary-time {
            font-size: 10px;
          }

          .numeric-col {
            flex: 0 0 auto;
            font-size: 12px;
          }

          .status-col {
            flex: 0 0 auto;
            margin-top: 0;
          }

          .status-pill {
            padding: 6px 14px;
            font-size: 11px;
          }
        }
      `}</style>

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
                className="nav-item" 
                onClick={() => { setShowCompletedSurveysModal(true); setSurveyFilter("Completed"); }} 
                style={{ background: "none", border: "none", width: "100%", textAlign: "left", cursor: "pointer", color: "inherit", display: "flex", alignItems: "center" }}
              >
                <FontAwesomeIcon icon={faHistory} className="nav-icon" />
                <span>Completed Surveys</span>
                <span className="survey-badge badge-green" style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: "4px", padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "bold" }}>
                  <FontAwesomeIcon icon={faCheckCircle} />
                  {completedCount}
                </span>
              </button>
            </nav>
          </div>
          <div className="sidebar-section">
            <span className="section-label">ACCOUNT</span>
            <nav className="sidebar-nav">
              <button type="button" className="nav-item" onClick={() => setShowWalletModal(true)} style={{ background: "none", border: "none", width: "100%", textAlign: "left", cursor: "pointer", color: "inherit" }}>
                <FontAwesomeIcon icon={faWallet} className="nav-icon" />
                <span>Wallet</span>
              </button>
              <button type="button" className="nav-item" onClick={() => setShowPaymentModal(true)} style={{ background: "none", border: "none", width: "100%", textAlign: "left", cursor: "pointer", color: "inherit" }}>
                <FontAwesomeIcon icon={faReceipt} className="nav-icon" />
                <span>Bills & Payments</span>
              </button>
              <button type="button" className="nav-item" onClick={() => setShowSettingsModal(true)} style={{ background: "none", border: "none", width: "100%", textAlign: "left", cursor: "pointer", color: "inherit" }}>
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
        {/* Header container with 35px border radius */}
        <header className="header" style={{ borderRadius: "35px" }}>
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

          <div className="header-actions" style={{ position: "relative" }}>
            <button className="notification-btn" onClick={() => setShowNotifications(!showNotifications)} style={{ position: "relative" }}>
              <FontAwesomeIcon icon={faBell} />
              <span style={{ position: "absolute", top: "2px", right: "2px", width: "8px", height: "8px", backgroundColor: "#00e676", borderRadius: "50%" }}></span>
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
              <div className="user-profile-info">
                <h4 className="user-name">{userProfile.name}</h4>
                <div className="animated-user-handle" style={{ fontSize: "11px", padding: "1px 8px", marginTop: "2px" }}>
                  <FontAwesomeIcon icon={faWandMagicSparkles} style={{ fontSize: "9px" }} />
                  {animatedHandle}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Notifications Centered relative to the entire page */}
        {showNotifications && (
          <div style={{
            position: "fixed",
            top: "85px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "calc(100% - 32px)",
            maxWidth: "380px",
            backgroundColor: "#1e1e2d",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "16px",
            padding: "18px",
            boxShadow: "0 15px 35px rgba(0,0,0,0.65)",
            zIndex: 1500,
            color: "#fff"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "8px" }}>
              <strong style={{ fontSize: "15px" }}>Notifications</strong>
              <button onClick={() => setShowNotifications(false)} style={{ background: "none", border: "none", color: "#8a8f9d", cursor: "pointer" }}>
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            <div style={{ fontSize: "12px", color: "#b5b5c3", display: "flex", flexDirection: "column", gap: "12px", maxHeight: "280px", overflowY: "auto" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <FontAwesomeIcon icon={faClipboardList} style={{ color: "#00e676", marginTop: "2px" }} />
                <div>
                  <strong style={{ color: "#fff", display: "block" }}>New Surveys Available</strong>
                  <span>{activeSurveysList.length} active surveys ready for you to take.</span>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <FontAwesomeIcon icon={faBullhorn} style={{ color: "#9980ff", marginTop: "2px" }} />
                <div>
                  <strong style={{ color: "#fff", display: "block" }}>New Ads Posted</strong>
                  <span>{ads.length} newly posted ads available to explore.</span>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <FontAwesomeIcon icon={faShield} style={{ color: "#ffab00", marginTop: "2px" }} />
                <div>
                  <strong style={{ color: "#fff", display: "block" }}>Daily Limit Reminder</strong>
                  <span>Complete up to 3 surveys per day to maximize your GP rewards.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User-Friendly Filter Navigation Tabs */}
        <div className="top-filter-bar" style={{ marginTop: "20px" }}>
          <div className="filter-tabs">
            {["Active Surveys", "Paused", "Completed"].map((tab) => (
              <button 
                key={tab} 
                className={`filter-tab ${surveyFilter === tab ? "active" : ""}`} 
                onClick={() => handleFilterTabClick(tab)}
              >
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
                  <button className="icon-arrow-btn" onClick={() => setShowWalletModal(true)}>
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
                  <h4>Activity & Engagement</h4>
                </div>
                <div style={{ padding: "10px 0", height: "100px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "6px" }}>
                  {[
                    { day: "M", val: 30, color: "#9980ff" },
                    { day: "T", val: 65, color: "#00e676" },
                    { day: "W", val: 45, color: "#9980ff" },
                    { day: "T", val: 80, color: "#00e676" },
                    { day: "F", val: 55, color: "#ffab00" },
                    { day: "S", val: 90, color: "#00e676" },
                    { day: "S", val: 40, color: "#9980ff" }
                  ].map((bar, idx) => (
                    <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                      <div style={{ width: "100%", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "4px", height: "70px", display: "flex", alignItems: "flex-end", padding: "2px" }}>
                        <div style={{ width: "100%", height: `${bar.val}%`, backgroundColor: bar.color, borderRadius: "3px" }}></div>
                      </div>
                      <span style={{ fontSize: "10px", color: "#8a8f9d" }}>{bar.day}</span>
                    </div>
                  ))}
                </div>
                <div className="chart-footer-info">
                  <strong>Weekly Performance Breakdown</strong>
                </div>
              </div>
            </div>

            {/* INTEGRATED "YOUR SURVEYS" DESIGN WITH RESPONSIVE UPDATES */}
            <div className="your-surveys-card-container">
              <div className="your-surveys-card-header">
                <h2>Your Surveys</h2>
                <div className="your-surveys-header-actions">
                  <button className="view-all-btn" onClick={() => setShowActiveSurveysModal(true)}>
                    View All
                  </button>
                </div>
              </div>

              {/* Daily Limit Warning Banner */}
              {hasReachedDailyLimit && (
                <div className="daily-limit-banner">
                  <FontAwesomeIcon icon={faExclamationTriangle} style={{ fontSize: "16px", flexShrink: 0 }} />
                  <span>
                    <strong>Maximum Daily Limit Reached!</strong> You have completed {MAX_DAILY_SURVEYS} out of {MAX_DAILY_SURVEYS} surveys today. Additional surveys are disabled until tomorrow.
                  </span>
                </div>
              )}

              <div className="surveys-table-container">
                <div className="surveys-table-header">
                  <span>PRODUCT NAME</span>
                  <span>DATE</span>
                  <span>RESPONSES</span>
                  <span>SPENT</span>
                  <span>STATUS</span>
                </div>

                {filteredSurveys.length === 0 ? (
                  <div style={{ padding: "30px", textAlign: "center", color: "#6a6c75" }}>
                    No surveys found for {surveyFilter}.
                  </div>
                ) : (
                  filteredSurveys.map((survey) => {
                    const badgeInfo = getBadgeStyle(survey);
                    const isComp = isSurveyCompleted(survey);
                    const dateDetails = formatDate(survey.createdAt || completedTimestamps[survey.id]);
                    const responsesCount = survey.responsesCount || (survey.responses ? survey.responses.toLocaleString() : "12,000");
                    const spentValue = survey.spent || (survey.gracePoints ? `₹${survey.gracePoints.toLocaleString()}` : "₹5,000");
                    const isDisabled = hasReachedDailyLimit || isComp || survey.status === "Paused";

                    return (
                      <div 
                        className={`surveys-table-row ${isDisabled ? "disabled-row" : ""}`}
                        key={survey.id}
                        onClick={() => {
                          if (hasReachedDailyLimit) {
                            alert("You have reached your daily limit of 3 surveys. Please try again tomorrow!");
                            return;
                          }
                          if (!isComp && survey.status !== "Paused") {
                            handleStartSurvey(survey);
                          }
                        }}
                      >
                        <div className="product-name-col">
                          <div className="product-icon-circle" style={{ backgroundColor: badgeInfo.circleBg, color: badgeInfo.circleIconColor }}>
                            <FontAwesomeIcon icon={badgeInfo.icon} />
                          </div>
                          <div className="product-title-group">
                            <h4>{survey.title || "Popcorn Survey"}</h4>
                            <span>{getQuestionCount(survey)} Questions</span>
                          </div>
                        </div>

                        <div className="date-col">
                          <span className="primary-date">{dateDetails.dateStr}</span>
                          <span className="secondary-time">{dateDetails.timeStr}</span>
                        </div>

                        <div className="numeric-col">{responsesCount}</div>

                        <div className="numeric-col">{spentValue}</div>

                        <div className="status-col">
                          <span 
                            className="status-pill" 
                            style={{ 
                              backgroundColor: badgeInfo.statusBg, 
                              color: badgeInfo.statusTextColor 
                            }}
                          >
                            {badgeInfo.label}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: ADS & PROMOS */}
          <div className="grid-side-column">
            <div className="ads-container-card">
              <div className="ads-header">
                <h3><FontAwesomeIcon icon={faBullhorn} style={{ color: "#9980ff", marginRight: "8px" }} /> Featured Promotions</h3>
              </div>

              <div className="ads-list">
                {filteredAds.length === 0 ? (
                  <div style={{ padding: "20px", textAlign: "center", color: "#8a8f9d", fontSize: "13px" }}>
                    No promotions available.
                  </div>
                ) : (
                  filteredAds.map((ad) => (
                    <div className="ad-card" key={ad.id}>
                      {ad.imageUrl && <img src={ad.imageUrl} alt={ad.title} className="ad-banner-img" />}
                      <div className="ad-card-body">
                        <h4 className="ad-title">{ad.title}</h4>
                        <p className="ad-description">{ad.description}</p>
                        {ad.link && (
                          <a href={ad.link} target="_blank" rel="noopener noreferrer" className="ad-link-btn">
                            Visit Promo <FontAwesomeIcon icon={faExternalLinkAlt} />
                          </a>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* -------------------- MODALS -------------------- */}

      {/* 1. SETTINGS MODAL */}
      {showSettingsModal && (
        <div className="responsive-popup-backdrop" onClick={() => setShowSettingsModal(false)}>
          <div className="responsive-popup-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", color: "#fff" }}><FontAwesomeIcon icon={faGear} style={{ marginRight: "8px", color: "#9980ff" }} /> Account Settings</h3>
              <button onClick={() => setShowSettingsModal(false)} style={{ background: "none", border: "none", color: "#8a8f9d", cursor: "pointer", fontSize: "16px" }}><FontAwesomeIcon icon={faXmark} /></button>
            </div>

            <form onSubmit={handleUpdateProfileSettings} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ textAlign: "center", margin: "10px 0" }}>
                <div style={{ position: "relative", width: "80px", height: "80px", margin: "0 auto 10px auto" }}>
                  {userProfile.photoURL ? (
                    <img src={userProfile.photoURL} alt="Profile" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", borderRadius: "50%", backgroundColor: "#2b2b3d", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", color: "#8a8f9d" }}><FontAwesomeIcon icon={faUser} /></div>
                  )}
                  <label htmlFor="modal-profile-upload" style={{ position: "absolute", bottom: "0", right: "0", backgroundColor: "#9980ff", width: "26px", height: "26px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", fontSize: "12px" }}>
                    <FontAwesomeIcon icon={faCamera} />
                  </label>
                  <input type="file" id="modal-profile-upload" accept="image/*" onChange={handleProfilePictureChange} style={{ display: "none" }} disabled={uploadingImage || !currentUser} />
                </div>
                <div className="animated-user-handle">
                  <FontAwesomeIcon icon={faWandMagicSparkles} />
                  {animatedHandle}
                </div>
              </div>

              <div>
                <label style={{ fontSize: "12px", color: "#8a8f9d", display: "block", marginBottom: "6px" }}>Full Name / Display Name</label>
                <div style={{ position: "relative" }}>
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} required style={{ width: "100%", padding: "10px 12px 10px 36px", backgroundColor: "#12121c", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", fontSize: "13px" }} />
                  <FontAwesomeIcon icon={faPenToSquare} style={{ position: "absolute", left: "12px", top: "12px", color: "#8a8f9d", fontSize: "13px" }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "12px", color: "#8a8f9d", display: "block", marginBottom: "6px" }}>Email Address</label>
                <div style={{ position: "relative" }}>
                  <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} required style={{ width: "100%", padding: "10px 12px 10px 36px", backgroundColor: "#12121c", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", fontSize: "13px" }} />
                  <FontAwesomeIcon icon={faAt} style={{ position: "absolute", left: "12px", top: "12px", color: "#8a8f9d", fontSize: "13px" }} />
                </div>
              </div>

              <button type="submit" style={{ marginTop: "10px", backgroundColor: "#9980ff", color: "#fff", border: "none", padding: "12px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>Save Profile Changes</button>
            </form>
          </div>
        </div>
      )}

      {/* 2. WALLET MODAL */}
      {showWalletModal && (
        <div className="responsive-popup-backdrop" onClick={() => setShowWalletModal(false)}>
          <div className="responsive-popup-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", color: "#fff", display: "flex", alignItems: "center", gap: "8px" }}>
                <FontAwesomeIcon icon={faWallet} style={{ color: "#00e676" }} /> My Digital Wallet
              </h3>
              <button onClick={() => setShowWalletModal(false)} style={{ background: "none", border: "none", color: "#8a8f9d", cursor: "pointer", fontSize: "16px" }}><FontAwesomeIcon icon={faXmark} /></button>
            </div>

            {/* Wallet Balance Summary Card */}
            <div style={{ background: "linear-gradient(135deg, #1f2b3e 0%, #121824 100%)", border: "1px solid rgba(0, 230, 118, 0.3)", borderRadius: "14px", padding: "16px", marginBottom: "18px", boxShadow: "0 8px 20px rgba(0,0,0,0.3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", color: "#8a8f9d" }}>Available Earnings</span>
                <span style={{ backgroundColor: "rgba(0,230,118,0.15)", color: "#00e676", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "bold" }}>
                  <FontAwesomeIcon icon={faLock} style={{ marginRight: "4px" }} /> Secured
                </span>
              </div>
              <div style={{ fontSize: "24px", fontWeight: "bold", color: "#fff", margin: "6px 0" }}>₦{userProfile.gracePoints.toLocaleString()}</div>
              <div style={{ fontSize: "11px", color: "#00e676", display: "flex", alignItems: "center", gap: "4px" }}>
                <FontAwesomeIcon icon={faCoins} /> {userProfile.gracePoints} Grace Points Available
              </div>
            </div>

            {/* Wallet Method Tabs */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "10px" }}>
              <button 
                onClick={() => setWalletTab("bank")}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: walletTab === "bank" ? "1px solid #00e676" : "1px solid rgba(255,255,255,0.1)",
                  backgroundColor: walletTab === "bank" ? "rgba(0, 230, 118, 0.15)" : "#12121c",
                  color: walletTab === "bank" ? "#00e676" : "#8a8f9d",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px"
                }}
              >
                <FontAwesomeIcon icon={faBuildingColumns} /> Bank Payout
              </button>
              <button 
                onClick={() => setWalletTab("crypto")}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: walletTab === "crypto" ? "1px solid #9980ff" : "1px solid rgba(255,255,255,0.1)",
                  backgroundColor: walletTab === "crypto" ? "rgba(153, 128, 255, 0.15)" : "#12121c",
                  color: walletTab === "crypto" ? "#9980ff" : "#8a8f9d",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px"
                }}
              >
                <FontAwesomeIcon icon={faBitcoinSign} /> Crypto Wallet
              </button>
            </div>

            {walletTab === "bank" ? (
              <form onSubmit={handleSaveBankDetails} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "11px", color: "#8a8f9d", display: "block", marginBottom: "4px" }}>Bank Name</label>
                  <div style={{ position: "relative" }}>
                    <input type="text" placeholder="e.g. Access Bank" value={bankName} onChange={(e) => setBankName(e.target.value)} required style={{ width: "100%", padding: "8px 10px 8px 32px", backgroundColor: "#12121c", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "#fff", fontSize: "12px" }} />
                    <FontAwesomeIcon icon={faBuildingColumns} style={{ position: "absolute", left: "10px", top: "10px", color: "#8a8f9d", fontSize: "11px" }} />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "11px", color: "#8a8f9d", display: "block", marginBottom: "4px" }}>Account Number</label>
                  <div style={{ position: "relative" }}>
                    <input type="text" placeholder="e.g. 0123456789" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} required style={{ width: "100%", padding: "8px 10px 8px 32px", backgroundColor: "#12121c", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "#fff", fontSize: "12px" }} />
                    <FontAwesomeIcon icon={faReceipt} style={{ position: "absolute", left: "10px", top: "10px", color: "#8a8f9d", fontSize: "11px" }} />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "11px", color: "#8a8f9d", display: "block", marginBottom: "4px" }}>Account Name</label>
                  <div style={{ position: "relative" }}>
                    <input type="text" placeholder="Full Account Name" value={accountName} onChange={(e) => setAccountName(e.target.value)} required style={{ width: "100%", padding: "8px 10px 8px 32px", backgroundColor: "#12121c", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "#fff", fontSize: "12px" }} />
                    <FontAwesomeIcon icon={faUser} style={{ position: "absolute", left: "10px", top: "10px", color: "#8a8f9d", fontSize: "11px" }} />
                  </div>
                </div>

                <button type="submit" style={{ marginTop: "8px", backgroundColor: "#00e676", color: "#000", border: "none", padding: "10px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}>Save Bank Details</button>
              </form>
            ) : (
              <form onSubmit={handleSaveCryptoDetails} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "11px", color: "#8a8f9d", display: "block", marginBottom: "4px" }}>Wallet Address</label>
                  <div style={{ position: "relative" }}>
                    <input type="text" placeholder="e.g. 0x71C...3a9" value={cryptoAddress} onChange={(e) => setCryptoAddress(e.target.value)} required style={{ width: "100%", padding: "8px 10px 8px 32px", backgroundColor: "#12121c", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "#fff", fontSize: "12px" }} />
                    <FontAwesomeIcon icon={faWallet} style={{ position: "absolute", left: "10px", top: "10px", color: "#8a8f9d", fontSize: "11px" }} />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "11px", color: "#8a8f9d", display: "block", marginBottom: "4px" }}>Network</label>
                  <div style={{ position: "relative" }}>
                    <input type="text" placeholder="e.g. TRC20 / ERC20 / BEP20" value={cryptoNetwork} onChange={(e) => setCryptoNetwork(e.target.value)} required style={{ width: "100%", padding: "8px 10px 8px 32px", backgroundColor: "#12121c", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "#fff", fontSize: "12px" }} />
                    <FontAwesomeIcon icon={faBolt} style={{ position: "absolute", left: "10px", top: "10px", color: "#8a8f9d", fontSize: "11px" }} />
                  </div>
                </div>

                <button type="submit" style={{ marginTop: "8px", backgroundColor: "#9980ff", color: "#fff", border: "none", padding: "10px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}>Save Crypto Details</button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 3. BILLS & PAYMENTS MODAL */}
      {showPaymentModal && (
        <div className="responsive-popup-backdrop" onClick={() => setShowPaymentModal(false)}>
          <div className="responsive-popup-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", color: "#fff" }}><FontAwesomeIcon icon={faReceipt} style={{ marginRight: "8px", color: "#00e676" }} /> Request Payout</h3>
              <button onClick={() => setShowPaymentModal(false)} style={{ background: "none", border: "none", color: "#8a8f9d", cursor: "pointer", fontSize: "16px" }}><FontAwesomeIcon icon={faXmark} /></button>
            </div>

            <form onSubmit={handleRequestPayout} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "12px", color: "#8a8f9d", display: "block", marginBottom: "6px" }}>Available GP Balance</label>
                <div style={{ fontSize: "18px", fontWeight: "bold", color: "#00e676" }}>₦{userProfile.gracePoints.toLocaleString()}</div>
              </div>

              <div>
                <label style={{ fontSize: "12px", color: "#8a8f9d", display: "block", marginBottom: "6px" }}>Payout Amount (₦)</label>
                <input type="number" placeholder="Enter amount to withdraw" value={payoutAmount} onChange={(e) => setPayoutAmount(e.target.value)} required style={{ width: "100%", padding: "10px", backgroundColor: "#12121c", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", fontSize: "13px" }} />
              </div>

              <button type="submit" disabled={payoutLoading} style={{ backgroundColor: "#00e676", color: "#000", border: "none", padding: "12px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", opacity: payoutLoading ? 0.7 : 1 }}>
                {payoutLoading ? "Processing..." : "Submit Payout Request"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 4. ACTIVE SURVEYS MODAL */}
      {showActiveSurveysModal && (
        <div className="responsive-popup-backdrop" onClick={() => setShowActiveSurveysModal(false)}>
          <div className="responsive-popup-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", color: "#fff" }}><FontAwesomeIcon icon={faBolt} style={{ marginRight: "8px", color: "#00e676" }} /> Active Surveys</h3>
              <button onClick={() => setShowActiveSurveysModal(false)} style={{ background: "none", border: "none", color: "#8a8f9d", cursor: "pointer", fontSize: "16px" }}><FontAwesomeIcon icon={faXmark} /></button>
            </div>

            {hasReachedDailyLimit && (
              <div className="daily-limit-banner">
                <FontAwesomeIcon icon={faExclamationTriangle} />
                <span>Daily limit reached (3/3). You cannot complete more surveys today.</span>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "60vh", overflowY: "auto" }}>
              {activeSurveysList.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#8a8f9d" }}>No active surveys available.</div>
              ) : (
                activeSurveysList.map((s) => {
                  const badgeInfo = getBadgeStyle(s);
                  return (
                    <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#12121c", padding: "12px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.08)", opacity: hasReachedDailyLimit ? 0.5 : 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div className="product-icon-circle" style={{ backgroundColor: badgeInfo.circleBg, color: badgeInfo.circleIconColor, width: "32px", height: "32px" }}>
                          <FontAwesomeIcon icon={badgeInfo.icon} />
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: "13px", color: "#fff" }}>{s.title}</h4>
                          <span style={{ fontSize: "11px", color: "#00e676" }}>{s.gracePoints || s.reward || "100 GP"}</span>
                        </div>
                      </div>
                      <button className={`start-btn ${hasReachedDailyLimit ? "disabled" : ""}`} disabled={hasReachedDailyLimit} onClick={() => handleStartSurvey(s)}>
                        Start
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. PAUSED SURVEYS MODAL */}
      {showPausedSurveysModal && (
        <div className="responsive-popup-backdrop" onClick={() => setShowPausedSurveysModal(false)}>
          <div className="responsive-popup-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", color: "#fff" }}><FontAwesomeIcon icon={faCircleDot} style={{ marginRight: "8px", color: "#ffab00" }} /> Paused Surveys</h3>
              <button onClick={() => setShowPausedSurveysModal(false)} style={{ background: "none", border: "none", color: "#8a8f9d", cursor: "pointer", fontSize: "16px" }}><FontAwesomeIcon icon={faXmark} /></button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "60vh", overflowY: "auto" }}>
              {pausedSurveysList.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#8a8f9d" }}>No paused surveys.</div>
              ) : (
                pausedSurveysList.map((s) => {
                  const badgeInfo = getBadgeStyle(s);
                  return (
                    <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#12121c", padding: "12px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div className="product-icon-circle" style={{ backgroundColor: badgeInfo.circleBg, color: badgeInfo.circleIconColor, width: "32px", height: "32px" }}>
                          <FontAwesomeIcon icon={badgeInfo.icon} />
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: "13px", color: "#fff" }}>{s.title}</h4>
                          <span style={{ backgroundColor: badgeInfo.statusBg, color: badgeInfo.statusTextColor, padding: "2px 8px", borderRadius: "12px", fontSize: "10px", fontWeight: "bold" }}>{badgeInfo.label}</span>
                        </div>
                      </div>
                      <button className="start-btn disabled" disabled>Paused</button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. COMPLETED SURVEYS MODAL */}
      {showCompletedSurveysModal && (
        <div className="responsive-popup-backdrop" onClick={() => setShowCompletedSurveysModal(false)}>
          <div className="responsive-popup-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", color: "#fff" }}><FontAwesomeIcon icon={faCheckCircle} style={{ marginRight: "8px", color: "#00e676" }} /> Completed Surveys</h3>
              <button onClick={() => setShowCompletedSurveysModal(false)} style={{ background: "none", border: "none", color: "#8a8f9d", cursor: "pointer", fontSize: "16px" }}><FontAwesomeIcon icon={faXmark} /></button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "60vh", overflowY: "auto" }}>
              {completedSurveysList.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#8a8f9d" }}>You haven't completed any surveys yet.</div>
              ) : (
                completedSurveysList.map((s) => {
                  const badgeInfo = getBadgeStyle(s);
                  return (
                    <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#12121c", padding: "12px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div className="product-icon-circle" style={{ backgroundColor: badgeInfo.circleBg, color: badgeInfo.circleIconColor, width: "32px", height: "32px" }}>
                          <FontAwesomeIcon icon={badgeInfo.icon} />
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: "13px", color: "#fff" }}>{s.title}</h4>
                          <span style={{ backgroundColor: badgeInfo.statusBg, color: badgeInfo.statusTextColor, padding: "2px 8px", borderRadius: "12px", fontSize: "10px", fontWeight: "bold" }}>{badgeInfo.label}</span>
                        </div>
                      </div>
                      <span style={{ fontSize: "12px", color: "#00e676", fontWeight: "bold" }}>+{s.gracePoints || s.reward || "100"} GP</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7. ACTIVE QUESTION RUNNER MODAL */}
      {activeSurvey && (
        <div className="responsive-popup-backdrop">
          <div className="responsive-popup-modal" style={{ maxWidth: "600px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", color: "#fff" }}>{activeSurvey.title}</h3>
              <button onClick={() => setActiveSurvey(null)} style={{ background: "none", border: "none", color: "#8a8f9d", cursor: "pointer" }}><FontAwesomeIcon icon={faXmark} /></button>
            </div>

            {Array.isArray(activeSurvey.questions) && activeSurvey.questions.length > 0 ? (
              <div>
                <div style={{ fontSize: "12px", color: "#8a8f9d", marginBottom: "8px" }}>Question {currentQuestionIdx + 1} of {activeSurvey.questions.length}</div>
                <h4 style={{ color: "#fff", marginBottom: "16px" }}>{activeSurvey.questions[currentQuestionIdx].questionText || activeSurvey.questions[currentQuestionIdx].title}</h4>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
                  {(activeSurvey.questions[currentQuestionIdx].options || ["Option A", "Option B", "Option C"]).map((opt, i) => (
                    <button key={i} onClick={() => setSelectedAnswer(opt)} style={{ padding: "12px", borderRadius: "8px", border: selectedAnswer === opt ? "1px solid #00e676" : "1px solid rgba(255,255,255,0.1)", backgroundColor: selectedAnswer === opt ? "rgba(0,230,118,0.1)" : "#12121c", color: "#fff", textAlign: "left", cursor: "pointer" }}>
                      {opt}
                    </button>
                  ))}
                </div>

                <button onClick={handleNextQuestion} style={{ width: "100%", backgroundColor: "#00e676", color: "#000", border: "none", padding: "12px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
                  {currentQuestionIdx < activeSurvey.questions.length - 1 ? "Next Question" : "Complete Survey"}
                </button>
              </div>
            ) : (
              <div>
                <p style={{ color: "#b5b5c3", fontSize: "13px" }}>Please answer the quick survey question below:</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", margin: "20px 0" }}>
                  {["Satisfied", "Neutral", "Unsatisfied"].map((opt, i) => (
                    <button key={i} onClick={() => setSelectedAnswer(opt)} style={{ padding: "12px", borderRadius: "8px", border: selectedAnswer === opt ? "1px solid #00e676" : "1px solid rgba(255,255,255,0.1)", backgroundColor: selectedAnswer === opt ? "rgba(0,230,118,0.1)" : "#12121c", color: "#fff", textAlign: "left", cursor: "pointer" }}>
                      {opt}
                    </button>
                  ))}
                </div>
                <button onClick={handleNextQuestion} style={{ width: "100%", backgroundColor: "#00e676", color: "#000", border: "none", padding: "12px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
                  Submit Answer
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

export default NewDashboard;