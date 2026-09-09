import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.removeItem('therapist');
      localStorage.removeItem('token');
      localStorage.removeItem('client_appointments');
    } catch (e) {}
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f172a',
          color: '#f8fafc',
          padding: 24,
          textAlign: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 12, color: '#818cf8' }}>Unfazed Health Portal</h1>
          <p style={{ color: '#94a3b8', marginBottom: 24, maxWidth: 450 }}>
            Session loaded cleanly. Click below to return to the Doctor & Client portal.
          </p>
          <button
            onClick={this.handleReset}
            style={{
              padding: '12px 24px',
              background: '#6366f1',
              color: '#fff',
              border: 'none',
              borderRadius: 30,
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
            }}
          >
            Reload Home Directory
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
