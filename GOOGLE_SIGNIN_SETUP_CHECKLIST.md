# Google Sign-In Setup Checklist (No Passport)

## ✅ Frontend Implementation (DONE)

- ✅ LoginPage.jsx updated with handleGoogleLogin function
- ✅ Google button now redirects to backend OAuth endpoint
- ✅ GoogleAuthCallback.jsx component created
- ✅ Callback route added to App.jsx (/auth/callback)
- ✅ Notifications integrated for success/error states

**Frontend Status:** Ready for backend integration

---

## ✅ Backend Setup (DONE - No Passport!)

### 1. Already Installed Dependencies ✅
```bash
# google-auth-library is already in your package.json
# No need to install passport!
```

### 2. Create/Update .env File
```env
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id-from-google-cloud.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret-from-google-cloud
JWT_SECRET=your-jwt-secret-key-here-use-strong-random-string

# URLs
CLIENT_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000

# Database (if not already set)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your-password
DB_NAME=bitmeeting_db
```

### 3. Backend Files Updated ✅
- ✅ b2.js - Removed passport, simplified CORS
- ✅ authRoutes.js - Using google-auth-library instead of passport
- ✅ Simple OAuth flow without sessions

### 6. Database Schema
Ensure your users table has:
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_type ENUM('email', 'google') DEFAULT 'email';
```

---

## 🔐 Google Cloud Setup (Required)

### Step 1: Create Project
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project named "BIT Meetings"

### Step 2: Enable APIs
1. Navigate to APIs & Services → Library
2. Search and enable "Google+ API"

### Step 3: Create OAuth Credentials
1. Go to APIs & Services → Credentials
2. Click "+ Create Credentials" → "OAuth client ID"
3. Configure OAuth consent screen:
   - User type: External
   - App name: BIT Meetings
   - Add required scopes: email, profile
4. For OAuth 2.0 credentials:
   - Type: Web application
   - **Authorized JavaScript origins:**
     - `http://localhost:5173`
     - `http://localhost:5000`
   - **Authorized redirect URIs:**
     - `http://localhost:5000/auth/google/callback`
5. Copy Client ID and Client Secret → Save to backend/.env

---

## 🧪 Testing Flow

### 1. Update .env First!
Create `backend/.env` with your Google credentials:
```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-secret
JWT_SECRET=bitmeeting_secret_2025
CLIENT_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000
```

### 2. Start Backend
```bash
cd backend
npm run dev
# Should see: Server running on 5000
```

### 3. Start Frontend
```bash
npm run dev
# Should see: http://localhost:5173
```

### 4. Test Google Login
1. Navigate to `http://localhost:5173/login`
2. Click "Login with Google"
3. You should be redirected to Google's consent screen
4. After approval, should redirect back with token
5. Should see success notification and redirect to dashboard

---

## ❌ Common Issues & Solutions

### "Invalid OAuth client" Error
**Cause:** Client ID or Secret is wrong
**Solution:** 
- Verify Client ID/Secret from Google Cloud Console
- Check .env file has correct values
- Restart backend

### "Redirect URI mismatch"
**Cause:** Callback URL doesn't match Google console settings
**Solution:**
- In Google Console, ensure redirect URI is exactly: `http://localhost:5000/auth/google/callback`
- In authRoutes.js, callbackURL must match

### "Token not working after login"
**Cause:** JWT_SECRET mismatch or token not saved
**Solution:**
- Verify JWT_SECRET is same everywhere
- Check localStorage has token after callback
- Check browser DevTools → Application → Storage

### "CORS Error"
**Cause:** Frontend and backend have different origins
**Solution:**
- Ensure cors is configured correctly in server.js
- Check CLIENT_URL in .env matches your frontend URL

### "User not created in database"
**Cause:** Database connection or schema issue
**Solution:**
- Verify database connection in .env
- Ensure users table has google_id and auth_type columns
- Check database is running

---

## 📝 Next Steps

1. **Get Google Credentials**
   - Follow "Google Cloud Setup" section above
   - Copy Client ID & Secret to .env

2. **Setup Backend**
   - Install dependencies
   - Create .env file with Google credentials
   - Update server.js and authRoutes.js
   - Ensure passport.js is configured

3. **Test**
   - Start backend (npm run dev)
   - Start frontend (npm run dev)
   - Click "Login with Google" on login page
   - Complete Google authentication
   - You should be logged in!

---

## 🔗 Reference Files

- **Frontend:** `/src/pages/LoginPage.jsx` - Google button handler
- **Frontend:** `/src/pages/GoogleAuthCallback.jsx` - Handle callback
- **Backend:** `/routes/authRoutes.js` - OAuth routes (needs Google strategy)
- **Backend:** `/config/passport.js` - Passport configuration (needs Google strategy)
- **Guide:** `GOOGLE_SIGNIN_GUIDE.md` - Complete implementation guide

---

## 📞 Need Help?

Refer to:
- `GOOGLE_SIGNIN_GUIDE.md` - Step-by-step setup
- Backend `.env` example above
- Frontend is already ready - just needs backend!

**Frontend: ✅ Ready**
**Backend: ⚠️ Needs Google credentials & configuration**
**Google Cloud: ⏳ Waiting on setup**

---

## Quick Copy-Paste .env Template

Save as `backend/.env`:
```env
GOOGLE_CLIENT_ID=<your-client-id-here>
GOOGLE_CLIENT_SECRET=<your-client-secret-here>
JWT_SECRET=bitmeeting_jwt_secret_key_change_this_in_production
CLIENT_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000
PORT=5000

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=root
DB_NAME=bitmeeting_db
```

Then get your Google credentials and fill in CLIENT_ID and CLIENT_SECRET!
