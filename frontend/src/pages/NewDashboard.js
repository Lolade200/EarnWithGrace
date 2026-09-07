import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartPie,
  faClipboardList,
  faCircleQuestion,
  faGear,
  faMagnifyingGlass,
  faBell,
  faBars,
  faXmark,
  faCheckCircle,
  faCoins,
  faWallet,
  faHistory,
  faVideo,
  faPlay,
  faStar,
  faClock,
  faCalendarAlt,
  faArrowRight,
  faCamera,
  faBuildingColumns,
  faMoneyBillWave
} from "@fortawesome/free-solid-svg-icons";
import "./NewDashboard.css";

// 👇 Import Firebase Auth, DB & Storage
import { auth, db, storage } from "../firebase";
import { ref as dbRef, onValue, update, push } from "firebase/database";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

function NewDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // 👤 User State
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState({
    name: "Loading...",
    email: "Loading...",
    gracePoints: 0,
    photoURL: "",
    bankDetails: {
      bankName: "",
      accountNumber: "",
      accountName: ""
    }
  });

  // 📷 Image Upload State
  const [uploadingImage, setUploadingImage] = useState(false);

  // 📋 Surveys State
  const [surveys, setSurveys] = useState([]);

  // 📝 Active Survey Modal State
  const [activeSurvey, setActiveSurvey] = useState(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");

  // 💳 Cashout & Bank Modal States
  const [showCashoutModal, setShowCashoutModal] = useState(false);
  const [bankForm, setBankForm] = useState({
    bankName: "",
    accountNumber: "",
    accountName: ""
  });
  const [cashoutAmount, setCashoutAmount] = useState("");
  const [isProcessingCashout, setIsProcessingCashout] = useState(false);

  // 💰 Minimum Withdrawal Constant
  const MIN_WITHDRAWAL = 15000;

  // ✅ 1. Listen for Authenticated User & fetch Realtime DB profile
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUser(user);

        // Fetch live user data dynamically using user.uid
        const userPath = dbRef(db, `users/${user.uid}`);
        const unsubscribeDb = onValue(userPath, (snapshot) => {
          const data = snapshot.val();
          setUserProfile({
            name: data?.name || user.displayName || "User",
            email: data?.email || user.email || "No Email",
            gracePoints: data?.gracePoints || data?.rewards || 0,
            photoURL: data?.photoURL || user.photoURL || "",
            bankDetails: data?.bankDetails || { bankName: "", accountNumber: "", accountName: "" }
          });

          // Pre-fill bank state if saved in DB
          if (data?.bankDetails) {
            setBankForm({
              bankName: data.bankDetails.bankName || "",
              accountNumber: data.bankDetails.accountNumber || "",
              accountName: data.bankDetails.accountName || ""
            });
          }
        });

        return () => unsubscribeDb();
      } else {
        setCurrentUser(null);
        setUserProfile({ name: "Guest", email: "Not logged in", gracePoints: 0, photoURL: "", bankDetails: {} });
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // ✅ 2. Listen for surveys data from Realtime DB
  useEffect(() => {
    const surveysPath = dbRef(db, "surveys");
    const unsubscribeSurveys = onValue(surveysPath, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const surveyList = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setSurveys(surveyList);
      } else {
        setSurveys([]);
      }
    });

    return () => unsubscribeSurveys();
  }, []);

  // 📷 Profile Picture Upload Handler
  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !currentUser) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Please select an image smaller than 2MB.");
      return;
    }

    setUploadingImage(true);

    try {
      const imageStorageRef = storageRef(storage, `profile_pictures/${currentUser.uid}`);
      await uploadBytes(imageStorageRef, file);
      const downloadURL = await getDownloadURL(imageStorageRef);

      await update(dbRef(db, `users/${currentUser.uid}`), {
        photoURL: downloadURL
      });

      alert("Profile picture updated!");
    } catch (error) {
      console.error("Failed to upload image:", error);
      alert("Error uploading profile image. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  // 💳 Save/Update Bank Account Details
  const handleSaveBankDetails = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!bankForm.bankName || !bankForm.accountNumber || !bankForm.accountName) {
      alert("Please complete all bank detail fields.");
      return;
    }

    try {
      await update(dbRef(db, `users/${currentUser.uid}/bankDetails`), {
        bankName: bankForm.bankName,
        accountNumber: bankForm.accountNumber,
        accountName: bankForm.accountName,
        updatedAt: Date.now()
      });
      alert("Bank account details saved successfully!");
    } catch (err) {
      console.error("Error saving bank details:", err);
      alert("Failed to save bank details.");
    }
  };

  // 💸 Submit Cashout Request (With ₦15,000 Minimum Validation)
  const handleCashoutSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    const amount = parseInt(cashoutAmount, 10);

    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid cashout amount.");
      return;
    }

    // ⛔ MINIMUM WITHDRAWAL VALIDATION
    if (amount < MIN_WITHDRAWAL) {
      alert(`The minimum withdrawal amount is ₦${MIN_WITHDRAWAL.toLocaleString()}.`);
      return;
    }

    if (amount > userProfile.gracePoints) {
      alert(`Insufficient balance! Your current balance is ₦${userProfile.gracePoints.toLocaleString()}`);
      return;
    }

    if (!bankForm.bankName || !bankForm.accountNumber || !bankForm.accountName) {
      alert("Please link your bank account details before requesting a cashout.");
      return;
    }

    setIsProcessingCashout(true);

    try {
      const remainingPoints = userProfile.gracePoints - amount;

      // 1. Deduct points immediately from user profile in DB
      await update(dbRef(db, `users/${currentUser.uid}`), {
        gracePoints: remainingPoints,
        rewards: remainingPoints
      });

      // 2. Save payout request for Admin Processing
      await push(dbRef(db, "payouts"), {
        userId: currentUser.uid,
        userName: userProfile.name,
        userEmail: userProfile.email,
        amount: amount,
        bankDetails: bankForm,
        status: "Pending",
        requestedAt: Date.now()
      });

      // 3. Trigger Notification
      await push(dbRef(db, "notifications"), {
        type: "CASHOUT_REQUEST",
        message: `${userProfile.name} requested cashout of ₦${amount.toLocaleString()}`,
        timestamp: Date.now(),
        read: false
      });

      alert(`🎉 Cashout request of ₦${amount.toLocaleString()} submitted! Funds will be transferred to your account after verification.`);
      setCashoutAmount("");
      setShowCashoutModal(false);
    } catch (error) {
      console.error("Cashout error:", error);
      alert("Failed to process cashout request. Please try again.");
    } finally {
      setIsProcessingCashout(false);
    }
  };

  // Open Survey Modal
  const handleStartSurvey = (survey) => {
    if (!currentUser) {
      alert("Please log in to attend surveys.");
      return;
    }
    setActiveSurvey(survey);
    setCurrentQuestionIdx(0);
    setSelectedAnswer("");
  };

  // Submit Answer & Go to Next Question / Complete Survey
  const handleNextQuestion = () => {
    if (!selectedAnswer) {
      alert("Please select an answer to proceed.");
      return;
    }

    const questionsList = Array.isArray(activeSurvey.questions) ? activeSurvey.questions : [];

    if (currentQuestionIdx < questionsList.length - 1) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
      setSelectedAnswer("");
    } else {
      const rewardGained = activeSurvey.gracePoints || parseInt(activeSurvey.reward?.replace(/\D/g, "") || "100", 10);
      const newTotalGP = userProfile.gracePoints + rewardGained;

      // Update User Grace Points & Rewards
      update(dbRef(db, `users/${currentUser.uid}`), {
        gracePoints: newTotalGP,
        rewards: newTotalGP
      });

      // Mark Survey Completed
      update(dbRef(db, `surveys/${activeSurvey.id}`), {
        status: "Completed"
      });

      // Log Notification
      push(dbRef(db, "notifications"), {
        type: "SURVEY_COMPLETED",
        message: `${userProfile.name} completed "${activeSurvey.title}" (+${rewardGained} GP)`,
        timestamp: Date.now(),
        read: false
      });

      alert(`🎉 Congratulations ${userProfile.name}! You earned ${rewardGained} Grace Points!`);
      setActiveSurvey(null);
    }
  };

  // Helpers
  const getQuestionCount = (survey) => {
    if (Array.isArray(survey.questions)) return survey.questions.length;
    return survey.questionsCount || survey.questions || 1;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Recently";
    return new Date(timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="survey-dashboard">
      {sidebarOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-top">
          <div className="logo">EarnwithGrace</div>
          <nav className="sidebar-nav">
            <a href="#dashboard" className="active">
              <FontAwesomeIcon icon={faChartPie} className="nav-icon" /> Dashboard
            </a>
            <a href="#surveys">
              <FontAwesomeIcon icon={faClipboardList} className="nav-icon" /> Available Surveys
            </a>
            <a href="#rewards" onClick={() => setShowCashoutModal(true)}>
              <FontAwesomeIcon icon={faCoins} className="nav-icon" /> Rewards
            </a>
            <a href="#wallet" onClick={() => setShowCashoutModal(true)}>
              <FontAwesomeIcon icon={faWallet} className="nav-icon" /> Wallet
            </a>
            <a href="#history">
              <FontAwesomeIcon icon={faHistory} className="nav-icon" /> Survey History
            </a>
            <a href="#ads">
              <FontAwesomeIcon icon={faVideo} className="nav-icon" /> Watch Ads
            </a>
          </nav>
        </div>

        <div className="sidebar-bottom">
          <nav className="sidebar-nav">
            <a href="#help">
              <FontAwesomeIcon icon={faCircleQuestion} className="nav-icon" /> Help
            </a>
            <a href="#settings">
              <FontAwesomeIcon icon={faGear} className="nav-icon" /> Settings
            </a>
          </nav>

          {/* Dynamic User Profile with Image Setup Button */}
          <div className="user-profile" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ position: "relative", width: "42px", height: "42px", flexShrink: 0 }}>
              <img 
                src={userProfile.photoURL || "https://via.placeholder.com/50"} 
                alt="Profile" 
                style={{ 
                  width: "100%", 
                  height: "100%", 
                  borderRadius: "50%", 
                  objectFit: "cover",
                  border: "2px solid #3b82f6",
                  opacity: uploadingImage ? 0.5 : 1
                }}
              />
              <label 
                htmlFor="sidebar-profile-upload" 
                title="Update profile picture"
                style={{
                  position: "absolute",
                  bottom: "-2px",
                  right: "-2px",
                  background: "#2563eb",
                  color: "#ffffff",
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "9px",
                  cursor: "pointer",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                }}
              >
                <FontAwesomeIcon icon={faCamera} />
              </label>
              <input 
                type="file" 
                id="sidebar-profile-upload" 
                accept="image/*" 
                onChange={handleProfilePictureChange} 
                style={{ display: "none" }}
                disabled={uploadingImage || !currentUser}
              />
            </div>

            <div style={{ overflow: "hidden" }}>
              <h4 style={{ margin: 0, fontSize: "14px", color: "#1f2937", fontWeight: "600" }}>{userProfile.name}</h4>
              <p style={{ margin: 0, fontSize: "12px", color: "#6b7280", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                {userProfile.email}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="header">
          <div className="header-title">
            <button className="menu-toggle" onClick={toggleSidebar} aria-label="Toggle navigation">
              <FontAwesomeIcon icon={sidebarOpen ? faXmark : faBars} />
            </button>
            <div>
              <h2>Welcome back, {userProfile.name}! 👋</h2>
              <p>Attend surveys, earn rewards, and grow your wallet balance.</p>
            </div>
          </div>

          <div className="header-actions">
            <div className="search-wrapper">
              <FontAwesomeIcon icon={faMagnifyingGlass} className="search-icon" />
              <input
                type="text"
                placeholder="Search surveys or topics..."
                className="search-bar"
              />
            </div>
            <button className="notification-btn" aria-label="Notifications">
              <FontAwesomeIcon icon={faBell} />
            </button>
          </div>
        </header>

        {/* Summary Cards */}
        <section className="summary-cards">
          <div className="card">
            <div className="card-header">
              <span className="card-icon active-icon">
                <FontAwesomeIcon icon={faClipboardList} />
              </span>
              <h3>Available Surveys</h3>
            </div>
            <p className="number">{surveys.filter(s => s.status === "Active" || !s.status).length}</p>
            <div className="card-footer">
              <span>Ready to attend</span>
              <a href="#surveys" className="view-link">Browse all</a>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-icon completed-icon">
                <FontAwesomeIcon icon={faCheckCircle} />
              </span>
              <h3>Surveys Completed</h3>
            </div>
            <p className="number">{surveys.filter(s => s.status === "Completed").length}</p>
            <div className="card-footer">
              <span>Your participation</span>
              <a href="#history" className="view-link">View history</a>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-icon">
                <FontAwesomeIcon icon={faCoins} />
              </span>
              <h3>Rewards Earned</h3>
            </div>
            <p className="number">₦{userProfile.gracePoints.toLocaleString()}</p>
            <div className="card-footer">
              <span>{userProfile.gracePoints} Grace Points</span>
              <button 
                onClick={() => setShowCashoutModal(true)} 
                className="view-link" 
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                Cashout
              </button>
            </div>
          </div>
        </section>

        {/* Surveys Card Grid Section */}
        <section className="recent-surveys" id="surveys">
          <div className="table-header">
            <h3>Surveys Posted by Admin</h3>
            <p className="sub-heading">Select a survey card below to start earning Grace Points</p>
          </div>

          <div className="survey-cards-grid" style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "20px",
            marginTop: "15px"
          }}>
            {surveys.length === 0 ? (
              <p>No surveys available right now.</p>
            ) : (
              surveys.map((s) => {
                const questionCount = getQuestionCount(s);
                const points = s.gracePoints || parseInt(s.reward?.replace(/\D/g, "") || "100", 10);
                const cashReward = s.reward || `₦${points}`;

                return (
                  <div key={s.id} className="survey-card" style={{
                    background: "#ffffff",
                    borderRadius: "12px",
                    padding: "20px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    border: "1px solid #e5e7eb"
                  }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                        <span style={{
                          background: "#eff6ff",
                          color: "#2563eb",
                          fontSize: "12px",
                          fontWeight: "bold",
                          padding: "4px 8px",
                          borderRadius: "6px"
                        }}>
                          {s.status || "Active"}
                        </span>
                        <span style={{ color: "#d97706", fontWeight: "bold", fontSize: "14px", display: "flex", alignItems: "center", gap: "4px" }}>
                          <FontAwesomeIcon icon={faStar} /> {points} GP
                        </span>
                      </div>

                      <h4 style={{ fontSize: "16px", fontWeight: "600", margin: "0 0 10px 0", color: "#1f2937" }}>
                        {s.title}
                      </h4>

                      <div style={{ display: "flex", gap: "15px", fontSize: "13px", color: "#6b7280", marginBottom: "15px" }}>
                        <span>
                          <FontAwesomeIcon icon={faClipboardList} style={{ marginRight: "4px" }} />
                          {questionCount} Qs
                        </span>
                        <span>
                          <FontAwesomeIcon icon={faClock} style={{ marginRight: "4px" }} />
                          {s.time || `${questionCount * 2} mins`}
                        </span>
                        <span>
                          <FontAwesomeIcon icon={faCalendarAlt} style={{ marginRight: "4px" }} />
                          {formatDate(s.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingTop: "12px",
                      borderTop: "1px solid #f3f4f6"
                    }}>
                      <div>
                        <span style={{ fontSize: "11px", color: "#9ca3af", display: "block" }}>Reward</span>
                        <strong style={{ color: "#16a34a", fontSize: "15px" }}>{cashReward}</strong>
                      </div>

                      {s.status === "Completed" ? (
                        <span className="completed-label" style={{
                          color: "#16a34a",
                          fontWeight: "bold",
                          fontSize: "13px"
                        }}>
                          Completed
                        </span>
                      ) : (
                        <button 
                          onClick={() => handleStartSurvey(s)}
                          className="take-survey-btn" 
                          style={{
                            background: "#2563eb",
                            color: "#fff",
                            border: "none",
                            padding: "8px 16px",
                            borderRadius: "8px",
                            fontWeight: "600",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px"
                          }}
                        >
                          <FontAwesomeIcon icon={faPlay} /> Attend
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* SURVEY MODAL */}
        {activeSurvey && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px"
          }}>
            <div style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "24px",
              maxWidth: "500px",
              width: "100%",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ margin: 0, fontSize: "18px" }}>{activeSurvey.title}</h3>
                <button 
                  onClick={() => setActiveSurvey(null)} 
                  style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer" }}
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>

              {Array.isArray(activeSurvey.questions) && activeSurvey.questions.length > 0 ? (
                <div>
                  <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "8px" }}>
                    Question {currentQuestionIdx + 1} of {activeSurvey.questions.length}
                  </div>
                  <h4 style={{ fontSize: "16px", marginBottom: "16px" }}>
                    {activeSurvey.questions[currentQuestionIdx]?.text || activeSurvey.questions[currentQuestionIdx]}
                  </h4>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
                    {(activeSurvey.questions[currentQuestionIdx]?.options || ["Option A", "Option B", "Option C", "Option D"]).map((opt, i) => (
                      <label 
                        key={i} 
                        style={{
                          padding: "12px 16px",
                          borderRadius: "8px",
                          border: selectedAnswer === opt ? "2px solid #2563eb" : "1px solid #d1d5db",
                          background: selectedAnswer === opt ? "#eff6ff" : "#ffffff",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "10px"
                        }}
                      >
                        <input
                          type="radio"
                          name="survey-option"
                          value={opt}
                          checked={selectedAnswer === opt}
                          onChange={(e) => setSelectedAnswer(e.target.value)}
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>

                  <button
                    onClick={handleNextQuestion}
                    style={{
                      width: "100%",
                      padding: "12px",
                      background: "#2563eb",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      fontWeight: "bold",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px"
                    }}
                  >
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

        {/* 💳 CASHOUT & LINK BANK ACCOUNT MODAL */}
        {showCashoutModal && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px"
          }}>
            <div style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "24px",
              maxWidth: "480px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 style={{ margin: 0, fontSize: "18px", color: "#1f2937", display: "flex", alignItems: "center", gap: "8px" }}>
                  <FontAwesomeIcon icon={faWallet} style={{ color: "#2563eb" }} /> Wallet & Cashout
                </h3>
                <button 
                  onClick={() => setShowCashoutModal(false)} 
                  style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#6b7280" }}
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>

              {/* Current Grace Points Balance Banner */}
              <div style={{
                background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                color: "#ffffff",
                padding: "16px",
                borderRadius: "12px",
                marginBottom: "20px"
              }}>
                <span style={{ fontSize: "12px", opacity: 0.85, display: "block" }}>Available Balance</span>
                <div style={{ fontSize: "28px", fontWeight: "bold" }}>₦{userProfile.gracePoints.toLocaleString()}</div>
                <span style={{ fontSize: "12px", opacity: 0.85 }}>
                  Minimum withdrawal threshold: ₦{MIN_WITHDRAWAL.toLocaleString()}
                </span>
              </div>

              {/* Step 1: Link Bank Details Form */}
              <div style={{ marginBottom: "20px", borderBottom: "1px solid #e5e7eb", paddingBottom: "20px" }}>
                <h4 style={{ fontSize: "14px", margin: "0 0 12px 0", color: "#374151", display: "flex", alignItems: "center", gap: "6px" }}>
                  <FontAwesomeIcon icon={faBuildingColumns} /> Link Bank Account Details
                </h4>

                <form onSubmit={handleSaveBankDetails} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <input
                    type="text"
                    placeholder="Bank Name (e.g. GTBank, Kuda, Access)"
                    value={bankForm.bankName}
                    onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                    required
                    style={{ padding: "10px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px" }}
                  />
                  <input
                    type="text"
                    placeholder="Account Number"
                    value={bankForm.accountNumber}
                    onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                    required
                    style={{ padding: "10px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px" }}
                  />
                  <input
                    type="text"
                    placeholder="Account Holder Name"
                    value={bankForm.accountName}
                    onChange={(e) => setBankForm({ ...bankForm, accountName: e.target.value })}
                    required
                    style={{ padding: "10px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px" }}
                  />
                  <button
                    type="submit"
                    style={{
                      padding: "8px 14px",
                      background: "#f3f4f6",
                      color: "#1f2937",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontWeight: "600",
                      fontSize: "13px",
                      cursor: "pointer",
                      alignSelf: "flex-end"
                    }}
                  >
                    Save Account Details
                  </button>
                </form>
              </div>

              {/* Step 2: Request Withdrawal Form */}
              <div>
                <h4 style={{ fontSize: "14px", margin: "0 0 12px 0", color: "#374151", display: "flex", alignItems: "center", gap: "6px" }}>
                  <FontAwesomeIcon icon={faMoneyBillWave} /> Request Payout
                </h4>

                <form onSubmit={handleCashoutSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div>
                    <label style={{ fontSize: "12px", color: "#6b7280", display: "block", marginBottom: "4px" }}>
                      Amount to Cashout (Min. ₦15,000)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 15000"
                      value={cashoutAmount}
                      onChange={(e) => setCashoutAmount(e.target.value)}
                      min={MIN_WITHDRAWAL}
                      max={userProfile.gracePoints}
                      required
                      style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px" }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessingCashout || userProfile.gracePoints < MIN_WITHDRAWAL}
                    style={{
                      padding: "12px",
                      background: isProcessingCashout || userProfile.gracePoints < MIN_WITHDRAWAL ? "#9ca3af" : "#16a34a",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "8px",
                      fontWeight: "bold",
                      fontSize: "14px",
                      cursor: isProcessingCashout || userProfile.gracePoints < MIN_WITHDRAWAL ? "not-allowed" : "pointer"
                    }}
                  >
                    {isProcessingCashout ? "Processing..." : "Withdraw Funds"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Watch Ads Section */}
        <section id="ads" className="ads-section">
          <h3>Watch Ads for Extra Rewards</h3>
          <p>Earn coins by watching short ads. Each ad gives you ₦50 bonus.</p>
          <button className="watch-ads-btn">
            <FontAwesomeIcon icon={faVideo} /> Watch Ad
          </button>
        </section>
      </main>
    </div>
  );
}

export default NewDashboard;