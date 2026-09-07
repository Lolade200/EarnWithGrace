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
  faSpinner
} from "@fortawesome/free-solid-svg-icons";
import "./AdminDashboard.css";

// --- Sub-components ---
const StatCard = ({ title, value, subtext, icon, theme }) => (
  <div className="card">
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

  // UI & Search States
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoading, setActionLoading] = useState({});

  // Dynamic Multi-Question & Multi-Option Forms State
  const [surveyTitle, setSurveyTitle] = useState("");
  const [surveyPoints, setSurveyPoints] = useState("");
  const [questions, setQuestions] = useState([
    { text: "", options: ["", ""] }
  ]);
  const [rewardUpdate, setRewardUpdate] = useState({ userId: "", pointsAmount: "" });

  const navigate = useNavigate();
  const prevNotifCountRef = useRef(0);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  // Helper for action loading state
  const setKeyLoading = (key, val) => {
    setActionLoading((prev) => ({ ...prev, [key]: val }));
  };

  // --- Handlers for Dynamic Question and Option Builder ---
  const handleAddQuestion = () => {
    setQuestions((prev) => [...prev, { text: "", options: ["", ""] }]);
  };

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
        alert("Each question must have at least 2 options.");
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

  // 1. Auth & Admin Role Check
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const adminEmail = "sa9362673@gmail.com";

        if (user.email === adminEmail) {
          setCurrentUserData({ email: user.email, photoURL: user.photoURL, name: "Super Admin" });
          setAuthorized(true);
          setLoading(false);
          return;
        }

        try {
          const userSnap = await get(ref(db, `users/${user.uid}`));
          const userData = userSnap.val();

          if (userData && (userData.role === "admin" || userData.isAdmin === true)) {
            setCurrentUserData({ ...userData, email: user.email, photoURL: user.photoURL });
            setAuthorized(true);
          } else {
            alert("Access denied: You do not have administrative privileges.");
            await signOut(auth);
            navigate("/login");
          }
        } catch (err) {
          console.error("Authorization check failed:", err);
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

  // 2. Realtime Firebase DB Subscriptions
  useEffect(() => {
    if (!authorized) return;

    const usersUnsub = onValue(
      ref(db, "users"),
      (snapshot) => {
        const data = snapshot.val();
        setUsers(data ? Object.keys(data).map((key) => ({ id: key, ...data[key] })) : []);
      },
      (error) => console.error("Users listener error:", error)
    );

    const surveysUnsub = onValue(
      ref(db, "surveys"),
      (snapshot) => {
        const data = snapshot.val();
        setSurveys(data ? Object.keys(data).map((key) => ({ id: key, ...data[key] })) : []);
      },
      (error) => console.error("Surveys listener error:", error)
    );

    const adsUnsub = onValue(
      ref(db, "ads"),
      (snapshot) => {
        const data = snapshot.val();
        setAds(data ? Object.keys(data).map((key) => ({ id: key, ...data[key] })) : []);
      },
      (error) => console.error("Ads listener error:", error)
    );

    const notifUnsub = onValue(
      ref(db, "notifications"),
      (snapshot) => {
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
            } catch (e) {
              console.error("Audio playback error:", e);
            }
          }
          prevNotifCountRef.current = unreadCount;
          setNotifications(notifList);
        } else {
          setNotifications([]);
        }
      },
      (error) => console.error("Notifications listener error:", error)
    );

    return () => {
      usersUnsub();
      surveysUnsub();
      adsUnsub();
      notifUnsub();
    };
  }, [authorized]);

  // Logout Handler
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error.message);
    }
  };

  // User Actions
  const updateUserStatus = async (userId, status) => {
    setKeyLoading(`user-${userId}`, true);
    try {
      await update(ref(db, `users/${userId}`), { status });
    } catch (err) {
      alert(`Failed to update user status: ${err.message}`);
    } finally {
      setKeyLoading(`user-${userId}`, false);
    }
  };

  // Survey Moderation Actions
  const updateSurveyStatus = async (id, status) => {
    setKeyLoading(`survey-${id}`, true);
    try {
      await update(ref(db, `surveys/${id}`), { status });
    } catch (err) {
      alert(`Failed to update survey status: ${err.message}`);
    } finally {
      setKeyLoading(`survey-${id}`, false);
    }
  };

  // Create Dynamic Survey
  const handleSurveySubmit = async (e) => {
    e.preventDefault();
    const pointsVal = parseInt(surveyPoints, 10) || 0;

    const formattedQuestions = questions
      .filter((q) => q.text.trim() !== "")
      .map((q, idx) => ({
        id: idx + 1,
        text: q.text.trim(),
        options: q.options.map((opt) => opt.trim()).filter((opt) => opt !== "")
      }));

    if (formattedQuestions.length === 0) {
      alert("Please enter at least one question.");
      return;
    }

    const invalidQuestion = formattedQuestions.find((q) => q.options.length < 2);
    if (invalidQuestion) {
      alert(`Question "${invalidQuestion.text}" must have at least 2 valid answer choices.`);
      return;
    }

    const surveyData = {
      title: surveyTitle,
      questions: formattedQuestions,
      questionsCount: formattedQuestions.length,
      gracePoints: pointsVal,
      reward: `₦${pointsVal}`,
      status: "Active",
      createdAt: Date.now()
    };

    setKeyLoading("survey-submit", true);
    try {
      await push(ref(db, "surveys"), surveyData);
      await push(ref(db, "notifications"), {
        type: "SURVEY_CREATED",
        message: `New task "${surveyTitle}" posted with ${formattedQuestions.length} question(s) and ${pointsVal} GP reward.`,
        timestamp: Date.now(),
        read: false
      });

      setSurveyTitle("");
      setSurveyPoints("");
      setQuestions([{ text: "", options: ["", ""] }]);
      alert("Task/Survey successfully created!");
    } catch (err) {
      alert(`Error creating survey: ${err.message}`);
    } finally {
      setKeyLoading("survey-submit", false);
    }
  };

  // Reward Management
  const updateUserRewards = async (e) => {
    e.preventDefault();
    if (!rewardUpdate.userId || !rewardUpdate.pointsAmount) return;

    const targetUser = users.find((u) => u.id === rewardUpdate.userId);
    const currentPoints = targetUser?.gracePoints || targetUser?.rewards || 0;
    const addedPoints = parseInt(rewardUpdate.pointsAmount, 10);
    const newTotal = Math.max(0, currentPoints + addedPoints);

    setKeyLoading("reward-submit", true);
    try {
      await update(ref(db, `users/${rewardUpdate.userId}`), {
        gracePoints: newTotal,
        rewards: newTotal
      });

      await push(ref(db, "notifications"), {
        type: "REWARD_UPDATED",
        message: `Updated points for ${targetUser?.name || targetUser?.email || "User"}: +${addedPoints} GP (Total: ${newTotal} GP)`,
        timestamp: Date.now(),
        read: false
      });

      setRewardUpdate({ userId: "", pointsAmount: "" });
      alert("User Grace Points updated successfully!");
    } catch (err) {
      alert(`Error updating points: ${err.message}`);
    } finally {
      setKeyLoading("reward-submit", false);
    }
  };

  const markNotificationRead = (id) => {
    update(ref(db, `notifications/${id}`), { read: true });
  };

  if (loading) {
    return <div className="loading">Checking authorization...</div>;
  }

  if (!authorized) return null;

  // Overview Metrics
  const totalUsersCount = users.length;
  const totalSurveysCount = surveys.length;
  const flaggedSurveysCount = surveys.filter((s) => s.status === "Flagged").length;
  const totalAdsCount = ads.length;
  const unreadNotifsCount = notifications.filter((n) => !n.read).length;

  const systemMetrics = [
    { title: "Total Users", value: totalUsersCount.toLocaleString(), subtext: "Registered Accounts", icon: faUsers, theme: "blue" },
    { title: "Total Surveys Posted", value: totalSurveysCount.toLocaleString(), subtext: "Active & Completed Tasks", icon: faClipboardCheck, theme: "purple" },
    { title: "Flagged Surveys", value: flaggedSurveysCount.toLocaleString(), subtext: "Requires Moderation", icon: faTriangleExclamation, theme: "amber" },
    { title: "Total Ads", value: totalAdsCount.toLocaleString(), subtext: "Active Monitored Ads", icon: faRectangleAd, theme: "green" },
  ];

  // Filtering Logic
  const searchLower = searchTerm.toLowerCase();

  const filteredUsers = users.filter((u) => {
    const nameMatch = u.name ? u.name.toLowerCase().includes(searchLower) : false;
    const emailMatch = u.email ? u.email.toLowerCase().includes(searchLower) : false;
    const roleMatch = u.role ? u.role.toLowerCase().includes(searchLower) : false;
    return nameMatch || emailMatch || roleMatch;
  });

  const filteredSurveys = surveys.filter((s) => {
    const titleMatch = s.title ? s.title.toLowerCase().includes(searchLower) : false;
    const statusMatch = s.status ? s.status.toLowerCase().includes(searchLower) : false;
    return titleMatch || statusMatch;
  });

  return (
    <div className="admin-dashboard">
      {sidebarOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}

      {/* Admin Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-top">
          <div className="admin-badge">
            <FontAwesomeIcon icon={faShieldHalved} className="badge-icon" />
            <span>Admin Console</span>
          </div>
          <nav className="sidebar-nav">
            <a href="#overview" className="active">
              <FontAwesomeIcon icon={faChartColumn} className="nav-icon" /> Overview
            </a>
            <a href="#users">
              <FontAwesomeIcon icon={faUsers} className="nav-icon" /> User Management
            </a>
            <a href="#create-survey">
              <FontAwesomeIcon icon={faPlus} className="nav-icon" /> Create Survey
            </a>
            <a href="#audit">
              <FontAwesomeIcon icon={faClipboardCheck} className="nav-icon" /> Survey Moderation
            </a>
            <a href="#rewards">
              <FontAwesomeIcon icon={faCoins} className="nav-icon" /> Rewards Management
            </a>
          </nav>
        </div>

        <div className="sidebar-bottom">
          <nav className="sidebar-nav">
            <a href="#settings">
              <FontAwesomeIcon icon={faGear} className="nav-icon" /> Global Settings
            </a>
          </nav>

          {/* Profile & Signout */}
          <div className="user-profile" style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "10px" }}>
            <img
              src={currentUserData?.photoURL || "https://via.placeholder.com/50"}
              alt="Admin Profile"
              style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }}
            />
            <div style={{ flexGrow: 1, overflow: "hidden" }}>
              <h4 style={{ margin: 0, fontSize: "14px" }}>{currentUserData?.name || "System Admin"}</h4>
              <p style={{ margin: 0, fontSize: "12px", color: "#9ca3af", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                {currentUserData?.email}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="logout-btn"
              title="Logout"
              style={{
                background: "#ef4444",
                color: "#fff",
                border: "none",
                padding: "8px 12px",
                borderRadius: "6px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <FontAwesomeIcon icon={faRightFromBracket} />
            </button>
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
              <h2>System Control Panel</h2>
              <p>Monitor platform usage, manage security permissions, and moderate active surveys.</p>
            </div>
          </div>

          <div className="header-actions">
            {/* Search Bar */}
            <div className="search-wrapper">
              <FontAwesomeIcon icon={faMagnifyingGlass} className="search-icon" />
              <input
                type="text"
                placeholder="Search users, emails, or surveys..."
                className="search-bar"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Notifications Menu */}
            <div className="notification-container">
              <button
                className="notification-btn"
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                aria-label="Notifications"
              >
                <FontAwesomeIcon icon={faBell} />
                {unreadNotifsCount > 0 && <span className="notification-dot">{unreadNotifsCount}</span>}
              </button>

              {showNotifMenu && (
                <div className="notification-dropdown">
                  <div className="notif-header">
                    <h4>Activity Log ({unreadNotifsCount} New)</h4>
                  </div>
                  <div className="notif-list">
                    {notifications.length === 0 ? (
                      <p className="notif-empty">No new activity.</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`notif-item ${n.read ? "read" : "unread"}`}
                          onClick={() => markNotificationRead(n.id)}
                        >
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

        {/* Metric Cards */}
        <section className="summary-cards" id="overview">
          {systemMetrics.map((metric, idx) => (
            <StatCard key={idx} {...metric} />
          ))}
        </section>

        {/* User Management */}
        <section className="admin-section" id="users">
          <div className="table-header">
            <div>
              <h3>User Accounts & Organizations</h3>
              <p className="sub-heading">Manage user access roles and monitor Grace Points balances.</p>
            </div>
            <div className="header-buttons">
              <button className="secondary-btn"><FontAwesomeIcon icon={faFilter} /> Filter</button>
              <button className="create-btn"><FontAwesomeIcon icon={faUserPlus} /> Add User</button>
            </div>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>User Details</th>
                  <th>Organization</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Grace Points Balance</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: "1.5rem" }}>No users match search.</td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div className="user-detail-cell" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <img
                            src={u.photoURL || "https://via.placeholder.com/40"}
                            alt={u.name || "User"}
                            style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover" }}
                          />
                          <div>
                            <span className="user-name" style={{ fontWeight: "bold", display: "block" }}>{u.name || "N/A"}</span>
                            <span className="user-email" style={{ fontSize: "12px", color: "#6b7280" }}>{u.email || "N/A"}</span>
                          </div>
                        </div>
                      </td>
                      <td>{u.org || "—"}</td>
                      <td><span className="role-pill">{u.role || "User"}</span></td>
                      <td>
                        <span className={`status-badge ${u.status?.toLowerCase() || "active"}`}>
                          {u.status || "Active"}
                        </span>
                      </td>
                      <td>
                        <strong>{u.gracePoints || u.rewards || 0} GP</strong> (₦{u.gracePoints || u.rewards || 0})
                      </td>
                      <td>
                        <div className="action-group">
                          <button
                            className="icon-action approve"
                            onClick={() => updateUserStatus(u.id, "Active")}
                            disabled={actionLoading[`user-${u.id}`]}
                            title="Activate Account"
                          >
                            <FontAwesomeIcon icon={actionLoading[`user-${u.id}`] ? faSpinner : faCheck} spin={actionLoading[`user-${u.id}`]} />
                          </button>
                          <button
                            className="icon-action suspend"
                            onClick={() => updateUserStatus(u.id, "Suspended")}
                            disabled={actionLoading[`user-${u.id}`]}
                            title="Suspend User"
                          >
                            <FontAwesomeIcon icon={actionLoading[`user-${u.id}`] ? faSpinner : faBan} spin={actionLoading[`user-${u.id}`]} />
                          </button>
                          <button className="icon-action" title="More Options">
                            <FontAwesomeIcon icon={faEllipsisVertical} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Dynamic Create Survey Form */}
        <section className="admin-section" id="create-survey">
          <h3>Create New Task / Survey</h3>
          <p className="sub-heading">Build custom questions and add dynamic answer choices for each.</p>
          <form onSubmit={handleSurveySubmit} className="survey-form">
            <input
              type="text"
              placeholder="Task / Survey Title (e.g. Consumer Shopping Habits)"
              value={surveyTitle}
              onChange={(e) => setSurveyTitle(e.target.value)}
              required
              style={{ width: "100%", padding: "10px", marginBottom: "15px" }}
            />

            {/* Questions Builder */}
            {questions.map((q, qIndex) => (
              <div
                key={qIndex}
                style={{
                  background: "#f9fafb",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "15px",
                  marginBottom: "15px"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <strong>Question {qIndex + 1}</strong>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(qIndex)}
                      style={{ background: "#ef4444", color: "#fff", border: "none", padding: "4px 8px", borderRadius: "4px", cursor: "pointer" }}
                    >
                      Remove Question
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  placeholder={`Enter question ${qIndex + 1} text`}
                  value={q.text}
                  onChange={(e) => handleQuestionTextChange(qIndex, e.target.value)}
                  required
                  style={{ width: "100%", padding: "8px", marginBottom: "12px" }}
                />

                {/* Options List */}
                <label style={{ fontSize: "12px", fontWeight: "bold", color: "#4b5563" }}>Answer Choices:</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "6px", marginBottom: "10px" }}>
                  {q.options.map((opt, oIndex) => (
                    <div key={oIndex} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <input
                        type="text"
                        placeholder={`Option ${oIndex + 1}`}
                        value={opt}
                        onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                        required
                        style={{ flexGrow: 1, padding: "6px" }}
                      />
                      {q.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(qIndex, oIndex)}
                          style={{ background: "#dc2626", color: "#fff", border: "none", padding: "4px 8px", borderRadius: "4px", cursor: "pointer" }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => handleAddOption(qIndex)}
                  style={{ background: "#10b981", color: "#fff", border: "none", padding: "6px 10px", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}
                >
                  <FontAwesomeIcon icon={faPlus} /> Add Option Choice
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddQuestion}
              style={{ background: "#3b82f6", color: "#fff", border: "none", padding: "8px 12px", borderRadius: "6px", cursor: "pointer", marginBottom: "15px", display: "block" }}
            >
              <FontAwesomeIcon icon={faPlus} /> Add Another Question
            </button>

            <div className="points-input-group" style={{ marginBottom: "15px" }}>
              <input
                type="number"
                placeholder="Target Grace Points (e.g. 100)"
                value={surveyPoints}
                onChange={(e) => setSurveyPoints(e.target.value)}
                required
              />
              <span className="points-calc-label">
                = ₦{surveyPoints || 0} Cash Reward (100 GP = ₦100)
              </span>
            </div>

            <button type="submit" className="create-btn" disabled={actionLoading["survey-submit"]}>
              <FontAwesomeIcon icon={actionLoading["survey-submit"] ? faSpinner : faPlus} spin={actionLoading["survey-submit"]} /> Post Survey & Set Reward
            </button>
          </form>
        </section>

        {/* Rewards Management */}
        <section className="admin-section" id="rewards">
          <h3>Rewards & Grace Points Management</h3>
          <p className="sub-heading">Conversion Rate: 100 Grace Points = ₦100</p>
          <form onSubmit={updateUserRewards} className="reward-form">
            <select
              value={rewardUpdate.userId}
              onChange={(e) => setRewardUpdate({ ...rewardUpdate, userId: e.target.value })}
              required
            >
              <option value="">Select Target User Account</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name || "Unnamed"} ({u.email || "No Email"}) — Balance: {u.gracePoints || u.rewards || 0} GP (₦{u.gracePoints || u.rewards || 0})
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Grace Points to Add (+)"
              value={rewardUpdate.pointsAmount}
              onChange={(e) => setRewardUpdate({ ...rewardUpdate, pointsAmount: e.target.value })}
              required
            />
            <button type="submit" className="create-btn" disabled={actionLoading["reward-submit"]}>
              <FontAwesomeIcon icon={actionLoading["reward-submit"] ? faSpinner : faStar} spin={actionLoading["reward-submit"]} /> Award Grace Points
            </button>
          </form>
        </section>

        {/* Survey Moderation */}
        <section className="admin-section" id="audit">
          <h3>Survey Moderation & Audit</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Survey Title</th>
                  <th>Questions</th>
                  <th>Reward Target</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSurveys.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", padding: "1.5rem" }}>No surveys found matching search.</td>
                  </tr>
                ) : (
                  filteredSurveys.map((s) => (
                    <tr key={s.id}>
                      <td><strong>{s.title}</strong></td>
                      <td>
                        {Array.isArray(s.questions) ? `${s.questions.length} Question(s)` : "1 Question"}
                      </td>
                      <td>
                        <span style={{ color: "#d97706", fontWeight: "bold" }}>
                          <FontAwesomeIcon icon={faStar} /> {s.gracePoints || s.reward?.replace("₦", "") || 0} GP
                        </span>
                        <div>(₦{s.gracePoints || s.reward?.replace("₦", "") || 0})</div>
                      </td>
                      <td>
                        <span className={`status-badge ${s.status?.toLowerCase() || "pending"}`}>
                          {s.status || "Pending"}
                        </span>
                      </td>
                      <td>
                        <div className="action-group">
                          <button
                            className="icon-action approve"
                            onClick={() => updateSurveyStatus(s.id, "Active")}
                            disabled={actionLoading[`survey-${s.id}`]}
                            title="Approve Survey"
                          >
                            <FontAwesomeIcon icon={actionLoading[`survey-${s.id}`] ? faSpinner : faCheck} spin={actionLoading[`survey-${s.id}`]} />
                          </button>
                          <button
                            className="icon-action suspend"
                            onClick={() => updateSurveyStatus(s.id, "Rejected")}
                            disabled={actionLoading[`survey-${s.id}`]}
                            title="Reject Survey"
                          >
                            <FontAwesomeIcon icon={actionLoading[`survey-${s.id}`] ? faSpinner : faBan} spin={actionLoading[`survey-${s.id}`]} />
                          </button>
                          <button
                            className="icon-action flag"
                            onClick={() => updateSurveyStatus(s.id, "Flagged")}
                            disabled={actionLoading[`survey-${s.id}`]}
                            title="Flag Survey"
                          >
                            <FontAwesomeIcon icon={actionLoading[`survey-${s.id}`] ? faSpinner : faTriangleExclamation} spin={actionLoading[`survey-${s.id}`]} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

export default AdminDashboard;