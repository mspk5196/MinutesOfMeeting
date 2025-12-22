/**
 * Centralized Notification Management
 * Provides consistent error, success, info, and warning messages across the app
 * Usage: import { showNotification, notificationManager } from '../utils/notificationManager'
 */

// Notification types
export const NOTIFICATION_TYPES = {
  ERROR: 'error',
  SUCCESS: 'success',
  INFO: 'info',
  WARNING: 'warning'
};

// Error message mapping - converts technical errors to user-friendly messages
const ERROR_MESSAGE_MAP = {
  // Authentication errors
  401: 'Your session has expired. Please log in again.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  422: 'Please check your input and try again.',
  500: 'Server error. Please try again later.',
  503: 'Service is temporarily unavailable. Please try again later.',
  
  // Network errors
  'Network Error': 'Unable to connect to the server. Please check your internet connection.',
  'ECONNREFUSED': 'Unable to reach the server. Is it running?',
  'ETIMEDOUT': 'Request timed out. Please try again.',
  'ERR_NETWORK': 'Network connection error. Please check your internet.',
  
  // Default
  'DEFAULT': 'An error occurred. Please try again.',
};

class NotificationManager {
  constructor() {
    this.listeners = new Set();
    this.queue = [];
  }

  /**
   * Subscribe to notification changes
   * @param {Function} callback - Function called with notification object
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all subscribers
   */
  notify(notification) {
    this.listeners.forEach(callback => callback(notification));
  }

  /**
   * Show a notification
   * @param {string} type - NOTIFICATION_TYPES
   * @param {string} message - Message to display
   * @param {number} duration - How long to show (ms), 0 = indefinite
   * @param {object} extra - Extra data (actionLabel, onAction, etc.)
   */
  show(type, message, duration = 5000, extra = {}) {
    const notification = {
      id: Date.now() + Math.random(),
      type,
      message,
      duration,
      ...extra
    };

    this.notify(notification);

    // Auto-hide after duration (unless 0)
    if (duration > 0) {
      setTimeout(() => this.dismiss(notification.id), duration);
    }

    return notification.id;
  }

  /**
   * Show error notification
   * @param {string|Error|object} error - Error message or error object
   * @param {number} duration - How long to show (ms)
   */
  error(error, duration = 6000) {
    const message = this.getErrorMessage(error);
    console.error('[Notification Error]', error); // Still log for debugging
    return this.show(NOTIFICATION_TYPES.ERROR, message, duration);
  }

  /**
   * Show success notification
   */
  success(message, duration = 4000) {
    return this.show(NOTIFICATION_TYPES.SUCCESS, message, duration);
  }

  /**
   * Show info notification
   */
  info(message, duration = 4000) {
    return this.show(NOTIFICATION_TYPES.INFO, message, duration);
  }

  /**
   * Show warning notification
   */
  warning(message, duration = 5000) {
    return this.show(NOTIFICATION_TYPES.WARNING, message, duration);
  }

  /**
   * Dismiss a notification by ID
   */
  dismiss(notificationId) {
    this.notify({ id: notificationId, dismiss: true });
  }

  /**
   * Clear all notifications
   */
  clearAll() {
    this.notify({ clearAll: true });
  }

  /**
   * Convert error object to user-friendly message
   * @param {string|Error|object} error - The error to process
   * @returns {string} User-friendly error message
   */
  getErrorMessage(error) {
    // String error
    if (typeof error === 'string') {
      return error;
    }

    // Axios error object
    if (error?.response) {
      const status = error.response.status;
      const message = error.response.data?.message;
      
      // Use API-provided message if available
      if (message && typeof message === 'string') {
        return message;
      }
      
      // Use status code mapping
      if (ERROR_MESSAGE_MAP[status]) {
        return ERROR_MESSAGE_MAP[status];
      }
    }

    // Network error (no response)
    if (error?.request && !error?.response) {
      return ERROR_MESSAGE_MAP['Network Error'];
    }

    // Error message property
    if (error?.message) {
      // Check if message matches known errors
      for (const [key, userMessage] of Object.entries(ERROR_MESSAGE_MAP)) {
        if (error.message.includes(key)) {
          return userMessage;
        }
      }
      return error.message;
    }

    // Validation errors (422)
    if (error?.errors && typeof error.errors === 'object') {
      const messages = Object.values(error.errors).flat();
      return messages[0] || ERROR_MESSAGE_MAP['422'];
    }

    // Error object with message property
    if (error?.status) {
      return ERROR_MESSAGE_MAP[error.status] || ERROR_MESSAGE_MAP['DEFAULT'];
    }

    // Fallback
    return ERROR_MESSAGE_MAP['DEFAULT'];
  }

  /**
   * Extract all error messages from API response
   * Useful for showing validation errors
   */
  getDetailedErrors(error) {
    if (error?.response?.data?.errors) {
      return error.response.data.errors;
    }
    if (error?.errors) {
      return error.errors;
    }
    return null;
  }
}

// Singleton instance
export const notificationManager = new NotificationManager();

/**
 * Convenience function for showing notifications
 * Usage: showNotification('error', 'Something went wrong!')
 */
export const showNotification = (type, message, duration = 5000, extra = {}) => {
  return notificationManager.show(type, message, duration, extra);
};
