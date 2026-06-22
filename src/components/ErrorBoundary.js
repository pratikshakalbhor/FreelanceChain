import React from 'react';

/**
 * FreelanceChain — Error Boundary Component
 * 
 * Catches rendering errors in child components and displays
 * a fallback UI instead of crashing the entire app.
 * 
 * Features:
 * - Graceful error display with retry option
 * - Error logging
 * - Isolated failure (one page crash doesn't kill other pages)
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);

    // Report to analytics if available
    if (typeof window !== 'undefined' && window.__FC_ERROR_REPORTER) {
      window.__FC_ERROR_REPORTER(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // Allow custom fallback
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          retry: this.handleRetry,
        });
      }

      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '300px',
          padding: '40px 20px',
          textAlign: 'center',
        }}>
          <div style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '500px',
            width: '100%',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h3 style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 700,
              fontSize: '1.2rem',
              color: '#ef4444',
              marginBottom: '8px',
            }}>
              {this.props.title || 'Something went wrong'}
            </h3>
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.9rem',
              color: 'rgba(255,255,255,0.5)',
              marginBottom: '20px',
              lineHeight: 1.5,
            }}>
              {this.state.error?.message || 'An unexpected error occurred in this section.'}
            </p>
            <button
              onClick={this.handleRetry}
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                padding: '10px 24px',
                fontFamily: "'Inter', sans-serif",
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => e.target.style.transform = 'scale(1.03)'}
              onMouseLeave={e => e.target.style.transform = 'scale(1)'}
            >
              🔄 Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
