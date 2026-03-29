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
  recognition.interimResults = true; // Enabled for better responsiveness
  recognition.maxAlternatives = 1;
  recognition.continuous = false;

  let finalTranscript = '';

  recognition.onresult = (event) => {
    let interimTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }
    
    const currentTranscript = finalTranscript || interimTranscript;
    console.log('[Speech Interim] ', currentTranscript);
    
    // Optional: Pass interim results to UI if needed
    // onInterimResult?.(currentTranscript);
  };

  recognition.onspeechend = () => {
    console.log('[Speech] Speech ended, stopping recognition...');
    recognition.stop();
  };

  recognition.onerror = (event) => {
    console.error('[Speech Error]', event.error);
    if (event.error === 'no-speech') {
      console.warn('[Speech Error] No speech detected.');
    } else if (event.error === 'not-allowed') {
      console.error('[Speech Error] Microphone access denied.');
    }
    onError?.(event.error);
  };

  recognition.onend = () => {
    console.log('[Speech End] Final Transcript captured:', finalTranscript);
    if (finalTranscript.trim()) {
      onResult?.(finalTranscript.trim());
    } else {
      console.warn('[Speech End] No transcript captured.');
    }
    onEnd?.();
  };

  recognition.start();
  console.log('[Speech] Recognition started for language:', recognition.lang);
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

  // Handle potential voice loading delay
  const setVoiceAndSpeak = () => {
    let voices = window.speechSynthesis.getVoices();
    let langCode = langMap[language] || 'en-US';

    const preferredFemaleVoices = [
      'Google UK English Female',
      'Google US English',
      'Microsoft Zira',
      'Microsoft Aria',
      'Samantha',
      'Victoria',
      'Karen'
    ];

    let selectedVoice = null;

    if (language === 'English') {
      for (const name of preferredFemaleVoices) {
        const voice = voices.find(v => v.name.includes(name));
        if (voice) { selectedVoice = voice; break; }
      }
    }

    if (!selectedVoice) {
      selectedVoice = voices.find(v => 
        v.lang.startsWith(langCode.split('-')[0]) && 
        v.name.toLowerCase().includes('female')
      );
    }

    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang === langCode && v.name.includes('Google')) ||
                      voices.find(v => v.lang === langCode && v.name.includes('Microsoft')) ||
                      voices.find(v => v.lang.startsWith(langCode.split('-')[0])) ||
                      voices[0];
    }

    utterance.voice = selectedVoice || null;
    utterance.lang = langCode;

    if (language !== 'English') {
      utterance.rate = 0.92;
      utterance.pitch = 1.05;
    } else {
      utterance.rate = 0.95;
      utterance.pitch = 1.05;
    }

    utterance.onstart = () => { window.isSpeaking = true; };
    utterance.onend = () => {
      window.isSpeaking = false;
      onEnd?.();
    };
    utterance.onerror = (event) => {
      console.error('[Speech Error]', event);
      window.isSpeaking = false;
      onEnd?.();
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.addEventListener('voiceschanged', setVoiceAndSpeak, { once: true });
  } else {
    setVoiceAndSpeak();
  }
}

export function stopSpeaking() {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

export function isSpeaking() {
  return window.speechSynthesis?.speaking ?? false;
}
