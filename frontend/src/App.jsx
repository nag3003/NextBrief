import React, { useState, useCallback, useRef, useEffect } from 'react';
import RoleSelector from './components/RoleSelector';
import MicButton from './components/MicButton';
import TextFallback from './components/TextFallback';
import ResponsePanel from './components/ResponsePanel';
import { fetchNewsSummary, fetchLocation } from './utils/api';
import { startListening, speakText, stopSpeaking } from './utils/speech';

// Dynamic suggestions per role
const ROLE_SUGGESTIONS = {
  all: [
    { icon: '🌐', text: 'Global breaking news' },
    { icon: '🚀', text: 'Latest technology trends' },
    { icon: '📈', text: 'Market overview' },
    { icon: '💡', text: 'Innovative startups' },
    { icon: '🩺', text: 'Health and science discoveries' },
    { icon: '🌱', text: 'Climate and sustainability' },
  ],
  student: [
    { icon: '🤖', text: 'Latest AI research breakthroughs' },
    { icon: '💼', text: 'Internship trends in tech 2025' },
    { icon: '📚', text: 'Top universities for computer science' },
    { icon: '🎓', text: 'Scholarship opportunities this year' },
    { icon: '🌐', text: 'How blockchain is used in education' },
    { icon: '🧬', text: 'New discoveries in biotech' },
  ],
  investor: [
    { icon: '📈', text: 'Stock market trends today' },
    { icon: '💰', text: 'Fed interest rate decision impact' },
    { icon: '🏦', text: 'Banking sector earnings reports' },
    { icon: '⚡', text: 'EV sector volatility and outlook' },
    { icon: '🪙', text: 'Crypto market sentiment analysis' },
    { icon: '🛢️', text: 'Oil price movement and geopolitics' },
  ],
  founder: [
    { icon: '🚀', text: 'Latest AI startup funding news' },
    { icon: '💡', text: 'Breakthrough technology innovations' },
    { icon: '🏆', text: 'Y Combinator W25 batch highlights' },
    { icon: '🌍', text: 'Global startup ecosystem trends' },
    { icon: '🤝', text: 'Big tech acquisition news this week' },
    { icon: '🔒', text: 'Cybersecurity startup opportunities' },
  ],
};

const LANGUAGE_OPTIONS = [
  { id: 'English', text: 'EN' },
  { id: 'Hindi', text: 'HI' },
  { id: 'Tamil', text: 'TA' },
  { id: 'Telugu', text: 'TE' },
  { id: 'Malayalam', text: 'ML' },
  { id: 'Kannada', text: 'KN' },
  { id: 'Bengali', text: 'BN' },
  { id: 'Marathi', text: 'MR' },
  { id: 'Gujarati', text: 'GU' },
  { id: 'Odia', text: 'OD' },
  { id: 'Urdu', text: 'UR' },
];

const I18N = {
  English: {
    roles: { all: 'All', student: 'Student', investor: 'Investor', founder: 'Founder' },
    domains: {
      all: 'Home',
      india: 'India',
      world: 'World',
      local: 'Local',
      business: 'Business',
      technology: 'Tech',
      entertainment: 'Arts',
      sports: 'Sports',
      science: 'Science',
      health: 'Health'
    },
    mic: { initial: 'Tap to ask', listening: 'Listening...', processing: 'Processing...' },
    btn: { ask: 'Ask AI', briefing: 'Briefings' },
    locating: 'Fetching location...',
    modeActive: 'MODE ACTIVE',
    yourQuery: 'Your Query',
    tryAs: 'Try asking as',
    global: 'Global',
    weather: 'Weather',
    placeholder: 'Type your news query...',
  },
  Hindi: {
    roles: { all: 'सब', student: 'छात्र', investor: 'निवेशक', founder: 'संस्थापक' },
    domains: {
      all: 'होम',
      india: 'भारत',
      world: 'दुनिया',
      local: 'स्थानीय',
      business: 'बिज़नेस',
      technology: 'टेक',
      entertainment: 'मनोरंजन',
      sports: 'खेल',
      science: 'विज्ञान',
      health: 'स्वास्थ्य'
    },
    mic: { initial: 'पूछने के लिए टैप करें', listening: 'सुन रहा हूँ...', processing: 'प्रक्रिया जारी है...' },
    btn: { ask: 'AI से पूछें', briefing: 'ब्रीफिंग' },
    placeholder: 'अपनी न्यूज़ क्वेरी टाइप करें...',
    locating: 'लोकेशन खोज रहे हैं...',
    modeActive: 'सक्रिय मोड',
    yourQuery: 'आपकी क्वेरी',
    tryAs: 'इस रूप में पूछें',
    global: 'वैश्विक',
    weather: 'मौसम',
  },
  Tamil: {
    roles: { all: 'அனைத்தும்', student: 'மாணவர்', investor: 'முதலீட்டாளர்', founder: 'நிறுவனர்' },
    domains: {
      all: 'முகப்பு',
      india: 'இந்தியா',
      world: 'உலகம்',
      local: 'உள்ளூர்',
      business: 'வணிகம்',
      technology: 'தொழில்நுட்பம்',
      entertainment: 'கலைகள்',
      sports: 'விளையாட்டு',
      science: 'அறிவியல்',
      health: 'சுகாதாரம்'
    },
    mic: { initial: 'கேட்க தட்டவும்', listening: 'கேட்கிறது...', processing: 'செயலாக்குகிறது...' },
    btn: { ask: 'AI கேட்க', briefing: 'சுருக்கங்கள்' },
    placeholder: 'செய்தி வினவலைத் தட்டச்சு செய்க...',
    locating: 'இருப்பிடத்தைக் கண்டறியும்...',
    modeActive: 'செயலில் உள்ள பயன்முறை',
    yourQuery: 'உங்கள் வினவல்',
    tryAs: 'இவ்வாறு கேட்கவும்',
    global: 'உலகளாவிய',
    weather: 'வானிலை',
  },
  Telugu: {
    roles: { all: 'అన్నీ', student: 'విద్యార్థి', investor: 'పెట్టుబడిదారుడు', founder: 'వ్యవస్థాపకుడు' },
    domains: {
      all: 'హోమ్',
      india: 'భారతదేశం',
      world: 'ప్రపంచం',
      local: 'స్థానిక',
      business: 'వ్యాపారం',
      technology: 'సాంకేతికత',
      entertainment: 'వినోదం',
      sports: 'క్రీడలు',
      science: 'సైన్స్',
      health: 'ఆరోగ్యం'
    },
    mic: { initial: 'అడగడానికి నొక్కండి', listening: 'వింటున్నాను...', processing: 'ప్రాసెస్ చేస్తోంది...' },
    btn: { ask: 'AI ని అడగండి', briefing: 'బ్రీఫింగ్‌లు' },
    placeholder: 'మీ వార్తా ప్రశ్నను టైప్ చేయండి...',
    locating: 'స్థానాన్ని కనుగొంటోంది...',
    modeActive: 'యాక్టివ్ మోడ్',
    yourQuery: 'మీ ప్రశ్న',
    tryAs: 'ఇలా అడగండి',
    global: 'ప్రపంచ',
    weather: 'వాతావరణం',
  },
  Malayalam: {
    roles: { all: 'എല്ലാം', student: 'വിദ്യാർത്ഥി', investor: 'നിക്ഷേപകൻ', founder: 'സ്ഥാപകൻ' },
    domains: {
      all: 'ഹോം',
      india: 'ഇന്ത്യ',
      world: 'ലോകം',
      local: 'പ്രാദേശികം',
      business: 'ബിസിനസ്',
      technology: 'സാങ്കേതികം',
      entertainment: 'വിനോദം',
      sports: 'കായികം',
      science: 'ശാസ്ത്രം',
      health: 'ആരോഗ്യം'
    },
    mic: { initial: 'ചോദിക്കാൻ ടാപ്പ് ചെയ്യൂ', listening: 'കേൾക്കുന്നു...', processing: 'പ്രോസസ് ചെയ്യുന്നു...' },
    btn: { ask: 'AI ചോദിക്കൂ', briefing: 'ബ്രീഫിംഗ്' },
    placeholder: 'നിങ്ങളുടെ വാർത്താ ചോദ്യം ടൈപ്പ് ചെയ്യൂ...',
    locating: 'ലൊക്കേഷൻ കണ്ടെത്തുന്നു...',
    modeActive: 'ആക്ടീവ് മോഡ്',
    yourQuery: 'നിങ്ങളുടെ ചോദ്യം',
    tryAs: 'ഇങ്ങനെ ചോദിക്കൂ',
    global: 'ആഗോളം',
    weather: 'കാലാവസ്ഥ',
  },
  Kannada: {
    roles: { all: 'ಎಲ್ಲಾ', student: 'ವಿದ್ಯಾರ್ಥಿ', investor: 'ಹೂಡಿಕೆದಾರ', founder: 'ಸಂಸ್ಥಾಪಕ' },
    domains: {
      all: 'ಹೋಮ್',
      india: 'ಭಾರತ',
      world: 'ವಿಶ್ವ',
      local: 'ಸ್ಥಳೀಯ',
      business: 'ವ್ಯಾಪಾರ',
      technology: 'ತಂತ್ರಜ್ಞಾನ',
      entertainment: 'ಮನರಂಜನೆ',
      sports: 'ಕ್ರೀಡೆ',
      science: 'ವಿಜ್ಞಾನ',
      health: 'ಆರೋಗ್ಯ'
    },
    mic: { initial: 'ಕೇಳಲು ಟ್ಯಾಪ್ ಮಾಡಿ', listening: 'ಕೇಳುತ್ತಿದೆ...', processing: 'ಪ್ರಕ್ರಿಯೆಗೊಳಿಸುತ್ತಿದೆ...' },
    btn: { ask: 'AI ಕೇಳಿ', briefing: 'ಬ್ರೀಫಿಂಗ್' },
    placeholder: 'ನಿಮ್ಮ ಸುದ್ದಿ ಪ್ರಶ್ನೆಯನ್ನು ಟೈಪ್ ಮಾಡಿ...',
    locating: 'ಸ್ಥಳವನ್ನು ಕಂಡುಹಿಡಿಯುತ್ತಿದೆ...',
    modeActive: 'ಆಕ್ಟಿವ್ ಮೋಡ್',
    yourQuery: 'ನಿಮ್ಮ ಪ್ರಶ್ನೆ',
    tryAs: 'ಹೀಗೆ ಕೇಳಿ',
    global: 'ಜಾಗತಿಕ',
    weather: 'ಹವಾಮಾನ',
  },
  Bengali: {
    roles: { all: 'সকল', student: 'শিক্ষার্থী', investor: 'বিনিয়োগকারী', founder: 'প্রতিষ্ঠাতা' },
    domains: {
      all: 'হোম',
      india: 'ভারত',
      world: 'বিশ্ব',
      local: 'স্থানীয়',
      business: 'ব্যবসা',
      technology: 'প্রযুক্তি',
      entertainment: 'বিনোদন',
      sports: 'খেলা',
      science: 'বিজ্ঞান',
      health: 'স্বাস্থ্য'
    },
    mic: { initial: 'জিজ্ঞাসা করতে ট্যাপ করুন', listening: 'শুনছি...', processing: 'প্রক্রিয়া করছি...' },
    btn: { ask: 'AI জিজ্ঞাসা', briefing: 'ব্রিফিং' },
    placeholder: 'আপনার সংবাদ প্রশ্ন টাইপ করুন...',
    locating: 'অবস্থান খুঁজছি...',
    modeActive: 'সক্রিয় মোড',
    yourQuery: 'আপনার প্রশ্ন',
    tryAs: 'এভাবে জিজ্ঞাসা করুন',
    global: 'বৈশ্বিক',
    weather: 'আবহাওয়া',
  },
  Marathi: {
    roles: { all: 'सर्व', student: 'विद्यार्थी', investor: 'गुंतवणूकदार', founder: 'संस्थापक' },
    domains: {
      all: 'होम',
      india: 'भारत',
      world: 'जग',
      local: 'स्थानिक',
      business: 'व्यवसाय',
      technology: 'तंत्रज्ञान',
      entertainment: 'मनोरंजन',
      sports: 'खेळ',
      science: 'विज्ञान',
      health: 'आरोग्य'
    },
    mic: { initial: 'विचारण्यासाठी टॅप करा', listening: 'ऐकत आहे...', processing: 'प्रक्रिया सुरू...' },
    btn: { ask: 'AI ला विचारा', briefing: 'ब्रीफिंग' },
    placeholder: 'तुमचा बातम्यांचा प्रश्न टाइप करा...',
    locating: 'स्थान शोधत आहे...',
    modeActive: 'सक्रिय मोड',
    yourQuery: 'तुमचा प्रश्न',
    tryAs: 'असे विचारा',
    global: 'जागतिक',
    weather: 'हवामान',
  },
  Gujarati: {
    roles: { all: 'બધા', student: 'વિદ્યાર્થી', investor: 'રોકાણકાર', founder: 'સ્થાપક' },
    domains: {
      all: 'હોમ',
      india: 'ભારત',
      world: 'વિશ્વ',
      local: 'સ્થાનિક',
      business: 'બિઝનેસ',
      technology: 'ટેક્નોલોજી',
      entertainment: 'મનોરંજન',
      sports: 'રમતગમત',
      science: 'વિજ્ઞાન',
      health: 'આરોગ્ય'
    },
    mic: { initial: 'પૂછવા માટે ટેપ કરો', listening: 'સાંભળી રહ્યું છે...', processing: 'પ્રક્રિયા ચાલુ છે...' },
    btn: { ask: 'AI ને પૂછો', briefing: 'બ્રીફિંગ' },
    placeholder: 'તમારો સમાચાર પ્રશ્ન ટાઇપ કરો...',
    locating: 'સ્થાન શોધી રહ્યું છે...',
    modeActive: 'સક્રિય મોડ',
    yourQuery: 'તમારો પ્રશ્ન',
    tryAs: 'આ રીતે પૂછો',
    global: 'વૈશ્વિક',
    weather: 'હવામાન',
  },
  Odia: {
    roles: { all: 'ସବୁ', student: 'ଛାତ୍ର', investor: 'ନିବେଶକ', founder: 'ପ୍ରତିଷ୍ଠାତା' },
    domains: {
      all: 'ହୋମ',
      india: 'ଭାରତ',
      world: 'ବିଶ୍ୱ',
      local: 'ସ୍ଥାନୀୟ',
      business: 'ବ୍ୟବସାୟ',
      technology: 'ପ୍ରଯୁକ୍ତି',
      entertainment: 'ମନୋରଞ୍ଜନ',
      sports: 'କ୍ରୀଡ଼ା',
      science: 'ବିଜ୍ଞାନ',
      health: 'ସ୍ୱାସ୍ଥ୍ୟ'
    },
    mic: { initial: 'ପଚାରିବାକୁ ଟାପ୍ କରନ୍ତୁ', listening: 'ଶୁଣୁଛି...', processing: 'ପ୍ରକ୍ରିୟା ଚାଲୁଅଛି...' },
    btn: { ask: 'AI ପଚାରନ୍ତୁ', briefing: 'ବ୍ରିଫିଂ' },
    placeholder: 'ଆପଣଙ୍କ ସମାଚାର ପ୍ରଶ୍ନ ଟାଇପ୍ କରନ୍ତୁ...',
    locating: 'ସ୍ଥାନ ଖୋଜୁଛି...',
    modeActive: 'ସକ୍ରିୟ ମୋଡ',
    yourQuery: 'ଆପଣଙ୍କ ପ୍ରଶ୍ନ',
    tryAs: 'ଏପରି ପଚାରନ୍ତୁ',
    global: 'ବୈଶ୍ୱିକ',
    weather: 'ପାଣିପାଗ',
  },
  Urdu: {
    roles: { all: 'سب', student: 'طالب علم', investor: 'سرمایہ کار', founder: 'بانی' },
    domains: {
      all: 'ہوم',
      india: 'بھارت',
      world: 'دنیا',
      local: 'مقامی',
      business: 'کاروبار',
      technology: 'ٹیکنالوجی',
      entertainment: 'تفریح',
      sports: 'کھیل',
      science: 'سائنس',
      health: 'صحت'
    },
    mic: { initial: 'پوچھنے کے لیے ٹیپ کریں', listening: 'سن رہا ہوں...', processing: 'عمل جاری ہے...' },
    btn: { ask: 'AI سے پوچھیں', briefing: 'بریفنگ' },
    placeholder: 'اپنا خبروں کا سوال ٹائپ کریں...',
    locating: 'مقام تلاش کر رہا ہے...',
    modeActive: 'فعال موڈ',
    yourQuery: 'آپ کا سوال',
    tryAs: 'اس طرح پوچھیں',
    global: 'عالمی',
    weather: 'موسم',
  }
};

const ROLES = [
  { id: 'all', icon: '🌍' },
  { id: 'student', icon: '🎓' },
  { id: 'investor', icon: '💼' },
  { id: 'founder', icon: '🚀' },
];

const DOMAINS = [
  { id: 'all' },
  { id: 'india' },
  { id: 'world' },
  { id: 'local' },
  { id: 'business' },
  { id: 'technology' },
  { id: 'entertainment' },
  { id: 'sports' },
  { id: 'science' },
  { id: 'health' },
];

export default function App() {
  const [role, setRole] = useState('all');
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState('');
  const [savedItems, setSavedItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('newsai-briefing') || '[]'); }
    catch { return []; }
  });

  const [location, setLocation] = useState(() => {
    try { return localStorage.getItem('newsai-location') || ''; }
    catch { return ''; }
  });
  const [weather, setWeather] = useState(null);
  const [domain, setDomain] = useState('all');
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [showSaved, setShowSaved] = useState(false);
  const [locationLoading, setLocationLoading] = useState(true);
  const geoFetchedRef = useRef(false);

  const recognitionRef = useRef(null);

  // Helper to update location + persist it
  const updateLocation = useCallback((loc) => {
    setLocation(loc);
    try { localStorage.setItem('newsai-location', loc); } catch {}
  }, []);

  // --- Fetch Weather ---
  const fetchWeather = useCallback(async (loc) => {
    try {
      let city;
      if (!loc || loc === 'Global' || loc === '') {
        // Use IP-based location for weather when geolocation is denied
        try {
          const ipRes = await fetch('https://ipapi.co/json/');
          const ipData = await ipRes.json();
          city = ipData.city || 'Hyderabad';
          if (ipData.city) {
            const ipLocation = [ipData.city, ipData.region, ipData.country_name].filter(Boolean).join(', ');
            updateLocation(ipLocation);
          }
        } catch {
          city = 'Hyderabad';
        }
      } else {
        city = loc.split(',')[0].trim();
      }
      const res = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);
      const data = await res.json();
      const current = data.current_condition[0];
      setWeather({
        temp: current.temp_C,
        desc: current.weatherDesc[0].value,
        city: city,
      });
    } catch (e) {
      console.warn('[Weather Error]', e);
    }
  }, []);

  // --- Fetch news from backend ---
  // overrideDomain lets category clicks pass the NEW domain immediately
  const handleQuery = useCallback(async (q, overrideLoc = location, overrideDomain) => {
    const activeDomain = overrideDomain || domain;
    const activeLoc = overrideLoc || location;
    const city = activeLoc.split(',')[0].trim();

    // Build a smart query: if user typed nothing, derive from domain + location
    const DOMAIN_QUERIES = {
      all: city !== 'Global' ? `latest news near ${city}` : 'latest news',
      india: 'India latest news today',
      world: 'world international news today',
      local: `${activeLoc} local news today`,
      business: city !== 'Global' ? `business finance news ${city}` : 'business finance market news',
      technology: 'technology AI software news',
      entertainment: city !== 'Global' ? `entertainment arts news ${city}` : 'entertainment movies arts news',
      sports: city !== 'Global' ? `sports news ${city}` : 'sports cricket football news',
      science: 'science space research news',
      health: 'health medical wellness news',
    };
    const finalQ = q || DOMAIN_QUERIES[activeDomain] || 'latest news';

    setQuery(finalQ);
    setError('');
    setLoading(true);
    setResponse(null);
    stopSpeaking();
    setSpeaking(false);

    try {
      const data = await fetchNewsSummary(finalQ, role, activeDomain, selectedLanguage, activeLoc);
      setResponse(data);
      if (data.summary) {
        setSpeaking(true);
        speakText(data.summary, () => setSpeaking(false), selectedLanguage);
      }
    } catch (err) {
      console.error('[Fetch Error]', err);
      setError('Could not reach the AI backend. Make sure Flask is running on port 5001.');
    } finally {
      setLoading(false);
    }
  }, [role, location, domain, selectedLanguage]);

  // --- Resolve location via IP as fallback ---
  const resolveLocationViaIP = useCallback(async () => {
    try {
      const data = await fetchLocation();
      if (data.city) {
        const ipLocation = [data.city, data.region, data.country_name].filter(Boolean).join(', ');
        return ipLocation;
      }
    } catch { /* silent */ }
    return 'India';
  }, []);

  // --- Refresh location on demand ---
  const refreshLocation = useCallback(async () => {
    setLocationLoading(true);
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const lat = position.coords.latitude;
              const lon = position.coords.longitude;
              const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
              const data = await res.json();
              const parts = [data.city, data.principalSubdivision, data.countryName].filter(Boolean);
              const exactLocation = parts.length > 0 ? parts.join(', ') : 'Global';
              updateLocation(exactLocation);
              fetchWeather(exactLocation);
              handleQuery('', exactLocation);
            } catch {
              const ipLoc = await resolveLocationViaIP();
              updateLocation(ipLoc);
              fetchWeather(ipLoc);
            }
            setLocationLoading(false);
          },
          async () => {
            // Geolocation denied — use IP fallback
            const ipLoc = await resolveLocationViaIP();
            updateLocation(ipLoc);
            fetchWeather(ipLoc);
            handleQuery('', ipLoc);
            setLocationLoading(false);
          },
          { timeout: 8000 }
        );
      } else {
        const ipLoc = await resolveLocationViaIP();
        updateLocation(ipLoc);
        fetchWeather(ipLoc);
        setLocationLoading(false);
      }
    } catch {
      setLocationLoading(false);
    }
  }, [updateLocation, fetchWeather, handleQuery, resolveLocationViaIP]);

  // --- Geolocation on mount ---
  useEffect(() => {
    if (geoFetchedRef.current) return;
    geoFetchedRef.current = true;

    const cachedLoc = location; // from localStorage init

    // Always resolve real location — never show "Global"
    const startWithLocation = async () => {
      let resolvedLoc = cachedLoc;

      // If no cached location, resolve via IP immediately
      if (!cachedLoc || cachedLoc === 'Global' || cachedLoc === '') {
        setLocationLoading(true);
        resolvedLoc = await resolveLocationViaIP();
        if (resolvedLoc && resolvedLoc !== 'Global') {
          updateLocation(resolvedLoc);
        }
      }

      const useLoc = (resolvedLoc && resolvedLoc !== 'Global') ? resolvedLoc : 'India';
      if (!cachedLoc) updateLocation(useLoc);
      handleQuery('latest news', useLoc);
      fetchWeather(useLoc);
      setLocationLoading(false);
    };

    startWithLocation();

    // Then try to get fresh precise GPS location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
            const data = await res.json();

            const parts = [data.city, data.principalSubdivision, data.countryName].filter(Boolean);
            const exactLocation = parts.length > 0 ? parts.join(', ') : 'Global';

            if (exactLocation !== 'Global' && exactLocation !== cachedLoc) {
              updateLocation(exactLocation);
              fetchWeather(exactLocation);
              handleQuery(query || 'latest news', exactLocation);
            }
          } catch (e) {
            console.warn('[Location Error]', e);
          }
        },
        async () => {
          // Geolocation denied — try IP fallback if no cache
          if (!cachedLoc || cachedLoc === 'Global') {
            const ipLoc = await resolveLocationViaIP();
            if (ipLoc !== 'Global') {
              updateLocation(ipLoc);
              fetchWeather(ipLoc);
              handleQuery('latest news', ipLoc);
            }
          }
        },
        { timeout: 8000 }
      );
    } else if (!cachedLoc || cachedLoc === 'Global') {
      // No geolocation API — use IP
      resolveLocationViaIP().then(ipLoc => {
        if (ipLoc !== 'Global') {
          updateLocation(ipLoc);
          fetchWeather(ipLoc);
        }
      });
    }
  }, [handleQuery, fetchWeather, query, updateLocation, resolveLocationViaIP]);

  // --- Mic toggle ---
  const handleMicToggle = useCallback(() => {
    if (listening) {
      recognitionRef.current?.abort();
      setListening(false);
      return;
    }
    setListening(true);
    setError('');
    recognitionRef.current = startListening(
      (transcript) => { setListening(false); handleQuery(transcript); },
      (err) => {
        setListening(false);
        if (err === 'not-allowed') setError('Microphone access denied.');
      },
      () => setListening(false),
      selectedLanguage
    );
  }, [listening, handleQuery, selectedLanguage]);

  // --- TTS toggle ---
  const handleSpeakToggle = useCallback(() => {
    if (speaking) { stopSpeaking(); setSpeaking(false); }
    else if (response?.summary) { setSpeaking(true); speakText(response.summary, () => setSpeaking(false), selectedLanguage); }
  }, [speaking, response, selectedLanguage]);

  // --- Save to Briefing ---
  const handleSave = useCallback((item) => {
    const isAlreadySaved = savedItems.some(s => s.query === item.query);
    const updated = isAlreadySaved
      ? savedItems.filter(s => s.query !== item.query)
      : [item, ...savedItems].slice(0, 10);
    setSavedItems(updated);
    localStorage.setItem('newsai-briefing', JSON.stringify(updated));
  }, [savedItems]);

  // Build location-aware suggestions
  const city = location.split(',')[0].trim();
  const baseSuggestions = ROLE_SUGGESTIONS[role] || ROLE_SUGGESTIONS.all;
  const locationSuggestions = (city && city !== 'Global') ? [
    { icon: '📍', text: `Latest news in ${city}` },
    { icon: '🏙️', text: `What's happening in ${city} today` },
    ...baseSuggestions.slice(0, 4),
  ] : baseSuggestions;
  const suggestions = locationSuggestions;

  return (
    <>
      <header className="header">
        <div className="header__brand">
          <div className="header__icon">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="premium-logo">
              <path d="M16 2L2 9V23L16 30L30 23V9L16 2Z" stroke="url(#brand-grad)" strokeWidth="2.5" fill="rgba(99, 102, 241, 0.1)" />
              <path d="M16 8V16M16 16L22 20M16 16L10 20" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <circle cx="16" cy="16" r="3" fill="white">
                <animate attributeName="opacity" values="0.5;1;0.5" dur="3s" repeatCount="indefinite" />
              </circle>
              <defs>
                <linearGradient id="brand-grad" x1="2" y1="2" x2="30" y2="30">
                  <stop stopColor="#6366f1" /><stop offset="1" stopColor="#a855f7" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div>
            <div className="header__title">NexBrief</div>
            <div className="header__subtitle">Next-Gen News Instantly.</div>
          </div>
        </div>

        <div className="header__right">
          {weather && (
            <div className="weather-widget">
              <span className="weather-temp">{weather.temp}°C</span>
              <span className="weather-desc">{weather.desc}</span>
              <span className="weather-city">📍 {weather.city}</span>
            </div>
          )}

          <button className="briefing-button" onClick={() => setShowSaved(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="4" width="18" height="11" rx="2" />
              <path d="M7 19h10M12 15v4" />
            </svg>
            {I18N[selectedLanguage].btn.briefing}
            {savedItems.length > 0 && <span className="briefing-count">{savedItems.length}</span>}
          </button>

          <div className="language-selector">
            {LANGUAGE_OPTIONS.map((lang) => (
              <button key={lang.id} className={`lang-btn ${selectedLanguage === lang.id ? 'active' : ''}`} onClick={() => setSelectedLanguage(lang.id)}>
                {lang.text}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="main">
        <div className="glass-filter-block">
          {/* Role Selector */}
          <div className="role-pill-container">
            {ROLES.map((r) => (
              <button key={r.id} className={`role-btn ${role === r.id ? 'active' : ''}`} onClick={() => { setRole(r.id); setResponse(null); }}>
                <span className="role-icon">{r.icon}</span>
                <span className="role-label">{I18N[selectedLanguage].roles[r.id]}</span>
              </button>
            ))}
          </div>

          <div className="filter-divider-horizontal" />

          {/* Category Nav (Google News Style) */}
          <nav className="category-nav">
            <div className="category-scroll">
              {DOMAINS.map((d) => (
                <button key={d.id} className={`category-link ${domain === d.id ? 'active' : ''}`} onClick={() => { setDomain(d.id); handleQuery('', location, d.id); }}>
                  {I18N[selectedLanguage].domains[d.id]}
                </button>
              ))}
            </div>
          </nav>
        </div>

        <MicButton isListening={listening} isLoading={loading} onToggle={handleMicToggle}
          label={loading ? I18N[selectedLanguage].mic.processing : (listening ? I18N[selectedLanguage].mic.listening : I18N[selectedLanguage].mic.initial)} />

        <div className="query-input-section">
          <div className="query-box">
            <input type="text" className="query-input" placeholder={I18N[selectedLanguage].placeholder} value={query} onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleQuery()} />
            <button className="ask-btn" onClick={() => handleQuery()} disabled={loading}>{I18N[selectedLanguage].btn.ask}</button>
          </div>
        </div>

        {/* Compact Status Strip */}
        <div className="status-strip">
          <div className="status-strip__item status-strip__location" onClick={refreshLocation} title="Click to refresh location" style={{ cursor: 'pointer' }}>
            {locationLoading ? (
              <span className="location-spinner">⟳</span>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            )}
            <span>{locationLoading ? 'Detecting location...' : (location || 'Detecting location...')}</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ opacity: 0.5 }}>
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
            </svg>
          </div>
          {domain !== 'all' && (
            <div className="status-strip__domain">
              {I18N[selectedLanguage].domains[domain]}
            </div>
          )}
          {selectedLanguage !== 'English' && (
            <div className="status-strip__item">
              <span>🌐</span>
              <span>{selectedLanguage}</span>
            </div>
          )}
        </div>

        {error && <div className="alert-error"><span>⚠️</span> {error}</div>}

        {query && !loading && (
          <div className="query-display">
            <div className="query-display__label">{I18N[selectedLanguage].yourQuery}</div>
            <div className="query-display__text">"{query}"</div>
          </div>
        )}

        <ResponsePanel data={response} isSpeaking={speaking} onSpeakToggle={handleSpeakToggle} onSave={handleSave} savedItems={savedItems} />

        {!response && !loading && (
          <div className="preload-section">
            <div className="preload-section__label">{I18N[selectedLanguage].tryAs} {I18N[selectedLanguage].roles[role]}</div>
            <div className="preload-grid">
              {suggestions.map((s, i) => (
                <button key={i} className="preload-btn" onClick={() => handleQuery(s.text)}>
                  <span className="preload-btn__icon">{s.icon}</span>
                  {s.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {showSaved && (
          <div className="modal-overlay" onClick={() => setShowSaved(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Saved Briefings</h2>
                <button className="modal-close" onClick={() => setShowSaved(false)}>×</button>
              </div>
              <div className="modal-body">
                {savedItems.length === 0 ? <p>No saved news yet.</p> : (
                  <div className="saved-list">
                    {savedItems.map((item, i) => (
                      <div key={i} className="saved-item" onClick={() => { setShowSaved(false); handleQuery(item.query); }}>
                        <div className="saved-item__header">
                          <span className="saved-item__query">"{item.query}"</span>
                          <button onClick={(e) => { e.stopPropagation(); handleSave(item); }}>🗑️</button>
                        </div>
                        <p className="saved-item__summary">{item.summary}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
