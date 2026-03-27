"""
AI Voice News Assistant — Flask Backend
Fetches news via NewsAPI, summarizes with OpenAI GPT, personalized by role.
"""

import os
import requests
import re
import urllib.request
from datetime import datetime, timezone
from urllib.parse import quote_plus
from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# --- Config ---
NEWSAPI_KEY = os.getenv("NEWSAPI_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
NEWSAPI_URL = "https://newsapi.org/v2/everything"

if OPENAI_API_KEY and OPENAI_API_KEY != "your_openai_api_key_here":
    if OPENAI_API_KEY.startswith("sk-or-v1-"):
        client = OpenAI(api_key=OPENAI_API_KEY, base_url="https://openrouter.ai/api/v1")
    else:
        client = OpenAI(api_key=OPENAI_API_KEY)
else:
    client = None

def get_system_prompt(role: str, domain: str, language: str) -> str:
    """Generate a dynamic system prompt based on role, domain, and target language."""
    base = (
        "You are the core intelligence of 'NexBrief,' a high-performance news assistant. "
        f"Target Language: {language}. "
        "Core directives: (1) Neutrality. (2) Brevity (under 100 words). (3) Timeliness. "
    )
    
    role_overlays = {
        "student": "PERSONA: Academic guide. Focus: Learning and global context. Tone: Clear. ",
        "investor": "PERSONA: Financial analyst. Focus: Market movement and ROI. Tone: Data-driven. ",
        "founder": "PERSONA: Strategic advisor. Focus: Innovation and competition. Tone: High-energy. ",
    }
    
    domain_overlays = {
        "stocks": "CONTEXT: You are in 'Stocks Mode'. Focus on tickers, NIFTY/S&P, and fiscal impact. ",
        "ai": "CONTEXT: AI Research mode. Focus on models, chips, and AGI progress. ",
        "energy": "CONTEXT: Energy sector mode. Focus on renewables, oil, and grid infra. ",
        "health": "CONTEXT: Healthcare mode. Focus on biotech, FDA, and longevity. ",
        "startup": "CONTEXT: Startup mode. Focus on funding rounds, pivots, and VC trends. ",
        "india": "CONTEXT: Regional India mode. Focus on national news, policy, and subcontinental trends. ",
        "world": "CONTEXT: International mode. Focus on global diplomacy, major events, and cross-border impact. ",
        "local": "CONTEXT: Hyper-local mode. Focus on community, regional governance, and local sentiment. ",
        "business": "CONTEXT: Business & Finance mode. Focus on earnings, markets, and corporate strategy. ",
        "technology": "CONTEXT: Tech & Innovation mode. Focus on gadgets, software, and digital transformation. ",
        "entertainment": "CONTEXT: Entertainment mode. Focus on cinema, arts, and celebrity news. ",
        "sports": "CONTEXT: Sports mode. Focus on matches, tournaments, and athlete performance. ",
        "science": "CONTEXT: Science mode. Focus on space, physics, and major discoveries. ",
        "all": "CONTEXT: General multi-domain news. ",
    }

    persona = role_overlays.get(role, role_overlays["student"])
    context = domain_overlays.get(domain, domain_overlays["all"])
    
    instruction = (
        f"TASK: Summarize the provided news into EXACTLY 3 bullet points in {language}. "
        "Structure each bullet as: '• **[Topic]:** [Insight]'. "
        f"Then, add a short section titled 'INSIGHT:' in {language} explaining the strategic significance for a {role}. "
        f"Final response MUST be entirely in {language} (except the keyword 'INSIGHT:')."
    )
    
    return base + persona + context + instruction

# --- Hardcoded fallbacks: topic × role matrix for demo safety ---
def _get_fallback(query: str, role: str) -> str:
    """Get a dynamic fallback response when NewsAPI returns nothing and OpenAI is unavailable."""
    clean_query = query.replace(" news", "").replace("latest ", "").strip().title()
    if not clean_query:
        clean_query = "Current Events"
        
    return (
        f"NexBrief Analysis on {clean_query}: We are currently seeing high volatility and rapid shifts in the {clean_query} space. "
        f"For a {role}, it's critical to monitor emerging patterns in {clean_query} and how they intersect with global trends. "
        "Check the related videos below for more context while we refresh the real-time news feed."
    )

def _relative_time(iso_str: str) -> str:
    """Convert ISO timestamp to relative time like '3 hours ago'."""
    try:
        dt = datetime.fromisoformat(iso_str.replace('Z', '+00:00'))
        diff = datetime.now(timezone.utc) - dt
        seconds = int(diff.total_seconds())
        if seconds < 60:
            return "just now"
        if seconds < 3600:
            mins = seconds // 60
            return f"{mins} min{'s' if mins != 1 else ''} ago"
        if seconds < 86400:
            hrs = seconds // 3600
            return f"{hrs} hour{'s' if hrs != 1 else ''} ago"
        days = seconds // 86400
        return f"{days} day{'s' if days != 1 else ''} ago"
    except Exception:
        return ""


def fetch_news(query: str) -> list[dict]:
    """Fetch top 5 articles from NewsAPI."""
    if not NEWSAPI_KEY or NEWSAPI_KEY == "your_newsapi_key_here":
        return []

    try:
        params = {
            "q": query,
            "sortBy": "publishedAt",
            "pageSize": 6,
            "language": "en",
            "apiKey": NEWSAPI_KEY,
        }
        resp = requests.get(NEWSAPI_URL, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()

        articles = []
        for art in data.get("articles", [])[:6]:
            desc = art.get("description", "")
            content = art.get("content", "")
            
            # Use content if description is empty or very short
            if not desc or len(desc) < 20:
                desc = content if content else ""
                
            # Clean up NewsAPI's truncated content suffix e.g. [+1234 chars]
            if desc:
                desc = re.sub(r'\s*\[\+\d+ chars\]', '...', desc)
                
            articles.append({
                "title": art.get("title", ""),
                "description": desc,
                "url": art.get("url", ""),
                "image": art.get("urlToImage", ""),
                "source": art.get("source", {}).get("name", ""),
                "publishedAt": art.get("publishedAt", ""),
                "timeAgo": _relative_time(art.get("publishedAt", "")),
            })
        return articles
    except Exception as e:
        print(f"[NewsAPI Error] {e}")
        return []


def _get_fallback_articles(query: str) -> list[dict]:
    """Generate fixed fallback articles for demo to ensure predictable behavior without external links."""
    def _make_article(title, source, time_ago, image, description="", url=""):
        return {
            "title": title,
            "source": source,
            "timeAgo": time_ago,
            "image": image,
            "url": url,
            "description": description,
            "is_fallback": True
        }

    q_lower = query.lower()
    if "sport" in q_lower or "cricket" in q_lower or "football" in q_lower:
        return [
            _make_article("Major Cricket Tournament Final Announced", "SportsNet", "2 hours ago", "https://images.unsplash.com/photo-1540747913346-19e32fc3e629?w=400&h=250&fit=crop", "The highly anticipated cricket finals are set to take place next week with record audience expected.", "https://www.espncricinfo.com"),
            _make_article("Football League Sees Record Goal Scoring Weekend", "Global Sports", "4 hours ago", "https://images.unsplash.com/photo-1518605368461-1eb49de659ca?w=400&h=250&fit=crop", "Strikers across the top leagues break seasonal records in a thrilling weekend of football.", "https://www.bbc.com/sport/football"),
            _make_article("New AI Analytics Transforming Athletes' Training", "Tech In Sports", "6 hours ago", "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=250&fit=crop", "Teams are increasingly relying on machine learning to optimize performance and prevent injuries.", "https://www.wired.com/category/sport/"),
            _make_article("Emerging Tennis Star Shocks the World Number One", "CourtSide", "8 hours ago", "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=400&h=250&fit=crop", "A massive upset in the open tournament as a wild card entrant defeats the top seed.", "https://www.atptour.com"),
            _make_article("Global Broadcast Rights Re-negotiated for Billions", "Sports Business", "12 hours ago", "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400&h=250&fit=crop", "Tech giants secure streaming rights for major global sports franchises in a landmark deal.", "https://www.sportspromedia.com"),
        ]

    clean_query = query.replace(" news", "").replace("latest ", "").strip().title()
    if not clean_query:
        clean_query = "Global News"

    return [
        _make_article(f"Breaking Developments in {clean_query}", "Global News", "2 hours ago", "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=250&fit=crop", f"New insights and rapid trends emerging in the world of {clean_query} are capturing global attention today.", "https://www.reuters.com"),
        _make_article(f"How {clean_query} is Shaping the Future", "Trends & Insights", "4 hours ago", "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=250&fit=crop", f"Industry experts weigh in on the long-term impact of recent {clean_query} events on the broader market.", "https://www.bloomberg.com"),
        _make_article(f"Top 5 Things You Need to Know About {clean_query}", "Daily Highlights", "6 hours ago", "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=400&h=250&fit=crop", f"A comprehensive breakdown of the most essential updates regarding {clean_query} this week.", "https://www.cnbc.com"),
        _make_article(f"The Economic Impact of {clean_query}", "Market Watch", "8 hours ago", "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=250&fit=crop", f"Analyzing the financial and social repercussions of the latest shifts in {clean_query}.", "https://www.ft.com"),

        _make_article(f"Global Perspectives on {clean_query}", "World Times", "12 hours ago", "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400&h=250&fit=crop", f"How different nations and leaders are responding to the growing importance of {clean_query}."),
    ]


def _get_youtube_videos(query: str) -> list[dict]:
    """Dynamically scrape YouTube search results for video IDs based on the news query."""
    try:
        url = f"https://www.youtube.com/results?search_query={quote_plus(query + ' news analysis')}"
        # Setting a generic User-Agent to avoid blocking
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        html = urllib.request.urlopen(req, timeout=5).read().decode('utf-8')
        
        # Regex to find video IDs in the window["ytInitialData"] object
        video_ids = re.findall(r'"videoId":"([^"]{11})"', html)
        
        unique_ids = []
        for vid in video_ids:
            if vid not in unique_ids:
                unique_ids.append(vid)
            if len(unique_ids) >= 3:
                break
                
        videos = []
        for i, vid in enumerate(unique_ids):
            videos.append({
                "title": f"Watch: Coverage on {query.title()}",
                "videoId": vid,
            })
            
        # Fallback if scraping fails
        if len(videos) < 3:
            return [
                {"title": "Tech Breakthroughs Explained", "videoId": "M7lc1UVf-VE"},
                {"title": "Market Trends Analysis", "videoId": "tgbNymZ7vqY"},
                {"title": "Startup Ecosystem Update", "videoId": "bHQqvYy5KYo"}
            ]
            
        return videos
    except Exception as e:
        print(f"[YouTube Scrape Error] {e}")
        return [
            {"title": "Tech Breakthroughs Explained", "videoId": "M7lc1UVf-VE"},
            {"title": "Market Trends Analysis", "videoId": "tgbNymZ7vqY"},
            {"title": "Startup Ecosystem Update", "videoId": "bHQqvYy5KYo"}
        ]


def _get_dynamic_mock_summary(articles: list[dict], query: str) -> str:
    """Generate a dynamic 3-point summary using real article titles and descriptions to simulate AI processing."""
    if not articles:
        return "No latest news found."
    
    bullets = []
    for a in articles[:3]:
        if a.get('title'):
            desc = a.get('description', '').strip()
            # Truncate description if too long
            if len(desc) > 100:
                desc = desc[:97] + "..."
            bullet_text = f"{a['title']}"
            if desc and desc != "No description available.":
                bullet_text += f" — {desc}"
            bullets.append(f"• {bullet_text}")
            
    if not bullets:
        return "Here is your news update. Please see the articles below for details."
        
    summary = f"Here is a clear 3-point summary specific to your structured query on {query}:\n\n"
    summary += "\n\n".join(bullets)
    return summary

def summarize_with_gpt(articles: list[dict], role: str, query: str = "", domain: str = "all", language: str = "English") -> str:
    """Summarize articles using OpenAI GPT, tailored to role, domain, and language."""
    # Detect if articles are real (have URLs) or fallback placeholders
    # Detect if we have any real articles (non-fallback ones)
    has_real_articles = any(a.get("url") and not a.get("is_fallback") for a in articles)

    if not client:
        if has_real_articles:
            return _get_dynamic_mock_summary(articles, query)
        return _get_fallback(query, role)

    system_prompt = get_system_prompt(role, domain, language)

    if has_real_articles:
        # Real articles from NewsAPI — summarize them
        article_text = "\n\n".join(
            f"{a['title']} ({a['source']})\n{a['description'] or 'No description available.'}"
            for a in articles
        )
        user_prompt = (
            f"The user asked about: '{query}'.\n\n"
            f"Here are the latest real-time news articles. Summarize the key points:\n\n{article_text}"
        )
    else:
        # No real articles — use GPT's own knowledge to answer the specific query
        user_prompt = (
            f"The user asked about: '{query}'.\n\n"
            "No real-time articles were found for this query. "
            f"Using your own knowledge, provide a highly relevant, specific, and insightful analysis about '{query}' "
            f"tailored for a {role}. "
            "Do NOT give a generic overview — focus specifically on what the user asked. "
            f"Be concrete with facts, names, numbers, and recent developments you know about regarding '{query}'."
        )

    try:
        response = client.chat.completions.create(
            model="openai/gpt-4o-mini" if OPENAI_API_KEY.startswith("sk-or-v1-") else "gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=600,
            temperature=0.7,
        )
        summary = response.choices[0].message.content.strip()
        # Clean up some common AI artifacts but KEEP the bullet points and bolding for the UI parser
        summary = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', summary)
        return summary
    except Exception as e:
        print(f"[OpenAI Error] {e}")
        return _get_fallback(query, role)


def _extract_sentiment(summary: str, role: str) -> dict:
    """Extract sentiment from GPT summary text."""
    if role != "investor":
        return {"label": None, "score": None}
    s = summary.lower()
    if "bullish" in s:
        return {"label": "Bullish", "score": "positive", "emoji": "📈"}
    elif "bearish" in s:
        return {"label": "Bearish", "score": "negative", "emoji": "📉"}
    elif "neutral" in s:
        return {"label": "Neutral", "score": "neutral", "emoji": "⚖️"}
    return {"label": None, "score": None}


# ========================
# API ROUTES
# ========================

@app.route("/api/get-news", methods=["POST"])
@app.route("/get-news", methods=["POST"])
def get_news():
    data = request.get_json(force=True)
    query = data.get("query", "latest technology news")
    role = data.get("role", "student").lower()
    domain = data.get("domain", "all").lower()
    language = data.get("language", "English")
    user_location = data.get("location", "Global")

    # 1. Fetch news articles
    # Fix 2 & 3: Combine Query + Location (User's Recommended Product Architecture)
    api_query = query
    if user_location and user_location != "Global":
        loc_city = user_location.split(",")[0].strip()
        if loc_city.lower() not in api_query.lower():
            api_query = f"{api_query} {loc_city}"
    
    # Domain-specific enrichment
    if domain != "all" and domain not in api_query.lower():
        api_query = f"{api_query} {domain}"
    
    # Language-specific enrichment for NewsAPI effectiveness
    if language != "English":
        lang_hints = {"Hindi": "India Hindi", "Tamil": "India Tamil", "Telugu": "India Telugu"}
        hint = lang_hints.get(language, f"India {language}")
        if hint.lower() not in api_query.lower():
            api_query = f"{api_query} {hint}"

    print(f"[*] Raw Query: '{query}' | Location: '{user_location}' | Final NewsAPI Query: '{api_query}'", flush=True)
    articles = fetch_news(api_query)
    
    # Direct fallback if raw query + city fails: try just the query
    if not articles and api_query != query:
        print(f"[*] NewsAPI found 0 articles for '{api_query}'. Trying raw query: '{query}'", flush=True)
        articles = fetch_news(query)

    if not articles:
        articles = _get_fallback_articles(query)

    # 2. Summarize with GPT (v4 multi-context prompts)
    summary = summarize_with_gpt(articles, role, query, domain, language)

    # 3. Extract sentiment (investor persona)
    sentiment = _extract_sentiment(summary, role)

    # 4. Related videos
    videos = _get_youtube_videos(query)

    # 5. Build source citations
    sources = [{"title": a["title"], "source": a["source"], "url": a["url"]} for a in articles]

    return jsonify({
        "summary": summary,
        "articles": articles,
        "videos": videos,
        "sources": sources,
        "sentiment": sentiment,
        "query": query,
        "role": role,
        "domain": domain,
        "language": language,
        "is_developing": False,
    })


@app.route("/api/get-location", methods=["GET"])
@app.route("/get-location", methods=["GET"])
def get_location():
    try:
        # Resolve location via IP on the backend (no CORS issues)
        response = requests.get('https://ipapi.co/json/', timeout=5)
        if response.status_code == 200:
            return jsonify(response.json())
        return jsonify({"city": "Hyderabad", "region": "Telangana", "country_name": "India"})
    except Exception as e:
        print(f"[Location Error] {e}")
        return jsonify({"city": "Hyderabad", "region": "Telangana", "country_name": "India"})


@app.route("/api/health", methods=["GET"])
@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "newsapi_configured": bool(NEWSAPI_KEY and NEWSAPI_KEY != "your_newsapi_key_here"),
        "openai_configured": bool(OPENAI_API_KEY and OPENAI_API_KEY != "your_openai_api_key_here"),
    })


if __name__ == "__main__":
    print("\n🚀 AI Voice News Assistant — Backend Starting...")
    print(f"   NewsAPI Key: {'✅ Configured' if NEWSAPI_KEY and NEWSAPI_KEY != 'your_newsapi_key_here' else '❌ Missing'}")
    print(f"   OpenAI Key:  {'✅ Configured' if OPENAI_API_KEY and OPENAI_API_KEY != 'your_openai_api_key_here' else '❌ Missing'}")
    print(f"   Server:      http://localhost:5001\n")
    app.run(debug=True, port=5001)
