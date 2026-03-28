import React, { useState } from 'react';

export default function ResponsePanel({ data, isSpeaking, onSpeakToggle, onSave, savedItems }) {
  if (!data) return null;
  const { enhanced, summary, articles, videos, sources, sentiment, role, query, language } = data;
  const [expandedCard, setExpandedCard] = useState(null);
  const [expandedSource, setExpandedSource] = useState(null);
  const [showSources, setShowSources] = useState(false);
  const [showBriefingToast, setShowBriefingToast] = useState(false);
  const [activeHeadline, setActiveHeadline] = useState(0);

  const roleLabels = { 
    student: (
      <span className="summary-card__role-badge">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
          <path d="M22 10v6M2 10l10-5 10 5-10 5L2 10Z"></path>
          <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
        </svg>
        Student
      </span>
    ), 
    investor: (
      <span className="summary-card__role-badge">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
        </svg>
        Investor
      </span>
    ), 
    founder: (
      <span className="summary-card__role-badge">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
          <path d="M4.5 16.5c-1.5 1.26-2 2.67-2 4.5 0 1 2 2 3 2s3-1 3-2c0-1.83-.5-3.24-2-4.5Z"></path>
          <path d="M10 10V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v5"></path>
          <path d="M7 10v4h10v-4"></path>
          <path d="M16.7 10.7c1.3-1.3 2.1-3.1 2.3-5.2.1-1.1-.9-2-2-2-2.1.2-3.9 1-5.2 2.3"></path>
          <path d="M7.3 10.7c-1.3-1.3-2.1-3.1-2.3-5.2-.1-1.1.9-2 2-2 2.1.2 3.9 1 5.2 2.3"></path>
        </svg>
        Founder
      </span>
    ) 
  };

  const isAlreadySaved = savedItems?.some(s => s.query === query);

  const handleSave = () => {
    onSave({ query, summary: enhanced?.lead || summary, role, savedAt: new Date().toLocaleTimeString() });
    setShowBriefingToast(true);
    setTimeout(() => setShowBriefingToast(false), 2000);
  };

  const handleCardClick = (e, index, url) => {
    if (expandedCard === index) {
      setExpandedCard(null);
    } else {
      setExpandedCard(index);
    }
  };

  const sentimentColor = {
    positive: '#10b981',
    negative: '#ef4444',
    neutral: '#f59e0b',
  };

  const renderEnhancedSummary = (obj) => {
    if (!obj || !obj.headlines) return null;
    const { headlines, lead, key_points, insights } = obj;
    return (
      <div className="enhanced-summary">
        <div className="enhanced-summary__headlines">
          <div className="headline-badge">NEWSRoom</div>
          <h2 className="enhanced-summary__active-title">{headlines && headlines.length > 0 ? headlines[activeHeadline] : 'News Update'}</h2>
          <div className="headline-selector">
            {headlines && Array.isArray(headlines) && headlines.map((_, i) => (
              <button 
                key={i} 
                className={`headline-dot ${i === activeHeadline ? 'active' : ''}`}
                onClick={() => setActiveHeadline(i)}
                title={_}
              />
            ))}
          </div>
        </div>
        <div className="enhanced-summary__lead-container">
          <div className="enhanced-summary__lead">{lead}</div>
          <button 
            className={`tts-button ${isSpeaking ? 'speaking' : ''}`}
            onClick={() => onSpeakToggle(lead)}
            title="Listen to summary"
          >
            {isSpeaking ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5z"></path><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5z"></path></svg>
            )}
          </button>
        </div>
        <div className="enhanced-summary__grid">
          <div className="enhanced-summary__col">
            <h3 className="section-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
              Key Facts
            </h3>
            <ul className="fact-list">
              {key_points && Array.isArray(key_points) && key_points.map((pt, i) => <li key={i} className="fact-item">{pt}</li>)}
            </ul>
          </div>
          <div className="enhanced-summary__col">
            <h3 className="section-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
              Strategic Insights
            </h3>
            <ul className="insight-list">
              {insights && Array.isArray(insights) && insights.map((pt, i) => <li key={i} className="insight-item">{pt}</li>)}
            </ul>
          </div>
        </div>
      </div>
    );
  };

  const renderSummary = (text) => {
    if (!text) return null;
    const [mainContent, whyItMatters] = text.split(/INSIGHT:/i);
    const points = mainContent && typeof mainContent === 'string' ? mainContent.split('•').map(p => p.trim()).filter(p => p.length > 0) : [];
    const insightLabels = { English: 'Why it matters', Hindi: 'क्यों यह महत्वपूर्ण है', Tamil: 'இது ஏன் முக்கியமானது', Telugu: 'ఇది ఎందుకు ముఖ్యం' };
    return (
      <div className="summary-card__content-wrap">
        {points && Array.isArray(points) && points.length > 0 && (
          <div className="summary-card__bullets">
            {points.map((point, i) => {
              const match = point && typeof point === 'string' ? point.match(/^\*\*(.*?)\*\*(?::)?(.*)/) : null;
              if (match) {
                return (
                  <div key={i} className="summary-bullet">
                    <div className="summary-bullet__dot">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    <div className="summary-bullet__content">
                      <span className="summary-bullet__subject">{match[1].replace(/:$/, '')}</span>
                      <span className="summary-bullet__desc">{match[2]}</span>
                    </div>
                  </div>
                );
              }
              return (
                <div key={i} className="summary-bullet">
                  <div className="summary-bullet__dot">•</div>
                  <div className="summary-bullet__content">{point}</div>
                </div>
              );
            })}
          </div>
        )}
        {whyItMatters && (
          <div className="summary-card__insight">
            <div className="summary-card__insight-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 14 4-4"></path><path d="M3.34 19a10 10 0 1 1 17.32 0"></path></svg>
              {insightLabels[language] || insightLabels.English}
            </div>
            <p className="summary-card__insight-text">{whyItMatters.trim()}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="response-container" id="response-panel">
      <div className="summary-card">
        <div className="summary-card__header">
          <div className="summary-card__title-row">
            <span className="summary-card__icon">
              <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="brand-logo-panel">
                <path d="M16 2L2 9V23L16 30L30 23V9L16 2Z" stroke="url(#panel-grad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="rgba(99, 102, 241, 0.1)"/>
                <path d="M16 8V16M16 16L22 20M16 16L10 20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="16" cy="16" r="3" fill="white" />
                <defs><linearGradient id="panel-grad" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse"><stop stopColor="#6366f1"/><stop offset="1" stopColor="#a855f7"/></linearGradient></defs>
              </svg>
            </span>
            <span className="summary-card__title">AI Analysis</span>
            {roleLabels[role] || <span className="summary-card__role-badge">{role}</span>}
            <span className="last-updated"><span className="pulse-dot-green"></span> Live Tracking</span>
          </div>
          <div className="summary-card__actions">
            <button className={`save-btn ${isAlreadySaved ? 'save-btn--saved' : ''}`} onClick={handleSave}>
              {isAlreadySaved ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path><path d="m9 10 2 2 4-4"></path></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path></svg>
              )}
            </button>
          </div>
        </div>
        <div className="summary-card__main-body">
          {enhanced ? renderEnhancedSummary(enhanced) : renderSummary(summary)}
        </div>
        {sentiment?.label && (
          <div className="sentiment-badge" style={{ '--s-color': sentimentColor[sentiment.score] }}>
            <span className="sentiment-badge__emoji">{sentiment.emoji}</span>
            <span className="sentiment-badge__label">Market Bias: {sentiment.label}</span>
          </div>
        )}
        {showBriefingToast && <div className="briefing-toast">✅ Saved!</div>}
        {sources && Array.isArray(sources) && sources.length > 0 && (
          <div className="sources-section">
            <button className="sources-toggle" onClick={() => setShowSources(v => !v)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.51a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
              Sources ({sources.length}) {showSources ? '▲' : '▼'}
            </button>
            {showSources && (
              <ul className="sources-list">
                {sources && Array.isArray(sources) && sources.slice(0, 5).map((src, i) => (
                  <li key={i} className="sources-list__item">
                    <div className="sources-list__link" onClick={() => src.url && window.open(src.url, '_blank')}>
                      <span className="sources-list__source">{src.source}</span> — {src.title}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {articles && articles.length > 0 && (
        <div className="news-section">
          <h2 className="news-section__title">📰 Top Stories</h2>
          <div className="news-grid">
            {articles && Array.isArray(articles) && articles.map((article, i) => (
              <div key={i} className={`news-card ${i === 0 ? 'news-card--featured' : ''} ${expandedCard === i ? 'news-card--expanded' : ''}`} onClick={(e) => handleCardClick(e, i, article.url)}>
                <div className="news-card__image-wrap">
                  {article.image ? <img src={article.image} alt={article.title} className="news-card__image" /> : <div className="news-card__image-placeholder">📰</div>}
                </div>
                <div className="news-card__content">
                  <div className="news-card__source"><span>{article.source}</span></div>
                  <h3 className="news-card__title">{article.title}</h3>
                  {expandedCard === i && (
                    <div className="news-card__expanded">
                      <p>{article.description}</p>
                      {article.url && <a href={article.url} target="_blank" rel="noopener noreferrer" className="news-card__read-more">Read More →</a>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {videos && videos.length > 0 && (
        <div className="videos-section">
          <h2 className="news-section__title">🎬 Related Analysis</h2>
          <div className="videos-grid">
            {videos && Array.isArray(videos) && videos.map((v, i) => (
              <div key={i} className="video-card">
                {v.videoId && <iframe width="100%" height="160" src={`https://www.youtube.com/embed/${v.videoId}`} frameBorder="0" allowFullScreen></iframe>}
                <div className="video-card__info"><span className="video-card__title">{v.title}</span></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
