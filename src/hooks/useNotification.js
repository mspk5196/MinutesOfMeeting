import { notificationManager, NOTIFICATION_TYPES } from '../utils/notificationManager';

/**
 * Hook for using notifications in components
 * Usage: const notify = useNotification();
 *        notify.error('Something went wrong!');
 *        notify.success('Saved successfully!');
 *        notify.warning('Are you sure?');
 *        notify.info('Just letting you know...');
 */
export const useNotification = () => {
  return {
    error: (message, duration) => notificationManager.error(message, duration),
    success: (message, duration) => notificationManager.success(message, duration),
    warning: (message, duration) => notificationManager.warning(message, duration),
    info: (message, duration) => notificationManager.info(message, duration),
    show: (type, message, duration, extra) => notificationManager.show(type, message, duration, extra),
    dismiss: (id) => notificationManager.dismiss(id),
    clearAll: () => notificationManager.clearAll(),
    getErrorMessage: (error) => notificationManager.getErrorMessage(error),
    getDetailedErrors: (error) => notificationManager.getDetailedErrors(error),
  };
};
