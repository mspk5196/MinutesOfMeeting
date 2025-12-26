import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { notificationManager } from '../utils/notificationManager';

/**
 * Handles Google OAuth callback
 * Google redirects to this page after user authenticates
 * Token is passed as URL parameter and stored in localStorage
 */
function GoogleAuthCallback({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      notificationManager.error('Google authentication failed. Please try again.');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    if (token) {
      try {
        // Store token
        localStorage.setItem('token', token);
        
        // Parse and store user data if included
        const userParam = searchParams.get('user');
        if (userParam) {
          try {
            const userData = JSON.parse(decodeURIComponent(userParam));
            localStorage.setItem('userId', JSON.stringify(userData));
            // console.log('Stored user data:', userData);
          } catch (e) {
            console.error('Could not parse user data:', e);
            // If user data parsing fails, we should still try to decode from token
          }
        } else {
          console.warn('No user data received in URL parameters');
        }
        
        notificationManager.success('Login successful!');
        
        // Trigger parent login success handler
        onLoginSuccess?.();
        
        // Redirect to dashboard
        setTimeout(() => navigate('/dashboard'), 500);
      } catch (error) {
        console.error('Error processing token:', error);
        notificationManager.error('Error processing login. Please try again.');
        setTimeout(() => navigate('/login'), 2000);
      }
    } else {
      notificationManager.error('No token received from Google. Please try again.');
      setTimeout(() => navigate('/login'), 2000);
    }
  }, [searchParams, navigate, onLoginSuccess]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#f5f5f5',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        textAlign: 'center'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #007bff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 20px'
        }}></div>
        <h2 style={{ color: '#333', marginBottom: '10px' }}>Processing Sign-In...</h2>
        <p style={{ color: '#666' }}>Please wait while we complete your authentication.</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}

export default GoogleAuthCallback;
