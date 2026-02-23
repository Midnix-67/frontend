import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';

// Import Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Quiz from './pages/Quiz';
import Results from './pages/Results';
import History from './pages/History';

import './App.css';

// Configure Axios to talk to Flask
axios.defaults.baseURL = 'http://localhost:5000';
axios.defaults.withCredentials = true;

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const res = await axios.get('/api/auth/check-session');
      if (res.data.authenticated) {
        setUser(res.data.user);
      }
    } catch (err) {
      console.error('Session check failed', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loader">Loading...</div>;

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <Login setUser={setUser} /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!user ? <Register setUser={setUser} /> : <Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} />
        <Route path="/quiz" element={user ? <Quiz user={user} /> : <Navigate to="/login" />} />
        <Route path="/results" element={user ? <Results /> : <Navigate to="/login" />} />
        <Route path="/history" element={user ? <History user={user} /> : <Navigate to="/login" />} />
        <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
      </Routes>
    </Router>
  );
}

export default App;