/**
 * Speech utility — Web Speech API wrappers
 */

// --- Voice Input (Speech Recognition) ---

const SpeechRecognition = typeof window !== 'undefined'
  ? window.SpeechRecognition || window.webkitSpeechRecognition
  : null;

export function isSpeechSupported() {
  return !!SpeechRecognition;
}

export function startListening(onResult, onError, onEnd, language = 'English') {
  if (!SpeechRecognition) {
    onError?.('Speech recognition not supported in this browser.');
    return null;
  }

  const langMap = {
    'English': 'en-US',
    'Hindi': 'hi-IN',
    'Tamil': 'ta-IN',
    'Telugu': 'te-IN',
    'Malayalam': 'ml-IN',
    'Kannada': 'kn-IN',
    'Bengali': 'bn-IN',
    'Marathi': 'mr-IN',
    'Gujarati': 'gu-IN',
    'Odia': 'or-IN',
    'Urdu': 'ur-IN'
  };

  const recognition = new SpeechRecognition();
  recognition.lang = langMap[language] || 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.continuous = false;

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    onResult?.(transcript);
  };

  recognition.onerror = (event) => {
    console.warn('[Speech Error]', event.error);
    onError?.(event.error);
  };

  recognition.onend = () => {
    onEnd?.();
  };

  recognition.start();
  return recognition;
}

// --- Voice Output (Text-to-Speech) ---

export function speakText(text, onEnd, language = 'English') {
  if (!window.speechSynthesis) return;

  const langMap = {
    'English': 'en-US',
    'Hindi': 'hi-IN',
    'Tamil': 'ta-IN',
    'Telugu': 'te-IN',
    'Malayalam': 'ml-IN',
    'Kannada': 'kn-IN',
    'Bengali': 'bn-IN',
    'Marathi': 'mr-IN',
    'Gujarati': 'gu-IN',
    'Odia': 'or-IN',
    'Urdu': 'ur-IN'
  };

  const targetLang = langMap[language] || 'en-US';

  // Clean text: remove Markdown bolding and special chars that confuse TTS
  const cleanText = text
    .replace(/\*\*/g, '')
    .replace(/•/g, '')
    .replace(/\[|\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = targetLang;
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.volume = 1;

  // Find best voice for language
  let voices = window.speechSynthesis.getVoices();
  let langCode = langMap[language] || 'en-US';

  // Voice Selection Strategy: Prioritize 'Google' or 'Microsoft' natural voices
  let selectedVoice = voices.find(v => v.lang === langCode && v.name.includes('Google')) ||
                      voices.find(v => v.lang === langCode && v.name.includes('Microsoft')) ||
                      voices.find(v => v.lang.startsWith(langCode.split('-')[0])) ||
                      voices[0];

  utterance.voice = selectedVoice;
  utterance.lang = langCode;

  // Pronunciation Tuning for regional languages
  if (language !== 'English') {
    utterance.rate = 0.92; // Slightly slower for better clarity
    utterance.pitch = 1.05; // Slightly higher for more natural sound
  } else {
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
  }

  utterance.onstart = () => { window.isSpeaking = true; };
  utterance.onend = () => {
    window.isSpeaking = false;
    onEnd?.();
  };

  // Cancel any ongoing speech before starting a new one
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

export function isSpeaking() {
  return window.speechSynthesis?.speaking ?? false;
}
