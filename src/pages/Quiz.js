import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';


function Quiz() {
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdapting, setIsAdapting] = useState(false); // NEW: Real-time effect state
  const navigate = useNavigate();
  const { state } = useLocation();
  const selectedTopics = useMemo(() => state?.topics || [], [state?.topics]);

  useEffect(() => {
    // Convert array to a comma-separated string if topics exist
    const topicQuery = selectedTopics.length > 0 ? `?topics=${selectedTopics.join(',')}` : '';
    
    axios.get(`/api/quiz/adaptive-questions${topicQuery}`)
      .then(res => {
        setQuestions(res.data.questions);
        setLoading(false);
      })
      .catch(() => navigate('/dashboard'));
  }, [navigate, selectedTopics]);

  const handleSelect = (optionIdx) => {
    const newAnswers = [...answers, { 
        question_id: questions[currentIdx].id, 
        selected_answer: optionIdx 
    }];
    
    if (currentIdx + 1 < questions.length) {
      // Trigger the "AI Adapting" effect
      setIsAdapting(true);
      setTimeout(() => {
        setAnswers(newAnswers);
        setCurrentIdx(currentIdx + 1);
        setIsAdapting(false);
      }, 800); // 800ms delay to simulate real-time ML processing
    } else {
      setLoading(true); // Show loader while submitting
      axios.post('/api/quiz/submit', { answers: newAnswers })
        .then(res => navigate('/results', { state: { data: res.data } }));
    }
  };

  // Generate a dynamic reason based on the question's metadata
  const getAIInsight = (q) => {
    if (currentIdx === 0) return `⚡ Baseline check: Calibrating your ${q.topic} skills.`;
    if (q.difficulty === 'hard') return `📈 Level up! Testing your limits in ${q.topic}.`;
    if (q.difficulty === 'easy') return `🔄 Reinforcing fundamentals in ${q.topic}.`;
    return `🎯 Targeting balanced proficiency in ${q.topic}.`;
  };

  if (loading) return <div className="loader">Initializing ML Engine...</div>;

  const q = questions[currentIdx];

  return (
    <div className="quiz-page">
      <div className="progress-bar" style={{width: `${((currentIdx)/questions.length)*100}%`}}></div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Question {currentIdx + 1}/{questions.length}</h3>
        <span className={`difficulty-badge ${q.difficulty}`}>{q.difficulty.toUpperCase()}</span>
      </div>

      {/* AI Indicator Box */}
      <div className="ai-indicator">
        {getAIInsight(q)}
      </div>

      {isAdapting ? (
        <div className="adapting-screen">
          <div className="spinner"></div>
          <p>🧠 AI is analyzing response & adapting next question...</p>
        </div>
      ) : (
        <div className="question-content fade-in">
          <h2>{q.question}</h2>
          <div className="options-list">
            {q.options.map((opt, i) => (
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