import React, { useState, useEffect } from "react";
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
  faShieldHalved,
  faCheckCircle,
  faInfoCircle,
  faWallet,
  faMousePointer,
  faClock,
  faLock
} from "@fortawesome/free-solid-svg-icons";
import AdsterraBanner from "./AdsterraBanner";
import "./NewDashboard.css";

// Adsterra Zone Keys — Replace with your real Adsterra banner keys
const ADSTERRA_CLICK_ZONES = [
  { id: "zone_click_1", title: "Sponsored Ad Banner #1", zoneKey: "YOUR_ADSTERRA_ZONE_KEY_1" },
  { id: "zone_click_2", title: "Sponsored Ad Banner #2", zoneKey: "YOUR_ADSTERRA_ZONE_KEY_2" },
  { id: "zone_click_3", title: "Sponsored Ad Banner #3", zoneKey: "YOUR_ADSTERRA_ZONE_KEY_3" }
];

const CLICK_REWARD_POINTS = 5;
const CLICK_COOLDOWN_SECONDS = 60; // 60 seconds anti-abuse cooldown per ad zone

export default function NewDashboard() {
  const navigate = useNavigate();

  // Navigation & UI States
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("click_ads");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // User & DB Data State
  const [currentUserData, setCurrentUserData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  // Anti-Abuse Tracking State: Tracks click states and cooldown timers for each zone
  const [adCooldowns, setAdCooldowns] = useState({});
  const [adClickedState, setAdClickedState] = useState({});
  const [processingAdId, setProcessingAdId] = useState(null);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  const showToast = (message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Auth & Initial User Sync
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const userRef = ref(db, `users/${user.uid}`);
          const userSnap = await get(userRef);
          const data = userSnap.val() || {};

          setCurrentUserData({
            uid: user.uid,
            email: user.email,
            ...data,
            gracePoints: data.gracePoints || 0
          });
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

  // Real-Time Database Sync (Updates Wallet in Sidebar & Notifications instantly)
  useEffect(() => {
    if (!currentUserData?.uid) return;

    const userUnsub = onValue(ref(db, `users/${currentUserData.uid}`), (snapshot) => {
      const val = snapshot.val();
      if (val) {
        setCurrentUserData((prev) => ({
          ...prev,
          ...val,
          gracePoints: val.gracePoints || 0
        }));
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
      notifUnsub();
    };
  }, [currentUserData?.uid]);

  // Anti-Abuse Cooldown Decrement Loop
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

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Logout Error:", error.message);
    }
  };

  // Step 1: User registers an ad click
  const handleAdContainerClick = (zoneId) => {
    if (adCooldowns[zoneId] > 0) return;
    setAdClickedState((prev) => ({ ...prev, [zoneId]: true }));
  };

  // Step 2: Trigger backend point addition securely
  const handleClaimClickReward = async (zone) => {
    const { id: zoneId, title } = zone;

    if (!currentUserData?.uid || processingAdId || adCooldowns[zoneId] > 0) return;

    setProcessingAdId(zoneId);

    try {
      const userRef = ref(db, `users/${currentUserData.uid}`);
      const clickHistoryRef = ref(db, `users/${currentUserData.uid}/clickAdHistory/${zoneId}_${Date.now()}`);

      // Security check: Query last click time from database to prevent API tampering
      const userSnap = await get(userRef);
      const lastClickTime = userSnap.val()?.lastAdClicks?.[zoneId] || 0;
      const now = Date.now();

      if (now - lastClickTime < CLICK_COOLDOWN_SECONDS * 1000) {
        showToast("Please wait for the cooldown before claiming again!", "error");
        setProcessingAdId(null);
        return;
      }

      // Atomic Balance Increment
      await runTransaction(userRef, (userData) => {
        if (userData) {
          userData.gracePoints = (userData.gracePoints || 0) + CLICK_REWARD_POINTS;
          userData.rewards = (userData.rewards || 0) + CLICK_REWARD_POINTS;
          if (!userData.lastAdClicks) userData.lastAdClicks = {};
          userData.lastAdClicks[zoneId] = now;
        }
        return userData;
      });

      // Write transaction history
      await update(clickHistoryRef, {
        adTitle: title,
        earned: CLICK_REWARD_POINTS,
        timestamp: now
      });

      // Trigger public notification
      await push(ref(db, "notifications"), {
        type: "AD_CLICKED",
        message: `${currentUserData.name || "User"} clicked "${title}" and earned +${CLICK_REWARD_POINTS} GP!`,
        timestamp: now,
        read: false
      });

      showToast(`Success! +${CLICK_REWARD_POINTS} Grace Points added to your wallet!`, "success");

      // Reset state and enforce local cooldown lock
      setAdClickedState((prev) => ({ ...prev, [zoneId]: false }));
      setAdCooldowns((prev) => ({ ...prev, [zoneId]: CLICK_COOLDOWN_SECONDS }));
    } catch (err) {
      console.error("Click Reward Error:", err);
      showToast(`Error rewarding points: ${err.message}`, "error");
    } finally {
      setProcessingAdId(null);
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
  const userGP = currentUserData?.gracePoints || 0;

  return (
    <div className="new-dashboard-container">
      {/* Toast Notification */}
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

      {/* SIDEBAR WITH REAL-TIME WALLET BALANCE */}
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
              className={activeTab === "watch_ads" ? "active" : ""}
              onClick={() => { setActiveTab("watch_ads"); setSidebarOpen(false); }}
            >
              <FontAwesomeIcon icon={faTv} className="nav-icon" /> Watch Video Ads
            </button>
            <button
              className={activeTab === "wallet" ? "active" : ""}
              onClick={() => { setActiveTab("wallet"); setSidebarOpen(false); }}
            >
              <FontAwesomeIcon icon={faWallet} className="nav-icon" /> Wallet & Points
            </button>
          </nav>

          {/* REAL-TIME WALLET DISPLAY IN SIDEBAR */}
          <div className="sidebar-wallet-badge">
            <div>
              <div className="sidebar-wallet-title">My Wallet</div>
              <div className="sidebar-wallet-amount">
                <FontAwesomeIcon icon={faCoins} /> {userGP} GP
              </div>
            </div>
          </div>
        </div>

        {/* User Profile */}
        <div className="user-profile">
          <div className="user-profile-left">
            <div className="profile-info">
              <h4>{currentUserData?.name || "Grace User"}</h4>
              <p>{currentUserData?.email}</p>
            </div>
          </div>
          <div className="user-profile-right">
            <button className="logout-btn" onClick={handleLogout} title="Logout">
              <FontAwesomeIcon icon={faRightFromBracket} />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="main-content">
        <header className="header">
          <div className="header-title">
            <button className="menu-toggle" onClick={toggleSidebar}>
              <FontAwesomeIcon icon={faBars} />
            </button>
            <h2>
              Dashboard <span className="version-tag">v2.0</span>
            </h2>
          </div>

          <div className="header-actions">
            <div className="search-wrapper">
              <FontAwesomeIcon icon={faSearch} className="search-icon" />
              <input
                type="text"
                className="search-bar"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Notification Menu */}
            <div className="notification-container">
              <button className="notification-btn" onClick={() => setShowNotifMenu(!showNotifMenu)}>
                <FontAwesomeIcon icon={faBell} />
                {unreadNotifsCount > 0 && <span className="notification-dot">{unreadNotifsCount}</span>}
              </button>

              {showNotifMenu && (
                <div className="notification-dropdown">
                  <div className="notif-header">
                    <span>Notifications</span>
                    <button className="notif-close-btn-v2" onClick={() => setShowNotifMenu(false)}>
                      <FontAwesomeIcon icon={faXmark} />
                    </button>
                  </div>
                  {notifications.length === 0 ? (
                    <div style={{ padding: "0.5rem", fontSize: "0.8rem", color: "#64748b" }}>
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className={`notification-row ${!n.read ? "unread" : ""}`}>
                        <span>{n.message}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* CLICK ADS & EARN TAB */}
        {activeTab === "click_ads" && (
          <section className="tab-section">
            <div className="section-title-bar">
              <h3>Click Ads & Earn Grace Points</h3>
            </div>
            <p style={{ color: "#94a3b8", marginBottom: "1.5rem" }}>
              Click on any advertisement below to open the offer. Once clicked, press "Claim +5 GP" to add points to your wallet.
            </p>

            <div className="ads-grid">
              {ADSTERRA_CLICK_ZONES.map((zone) => {
                const isCooldown = (adCooldowns[zone.id] || 0) > 0;
                const hasClicked = !!adClickedState[zone.id];
                const isProcessing = processingAdId === zone.id;

                return (
                  <div key={zone.id} className="click-ad-card">
                    <div style={{ width: "100%", fontWeight: "bold", fontSize: "0.9rem" }}>
                      {zone.title}
                    </div>

                    {/* Adsterra Display Frame */}
                    <div
                      style={{ width: "100%", cursor: "pointer" }}
                      onClick={() => handleAdContainerClick(zone.id)}
                    >
                      <AdsterraBanner zoneKey={zone.zoneKey} width={300} height={250} />
                    </div>

                    <div className="click-ad-footer">
                      <div className="click-ad-reward">
                        <FontAwesomeIcon icon={faCoins} /> +5 GP
                      </div>

                      {isCooldown ? (
                        <button className="claim-click-btn" disabled>
                          <FontAwesomeIcon icon={faClock} /> Wait {adCooldowns[zone.id]}s
                        </button>
                      ) : (
                        <button
                          className="claim-click-btn"
                          disabled={!hasClicked || isProcessing}
                          onClick={() => handleClaimClickReward(zone)}
                        >
                          {isProcessing ? (
                            <FontAwesomeIcon icon={faSpinner} spin />
                          ) : (
                            <>
                              <FontAwesomeIcon icon={hasClicked ? faCheckCircle : faLock} />
                              {hasClicked ? "Claim +5 GP" : "Click Ad First"}
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* WALLET TAB */}
        {activeTab === "wallet" && (
          <section className="tab-section">
            <div className="section-title-bar">
              <h3>My Grace Wallet</h3>
            </div>

            <div className="cyber-card orange" style={{ maxWidth: "450px" }}>
              <h4>Current Balance</h4>
              <h1 style={{ fontSize: "2.5rem", color: "var(--orange)", margin: "0.5rem 0" }}>
                {userGP} <span style={{ fontSize: "1rem", color: "#fff" }}>GP</span>
              </h1>
              <p style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
                100 Grace Points = $1.00 USD
              </p>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
