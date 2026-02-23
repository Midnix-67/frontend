import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';

function Quiz() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const selectedTopics = useMemo(() => state?.topics || [], [state?.topics]);

  // Quiz Engine State
  const [pool, setPool] = useState(null);
  const [questionsTaken, setQuestionsTaken] = useState([]);
  const [currentQ, setCurrentQ] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Real-Time Adaptation State
  const [currentLevel, setCurrentLevel] = useState('medium');
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isAdapting, setIsAdapting] = useState(false);
  const [adaptationMessage, setAdaptationMessage] = useState('');

  const MAX_QUESTIONS = 10;
  const TIME_PER_QUESTION = 60;

  // Refs for timer and state consistency (avoids stale closures)
  const stateRefs = useRef({ answers, currentLevel, streak, questionsTaken });
  
  useEffect(() => {
    stateRefs.current = { answers, currentLevel, streak, questionsTaken };
  }, [answers, currentLevel, streak, questionsTaken]);

  // 1. Submit Quiz Logic
  const submitQuiz = useCallback((finalAnswers) => {
    setLoading(true);
    axios.post('/api/quiz/submit', { answers: finalAnswers || [] })
      .then(res => navigate('/results', { state: { data: res.data } }))
      .catch(err => {
        console.error("Submission failed:", err);
        setLoading(false);
      });
  }, [navigate]);

  // 2. Question Selection Logic (Improved with forcedAskedIds to prevent duplicate/empty states)
  const pickNextQuestion = useCallback((currentPool, targetLevel, forcedAskedIds) => {
    if (!currentPool) return;

    let levelToPick = targetLevel;
    const asked = forcedAskedIds || [];
    
    // Check if target level exists/has questions, otherwise fallback
    const hasQuestions = (lvl) => currentPool[lvl] && currentPool[lvl].filter(q => !asked.includes(q.id)).length > 0;

    if (!hasQuestions(levelToPick)) {
      const fallbacks = ['medium', 'easy', 'hard'];
      levelToPick = fallbacks.find(lvl => hasQuestions(lvl)) || null;
    }

    if (levelToPick) {
      const availableQs = currentPool[levelToPick].filter(q => !asked.includes(q.id));
      const nextQ = availableQs[Math.floor(Math.random() * availableQs.length)];
      setCurrentQ(nextQ);
      setQuestionsTaken(prev => [...prev, nextQ.id]);
      setTimeLeft(TIME_PER_QUESTION);
    } else {
      // If we literally ran out of questions in all difficulties
      submitQuiz(stateRefs.current.answers);
    }
  }, [submitQuiz]);

  // 3. Real-Time Adaptation Core
  const handleSelect = useCallback((optionIdx) => {
    // Prevent double-clicks or clicking while adapting
    if (isAdapting || !currentQ || loading) return;

    const timeTaken = TIME_PER_QUESTION - timeLeft;
    const isCorrect = optionIdx === currentQ.correct_answer;
    
    // Use refs to get current state without triggering effect loop
    const { answers: currentAnswers, currentLevel: activeLevel, streak: activeStreak, questionsTaken: taken } = stateRefs.current;

    const newAnswers = [...currentAnswers, { 
        question_id: currentQ.id, 
        selected_answer: optionIdx 
    }];

    let nextLevel = activeLevel;
    let newStreak = isCorrect ? (activeStreak > 0 ? activeStreak + 1 : 1) : (activeStreak < 0 ? activeStreak - 1 : -1);
    let msg = `⚙️ Processing response...`;

    // Rule Engine
    if (isCorrect) {
      if (timeTaken <= 15 || newStreak >= 2) {
        if (activeLevel !== 'hard') {
          nextLevel = activeLevel === 'easy' ? 'medium' : 'hard';
          newStreak = 0;
          msg = `🚀 Excellent! Upgrading difficulty to ${nextLevel.toUpperCase()}.`;
        } else {
          msg = `🔥 Max level maintained. Mastery in progress!`;
        }
      } else {
        msg = `✅ Correct. Maintaining ${activeLevel.toUpperCase()} difficulty.`;
      }
    } else {
      if (timeTaken >= 45 || newStreak <= -2 || optionIdx === -1) {
        if (activeLevel !== 'easy') {
          nextLevel = activeLevel === 'hard' ? 'medium' : 'easy';
          newStreak = 0;
          msg = optionIdx === -1 ? `⏰ Timeout. Calibrating to ${nextLevel.toUpperCase()}.` : `📉 Adjusting difficulty to ${nextLevel.toUpperCase()}.`;
        } else {
          msg = `🛡️ Fundamental review mode active.`;
        }
      } else {
        msg = `❌ Incorrect. Maintaining ${activeLevel.toUpperCase()} difficulty.`;
      }
    }

    // Update States
    setAnswers(newAnswers);
    setCurrentLevel(nextLevel);
    setStreak(newStreak);
    setAdaptationMessage(msg);
    setIsAdapting(true);

    // Timing Logic for Next Question or Submit
    if (newAnswers.length >= MAX_QUESTIONS) {
      setTimeout(() => submitQuiz(newAnswers), 1500);
    } else {
      setTimeout(() => {
        // Crucial: Pass the manual "taken" list because state update is async
        const updatedAsked = [...taken, currentQ.id];
        pickNextQuestion(pool, nextLevel, updatedAsked);
        setIsAdapting(false);
      }, 1500);
    }
  }, [currentQ, isAdapting, pool, submitQuiz, pickNextQuestion, timeLeft, loading]);

  // 4. Initial Load
  useEffect(() => {
    let isMounted = true;
    const topicQuery = selectedTopics.length > 0 ? `?topics=${selectedTopics.join(',')}` : '';
    
    axios.get(`/api/quiz/adaptive-questions${topicQuery}`)
      .then(res => {
        if (isMounted) {
          setPool(res.data.pool);
          setCurrentLevel(res.data.starting_level);
          // Start the quiz
          pickNextQuestion(res.data.pool, res.data.starting_level, []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) navigate('/dashboard');
      });

    return () => { isMounted = false; };
  }, [navigate, selectedTopics, pickNextQuestion]);

  // 5. Timer Effect
  useEffect(() => {
    if (loading || isAdapting || !currentQ) return;
    
    if (timeLeft <= 0) {
      handleSelect(-1);
      return;
    }

    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, loading, isAdapting, currentQ, handleSelect]);

  // Guard Renders
  if (loading) return <div className="loader" style={{textAlign: 'center', marginTop: '50px'}}>Initializing Real-Time ML Engine...</div>;
  if (!currentQ) return <div className="loader" style={{textAlign: 'center', marginTop: '50px'}}>No questions available. Please try selecting different topics.</div>;

  return (
    <div className="quiz-page" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div className="quiz-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="progress-text">Question {answers.length + 1} of {MAX_QUESTIONS}</div>
        <div className={`timer-box ${timeLeft <= 10 ? 'danger' : ''}`} style={{ color: timeLeft <= 10 ? 'red' : 'inherit', fontWeight: 'bold', fontSize: '1.2rem' }}>
          ⏱️ {timeLeft}s
        </div>
      </div>
      
      <div className="progress-container" style={{ width: '100%', height: '10px', background: '#eee', borderRadius: '5px', margin: '15px 0' }}>
        <div className="progress-bar" style={{ width: `${((answers.length) / MAX_QUESTIONS) * 100}%`, height: '100%', background: '#4caf50', borderRadius: '5px', transition: 'width 0.3s' }}></div>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <span className="topic-tag" style={{ background: '#e1f5fe', padding: '5px 10px', borderRadius: '4px', fontSize: '0.9rem' }}>{currentQ.topic}</span>
        <span className={`difficulty-badge ${currentQ.difficulty}`} style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>Level: {currentQ.difficulty}</span>
      </div>

      {isAdapting ? (
        <div className="adapting-screen" style={{ textAlign: 'center', padding: '50px 0' }}>
          <div className="spinner" style={{ border: '4px solid #f3f3f3', borderTop: '4px solid #3498db', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 2s linear infinite', margin: '0 auto' }}></div>
          <p className="adaptation-msg" style={{ fontSize: '1.2rem', color: '#2980b9', marginTop: '20px' }}>{adaptationMessage}</p>
        </div>
      ) : (
        <div className="question-content">
          <h2 style={{ marginBottom: '25px', lineHeight: '1.4' }}>{currentQ.question}</h2>
          <div className="options-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {currentQ.options?.map((opt, i) => (
              <button 
                key={i} 
                onClick={() => handleSelect(i)} 
                className="option-btn"
                style={{ padding: '15px', textAlign: 'left', borderRadius: '8px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', fontSize: '1rem', transition: '0.2s' }}
                onMouseOver={(e) => (e.target.style.background = '#f5f5f5')}
                onMouseOut={(e) => (e.target.style.background = 'white')}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default Quiz;