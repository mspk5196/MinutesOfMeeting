import { useState, useRef, useCallback } from 'react';

/**
 * Custom hook to prevent double submissions and rapid multiple clicks
 * 
 * Usage:
 * const { isSubmitting, executeSubmit } = useSubmitGuard();
 * 
 * const handleSubmit = executeSubmit(async () => {
 *   // Your submission logic here
 *   await api.post(...);
 * });
 * 
 * @param {number} cooldownMs - Cooldown period in milliseconds (default: 1000ms)
 * @returns {Object} - { isSubmitting, executeSubmit }
 */
export const useSubmitGuard = (cooldownMs = 1000) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const lastSubmitTime = useRef(0);
  const submitInProgress = useRef(false);

  const executeSubmit = useCallback((submitFunction) => {
    return async (...args) => {
      // Check if submission is already in progress
      if (submitInProgress.current) {
        console.warn('Submission already in progress, ignoring duplicate request');
        return;
      }

      // Check cooldown period
      const now = Date.now();
      const timeSinceLastSubmit = now - lastSubmitTime.current;
      
      if (timeSinceLastSubmit < cooldownMs) {
        console.warn(`Please wait ${Math.ceil((cooldownMs - timeSinceLastSubmit) / 1000)}s before submitting again`);
        return;
      }

      try {
        // Mark submission as in progress
        submitInProgress.current = true;
        setIsSubmitting(true);
        lastSubmitTime.current = now;

        // Execute the actual submission function
        const result = await submitFunction(...args);
        return result;
      } catch (error) {
        console.error('Submission error:', error);
        throw error;
      } finally {
        // Always clean up, even on error
        submitInProgress.current = false;
        setIsSubmitting(false);
      }
    };
  }, [cooldownMs]);

  return { isSubmitting, executeSubmit };
};

export default useSubmitGuard;
