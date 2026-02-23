import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Radar, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  ArcElement
);

function Results() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const results = state?.data;

  if (!results) return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h2>No data found.</h2>
      <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
    </div>
  );

  // --- Chart Data Configurations ---

  // 1. Doughnut Chart for Overall Score
  const scoreData = {
    labels: ['Correct', 'Incorrect'],
    datasets: [{
      data: [results.correct, results.total - results.correct],
      backgroundColor: ['#4caf50', '#eeeeee'],
      borderWidth: 0,
    }]
  };

  // 2. Radar Chart for Topic Mastery
  const topicLabels = results.topic_performance.map(tp => tp.topic);
  const topicScores = results.topic_performance.map(tp => tp.accuracy);

  const radarData = {
    labels: topicLabels,
    datasets: [{
      label: 'Mastery %',
      data: topicScores,
      backgroundColor: 'rgba(52, 152, 219, 0.2)',
      borderColor: 'rgba(52, 152, 219, 1)',
      borderWidth: 2,
      pointBackgroundColor: 'rgba(52, 152, 219, 1)',
    }]
  };

  const radarOptions = {
    scales: {
      r: {
        angleLines: { display: true },
        suggestedMin: 0,
        suggestedMax: 100
      }
    },
    plugins: { legend: { display: false } }
  };

  return (
    <div className="results-container" style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ textAlign: 'center', color: '#2c3e50' }}>Quiz Complete!</h1>

      {/* Top Section: Visual Summary */}
      <div className="summary-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', margin: '30px 0' }}>
        
        {/* Score Circle Card */}
        <div className="card" style={{ textAlign: 'center', padding: '20px', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <h3>Overall Score</h3>
          <div style={{ height: '180px', position: 'relative' }}>
            <Doughnut data={scoreData} options={{ cutout: '70%', plugins: { legend: { display: false } } }} />
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
              <h2 style={{ margin: 0, fontSize: '2rem' }}>{results.score}%</h2>
            </div>
          </div>
          <p style={{ marginTop: '10px', color: '#7f8c8d' }}>{results.correct} / {results.total} Correct</p>
        </div>

        {/* Radar Mastery Card */}
        <div className="card" style={{ padding: '20px', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <h3 style={{ textAlign: 'center' }}>Topic Mastery</h3>
          <div style={{ height: '220px' }}>
            <Radar data={radarData} options={radarOptions} />
          </div>
        </div>
      </div>

      {/* Recommendation Box */}
      <div className="recommendation-box" style={{ background: '#ebf5fb', padding: '20px', borderRadius: '12px', borderLeft: '5px solid #3498db', marginBottom: '30px' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#2980b9' }}>🤖 AI Recommendation:</h4>
        <p style={{ margin: 0, fontSize: '1.1rem' }}>{results.recommendation}</p>
      </div>

      {/* Detailed AI Review Section */}
      <div className="detailed-review">
        <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px' }}>🧠 Detailed AI Review</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
          {results.question_results.map((q, idx) => (
            <div key={idx} className="review-card" style={{ padding: '20px', borderRadius: '10px', background: q.is_correct ? '#f1fcf1' : '#fff5f5', border: `1px solid ${q.is_correct ? '#c3e6cb' : '#f5c6cb'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.85rem', color: '#666' }}>
                <span>QUESTION {idx + 1}</span>
                <span style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>{q.topic} • {q.difficulty}</span>
              </div>
              
              <h4 style={{ margin: '0 0 15px 0', fontSize: '1.1rem' }}>{q.question}</h4>
              
              <div className="answers" style={{ marginBottom: '15px' }}>
                <p style={{ margin: '5px 0', color: q.is_correct ? '#2ecc71' : '#e74c3c', fontWeight: 'bold' }}>
                  Your Answer: {q.selected_answer} {q.is_correct ? '✅' : '❌'}
                </p>
                {!q.is_correct && (
                  <p style={{ margin: '5px 0', color: '#2c3e50' }}>
                    <strong>Correct Answer:</strong> {q.correct_answer}
                  </p>
                )}
              </div>
              
              <div style={{ fontSize: '0.95rem', fontStyle: 'italic', color: '#555', background: 'rgba(255,255,255,0.5)', padding: '10px', borderRadius: '5px' }}>
                <strong>💡 Explanation:</strong> {q.explanation || "The AI selected this difficulty based on your previous performance and the topic's complexity."}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button 
        onClick={() => navigate('/dashboard')} 
        style={{ display: 'block', width: '100%', padding: '15px', marginTop: '40px', backgroundColor: '#34495e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1.1rem' }}
      >
        Back to Dashboard
      </button>
    </div>
  );
}

export default Results;