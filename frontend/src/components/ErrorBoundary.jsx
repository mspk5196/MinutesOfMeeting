import React from 'react';
import { Box, Button, Typography, Paper, Container } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import HomeIcon from '@mui/icons-material/Home';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error);
    console.error('Error info:', errorInfo);

    // Update state with error details
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // You can also log the error to an error reporting service here
    // Example: logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    // Clear error state and try to recover
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleGoHome = () => {
    // Clear error and redirect to dashboard
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    window.location.href = '/dashboard';
  };

  handleReload = () => {
    // Full page reload as last resort
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // If error keeps happening, suggest full reload
      const persistentError = this.state.errorCount > 2;

      return (
        <Container maxWidth="md" sx={{ mt: 8 }}>
          <Paper
            elevation={3}
            sx={{
              p: 4,
              textAlign: 'center',
              backgroundColor: '#fff',
              borderRadius: 2
            }}
          >
            <ErrorOutlineIcon
              sx={{
                fontSize: 80,
                color: '#f44336',
                mb: 2
              }}
            />

            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
              Oops! Something went wrong
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {persistentError
                ? 'The application encountered a persistent error. Please try reloading the page.'
                : 'The application encountered an unexpected error. Your work has been saved, and you can continue by going back to the dashboard.'}
            </Typography>

            {/* Show error details in development mode */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Box
                sx={{
                  mt: 3,
                  mb: 3,
                  p: 2,
                  backgroundColor: '#f5f5f5',
                  borderRadius: 1,
                  textAlign: 'left',
                  maxHeight: 200,
                  overflow: 'auto'
                }}
              >
                <Typography
                  variant="body2"
                  component="pre"
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}
                >
                  <strong>Error:</strong> {this.state.error.toString()}
                  {this.state.errorInfo && (
                    <>
                      {'\n\n'}
                      <strong>Component Stack:</strong>
                      {this.state.errorInfo.componentStack}
                    </>
                  )}
                </Typography>
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 4 }}>
              {!persistentError && (
                <>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<HomeIcon />}
                    onClick={this.handleGoHome}
                    size="large"
                  >
                    Go to Dashboard
                  </Button>

                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={this.handleReset}
                    size="large"
                  >
                    Try Again
                  </Button>
                </>
              )}

              <Button
                variant={persistentError ? 'contained' : 'outlined'}
                color={persistentError ? 'primary' : 'secondary'}
                startIcon={<RefreshIcon />}
                onClick={this.handleReload}
                size="large"
              >
                Reload Page
              </Button>
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 4 }}>
              If this problem persists, please contact support.
            </Typography>
          </Paper>
        </Container>
      );
    }

    // When there's no error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;
