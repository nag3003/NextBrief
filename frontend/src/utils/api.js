/**
 * API utility — communicates with Flask backend
 */

const API_BASE = ''; // Vite proxy handles /get-news → localhost:5000

export async function fetchNewsSummary(query, role, domain = 'all', language = 'English') {
  const response = await fetch(`${API_BASE}/get-news`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, role, domain, language }),
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
