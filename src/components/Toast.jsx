import React, { useState, useEffect } from 'react';
import { notificationManager, NOTIFICATION_TYPES } from '../utils/notificationManager';
import {
  Alert,
  Snackbar,
  IconButton,
  Box,
  Button,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import '../styles/Toast.css';

/**
 * Toast/Snackbar notification component
 * Should be placed once at app root level
 * Works with notificationManager to display all notifications
 * 
 * Usage in App.jsx:
 * <Toast />
 */
const Toast = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Subscribe to notification manager
    const unsubscribe = notificationManager.subscribe((notification) => {
      // Handle dismiss
      if (notification.dismiss) {
        setNotifications(prev => 
          prev.filter(n => n.id !== notification.id)
        );
        return;
      }

      // Handle clear all
      if (notification.clearAll) {
        setNotifications([]);
        return;
      }

      // Add new notification
      setNotifications(prev => [...prev, notification]);
    });

    return unsubscribe;
  }, []);

  const handleClose = (id) => {
    notificationManager.dismiss(id);
  };

  const getIcon = (type) => {
    switch (type) {
      case NOTIFICATION_TYPES.ERROR:
        return <ErrorIcon sx={{ color: '#d32f2f' }} />;
      case NOTIFICATION_TYPES.SUCCESS:
        return <CheckCircleIcon sx={{ color: '#388e3c' }} />;
      case NOTIFICATION_TYPES.WARNING:
        return <WarningIcon sx={{ color: '#f57c00' }} />;
      case NOTIFICATION_TYPES.INFO:
        return <InfoIcon sx={{ color: '#1976d2' }} />;
      default:
        return null;
    }
  };

  const getAlertSeverity = (type) => {
    switch (type) {
      case NOTIFICATION_TYPES.ERROR:
        return 'error';
      case NOTIFICATION_TYPES.SUCCESS:
        return 'success';
      case NOTIFICATION_TYPES.WARNING:
        return 'warning';
      case NOTIFICATION_TYPES.INFO:
        return 'info';
      default:
        return 'info';
    }
  };

  return (
    <div className="toast-container">
      {notifications.map((notification) => (
        <Snackbar
          key={notification.id}
          open={true}
          autoHideDuration={notification.duration > 0 ? notification.duration : null}
          onClose={() => handleClose(notification.id)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          className="toast-snackbar"
        >
          <Alert
            onClose={() => handleClose(notification.id)}
            severity={getAlertSeverity(notification.type)}
            icon={getIcon(notification.type)}
            sx={{
              width: '100%',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              fontSize: '0.95rem',
              alignItems: 'center',
            }}
            action={
              <IconButton
                size="small"
                aria-label="close"
                color="inherit"
                onClick={() => handleClose(notification.id)}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            }
          >
            {notification.message}
            {notification.actionLabel && (
              <Button
                size="small"
                color="inherit"
                style={{ marginLeft: '16px' }}
                onClick={() => {
                  notification.onAction?.();
                  handleClose(notification.id);
                }}
              >
                {notification.actionLabel}
              </Button>
            )}
          </Alert>
        </Snackbar>
      ))}
    </div>
  );
};

export default Toast;
