import { useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const resolveSocketUrl = () => {
  if (typeof window === 'undefined') return null;
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  return isLocal ? 'http://localhost:5002' : null;
};

export const useBreakingNews = (language = 'English', speakFn) => {
  const socket = useCallback(() => {
    const url = resolveSocketUrl();
    if (!url) return null;
    return io(url);
  }, []);

  useEffect(() => {
    const s = socket();
    if (!s) return;

    s.on('connect', () => {
      console.log('[Socket] Connected to breaking news server');
      // Set default location (India for this context)
      s.emit('set-location', 'in');
    });

    s.on('breaking-news', (articles) => {
      if (!articles || !Array.isArray(articles)) {
        console.warn('[Socket] Received invalid breaking news data:', articles);
        return;
      }
      articles.forEach((article) => {
        // 🚨 Notify via Toast
        toast.custom((t) => (
          <div
            className={`breaking-toast ${t.visible ? 'animate-enter' : 'animate-leave'}`}
            onClick={() => window.open(article.url, '_blank')}
          >
            <div className="breaking-toast__badge">BREAKING NEWS</div>
            <div className="breaking-toast__content">
              <p className="breaking-toast__title">{article.title}</p>
              <p className="breaking-toast__source">{article.source.name}</p>
            </div>
          </div>
        ), { duration: 6000 });

        // 🔊 Automated Voice Alert
        if (speakFn) {
          speakFn(article.title, null, language);
        }
      });
    });

    return () => s.disconnect();
  }, [socket, language, speakFn]);
};
