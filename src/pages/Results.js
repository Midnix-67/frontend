import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function Results() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const results = state?.data;

  if (!results) return <div>No data found.</div>;

  return (
    <div className="results-container expanded">
      <h1>Quiz Complete!</h1>
      <div className="score-circle">
        <h2>{results.score}%</h2>
        <p>{results.correct} / {results.total} Correct</p>
      </div>

      <div className="analysis">
        <h3>Performance by Topic</h3>
        {results.topic_performance.map(tp => (
          <div key={tp.topic} className="stat-row">
            <span>{tp.topic}:</span>
            <div className="bar-bg"><div className="bar-fill" style={{width: `${tp.accuracy}%`}}></div></div>
            <span>{tp.accuracy}%</span>
          </div>
        ))}
      </div>

      <div className="recommendation-box">
        <h4>AI Recommendation:</h4>
        <p>{results.recommendation}</p>
      </div>

      {/* NEW: Detailed AI Review Section */}
      <div className="detailed-review">
        <h3>🧠 Detailed AI Review</h3>
        <p className="review-subtitle">Review your answers and learn from the AI explanations below.</p>
        
        {results.question_results.map((q, idx) => {
          // Safely get the text of the selected and correct options
          const selectedText = q.options && q.options[q.selected_answer] ? q.options[q.selected_answer] : "No Answer";
          const correctText = q.options && q.options[q.correct_answer] ? q.options[q.correct_answer] : "Unknown";

          return (
            <div key={idx} className={`review-card ${q.is_correct ? 'correct' : 'incorrect'}`}>
              <div className="review-header">
                <span className="q-number">Q{idx + 1}</span>
                <span className="q-topic">{q.topic} ({q.difficulty})</span>
              </div>
              
              <h4 className="q-text">{q.question}</h4>
              
              <div className="answer-comparison">
                <p className={`your-answer ${q.is_correct ? 'text-green' : 'text-red'}`}>
                  <strong>Your Answer:</strong> {selectedText} {q.is_correct ? ' ✅' : ' ❌'}
                </p>
                
                {!q.is_correct && (
                  <p className="correct-answer">
                    <strong>Correct Answer:</strong> {correctText}
                  </p>
                )}
              </div>
              
              <div className="explanation-box">
                <strong>💡 Why?</strong> {q.explanation}
              </div>
            </div>
          );
        })}
      </div>

      <button className="dashboard-btn" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
    </div>
  );
}

export default Results;