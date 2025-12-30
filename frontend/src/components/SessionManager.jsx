import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { api } from '../utils/apiClient';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';

function decodeJwt(token) {
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  }
}

export default function SessionManager({ warningBeforeExpiryMs = 2 * 60 * 1000, idleTimeoutMs = 30 * 60 * 1000, onLogout }) {
  const [showExpiryWarn, setShowExpiryWarn] = useState(false);
  const [showIdleWarn, setShowIdleWarn] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const expiryTimerRef = useRef(null);
  const idleTimerRef = useRef(null);
  const idleCountdownRef = useRef(null);

  const token = useMemo(() => localStorage.getItem('token') || '', []);
  const payload = useMemo(() => (token ? decodeJwt(token) : null), [token]);

  const scheduleExpiryWarning = useCallback(() => {
    if (!payload || !payload.exp) return;
    const msLeft = payload.exp * 1000 - Date.now();
    if (msLeft <= 0) {
      handleLogout();
      return;
    }
    const fireIn = Math.max(0, msLeft - warningBeforeExpiryMs);
    expiryTimerRef.current && clearTimeout(expiryTimerRef.current);
    expiryTimerRef.current = setTimeout(() => setShowExpiryWarn(true), fireIn);
  }, [payload, warningBeforeExpiryMs]);

  const resetIdleTimer = useCallback(() => {
    setShowIdleWarn(false);
    idleTimerRef.current && clearTimeout(idleTimerRef.current);
    idleCountdownRef.current && clearInterval(idleCountdownRef.current);
    idleTimerRef.current = setTimeout(() => {
      setShowIdleWarn(true);
      setCountdown(60);
      idleCountdownRef.current = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(idleCountdownRef.current);
            handleLogout();
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }, idleTimeoutMs);
  }, [idleTimeoutMs]);

  useEffect(() => {
    scheduleExpiryWarning();
    resetIdleTimer();

    const onActivity = () => resetIdleTimer();
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    return () => {
      expiryTimerRef.current && clearTimeout(expiryTimerRef.current);
      idleTimerRef.current && clearTimeout(idleTimerRef.current);
      idleCountdownRef.current && clearInterval(idleCountdownRef.current);
      events.forEach((e) => window.removeEventListener(e, onActivity));
    };
  }, [scheduleExpiryWarning, resetIdleTimer]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    try {
      delete api.defaults.headers.common['Authorization'];
    } catch {}
    if (typeof onLogout === 'function') onLogout();
    window.location.href = '/meetings/login';
  }, [onLogout]);

  const extendSession = useCallback(async () => {
    try {
      const current = localStorage.getItem('token');
      if (!current) return handleLogout();
      const res = await api.post('/api/meetings/refresh-token', {}, {
        headers: { Authorization: `Bearer ${current}` }
      });
      if (res.data?.success && res.data?.token) {
        localStorage.setItem('token', res.data.token);
        api.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
        setShowExpiryWarn(false);
        scheduleExpiryWarning();
        resetIdleTimer();
      } else {
        handleLogout();
      }
    } catch {
      handleLogout();
    }
  }, [scheduleExpiryWarning, resetIdleTimer, handleLogout]);

  return (
    <>
      <Dialog open={showExpiryWarn} onClose={() => setShowExpiryWarn(false)}>
        <DialogTitle>Session expiring soon</DialogTitle>
        <DialogContent>
          <Typography>Your session will expire shortly. Stay signed in?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleLogout} color="error">Logout</Button>
          <Button onClick={extendSession} variant="contained">Stay Signed In</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showIdleWarn} onClose={() => setShowIdleWarn(false)}>
        <DialogTitle>Are you still there?</DialogTitle>
        <DialogContent>
          <Typography>No activity detected. You will be logged out in {countdown}s.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleLogout} color="error">Logout</Button>
          <Button onClick={() => { setShowIdleWarn(false); resetIdleTimer(); }} variant="contained">Stay Signed In</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
