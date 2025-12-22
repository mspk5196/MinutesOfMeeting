# Google Sign-In Implementation Guide

## Overview
Implement Google OAuth 2.0 authentication with your existing app using Google's OAuth strategy.

---

## Step 1: Google Cloud Setup (Required)

### 1.1 Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click **Create Project**
3. Name it (e.g., "BIT Meetings")
4. Click **Create**

### 1.2 Enable Google+ API
1. In Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for "Google+ API"
3. Click it and press **Enable**

### 1.3 Create OAuth 2.0 Credentials
1. Go to **APIs & Services** → **Credentials**
2. Click **+ Create Credentials** → **OAuth client ID**
3. If prompted, configure the OAuth consent screen first:
   - User type: **External**
   - Fill in app name: "BIT Meetings"
   - User support email: your-email@example.com
   - Add scopes: `email`, `profile`
   - Add test users if needed
4. For OAuth 2.0 credentials:
   - Application type: **Web application**
   - Name: "BIT Meetings Web Client"
   - Authorized JavaScript origins:
     - `http://localhost:5173` (Vite dev)
     - `http://localhost:3000` (if using)
     - `http://localhost:5000` (backend)
   - Authorized redirect URIs:
     - `http://localhost:5000/auth/google/callback`
5. Click **Create**
6. Copy the **Client ID** and **Client Secret**

---

## Step 2: Backend Setup

### 2.1 Install Required Packages
```bash
cd backend
npm install passport passport-google-oauth20 jsonwebtoken dotenv
```

### 2.2 Update .env File
```env
# .env
GOOGLE_CLIENT_ID=your-client-id-from-google-cloud.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-from-google-cloud
JWT_SECRET=your-jwt-secret-key-here
CLIENT_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000
```

### 2.3 Update Passport Configuration
Your backend/config/passport.js looks good, but ensure it's complete:

```javascript
// backend/config/passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('./db');
require('dotenv').config();

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async(id, done) => {
    try {
        const [users] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
        done(null, users[0]);
    } catch (error) {
        done(error, null);
    }
});

passport.use(
    new GoogleStrategy({
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: `${process.env.BACKEND_URL}/auth/google/callback`,
            passReqToCallback: true,
        },
        async(req, accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails[0].value;
                const name = profile.displayName;
                const googleId = profile.id;

                // Check if user exists
                const [existingUsers] = await db.query(
                    'SELECT * FROM users WHERE email = ? OR google_id = ?', 
                    [email, googleId]
                );

                if (existingUsers.length > 0) {
                    const user = existingUsers[0];
                    // Update user with Google ID if missing
                    await db.query(
                        'UPDATE users SET name = ?, google_id = ?, auth_type = ? WHERE id = ?',
                        [name, googleId, 'google', user.id]
                    );
                    return done(null, user);
                }

                // Create new user
                const [result] = await db.query(
                    'INSERT INTO users (name, email, google_id, auth_type) VALUES (?, ?, ?, ?)',
                    [name, email, googleId, 'google']
                );

                const newUser = {
                    id: result.insertId,
                    name,
                    email,
                    google_id: googleId,
                    auth_type: 'google'
                };

                return done(null, newUser);
            } catch (error) {
                return done(error, null);
            }
        }
    )
);

module.exports = passport;
```

### 2.4 Update server.js
```javascript
// backend/server.js
const express = require('express');
const passport = require('passport');
const session = require('express-session');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}));

app.use(express.json());

// Session setup (required for passport)
app.use(session({
    secret: process.env.JWT_SECRET || 'session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // Set to true in production with HTTPS
        httpOnly: true 
    }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Import passport config
require('./config/passport');

// Routes
app.use('/auth', require('./routes/authRoutes'));
// ... other routes

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

### 2.5 Install express-session if needed
```bash
npm install express-session
```

---

## Step 3: Frontend Setup

### 3.1 Install Google Login Library
```bash
cd src
npm install @react-oauth/google
# OR
npm install @google/identity
```

### 3.2 Create useNotification Hook (if not using the toast system)
If you haven't already implemented the toast notification system from Issue #19:
```jsx
import { notificationManager } from '../utils/notificationManager';

const notify = notificationManager;
notify.error('message');
notify.success('message');
```

### 3.3 Update LoginPage.jsx
Replace the Google button with functional implementation:

```jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationManager } from '../utils/notificationManager';
import '../styles/LoginPage.css';
import backgroundImg from '../assets/Frame 1597881298.png';
import logo from '../assets/Logo.svg';
import googleIcon from '../assets/google.png';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { api } from '../utils/apiClient';
import { useSubmitGuard } from '../hooks/useSubmitGuard';

const LoginPage = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const { isSubmitting, executeSubmit } = useSubmitGuard(2000);

  // Email/Password Login
  const handleSubmit = executeSubmit(async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      const response = await api.post('/api/meetings/login', { email, password });
      
      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userId', JSON.stringify(response.data.user));
        notificationManager.success('Login successful!');
        onLoginSuccess();
      } else {
        setErrorMessage('Login failed: No token received');
      }
    } catch (error) {
      const apiMessage = error?.response?.data?.message;
      setErrorMessage(apiMessage || 'Login failed. Please check your credentials.');
      notificationManager.error(error);
    } finally {
      setIsLoading(false);
    }
  });

  // Google Login Handler
  const handleGoogleLogin = () => {
    setIsLoading(true);
    setErrorMessage('');
    
    // Redirect to backend Google OAuth endpoint
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/google`;
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
          
          {/* Google Login Button */}
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

          {/* Email/Password Form */}
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
            <button 
              type="submit" 
              className="login-page-btn" 
              disabled={isLoading || isSubmitting}
            >
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
```

### 3.4 Handle Google OAuth Callback
Create a component to handle the redirect after Google login:

```jsx
// src/pages/GoogleAuthCallback.jsx
import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { notificationManager } from '../utils/notificationManager';

function GoogleAuthCallback({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      notificationManager.error('Google authentication failed. Please try again.');
      navigate('/login');
      return;
    }

    if (token) {
      // Store token and redirect
      localStorage.setItem('token', token);
      notificationManager.success('Login successful!');
      onLoginSuccess();
      navigate('/dashboard');
    } else {
      notificationManager.error('No token received from Google. Please try again.');
      navigate('/login');
    }
  }, [searchParams, navigate, onLoginSuccess]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontSize: '18px'
    }}>
      Processing Google Sign-In...
    </div>
  );
}

export default GoogleAuthCallback;
```

### 3.5 Update App.jsx Routes
Add the callback route:

```jsx
// In your App.jsx routes
<Route path="/auth/callback" element={<GoogleAuthCallback onLoginSuccess={handleLoginSuccess} />} />
```

---

## Step 4: Database Schema Update

Ensure your users table has Google ID field:

```sql
ALTER TABLE users ADD COLUMN google_id VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN auth_type ENUM('email', 'google') DEFAULT 'email';
```

---

## Step 5: Environment Variables

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:5000
```

### Backend (.env)
```env
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
JWT_SECRET=your-jwt-secret-here
CLIENT_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your-password
DB_NAME=bitmeeting_db
```

---

## Step 6: Testing

### 6.1 Start Backend
```bash
cd backend
npm run dev
```

### 6.2 Start Frontend
```bash
cd src
npm run dev
```

### 6.3 Test Flow
1. Navigate to login page
2. Click "Login with Google"
3. Sign in with your Google account
4. You should be redirected to dashboard with token

---

## Troubleshooting

### Issue: "Invalid Client" Error
**Solution:** Check that Client ID and Secret are correctly set in .env

### Issue: Redirect URI Mismatch
**Solution:** Ensure callback URL matches exactly:
- Google Console: `http://localhost:5000/auth/google/callback`
- Code: Same URL in authRoutes.js

### Issue: Token Not Working
**Solution:** 
- Check JWT_SECRET is same in backend
- Verify token is being stored in localStorage
- Check token expiration (default 24h)

### Issue: CORS Errors
**Solution:** Update cors in server.js:
```javascript
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
}));
```

---

## Advanced: Add Logout Google Session

```javascript
// In your Logout component
const handleGoogleLogout = async () => {
  try {
    // Clear local auth
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    
    // Sign out from Google if using Google Sign-In library
    if (window.gapi) {
      window.gapi.auth2.getAuthInstance().signOut();
    }
    
    notificationManager.success('Logged out successfully');
    navigate('/login');
  } catch (error) {
    notificationManager.error('Error logging out');
  }
};
```

---

## Production Considerations

1. **Change callback URL:**
   - Development: `http://localhost:5000/auth/google/callback`
   - Production: `https://your-domain.com/auth/google/callback`

2. **Set secure cookies:**
   ```javascript
   cookie: { 
       secure: true,  // Only send over HTTPS
       httpOnly: true,
       sameSite: 'lax'
   }
   ```

3. **Use HTTPS** for production

4. **Update VITE_API_BASE_URL** to production URL

---

That's it! Your Google Sign-In is now ready. The flow is:
1. User clicks "Login with Google"
2. Redirected to Google OAuth consent screen
3. User authorizes
4. Backend creates/updates user in DB
5. Backend generates JWT token
6. Frontend stores token and redirects to dashboard
7. User is logged in!
