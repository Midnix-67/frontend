import React, { useState, useEffect, useMemo, useCallback } from 'react';
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

  // 1. Initial Load: Fetch the Smart Pool
  useEffect(() => {
    const topicQuery = selectedTopics.length > 0 ? `?topics=${selectedTopics.join(',')}` : '';
    axios.get(`/api/quiz/adaptive-questions${topicQuery}`)
      .then(res => {
        setPool(res.data.pool);
        setCurrentLevel(res.data.starting_level);
        pickNextQuestion(res.data.pool, res.data.starting_level, []);
        setLoading(false);
      })
      .catch(() => navigate('/dashboard'));
  }, [navigate, selectedTopics]);

  // 2. Timer Logic
  useEffect(() => {
    if (loading || isAdapting || !currentQ) return;
    
    if (timeLeft <= 0) {
      handleSelect(-1); // -1 indicates timeout (wrong answer)
      return;
    }

    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, loading, isAdapting, currentQ]);

  // 3. Select Next Question from Pool
  const pickNextQuestion = useCallback((currentPool, targetLevel, askedIds) => {
    let levelToPick = targetLevel;
    
    // Fallback if we run out of questions in the target difficulty
    if (!currentPool[levelToPick] || currentPool[levelToPick].filter(q => !askedIds.includes(q.id)).length === 0) {
      levelToPick = levelToPick === 'hard' ? 'medium' : (levelToPick === 'easy' ? 'medium' : 'easy');
    }

    const availableQs = currentPool[levelToPick].filter(q => !askedIds.includes(q.id));
    if (availableQs.length > 0) {
      const nextQ = availableQs[Math.floor(Math.random() * availableQs.length)];
      setCurrentQ(nextQ);
      setQuestionsTaken(prev => [...prev, nextQ.id]);
      setTimeLeft(TIME_PER_QUESTION);
    } else {
      // Out of questions completely, force submit
      submitQuiz(answers);
    }
  }, [answers]);

  // 4. Real-Time Adaptation Logic Core
  const handleSelect = (optionIdx) => {
    const timeTaken = TIME_PER_QUESTION - timeLeft;
    const isCorrect = currentQ && optionIdx === currentQ.correct_answer;
    
    const newAnswers = [...answers, { 
        question_id: currentQ.id, 
        selected_answer: optionIdx 
    }];

    // --- The Adaptation Rules Engine ---
    let nextLevel = currentLevel;
    let newStreak = isCorrect ? (streak > 0 ? streak + 1 : 1) : (streak < 0 ? streak - 1 : -1);
    let msg = `⚙️ Processing response...`;

    if (isCorrect) {
      if (timeTaken <= 15 || newStreak >= 2) {
        if (currentLevel !== 'hard') {
          nextLevel = currentLevel === 'easy' ? 'medium' : 'hard';
          newStreak = 0; // Reset streak after promotion
          msg = `🚀 Excellent! Rapid/Consistent correct answers. Upgrading difficulty to ${nextLevel.toUpperCase()}.`;
        } else {
          msg = `🔥 Max level maintained. You are mastering this topic!`;
        }
      } else {
        msg = `✅ Correct. Maintaining ${currentLevel.toUpperCase()} difficulty.`;
      }
    } else {
      if (timeTaken >= 45 || newStreak <= -2) {
        if (currentLevel !== 'easy') {
          nextLevel = currentLevel === 'hard' ? 'medium' : 'easy';
          newStreak = 0; // Reset streak after demotion
          msg = `📉 Time exhausted / Sequence broken. Calibrating difficulty down to ${nextLevel.toUpperCase()}.`;
        } else {
          msg = `🛡️ Fundamental review mode active. Take your time.`;
        }
      } else {
        msg = `❌ Incorrect. Maintaining ${currentLevel.toUpperCase()} difficulty.`;
      }
    }

    setAnswers(newAnswers);
    setCurrentLevel(nextLevel);
    setStreak(newStreak);
    setAdaptationMessage(msg);
    setIsAdapting(true);

    if (newAnswers.length >= MAX_QUESTIONS) {
      setTimeout(() => submitQuiz(newAnswers), 1500);
    } else {
      setTimeout(() => {
        pickNextQuestion(pool, nextLevel, questionsTaken);
        setIsAdapting(false);
      }, 1500);
    }
  };

  const submitQuiz = (finalAnswers) => {
    setLoading(true);
    axios.post('/api/quiz/submit', { answers: finalAnswers })
      .then(res => navigate('/results', { state: { data: res.data } }))
      .catch(err => console.error(err));
  };

  if (loading) return <div className="loader">Initializing Real-Time ML Engine...</div>;
  if (!currentQ) return <div className="loader">No questions available.</div>;

  return (
    <div className="quiz-page">
      {/* Top Header with Progress and Timer */}
      <div className="quiz-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
        <div className="progress-text">Question {answers.length + 1} of {MAX_QUESTIONS}</div>
        <div className={`timer-box ${timeLeft <= 10 ? 'danger' : ''}`}>
          ⏱️ {timeLeft}s
        </div>
      </div>
      
      <div className="progress-bar" style={{width: `${((answers.length)/MAX_QUESTIONS)*100}%`}}></div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
        <span className="topic-tag">{currentQ.topic}</span>
        <span className={`difficulty-badge ${currentQ.difficulty}`}>Level: {currentQ.difficulty.toUpperCase()}</span>
      </div>

      {isAdapting ? (
        <div className="adapting-screen fade-in">
          <div className="spinner"></div>
          <p className="adaptation-msg">{adaptationMessage}</p>
        </div>
      ) : (
        <div className="question-content fade-in">
          <h2>{currentQ.question}</h2>
          <div className="options-list">
            {currentQ.options.map((opt, i) => (
              <button key={i} onClick={() => handleSelect(i)} className="option-btn">
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Quiz;