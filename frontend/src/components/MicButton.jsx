import React from 'react';

export default function MicButton({ isListening, isLoading, onToggle, label: propLabel }) {
  let label = propLabel || 'Tap to ask';
  if (isLoading) label = propLabel || 'Processing…';
  else if (isListening) label = propLabel || 'Listening…';
  const handleMouseMove = (e) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const rotateX = -y / 10;
    const rotateY = x / 10;
    btn.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
  };

  const handleMouseLeave = (e) => {
    e.currentTarget.style.transform = '';
  };

  return (
    <div className="mic-section">
      <button
        id="mic-button"
        className={`mic-orb ${isListening ? 'mic-orb--listening' : ''} ${isLoading ? 'mic-orb--processing' : ''}`}
        onClick={onToggle}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        aria-label={isListening ? 'Stop listening' : 'Start listening'}
      >
        {/* Siri wave rings */}
        <span className="mic-orb__ring mic-orb__ring--1" />
        <span className="mic-orb__ring mic-orb__ring--2" />
        <span className="mic-orb__ring mic-orb__ring--3" />

        {/* Dynamic Display */}
        {isLoading ? (
          <div className="mic-orb__spinner">
            <div className="mic-orb__dot" style={{ '--d': '0s' }} />
            <div className="mic-orb__dot" style={{ '--d': '0.2s' }} />
            <div className="mic-orb__dot" style={{ '--d': '0.4s' }} />
          </div>
        ) : (
          <div className="mic-orb__inner">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mic-orb__svg">
              {isListening ? (
                <>
                  <rect x="6" y="6" width="12" height="12" rx="2" fill="white" />
                </>
              ) : (
                <>
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                  <line x1="12" y1="19" x2="12" y2="22"></line>
                </>
              )}
            </svg>
          </div>
        )}
      </button>

      <span className={`mic-label ${isListening ? 'mic-label--listening' : ''} ${isLoading ? 'mic-label--processing' : ''}`}>
        {label}
      </span>
    </div>
  );
}
