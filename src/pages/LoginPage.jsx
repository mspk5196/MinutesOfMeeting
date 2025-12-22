import React, { useState } from 'react';
import '../styles/LoginPage.css';
import backgroundImg from '../assets/Frame 1597881298.png';
import logo from '../assets/Logo.svg';
import googleIcon from '../assets/google.png';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { api } from '../utils/apiClient';
import { notificationManager } from '../utils/notificationManager';
import { useSubmitGuard } from '../hooks/useSubmitGuard';

const LoginPage = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { isSubmitting, executeSubmit } = useSubmitGuard(2000);

  const handleSubmit = executeSubmit(async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      const response = await api.post('/api/meetings/login', { email, password });
      
      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
        try { api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`; } catch {}
        localStorage.setItem('userId', JSON.stringify(response.data.user));
        notificationManager.success('Login successful!');
        onLoginSuccess();
      } else {
        setErrorMessage('Login failed: No token received');
      }
    } catch (error) {
      const apiMessage = error?.response?.data?.message;
      const message = apiMessage || 'Login failed. Please check your email and password and try again.';
      setErrorMessage(message);
      notificationManager.error(error);
    } finally {
      setIsLoading(false);
    }
  });

  // Google Sign-In Handler
  const handleGoogleLogin = () => {
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      window.location.href = `${backendUrl}/auth/google`;
    } catch (error) {
      notificationManager.error('Failed to initiate Google sign-in');
      setIsLoading(false);
    }
  };

  const handleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-page-container">
      <div className="login-page-section">
        <div className="login-page-logo">
          <img src={logo} alt="Meets" className="login-page-meets-logo" />
          <span className="login-page-logo-text login-page-roboto-variable">Meets</span>
        </div>

        <div className="login-page-form-container">
          <h1 className="login-page-title login-page-roboto-variable">Login</h1>
          <p className="login-page-subtitle login-page-roboto-variable">
            Enter your credentials to access your account.
          </p>  
          {errorMessage && (
            <div
              role="alert"
              aria-live="assertive"
              style={{
                marginTop: 8,
                marginBottom: 12,
                padding: '10px 12px',
                borderRadius: 6,
                background: '#fdecea',
                color: '#611a15',
                border: '1px solid #f5c6cb',
                fontSize: 14
              }}
            >
              {errorMessage}
            </div>
          )}
          <button 
            type="button"
            className="login-page-google-btn" 
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            <img src={googleIcon} alt="Google" className="login-page-google-icon" />
            {isLoading ? 'Signing in...' : 'Login with Google'}
          </button>
          <div className="login-page-divider">
            <hr className="login-page-divider-line" />
            <span className="login-page-divider-text">Or</span>
            <hr className="login-page-divider-line" />
          </div>
          <form onSubmit={handleSubmit}>
            <div className="login-page-form-group">
              <label htmlFor="email" className="login-page-label">Email address</label>
              <input
                type="email"
                id="email"
                placeholder="email@domain.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (errorMessage) setErrorMessage(''); }}
                required
                className="login-page-input"
              />
            </div>
            <div className="login-page-form-group">
              <div className="login-page-password-header">
                <label htmlFor="password" className="login-page-label">Password</label>
                <a href="/forgot-password" className="login-page-forgot-link">Forgot Password?</a>
              </div>
              <div className="login-page-password-container">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (errorMessage) setErrorMessage(''); }}
                  required
                  className="login-page-input"
                />
                <button
                  type="button"
                  onClick={handleShowPassword}
                  className="login-page-show-password-btn"
                >
                  {showPassword ? <FaEye size={16} color="black" /> : <FaEyeSlash size={16} color="black" />}
                </button>
              </div>
            </div>
            <button type="submit" className="login-page-btn" disabled={isLoading || isSubmitting}>
              {isLoading || isSubmitting ? 'Loading...' : 'Login'}
            </button>
          </form>
        </div>

      </div>
      <div className="login-page-right-section">
        <img src={backgroundImg} alt="Background" />
      </div>
    </div>
  );
};

export default LoginPage;
