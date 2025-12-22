# Google Sign-In Implementation (Without Passport) ✅

## ✅ What I've Done

I've implemented Google OAuth 2.0 authentication **WITHOUT passport** using Google's official `google-auth-library` package (already in your dependencies).

---

## 📦 Changed Files

### Backend:
1. **backend/b2.js** - Removed passport and session middleware, simplified to direct OAuth
2. **backend/routes/authRoutes.js** - Replaced passport with `OAuth2Client` from google-auth-library
3. **backend/.env.example** - Created template for your environment variables

### Frontend (Already done):
1. **src/pages/LoginPage.jsx** - Google button handler
2. **src/pages/GoogleAuthCallback.jsx** - Callback handler
3. **src/App.jsx** - Added callback route

---

## 🚀 How It Works (Simple Flow)

```
1. User clicks "Login with Google"
   ↓
2. Frontend redirects to: /auth/google
   ↓
3. Backend generates Google OAuth URL and redirects user
   ↓
4. User signs in with Google
   ↓
5. Google redirects to: /auth/google/callback?code=xxx
   ↓
6. Backend exchanges code for user info
   ↓
7. Backend creates/updates user in database
   ↓
8. Backend generates JWT token
   ↓
9. Backend redirects to: http://localhost:5173/auth/callback?token=xxx
   ↓
10. Frontend saves token and redirects to dashboard
    ↓
11. User is logged in! ✅
```

---

## ⚙️ Setup Steps (What You Need to Do)

### Step 1: Get Google Credentials (15 minutes)

1. **Go to Google Cloud Console:**
   - https://console.cloud.google.com

2. **Create a new project:**
   - Click "Select a project" → "New Project"
   - Name: "BIT Meetings"
   - Click "Create"

3. **Enable Google+ API:**
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click and press "Enable"

4. **Configure OAuth Consent Screen:**
   - Go to "APIs & Services" → "OAuth consent screen"
   - User Type: **External**
   - Fill in:
     - App name: `BIT Meetings`
     - User support email: your-email@example.com
     - Developer contact: your-email@example.com
   - Add scopes:
     - Click "Add or Remove Scopes"
     - Select: `.../auth/userinfo.email` and `.../auth/userinfo.profile`
     - Save
   - Add test users (your email) if needed
   - Click "Save and Continue"

5. **Create OAuth 2.0 Credentials:**
   - Go to "APIs & Services" → "Credentials"
   - Click "+ Create Credentials" → "OAuth client ID"
   - Application type: **Web application**
   - Name: `BIT Meetings Web`
   - **Authorized JavaScript origins:**
     ```
     http://localhost:5173
     http://localhost:5000
     ```
   - **Authorized redirect URIs:**
     ```
     http://localhost:5000/auth/google/callback
     ```
   - Click "Create"
   - **COPY the Client ID and Client Secret!**

---

### Step 2: Update Backend .env File (2 minutes)

Create `backend/.env` file (copy from .env.example):

```env
# Paste your Google credentials here
GOOGLE_CLIENT_ID=123456789-abc...xyz.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc...xyz

# JWT Secret
JWT_SECRET=bitmeeting_jwt_secret_2025

# URLs
CLIENT_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000
PORT=5000

# Your database config
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your-password
DB_NAME=bitmeeting_db
```

---

### Step 3: Update Database Schema (1 minute)

Run this SQL in your database:

```sql
-- Add Google ID column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;

-- Add auth type column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_type ENUM('email', 'google') DEFAULT 'email';
```

Or if that doesn't work:

```sql
-- Check if columns exist first
ALTER TABLE users ADD COLUMN google_id VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN auth_type ENUM('email', 'google') DEFAULT 'email';
```

---

### Step 4: Start Servers (1 minute)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

You should see:
```
Server running on port 5000
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

You should see:
```
VITE ready at http://localhost:5173
```

---

### Step 5: Test It! (1 minute)

1. Open browser: `http://localhost:5173/login`
2. Click **"Login with Google"**
3. Google consent screen appears
4. Select your Google account
5. Grant permissions
6. You're redirected back and logged in!
7. Check if you're on the dashboard ✅

---

## 🔍 Troubleshooting

### "redirect_uri_mismatch" Error
**Problem:** The redirect URI doesn't match Google Console settings

**Solution:**
- In Google Cloud Console, ensure redirect URI is EXACTLY:
  ```
  http://localhost:5000/auth/google/callback
  ```
- No trailing slash, exact port number

### "invalid_client" Error
**Problem:** Client ID or Secret is wrong

**Solution:**
- Double-check your `.env` file
- Copy-paste credentials again from Google Console
- Restart backend server

### Token Not Saving
**Problem:** User redirected but not logged in

**Solution:**
- Check browser console for errors
- Verify JWT_SECRET is set in `.env`
- Check localStorage in browser DevTools

### Database Errors
**Problem:** User not created

**Solution:**
- Ensure database is running
- Check `google_id` and `auth_type` columns exist
- Check database credentials in `.env`

---

## 🎯 Key Differences from Passport Version

| Aspect | With Passport | Without Passport (Current) |
|--------|---------------|---------------------------|
| **Dependencies** | passport, passport-google-oauth20, express-session | google-auth-library (already installed) |
| **Complexity** | Medium (strategies, sessions) | Simple (direct OAuth2Client) |
| **Session Management** | Required | Not needed |
| **Code Lines** | More boilerplate | Less code |
| **Flexibility** | Works with multiple auth methods | Direct Google integration |
| **Maintenance** | More dependencies | Fewer dependencies |

---

## 📝 What Each File Does

### Backend Files:

**b2.js (Main Server)**
- Removed passport and session middleware
- Simplified CORS setup
- Routes still work the same way

**authRoutes.js (OAuth Routes)**
- `/auth/google` - Generates Google OAuth URL and redirects
- `/auth/google/callback` - Receives code from Google, exchanges for user info, creates JWT, redirects to frontend
- `/auth/google/verify` - Alternative: verify Google token directly from frontend (not used currently)

### Frontend Files:

**LoginPage.jsx**
- `handleGoogleLogin()` - Redirects to `/auth/google`
- Google button triggers this function

**GoogleAuthCallback.jsx**
- Extracts token from URL parameter
- Saves to localStorage
- Redirects to dashboard

**App.jsx**
- Route `/auth/callback` uses GoogleAuthCallback component

---

## ✅ Complete Checklist

Before testing, ensure:

- [ ] Google Cloud project created
- [ ] OAuth credentials created
- [ ] Redirect URI configured: `http://localhost:5000/auth/google/callback`
- [ ] Client ID and Secret copied to `backend/.env`
- [ ] Database has `google_id` and `auth_type` columns
- [ ] Backend server is running on port 5000
- [ ] Frontend is running on port 5173
- [ ] Both servers show no errors

Then test:
- [ ] Click "Login with Google" button
- [ ] Google consent screen appears
- [ ] After approving, redirected to dashboard
- [ ] User is logged in

---

## 🎉 That's It!

You now have a **simple, passport-free Google OAuth implementation**. 

Just get your Google credentials and test it out! 🚀

**Next:** Copy `.env.example` to `.env` and fill in your Google credentials.
