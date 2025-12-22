# Quick Reference: Toast Notifications

## One-Minute Setup

The system is **already integrated into your app**. You just need to use it!

---

## Usage in Your Components

### Copy-Paste Template
```jsx
import { useNotification } from '../hooks/useNotification';

function MyComponent() {
  const notify = useNotification();

  const handleAction = async () => {
    try {
      await api.post('/api/action', data);
      notify.success('Action completed!');
    } catch (error) {
      notify.error(error); // Automatically user-friendly
    }
  };

  return <button onClick={handleAction}>Do Action</button>;
}

export default MyComponent;
```

---

## All Available Methods

```jsx
const notify = useNotification();

// Show notifications
notify.success(message, duration);     // Green checkmark
notify.error(error, duration);         // Red X icon
notify.warning(message, duration);     // Orange warning
notify.info(message, duration);        // Blue info icon

// Advanced
notify.show(type, message, duration, extra);  // Custom
notify.dismiss(notificationId);                 // Close one
notify.clearAll();                             // Close all

// Utilities
notify.getErrorMessage(error);         // Convert error to text
notify.getDetailedErrors(error);       // Get validation errors
```

---

## Common Patterns

### Success After Action
```jsx
try {
  await api.post('/api/save', data);
  notify.success('Saved successfully!');
} catch (error) {
  notify.error(error);
}
```

### Just Show Error
```jsx
try {
  await api.get('/api/data');
} catch (error) {
  notify.error(error);
}
```

### With Undo Button
```jsx
notify.show('success', 'Item deleted', 5000, {
  actionLabel: 'Undo',
  onAction: () => restoreItem(id)
});
```

### Show Validation Errors
```jsx
try {
  await api.post('/api/register', formData);
} catch (error) {
  const errors = notify.getDetailedErrors(error);
  if (errors) {
    Object.values(errors).forEach(msgs => {
      notify.warning(msgs[0]);
    });
  }
}
```

---

## Duration Settings

```jsx
notify.success('Quick!');              // 4 seconds (default for success)
notify.error(error);                   // 6 seconds (default for error)
notify.info('Heads up', 10000);        // 10 seconds (custom)
notify.warning('Careful!', 0);         // Forever (until manually closed)
```

---

## Error Messages Are Automatic

You pass the error object, we handle the rest:

```jsx
// API error 401?
notify.error(error);
// → "Your session has expired. Please log in again."

// API error 404?
notify.error(error);
// → "The requested resource was not found."

// Network error?
notify.error(error);
// → "Unable to connect to the server. Please check your internet."

// Custom API message?
// API returns: { message: "Email already in use" }
notify.error(error);
// → "Email already in use"

// Unknown error?
notify.error(error);
// → "An error occurred. Please try again."
```

---

## Replacing Old Code

### Replace `alert()`
```jsx
// OLD
alert('Saved!');

// NEW
notify.success('Saved!');
```

### Replace `console.error()`
```jsx
// OLD
console.error('Failed:', error);

// NEW
notify.error(error);
```

### Replace `setError()` State
```jsx
// OLD
const [error, setError] = useState('');
setError('Something failed');
{error && <div>{error}</div>}

// NEW
const notify = useNotification();
notify.error('Something failed');
// ← No state, no manual display needed!
```

---

## Direct Import (No Hook)

For utilities/services without components:

```jsx
import { notificationManager } from '../utils/notificationManager';

export async function syncData() {
  try {
    await api.get('/api/sync');
    notificationManager.success('Synced!');
  } catch (error) {
    notificationManager.error(error);
  }
}
```

---

## Tips & Tricks

### 1. Chain Operations
```jsx
try {
  const data = await api.get('/api/data');
  const saved = await api.post('/api/save', data);
  notify.success('Processed successfully!');
} catch (error) {
  notify.error(error);
}
```

### 2. Conditional Messages
```jsx
try {
  const result = await api.post('/api/action', data);
  if (result.data.warnings) {
    notify.warning('Action completed with warnings');
  } else {
    notify.success('Action completed!');
  }
} catch (error) {
  notify.error(error);
}
```

### 3. Multiple Operations
```jsx
for (const item of items) {
  try {
    await api.post(`/api/process/${item.id}`);
  } catch (error) {
    notify.error(`Failed to process ${item.name}`);
  }
}
```

### 4. Custom Durations
```jsx
notify.info('Short notice', 2000);         // 2 seconds
notify.warning('Medium warning', 5000);    // 5 seconds
notify.info('Persistent info', 0);         // Until manually closed
```

---

## Notification Types

| Type | Color | Icon | Default Duration | Use When |
|------|-------|------|------------------|----------|
| **success** | Green | ✓ | 4s | Action completed |
| **error** | Red | ✗ | 6s | Something failed |
| **warning** | Orange | ⚠ | 5s | Caution needed |
| **info** | Blue | ℹ | 4s | FYI message |

---

## File Locations

- **Use in components:** `import { useNotification } from '../hooks/useNotification';`
- **Use in services:** `import { notificationManager } from '../utils/notificationManager';`
- **Display component:** Already in App.jsx
- **Styling:** `src/styles/Toast.css`

---

## Nothing to Install!

The system is already:
- ✅ Created
- ✅ Integrated into App.jsx
- ✅ Using Material-UI (already a dependency)
- ✅ Ready to use

Just import the hook and start using it!

---

## Questions?

See the full documentation:
- `CONSISTENT_ERROR_MESSAGES.md` - Complete guide
- `NOTIFICATION_EXAMPLES.js` - Code examples
- `ISSUE_19_RESOLVED.md` - Implementation details
