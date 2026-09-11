import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { ref, onValue, update, push, get } from "firebase/database";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClipboardCheck,
  faLock,
  faXmark,
  faSpinner,
  faCoins
} from "@fortawesome/free-solid-svg-icons";
import Header from "./Header";
import "./Surveys.css";

export default function Surveys() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [surveys, setSurveys] = useState([]);
  const [activeSurvey, setActiveSurvey] = useState(null);
  const [surveyAnswers, setSurveyAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => setCurrentUser(user));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const surveysUnsub = onValue(ref(db, "surveys"), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const surveyList = Object.keys(data).map((key) => ({ id: key, ...data[key] }));
        setSurveys(surveyList);
      } else {
        setSurveys([
          {
            id: "s1",
            title: "Global Consumer Tech Trends 2026",
            gracePoints: 120,
            questions: [
              { id: "q1", text: "Which mobile operating system do you use?", options: ["Android", "Apple iOS", "Other"] },
              { id: "q2", text: "How many hours do you spend online daily?", options: ["1-3 Hours", "4-6 Hours", "7+ Hours"] }
            ]
          },
          {
            id: "s2",
            title: "Digital Entertainment & Streaming Habits",
            gracePoints: 85,
            questions: [
              { id: "q1", text: "What is your primary streaming service?", options: ["Netflix", "YouTube Premium", "Amazon Prime", "Other"] }
            ]
          }
        ]);
      }
    });

    return () => surveysUnsub();
  }, []);

  const handleStartSurvey = (survey) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    setActiveSurvey(survey);
  };

  const handleCompleteSurvey = async (e) => {
    e.preventDefault();
    if (!activeSurvey || !currentUser) return;

    setSubmitting(true);
    const rewardGP = parseInt(activeSurvey.gracePoints, 10) || 50;

    try {
      const userRef = ref(db, `users/${currentUser.uid}`);
      const userSnap = await get(userRef);
      const currentPts = userSnap.val()?.gracePoints || 0;
      const newPts = currentPts + rewardGP;

      await update(userRef, { gracePoints: newPts, rewards: newPts });
      await push(ref(db, `surveyCompletions/${activeSurvey.id}`), {
        userId: currentUser.uid,
        answers: surveyAnswers,
        completedAt: Date.now()
      });

      alert(`Survey Completed! +${rewardGP} GP added to your wallet.`);
      setActiveSurvey(null);
      setSurveyAnswers({});
    } catch (err) {
      alert(`Submission error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="surveys-page-wrapper">
      <Header />

      <section className="surveys-section">
        <div className="surveys-bg-glow glow-1"></div>
        <div className="surveys-bg-glow glow-2"></div>

        <div className="surveys-container">
          <div className="surveys-header">
            <span className="surveys-badge">MARKET RESEARCH</span>
            <h1 className="surveys-title">Paid Surveys & Feedback</h1>
            <p className="surveys-subtitle">
              Participate in global research panels. Express your opinions to earn Grace Points instantly.
            </p>
          </div>

          <div className="surveys-grid">
            {surveys.map((survey) => (
              <div key={survey.id} className="survey-card">
                <div className="survey-card-top">
                  <span className="survey-type">OPINION PANEL</span>
                  <div className="survey-reward">
                    <FontAwesomeIcon icon={faCoins} />
                    <span>+{survey.gracePoints || 50} GP</span>
                  </div>
                </div>

                <h3 className="survey-card-title">{survey.title}</h3>
                <p className="survey-questions-count">
                  <FontAwesomeIcon icon={faClipboardCheck} style={{ marginRight: "6px" }} />
                  {survey.questions?.length || 1} Question(s)
                </p>

                <button className="take-survey-btn" onClick={() => handleStartSurvey(survey)}>
                  {currentUser ? "Take Survey & Earn" : "Sign In to Take Survey"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Survey Questionnaire Modal */}
      {activeSurvey && (
        <div className="survey-modal-overlay">
          <div className="survey-modal-box">
            <div className="survey-modal-header">
              <h3>{activeSurvey.title}</h3>
              <button className="survey-close-btn" onClick={() => setActiveSurvey(null)}>
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <form onSubmit={handleCompleteSurvey}>
              {activeSurvey.questions?.map((q) => (
                <div key={q.id} className="survey-q-group">
                  <label className="survey-q-label">{q.text}</label>
                  <div className="survey-options-list">
                    {q.options?.map((opt, idx) => (
                      <label key={idx} className="survey-opt-item">
                        <input
                          type="radio"
                          name={q.id}
                          value={opt}
                          onChange={() => setSurveyAnswers({ ...surveyAnswers, [q.id]: opt })}
                          required
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              <div className="survey-modal-footer">
                <button type="submit" className="survey-submit-btn" disabled={submitting}>
                  {submitting ? <FontAwesomeIcon icon={faSpinner} spin /> : "Submit & Earn Grace Points"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Auth Gate Modal */}
      {showAuthModal && (
        <div className="survey-modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="auth-gate-modal" onClick={(e) => e.stopPropagation()}>
            <FontAwesomeIcon icon={faLock} className="auth-gate-icon" />
            <h2>Sign In Required</h2>
            <p>Please sign in or create an account to submit survey responses and claim your Grace Points.</p>
            <div className="auth-gate-actions">
              <button className="auth-primary-btn" onClick={() => navigate("/login")}>
                Sign In
              </button>
              <button className="auth-secondary-btn" onClick={() => navigate("/signup")}>
                Create Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
