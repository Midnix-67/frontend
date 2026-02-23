import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// 1. Essential: Register Chart.js modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard = ({ user }) => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState({
    total_attempts: 0,
    average_score: 0,
    best_score: 0,
    recent_attempts: []
  });
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  const availableTopics = [
    'Python Basics', 
    'Data Structures', 
    'Algorithms', 
    'Web Development'
  ];

  // 2. Fetch User Analytics on Mount
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const res = await axios.get('/api/quiz/analytics');
        if (res.data.status === 'success') {
          setAnalytics(res.data);
        }
      } catch (err) {
        console.error("Dashboard data load failed:", err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  // 3. Navigation Handler (The "Start Quiz" logic)
  const startQuiz = () => {
    console.log("Navigating to Quiz with topics:", selectedTopics);
    // Passing state via React Router is the most reliable way to sync with Quiz.js
    navigate('/quiz', { state: { topics: selectedTopics } });
  };

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout');
      window.location.href = '/login';
    } catch (err) {
      window.location.href = '/login';
    }
  };

  const toggleTopic = (topic) => {
    setSelectedTopics(prev => 
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    );
  };

  // 4. Chart.js Logic
  const chartData = {
    labels: analytics.recent_attempts?.map(a => 
      new Date(a.attempt_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    ) || [],
    datasets: [{
      label: 'Performance %',
      data: analytics.recent_attempts?.map(a => a.score_percentage) || [],
      fill: true,
      backgroundColor: 'rgba(52, 152, 219, 0.1)',
      borderColor: '#3498db',
      tension: 0.4,
      pointRadius: 5,
      pointBackgroundColor: '#2980b9'
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { min: 0, max: 100, ticks: { stepSize: 20 } }
    },
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Your Learning Curve', font: { size: 16 } }
    }
  };

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Loading Dashboard...</div>;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      
      {/* Header Area */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ margin: 0, color: '#2c3e50' }}>Welcome, {user?.username || 'Learner'}!</h1>
          <p style={{ color: '#7f8c8d', marginTop: '5px' }}>Track your progress and start your next adaptive session.</p>
        </div>
        <button onClick={handleLogout} style={{ padding: '10px 20px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Logout</button>
      </div>

      {/* Analytics Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
        <div style={cardStyle}>
          <small style={{ color: '#7f8c8d', textTransform: 'uppercase' }}>Total Quizzes</small>
          <h2 style={{ margin: '10px 0 0 0', fontSize: '2rem' }}>{analytics.total_attempts}</h2>
        </div>
        <div style={cardStyle}>
          <small style={{ color: '#7f8c8d', textTransform: 'uppercase' }}>Avg. Score</small>
          <h2 style={{ margin: '10px 0 0 0', fontSize: '2rem', color: '#2980b9' }}>{analytics.average_score}%</h2>
        </div>
        <div style={cardStyle}>
          <small style={{ color: '#7f8c8d', textTransform: 'uppercase' }}>Best Performance</small>
          <h2 style={{ margin: '10px 0 0 0', fontSize: '2rem', color: '#27ae60' }}>{analytics.best_score}%</h2>
        </div>
      </div>

      {/* Learning Curve Chart */}
      <div style={{ ...cardStyle, height: '350px', marginBottom: '40px' }}>
        {analytics.recent_attempts.length > 0 ? (
          <Line data={chartData} options={chartOptions} />
        ) : (
          <div style={{ textAlign: 'center', paddingTop: '100px', color: '#bdc3c7' }}>No data yet. Complete your first quiz to see your trend!</div>
        )}
      </div>

      {/* Topic Selection */}
      <div style={{ marginBottom: '40px' }}>
        <h3 style={{ marginBottom: '15px' }}>Custom Study Plan <span style={{ fontWeight: 'normal', fontSize: '0.9rem', color: '#7f8c8d' }}>(Select topics to focus on)</span></h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {availableTopics.map(topic => (
            <div 
              key={topic}
              onClick={() => toggleTopic(topic)}
              style={{
                padding: '12px 20px',
                borderRadius: '30px',
                border: `2px solid ${selectedTopics.includes(topic) ? '#3498db' : '#ecf0f1'}`,
                backgroundColor: selectedTopics.includes(topic) ? '#ebf5fb' : 'white',
                color: selectedTopics.includes(topic) ? '#3498db' : '#34495e',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: '0.2s'
              }}
            >
              {topic} {selectedTopics.includes(topic) && '✓'}
            </div>
          ))}
        </div>
      </div>

      {/* Action Footer */}
      <div style={{ display: 'flex', gap: '15px', borderTop: '1px solid #eee', paddingTop: '30px' }}>
        <button 
          onClick={startQuiz}
          style={{ 
            flex: 2, padding: '18px', backgroundColor: '#3498db', color: 'white', 
            border: 'none', borderRadius: '10px', fontSize: '1.2rem', fontWeight: 'bold', 
            cursor: 'pointer', boxShadow: '0 4px 15px rgba(52, 152, 219, 0.3)' 
          }}
        >
          🚀 Start Adaptive Quiz
        </button>
        <button 
          onClick={() => navigate('/history')}
          style={{ 
            flex: 1, padding: '18px', backgroundColor: '#95a5a6', color: 'white', 
            border: 'none', borderRadius: '10px', fontSize: '1.1rem', cursor: 'pointer' 
          }}
        >
          View History
        </button>
      </div>
    </div>
  );
};

const cardStyle = {
  backgroundColor: 'white',
  padding: '20px',
  borderRadius: '12px',
  boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
  border: '1px solid #f1f1f1'
};

export default Dashboard;