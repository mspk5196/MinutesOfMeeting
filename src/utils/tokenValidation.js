/**
 * Token validation utilities
 * Helps check if JWT tokens are expired
 */

/**
 * Decode JWT token payload
 * @param {string} token - JWT token
 * @returns {object|null} - Decoded payload or null if invalid
 */
export function decodeJwt(token) {
  try {
    if (!token || typeof token !== 'string') return null;
    
    const parts = token.split('.');
    if (parts.length !== 3) return null; // Invalid JWT format
    
    const payload = parts[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

/**
 * Check if a JWT token is expired
 * @param {string} token - JWT token
 * @returns {boolean} - true if expired, false if valid
 */
export function isTokenExpired(token) {
  const payload = decodeJwt(token);
  
  // If we can't decode it, consider it expired
  if (!payload || !payload.exp) {
    return true;
  }
  
  // Convert exp (seconds) to milliseconds and compare with current time
  const expirationTime = payload.exp * 1000;
  const currentTime = Date.now();
  
  // Add 5-second buffer to prevent edge cases
  return currentTime > expirationTime - 5000;
}

/**
 * Get remaining time until token expires
 * @param {string} token - JWT token
 * @returns {number} - Milliseconds until expiration, or 0 if expired
 */
export function getTokenTimeRemaining(token) {
  const payload = decodeJwt(token);
  
  if (!payload || !payload.exp) {
    return 0;
  }
  
  const expirationTime = payload.exp * 1000;
  const currentTime = Date.now();
  const timeRemaining = expirationTime - currentTime;
  
  return Math.max(0, timeRemaining);
}

/**
 * Validate token and clear if expired
 * @param {string} token - JWT token
 * @returns {boolean} - true if token is valid, false if expired/invalid
 */
export function validateAndClearExpiredToken(token) {
  if (!token) {
    return false;
  }
  
  if (isTokenExpired(token)) {
    // Clear expired token
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      delete window.api?.defaults.headers.common['Authorization'];
    } catch (error) {
      console.error('Error clearing expired token:', error);
    }
    return false;
  }
  
  return true;
}

/**
 * Get user info from token
 * @param {string} token - JWT token
 * @returns {object|null} - User info or null
 */
export function getUserFromToken(token) {
  const payload = decodeJwt(token);
  
  if (!payload) {
    return null;
  }
  
  return {
    userId: payload.userId || payload.id,
    email: payload.email,
    username: payload.username,
    role: payload.role,
    exp: payload.exp,
    iat: payload.iat
  };
}

export default {
  decodeJwt,
  isTokenExpired,
  getTokenTimeRemaining,
  validateAndClearExpiredToken,
  getUserFromToken
};
