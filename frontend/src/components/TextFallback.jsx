import React, { useState } from 'react';

export default function TextFallback({ onSubmit, disabled }) {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim() && !disabled) {
      onSubmit(text.trim());
      setText('');
    }
  };

  return (
    <div className="text-input-section">
      <form className="text-input-wrapper" onSubmit={handleSubmit}>
        <input
          id="text-input"
          type="text"
          className="text-input"
          placeholder="Type your news query… e.g. latest AI startup funding"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={disabled}
        />
        <button
          id="text-submit"
          type="submit"
          className="text-submit-btn"
          disabled={disabled || !text.trim()}
        >
          Ask AI
        </button>
      </form>
    </div>
  );
}
