import React, { useState } from 'react';

export default function ResponsePanel({ data, isSpeaking, onSpeakToggle, onSave, savedItems }) {
  if (!data) return null;
  const { summary, articles, videos, sources, sentiment, role, query, is_developing, language } = data;
  const [expandedCard, setExpandedCard] = useState(null);
  const [expandedSource, setExpandedSource] = useState(null);
  const [showSources, setShowSources] = useState(false);
  const [showBriefingToast, setShowBriefingToast] = useState(false);

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
    onSave({ query, summary, role, savedAt: new Date().toLocaleTimeString() });
    setShowBriefingToast(true);
    setTimeout(() => setShowBriefingToast(false), 2000);
  };

  const handleCardClick = (e, index, url) => {
    // Card expansion is independent of the link click
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

  const renderSummary = (text) => {
    if (!text) return null;
    
    // Split into bullets and insight using the standardized 'INSIGHT:' delimiter
    const [mainContent, whyItMatters] = text.split(/INSIGHT:/i);
    
    // Split bullets
    const points = mainContent.split('•').map(p => p.trim()).filter(p => p.length > 0);
    
    const insightLabels = {
      English: 'Why it matters',
      Hindi: 'क्यों यह महत्वपूर्ण है',
      Tamil: 'இது ஏன் முக்கியமானது',
      Telugu: 'ఇది ఎందుకు ముఖ్యం'
    };

    return (
      <div className="summary-card__content-wrap">
        {points.length > 0 && (
          <div className="summary-card__bullets">
            {points.map((point, i) => {
              // Flexible regex for **Topic**: details or **Topic** details
              const match = point.match(/^\*\*(.*?)\*\*(?::)?(.*)/);
              if (match) {
                return (
                  <div key={i} className="summary-bullet">
                    <div className="summary-bullet__dot">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m12 14 4-4"></path>
                <path d="M3.34 19a10 10 0 1 1 17.32 0"></path>
              </svg>
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

      {/* AI Summary Card */}
      <div className="summary-card">
        <div className="summary-card__header">
          <div className="summary-card__title-row">
            <span className="summary-card__icon">
              <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="brand-logo-panel">
                <path d="M16 2L2 9V23L16 30L30 23V9L16 2Z" stroke="url(#panel-grad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="rgba(99, 102, 241, 0.1)"/>
                <path d="M16 8V16M16 16L22 20M16 16L10 20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="16" cy="16" r="3" fill="white" />
                <defs>
                  <linearGradient id="panel-grad" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#6366f1"/>
                    <stop offset="1" stopColor="#a855f7"/>
                  </linearGradient>
                </defs>
              </svg>
            </span>
            <span className="summary-card__title">AI Summary</span>
            {roleLabels[role] || <span className="summary-card__role-badge">{role}</span>}
            {is_developing && (
              <span className="badge badge--developing">📡 Developing Story</span>
            )}
            <span className="last-updated">
              <span className="pulse-dot-green"></span>
              Last updated: just now
            </span>
          </div>
          <div className="summary-card__actions">
            <button
              id="speak-btn"
              className={`speak-btn ${isSpeaking ? 'speak-btn--speaking' : ''}`}
              onClick={onSpeakToggle}
              title={isSpeaking ? 'Stop' : 'Read aloud'}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {isSpeaking ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                </svg>
              )}
            </button>
            <button
              className={`save-btn ${isAlreadySaved ? 'save-btn--saved' : ''}`}
              onClick={handleSave}
              title={isAlreadySaved ? 'Already saved' : 'Save to Briefing'}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {isAlreadySaved ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                  <path d="m9 10 2 2 4-4"></path>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path>
                </svg>
              )}
            </button>
          </div>
        </div>

        {renderSummary(summary)}

        {/* Sentiment Badge — Investor only */}
        {sentiment?.label && (
          <div className="sentiment-badge" style={{ '--s-color': sentimentColor[sentiment.score] }}>
            <span className="sentiment-badge__emoji">{sentiment.emoji}</span>
            <span className="sentiment-badge__label">Market Sentiment: {sentiment.label}</span>
          </div>
        )}

        {/* Briefing toast */}
        {showBriefingToast && (
          <div className="briefing-toast">✅ Saved to Briefing!</div>
        )}

        {/* Source transparency */}
        {sources && sources.length > 0 && (
          <div className="sources-section">
            <button
              className="sources-toggle"
              onClick={() => setShowSources(v => !v)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.51a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
              </svg>
              View Sources ({sources.length})
              <span className="sources-toggle__arrow" style={{ marginLeft: 'auto' }}>{showSources ? '▲' : '▼'}</span>
            </button>
            {showSources && (
              <ul className="sources-list">
                {sources.slice(0, 6).map((src, i) => (
                  <li key={i} className="sources-list__item">
                    <div 
                      className="sources-list__link"
                      onClick={(e) => {
                        e.preventDefault();
                        if (src.url && src.url !== '#') {
                          window.open(src.url, '_blank', 'noopener,noreferrer');
                        }
                      }}
                      style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <span className="sources-list__dot" style={{ flexShrink: 0 }} />
                        <span className="sources-list__source" style={{ marginLeft: '6px', fontWeight: 600, color: 'var(--accent)' }}>{src.source}</span>
                        <span className="sources-list__title" style={{ marginLeft: '8px', color: 'var(--text-secondary)' }}>{src.title}</span>
                      </div>
                      
                      {expandedSource === i && (
                        <div className="sources-list__expanded" style={{ marginTop: '8px', paddingLeft: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          <p style={{ marginBottom: '6px' }}>{src.description || "No description available for this source."}</p>
                          <span style={{ color: 'var(--accent)', fontWeight: 500 }}>Read full article →</span>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Top Stories Grid */}
      {articles && articles.length > 0 && (
        <div className="news-section">
          <h2 className="news-section__title">
            <span className="news-section__icon">📰</span>
            Top stories
          </h2>
          <div className="news-grid">
            {articles.map((article, i) => (
              <div
                key={i}
                className={`news-card ${i === 0 ? 'news-card--featured' : ''} ${expandedCard === i ? 'news-card--expanded' : ''}`}
                id={`news-card-${i}`}
                onClick={(e) => handleCardClick(e, i, article.url)}
                role="button"
                tabIndex={0}
              >
                <div className="news-card__image-wrap">
                  {article.image ? (
                    <img src={article.image} alt={article.title} className="news-card__image" loading="lazy"
                      onError={(e) => { e.target.style.display = 'none'; }} />
                  ) : (
                    <div className="news-card__image-placeholder">📰</div>
                  )}
                </div>
                <div className="news-card__content">
                  <div className="news-card__source">
                    <span className="news-card__source-dot"></span>
                    <span>{article.source}</span>
                    {article.timeAgo && <span className="news-card__time-inline">• {article.timeAgo}</span>}
                  </div>
                  <h3 className="news-card__title">{article.title}</h3>
                  {expandedCard === i && (
                    <div className="news-card__expanded">
                      {article.description && <p className="news-card__description">{article.description}</p>}
                      {article.url && article.url !== '#' && (
                        <a href={article.url} target="_blank" rel="noopener noreferrer"
                          className="news-card__read-more" onClick={(e) => {
                            e.stopPropagation();
                          }}>
                          Read full article on {article.source} →
                        </a>
                      )}
                    </div>
                  )}
                  {expandedCard !== i && article.timeAgo && (
                    <span className="news-card__time">{article.timeAgo}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related Videos Section */}
      {videos && videos.length > 0 && (
        <div className="videos-section">
          <h2 className="news-section__title">
            <span className="news-section__icon">🎬</span>
            Related Videos
          </h2>
          <div className="videos-grid">
            {videos.map((video, i) => (
              <div key={i} className="video-card" id={`video-card-${i}`}>
                {video.videoId ? (
                  <iframe
                    width="100%"
                    height="160"
                    src={`https://www.youtube.com/embed/${video.videoId}?rel=0`}
                    title={video.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}
                  ></iframe>
                ) : (
                  <a href={video.searchUrl || '#'} target="_blank" rel="noreferrer" className="video-card__thumb-link">
                    <div className="video-card__thumb">
                      {video.thumbnail ? (
                        <img src={video.thumbnail} alt={video.title} className="video-card__thumb-image" loading="lazy" />
                      ) : (
                        <div className="video-card__thumb-placeholder">▶</div>
                      )}
                      <div className="video-card__play">▶</div>
                    </div>
                  </a>
                )}
                <div className="video-card__info">
                  <span className="video-card__title">{video.title}</span>
                  <span className="video-card__label">YouTube Video</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
