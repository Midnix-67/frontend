import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function History() {
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

  const handleReview = async (attemptId) => {
    try {
      const res = await axios.get(`/api/quiz/attempt/${attemptId}`);
      // Navigate to results page using the historical data
      navigate('/results', { state: { data: res.data } });
    } catch (err) {
      alert("Could not load details for this attempt.");
    }
  };

  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleDateString(undefined, { 
      year: 'numeric', month: 'short', day: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    });
  };

  if (loading) return <div className="loader">Loading your history...</div>;

  return (
    <div className="history-page" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ textAlign: 'center', color: '#2c3e50' }}>Quiz History</h1>
      
      {history.length === 0 ? (
        <div className="empty-state" style={{ textAlign: 'center', marginTop: '50px' }}>
          <p>You haven't taken any quizzes yet.</p>
          <button onClick={() => navigate('/quiz')} style={{ padding: '10px 20px', background: '#3498db', color: 'white', border: 'none', borderRadius: '5px' }}>
            Take Your First Quiz
          </button>
        </div>
      ) : (
        <div className="history-list" style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '30px' }}>
          {history.map((attempt) => (
            <div key={attempt._id} className="history-card" style={{ padding: '20px', background: '#fff', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="history-info">
                <h3 style={{ margin: '0 0 5px 0' }}>Score: {attempt.score_percentage.toFixed(1)}%</h3>
                <p style={{ margin: 0, color: '#7f8c8d', fontSize: '0.9rem' }}>{formatDate(attempt.attempt_date)}</p>
                <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem' }}>{attempt.correct_answers} / {attempt.total_questions} Correct</p>
              </div>
              <button 
                onClick={() => handleReview(attempt._id)} 
                style={{ padding: '8px 16px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
              >
                Review AI Analysis
              </button>
            </div>
          ))}
        </div>
      )}
      
      <button 
        className="back-btn" 
        onClick={() => navigate('/dashboard')} 
        style={{ width: '100%', padding: '12px', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '5px', marginTop: '30px', cursor: 'pointer' }}
      >
        Back to Dashboard
      </button>
    </div>
  );
}

export default History;