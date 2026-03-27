/**
 * API utility — communicates with Flask backend
 */

const API_BASE = '/api'; // Vite proxy handles /api/get-news -> localhost:5001

export async function fetchNewsSummary(query, role, domain = 'all', language = 'English', location = 'Global') {
  const response = await fetch(`${API_BASE}/get-news`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, role, domain, language, location }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}


export async function checkHealth() {
  const response = await fetch(`${API_BASE}/health`);
  return response.json();
}

export async function fetchLocation() {
  const response = await fetch(`${API_BASE}/get-location`);
  if (!response.ok) {
    throw new Error(`Location API error: ${response.status}`);
  }
  return response.json();
}

