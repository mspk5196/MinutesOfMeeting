import React, { useState, useEffect } from 'react';
import { PrimeReactProvider } from 'primereact/api';
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import './App.css';
import Sidebar from './pages/Sidebar';
import Logout from './components/Logout';
import Dashboard from './pages/Dashboard';
import CreateMeeting from './pages/CreateMeeting';
import LoginPage from './pages/LoginPage';
import GoogleAuthCallback from './pages/GoogleAuthCallback';
import MeetingPage from './pages/MeetingPage';
import Database from './pages/Database';
import Template from './pages/Template';
import Template1 from "./components/template1";
import Reports from './pages/Reports';
import Calendar from './components/Calendar';
import Cmeeting from './components/template1';
import JoinMeet from './pages/Joinmeet';
import AdminChooser from './components/AdminChooser';
import EditPoint from './pages/EditPoints';
import MeetingReportView from './pages/MeetingReportView';
import SessionManager from './components/SessionManager';
import ErrorBoundary from './components/ErrorBoundary';
import ErrorBoundaryTest from './components/ErrorBoundaryTest';
import Toast from './components/Toast';
import { validateAndClearExpiredToken } from './utils/tokenValidation';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingToken, setIsCheckingToken] = useState(true);

  // Validate token on app start - check if expired
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    // Check if token exists and is not expired
    if (token && validateAndClearExpiredToken(token)) {
      // Token is valid, restore auth state
      setIsAuthenticated(true);
      try {
        // set axios default Authorization header so subsequent requests include the token
        // eslint-disable-next-line global-require
        const axios = require('axios');
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (err) {
        // ignore if axios can't be required here
      }
    } else {
      // Token is expired or doesn't exist, clear auth state
      setIsAuthenticated(false);
    }
    
    // Finished checking token
    setIsCheckingToken(false);
  }, []);

  const handleLoginSuccess = () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // eslint-disable-next-line global-require
        const axios = require('axios');
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (err) {
        // ignore
      }
    }
    setIsAuthenticated(true);
  };

  const value = {
    ripple: true,
    inputStyle: 'outlined',
    appendTo: 'self',
    pt: {
      button: {
        root: { className: 'p-button' }
      }
    }
  };

  return (
    <PrimeReactProvider value={value}>
      <Router basename='/meetings'>
        <Toast />
        <div className="App">
          {isCheckingToken ? (
            // Show loading state while checking token
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100vh',
              backgroundColor: '#f5f5f5'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  width: 40, 
                  height: 40, 
                  border: '4px solid #f3f3f3',
                  borderTop: '4px solid #007bff',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 20px'
                }}></div>
                <p style={{ color: '#666', fontSize: '16px' }}>Loading...</p>
                <style>{`
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                `}</style>
              </div>
            </div>
          ) : isAuthenticated ? (
            <>
              <SessionManager onLogout={() => setIsAuthenticated(false)} />
              <Sidebar className="sidebar" />
              <div className="main-content">
                <ErrorBoundary>
                  <Routes>
                    <Route path='/reportview' element={<MeetingReportView />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/create-meeting" element={<CreateMeeting />} />
                    <Route path="/admin-access" element={<AdminChooser />} />
                    <Route path="/meeting" element={< JoinMeet />} />
                    <Route path="/meetingadmin" element={< MeetingPage />} />
                    <Route path="/database" element={<Database />} />
                    <Route path="/template" element={<Template />} />
                    <Route path="/template/edit/:templateId" element={<Template />} />
                    <Route path="/template1" element={<Template1 />} />
                    <Route path="/cmeeting" element={<Cmeeting />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/logout" element={<Logout />} />
                    <Route path="/test-error-boundary" element={<ErrorBoundaryTest />} />
                    <Route path='/calendar' element={<Calendar />} />
                    <Route path='/editpoints' element={<EditPoint />} />
                    <Route path='/reports/:id' element={<MeetingReportView />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </ErrorBoundary>
              </div>
            </>
          ) : (
            <Routes>
              <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
              <Route path="/auth/callback" element={<GoogleAuthCallback onLoginSuccess={handleLoginSuccess} />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          )}
        </div>
      </Router>
    </PrimeReactProvider>
  );
}

export default App;
