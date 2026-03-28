// --- Diagnostics: Catch absolute early errors ---
window.onerror = function(msg, url, line, col, error) {
  console.error('[CRITICAL] Global Error:', { msg, url, line, col, error });
  const root = document.getElementById('root');
  if (root && root.innerHTML === '') {
    root.innerHTML = `<div style="padding: 40px; color: #ff5555; font-family: sans-serif; background: #0a0a1a; min-height: 100vh;">
      <h1 style="margin-bottom: 16px;">NexBrief failed to start</h1>
      <p style="opacity: 0.8; font-size: 14px;">Error: ${msg}</p>
      <p style="opacity: 0.6; font-size: 12px; margin-top: 24px;">Check the browser console for details.</p>
    </div>`;
  }
};

window.onunhandledrejection = function(event) {
  console.error('[CRITICAL] Unhandled Promise Rejection:', event.reason);
};

console.log('[DEBUG] NextBrief UI initialization sequence starting...');

import React, { Component, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('[DEBUG] React Component Catch:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 48, background: '#0a0a1a', minHeight: '100vh', color: '#f0f0f5', fontFamily: 'sans-serif' }}>
          <h1 style={{ marginBottom: 16, color: '#ec4899' }}>Something went wrong.</h1>
          <p style={{ opacity: 0.8 }}>The application encountered an unexpected error during render.</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ marginTop: 24, padding: '12px 24px', background: '#4a7cff', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            Reload Application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const container = document.getElementById('root');
if (!container) {
  console.error('[CRITICAL] Target container #root not found in DOM.');
  document.body.innerHTML = '<div style="padding: 40px; color: white; background: red;">Critical Error: #root element missing.</div>';
} else {
  console.log('[DEBUG] Mounting React application to #root...');
  try {
    const root = createRoot(container);
    root.render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>
    );
    console.log('[DEBUG] React render() initiated.');
  } catch (err) {
    console.error('[CRITICAL] Failed to create or render React root:', err);
  }
}
