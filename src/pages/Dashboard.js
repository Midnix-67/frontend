import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Dashboard({ user }) {
  const [analytics, setAnalytics] = useState(null);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const navigate = useNavigate();

  const availableTopics = [
    'Python Basics', 'Data Structures', 'Algorithms', 'Web Development'
  ];

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const res = await axios.get('/api/quiz/analytics');
        if (res.data.status === 'success') {
          setAnalytics(res.data);
        }
      } catch (err) {
        console.error('Failed to load analytics', err);
      }
    };
    loadAnalytics();
  }, []);

  const handleLogout = async () => {
    await axios.post('/api/auth/logout');
    window.location.href = '/login';
  };

  const toggleTopic = (topic) => {
    if (selectedTopics.includes(topic)) {
      setSelectedTopics(selectedTopics.filter(t => t !== topic));
    } else {
      setSelectedTopics([...selectedTopics, topic]);
    }
  };

  const startQuiz = () => {
    // Pass the selected topics via React Router state
    navigate('/quiz', { state: { topics: selectedTopics } });
  };

  return (
    <div className="dashboard">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Welcome, {user.username}!</h1>
        <button onClick={handleLogout} style={{ backgroundColor: '#e74c3c' }}>Logout</button>
      </div>
      
      {analytics && (
        <div className="stats">
          <div className="stat-card">
            <h3>Total Quizzes</h3>
            <p>{analytics.total_attempts}</p>
          </div>
          <div className="stat-card">
            <h3>Average Score</h3>
            <p>{analytics.average_score}%</p>
          </div>
          <div className="stat-card">
            <h3>Best Score</h3>
            <p>{analytics.best_score}%</p>
          </div>
        </div>
      )}

      {/* NEW: Topic Selection UI */}
      <div className="topic-selector-container">
        <h3>Target Specific Topics (Optional)</h3>
        <p style={{fontSize: '0.9rem', color: '#7f8c8d', marginBottom: '10px'}}>
          Leave all unselected for a fully balanced adaptive quiz.
        </p>
        <div className="topic-grid">
          {availableTopics.map(topic => (
            <div 
              key={topic} 
              className={`topic-card ${selectedTopics.includes(topic) ? 'selected' : ''}`}
              onClick={() => toggleTopic(topic)}
            >
              {topic}
            </div>
          ))}
        </div>
      </div>
      
      <div style={{ marginTop: '20px', display: 'flex', gap: '15px' }}>
        <button onClick={startQuiz} style={{ padding: '15px 30px', fontSize: '1.1rem' }}>
          Start Adaptive Quiz
        </button>
        <button onClick={() => navigate('/history')} style={{ padding: '15px 30px', fontSize: '1.1rem', backgroundColor: '#95a5a6' }}>
          View History
        </button>
      </div>
    </div>
  );
}

export default Dashboard;