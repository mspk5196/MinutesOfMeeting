/**
 * EXAMPLE IMPLEMENTATIONS
 * 
 * This file shows how to update existing components to use the new
 * consistent error notification system.
 * 
 * Copy-paste patterns from here into your components as you refactor them.
 */

// =============================================================================
// EXAMPLE 1: Form Submission with Error Handling
// =============================================================================

/**
 * BEFORE: Multiple error handling approaches
 */
// function OldLoginForm() {
//   const [error, setError] = useState('');
// 
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       const response = await api.post('/api/login', { email, password });
//       if (response.data.token) {
//         localStorage.setItem('token', response.data.token);
//         // No success notification - user doesn't know if it worked
//       }
//     } catch (error) {
//       setError(error.response?.data?.message || 'Login failed');
//       // OR use an alert (bad UX)
//       // alert(error.response?.data?.message || 'Login failed');
//     }
//   };
//
//   return (
//     <>
//       {error && <div className="error-box">{error}</div>}
//       <form onSubmit={handleSubmit}>
//         {/* form fields */}
//       </form>
//     </>
//   );
// }

/**
 * AFTER: Consistent toast notifications
 */
import { useNotification } from '../hooks/useNotification';

function NewLoginForm() {
  const notify = useNotification();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/api/login', { email, password });
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        notify.success('Login successful!');
        // Navigate or update auth state
      }
    } catch (error) {
      notify.error(error); // Automatically converts to user-friendly message
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
    </form>
  );
}

// =============================================================================
// EXAMPLE 2: Data Mutation (Create/Update/Delete)
// =============================================================================

/**
 * BEFORE: Silent failures and inconsistent feedback
 */
// async function oldCreateMeeting(data) {
//   try {
//     const response = await api.post('/api/meetings', data);
//     console.log('Meeting created'); // User doesn't see this
//     return response.data;
//   } catch (error) {
//     console.error('Error creating meeting:', error); // Only in console
//     throw error; // Let caller handle it
//   }
// }

/**
 * AFTER: User always knows what happened
 */
import { useNotification } from '../hooks/useNotification';

function MeetingForm() {
  const notify = useNotification();

  async function createMeeting(data) {
    try {
      const response = await api.post('/api/meetings', data);
      notify.success('Meeting created successfully!');
      return response.data;
    } catch (error) {
      notify.error(error);
      throw error;
    }
  }

  return (
    <form onSubmit={async (e) => {
      e.preventDefault();
      await createMeeting(formData);
    }}>
      {/* form fields */}
    </form>
  );
}

// =============================================================================
// EXAMPLE 3: Data Fetching with Error Handling
// =============================================================================

/**
 * BEFORE: Errors hidden in console
 */
// function OldMeetingList() {
//   const [meetings, setMeetings] = useState([]);
//
//   useEffect(() => {
//     api.get('/api/meetings')
//       .then(res => setMeetings(res.data))
//       .catch(err => console.error('Failed to fetch:', err));
//   }, []);
//
//   return <div>{meetings.length} meetings</div>;
// }

/**
 * AFTER: User sees what happened
 */
function NewMeetingList() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const notify = useNotification();

  useEffect(() => {
    api.get('/api/meetings')
      .then(res => {
        setMeetings(res.data);
        // Optional: notify.info(`Loaded ${res.data.length} meetings`);
      })
      .catch(err => {
        notify.error(err);
        // Could also: notify.error('Failed to load meetings');
      })
      .finally(() => setLoading(false));
  }, [notify]);

  if (loading) return <div>Loading...</div>;
  return <div>{meetings.length} meetings</div>;
}

// =============================================================================
// EXAMPLE 4: Async Action with Loading State
// =============================================================================

/**
 * AFTER: Complete pattern with loading state
 */
function ApproveButton({ meetingId }) {
  const [loading, setLoading] = useState(false);
  const notify = useNotification();

  const handleApprove = async () => {
    setLoading(true);
    try {
      await api.post(`/api/meetings/${meetingId}/approve`);
      notify.success('Meeting approved!');
      // Refresh data, navigate, etc.
    } catch (error) {
      notify.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleApprove} disabled={loading}>
      {loading ? 'Approving...' : 'Approve'}
    </button>
  );
}

// =============================================================================
// EXAMPLE 5: Validation Errors
// =============================================================================

/**
 * AFTER: Show validation errors with context
 */
function RegistrationForm() {
  const notify = useNotification();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/register', formData);
      notify.success('Registration successful!');
    } catch (error) {
      // For 422 validation errors, get detailed errors
      const detailedErrors = notify.getDetailedErrors(error);
      if (detailedErrors) {
        // Could show in form: { name: ["Name is required"], email: [...] }
        Object.entries(detailedErrors).forEach(([field, messages]) => {
          notify.warning(`${field}: ${messages[0]}`);
        });
      } else {
        notify.error(error);
      }
    }
  };

  return <form onSubmit={handleSubmit}>{/* fields */}</form>;
}

// =============================================================================
// EXAMPLE 6: Multiple Operations (Batch)
// =============================================================================

/**
 * AFTER: Show progress for batch operations
 */
function BulkApprovalButton({ meetingIds }) {
  const notify = useNotification();

  const handleBulkApprove = async () => {
    const results = { success: 0, failed: 0 };

    for (const id of meetingIds) {
      try {
        await api.post(`/api/meetings/${id}/approve`);
        results.success++;
      } catch (error) {
        results.failed++;
        console.error(`Failed to approve meeting ${id}:`, error);
      }
    }

    if (results.failed === 0) {
      notify.success(`All ${results.success} meetings approved!`);
    } else {
      notify.warning(
        `Approved ${results.success}, failed ${results.failed}`
      );
    }
  };

  return <button onClick={handleBulkApprove}>Bulk Approve</button>;
}

// =============================================================================
// EXAMPLE 7: Non-Component Code (Services/Utils)
// =============================================================================

/**
 * AFTER: Direct import for services
 */
import { notificationManager } from '../utils/notificationManager';

export async function syncMeetings() {
  try {
    const response = await api.get('/api/meetings/sync');
    notificationManager.success('Meetings synced!');
    return response.data;
  } catch (error) {
    notificationManager.error(error);
    throw error;
  }
}

// =============================================================================
// EXAMPLE 8: Custom Actions with Undo
// =============================================================================

/**
 * AFTER: Show action with optional undo
 */
function DeleteMeetingButton({ meetingId }) {
  const notify = useNotification();

  const handleDelete = async () => {
    if (!window.confirm('Are you sure?')) return;

    try {
      await api.delete(`/api/meetings/${meetingId}`);
      notify.show(
        'success',
        'Meeting deleted',
        5000,
        {
          actionLabel: 'Undo',
          onAction: () => restoreMeeting(meetingId)
        }
      );
    } catch (error) {
      notify.error(error);
    }
  };

  return <button onClick={handleDelete}>Delete</button>;
}

// =============================================================================
// MIGRATION CHECKLIST
// =============================================================================

/**
 * When updating a component, use this checklist:
 * 
 * ☐ Import: import { useNotification } from '../hooks/useNotification';
 * ☐ Create hook: const notify = useNotification();
 * ☐ Replace: alert() → notify.success() / notify.error() / notify.warning()
 * ☐ Replace: console.error() → notify.error()
 * ☐ Replace: setError() state → notify.error()
 * ☐ Add: notify.success() for successful operations
 * ☐ Test: Verify errors show as toasts instead of alerts/console
 * ☐ Remove: Old error state/display code
 * 
 * Example changes:
 * 
 * OLD:
 *   const [error, setError] = useState('');
 *   {error && <div className="error">{error}</div>}
 *   setError('Something failed');
 *   alert('Success!');
 * 
 * NEW:
 *   (no error state needed)
 *   (no error div needed)
 *   notify.error('Something failed');
 *   notify.success('Success!');
 */
