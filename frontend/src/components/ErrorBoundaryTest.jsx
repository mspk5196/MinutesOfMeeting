import React, { useState } from 'react';
import { Box, Button, Typography, Paper, Stack } from '@mui/material';
import BugReportIcon from '@mui/icons-material/BugReport';

// Component that throws an error when triggered
function BrokenComponent({ shouldThrow }) {
  if (shouldThrow) {
    // This will crash the component
    throw new Error('Test error: This component intentionally crashed!');
  }
  return <Typography>Component is working fine.</Typography>;
}

// Component that causes an error during render
function ErrorInRender() {
  // This will cause a type error
  const data = null;
  return <div>{data.map(item => item.name)}</div>;
}

// Component that causes error in useEffect
function ErrorInEffect() {
  React.useEffect(() => {
    // This will throw after component mounts
    setTimeout(() => {
      throw new Error('Test error: Error in useEffect!');
    }, 100);
  }, []);
  return <Typography>Component mounted, error coming in useEffect...</Typography>;
}

export default function ErrorBoundaryTest() {
  const [throwError, setThrowError] = useState(false);
  const [showErrorInRender, setShowErrorInRender] = useState(false);
  const [showErrorInEffect, setShowErrorInEffect] = useState(false);

  return (
    <Paper elevation={3} sx={{ p: 4, m: 4 }}>
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <BugReportIcon sx={{ fontSize: 60, color: '#ff9800', mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          Error Boundary Test Page
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Use the buttons below to trigger different types of errors and see how the Error Boundary handles them.
        </Typography>
      </Box>

      <Stack spacing={3} sx={{ mt: 4 }}>
        {/* Test 1: Button-triggered error */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Test 1: Button-Triggered Error
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Click the button to throw an error in the component.
          </Typography>
          <Button
            variant="contained"
            color="error"
            onClick={() => setThrowError(true)}
          >
            Throw Error
          </Button>
          <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <BrokenComponent shouldThrow={throwError} />
          </Box>
        </Box>

        {/* Test 2: Render error */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Test 2: Error During Render
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This will cause a TypeError when trying to map over null.
          </Typography>
          <Button
            variant="contained"
            color="error"
            onClick={() => setShowErrorInRender(true)}
          >
            Trigger Render Error
          </Button>
          <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            {showErrorInRender ? <ErrorInRender /> : <Typography>Click button to trigger error</Typography>}
          </Box>
        </Box>

        {/* Test 3: Effect error (Note: This won't be caught by Error Boundary) */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Test 3: Error in useEffect (Not Caught by Error Boundary)
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Errors in event handlers and async code are NOT caught by Error Boundary.
            Check the console to see the error.
          </Typography>
          <Button
            variant="contained"
            color="warning"
            onClick={() => setShowErrorInEffect(true)}
          >
            Trigger Effect Error (Console Only)
          </Button>
          <Box sx={{ mt: 2, p: 2, bgcolor: '#fff3e0', borderRadius: 1 }}>
            {showErrorInEffect ? <ErrorInEffect /> : <Typography>Click button to trigger error</Typography>}
          </Box>
        </Box>

        {/* Instructions */}
        <Box sx={{ mt: 4, p: 3, bgcolor: '#e3f2fd', borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom>
            What to Expect:
          </Typography>
          <Typography variant="body2" component="div">
            <ul>
              <li>Tests 1 & 2: Should show the Error Boundary fallback UI</li>
              <li>You'll see "Oops! Something went wrong" message</li>
              <li>Options to "Go to Dashboard", "Try Again", or "Reload Page"</li>
              <li>In development mode, you'll see the error details</li>
              <li>Test 3: Will only show in browser console (Error Boundaries don't catch async errors)</li>
            </ul>
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}
