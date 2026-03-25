import React from 'react';

export default function MicButton({ isListening, isLoading, onToggle }) {
  let label = 'Tap to ask';
  if (isLoading) label = 'Processing…';
  else if (isListening) label = 'Listening…';

  const handleMouseMove = (e) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const rotateX = -y / 4;
    const rotateY = x / 4;
    btn.style.transform = `perspective(500px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.1)`;
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
        {(isListening || isLoading) && (
          <>
            <span className="mic-orb__ring mic-orb__ring--1" />
            <span className="mic-orb__ring mic-orb__ring--2" />
            <span className="mic-orb__ring mic-orb__ring--3" />
          </>
        )}

        {/* Siri waveform bars (when listening) */}
        {isListening ? (
          <div className="mic-orb__waveform">
            {[...Array(5)].map((_, i) => (
              <span key={i} className="mic-orb__bar" style={{ animationDelay: `${i * 0.12}s` }} />
            ))}
          </div>
        ) : isLoading ? (
          <div className="mic-orb__spinner">
            <div className="mic-orb__dot" style={{ '--d': '0s' }} />
            <div className="mic-orb__dot" style={{ '--d': '0.2s' }} />
            <div className="mic-orb__dot" style={{ '--d': '0.4s' }} />
          </div>
        ) : (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mic-orb__svg">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            <line x1="12" y1="19" x2="12" y2="22"></line>
          </svg>
        )}
      </button>

      <span className={`mic-label ${isListening ? 'mic-label--listening' : ''} ${isLoading ? 'mic-label--processing' : ''}`}>
        {label}
      </span>
    </div>
  );
}
