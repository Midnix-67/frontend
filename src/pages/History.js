import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function History({ user }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get('/api/quiz/history');
        if (res.data.status === 'success') {
          setHistory(res.data.attempts || []);
        }
      } catch (err) {
        console.error('Failed to fetch history', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', month: 'short', day: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    });
  };

  if (loading) return <div className="loader">Loading your history...</div>;

  return (
    <div className="history-page">
      <h1>Quiz History</h1>
      
      {history.length === 0 ? (
        <div className="empty-state">
          <p>You haven't taken any quizzes yet.</p>
          <button onClick={() => navigate('/quiz')}>Take Your First Quiz</button>
        </div>
      ) : (
        <div className="history-list">
          {history.map((attempt) => (
            <div key={attempt._id} className="history-card">
              <div className="history-header">
                <h3>Score: {attempt.score_percentage.toFixed(1)}%</h3>
                <span className="date">{formatDate(attempt.attempt_date)}</span>
              </div>
              <div className="history-body">
                <p><strong>Correct Answers:</strong> {attempt.correct_answers} / {attempt.total_questions}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <button className="back-btn" onClick={() => navigate('/dashboard')} style={{ backgroundColor: '#95a5a6', marginTop: '20px' }}>
        Back to Dashboard
      </button>
    </div>
  );
}

//Most important
export default History;