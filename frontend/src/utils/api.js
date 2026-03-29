/**
 * API utility — communicates with Flask backend
 */

// Use window.location.origin to ensure absolute URLs in production, avoiding ERR_ABORTED issues
const API_BASE = (typeof window !== 'undefined' ? window.location.origin : '') + '/api';

export async function fetchNewsSummary(query, role, domain = 'all', language = 'English', location = 'Global') {
  console.log(`[API] Fetching summary for: ${query} from ${API_BASE}/get-news`);
  try {
    const response = await fetch(`${API_BASE}/get-news`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, role, domain, language, location }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API Error] Status: ${response.status}, Body: ${errorText}`);
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    console.error('[API Fetch Fatal]', err);
    throw err;
  }
}

export async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE}/health`);
    return await response.json();
  } catch (err) {
    console.error('[API Health Check Failed]', err);
    return { status: 'offline', error: err.message };
  }
}

export async function fetchLocation() {
  try {
    const response = await fetch(`${API_BASE}/get-location`);
    if (!response.ok) {
      throw new Error(`Location API error: ${response.status}`);
    }
    return await response.json();
  } catch (err) {
    console.error('[API Location Fetch Failed]', err);
    throw err;
  }
}

