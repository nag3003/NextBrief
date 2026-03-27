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
TOPIC_FALLBACKS = {
    "ai": {
        "student": "AI is transforming education rapidly. Google and Microsoft are launching free AI courses, and universities are adding machine learning to core curricula. Internship demand for AI skills has jumped 3x this year. If you're a student, start with Python and TensorFlow — the job market is red hot.",
        "investor": "The AI sector continues to attract massive capital — over $50B invested in the last quarter alone. Key players like NVIDIA, OpenAI, and Anthropic are driving valuations up. Enterprise AI adoption is hitting an inflection point, but regulatory risks are mounting. Watch for consolidation in the AI infrastructure layer.",
        "founder": "AI startup competition is fierce but opportunities abound. Vertical AI (healthcare, legal, finance) is where the whitespace is. VCs are favoring AI startups with proprietary data advantages over generic chatbot wrappers. Focus on a niche, build a data moat, and show clear ROI to customers.",
    },
    "stock": {
        "student": "Stock markets are seeing volatility due to mixed earnings reports and changing interest rate expectations. Tech stocks remain strong, driven by AI enthusiasm. For students learning about investing, this is a great time to study how macroeconomic factors affect market sentiment. Consider paper trading to practice!",
        "investor": "Markets are in a rotation phase — growth stocks are outperforming value amid AI tailwinds. The S&P 500 is up 12% YTD, led by the Magnificent 7. Bond yields are stabilizing, which may support equity valuations. Key risks: geopolitical tensions and a potential Fed pause could trigger near-term corrections.",
        "founder": "Public market trends signal strong exit opportunities for well-positioned startups. IPO windows are reopening, especially for profitable tech companies. If you're planning a future exit, focus on achieving positive unit economics now. Acqui-hires are also increasing as big tech hunts for AI talent.",
    },
    "startup": {
        "student": "The startup ecosystem is booming! Y Combinator's latest batch had record applications, and student-founded startups are getting funded faster than ever. Key hot sectors: AI tools, climate tech, and health tech. Start building side projects now — many successful founders started as student hackers!",
        "investor": "Early-stage startup funding is rebounding after the 2023 correction. Seed rounds are averaging $3-5M, and Series A deals require stronger traction metrics. AI-first startups dominate deal flow, but sustainability and fintech are resurging. Due diligence cycle times have shortened — move fast on promising deals.",
        "founder": "Funding landscape update: Seed rounds are flowing again, but investors want to see revenue traction earlier. The median time to Series A has stretched to 24 months. Focus on capital efficiency and achieving $1M ARR before raising. Strategic angels and micro-VCs are often better first checks than big funds.",
    },
    "economy": {
        "student": "The global economy is in a transitional phase. Inflation is cooling in most major economies, while job markets remain surprisingly strong. For students, this means good employment prospects upon graduation, especially in tech and healthcare. Understanding macroeconomics will give you an edge in any career path.",
        "investor": "Economic indicators are mixed. GDP growth is slowing but resilient, unemployment remains historically low, and inflation is trending toward central bank targets. The Fed may pivot to rate cuts, which could fuel the next bull run. Defensive positioning with selective risk exposure is the prudent play.",
        "founder": "Economic conditions are favorable for lean startups. Customer acquisition costs are dropping as ad markets normalize. Enterprise budgets are shifting toward efficiency and automation tools — position your product there. Cash management remains critical; aim for 18+ months of runway in the current environment.",
    },
    "health": {
        "student": "Healthcare innovation is accelerating! AI-powered diagnostics, telemedicine, and personalized medicine are creating new career opportunities. Biotech companies are hiring data scientists and engineers like never before. If you're interested in health tech, combining CS with biology knowledge is an incredibly powerful skill combination.",
        "investor": "Healthcare and biotech are showing strong momentum. GLP-1 drugs continue to dominate with massive market potential. AI-driven drug discovery is cutting development timelines from years to months. Digital health stocks have been undervalued post-2022 correction, presenting entry opportunities. Watch regulatory approvals closely.",
        "founder": "Health tech is a massive opportunity space. AI diagnostics, remote patient monitoring, and mental health platforms are seeing strong demand. FDA pathways for AI/ML-based Software as Medical Devices (SaMD) are becoming clearer. Focus on clinical validation and insurance reimbursement strategy early.",
    },
    "crypto": {
        "student": "Cryptocurrency and blockchain technology continue to evolve. Bitcoin ETFs are now mainstream, and Web3 development skills are in demand. Understanding blockchain fundamentals can open doors in fintech, gaming, and decentralized applications. Many universities now offer blockchain courses — it's worth exploring!",
        "investor": "Crypto markets are in a new cycle. Bitcoin ETFs have attracted institutional capital, pushing BTC past previous resistance levels. Ethereum's DeFi ecosystem is maturing with real yield products. Key risks: regulatory clarity is still evolving, and altcoin speculation remains high. Position sizing and risk management are essential.",
        "founder": "Blockchain infrastructure is maturing, creating opportunities for builder-founders. DeFi, real-world asset tokenization, and decentralized identity are hot verticals. VC funding for crypto startups is returning but with higher bars. Focus on real utility over token speculation to attract serious investors.",
    },
    "climate": {
        "student": "Climate tech is one of the fastest-growing sectors! Clean energy jobs are booming, and companies are actively hiring sustainability-focused engineers and scientists. Solar and EV industries are projected to grow 5x in the next decade. Green skills will be essential for the future workforce — start building them now.",
        "investor": "Clean energy investments are at all-time highs. Solar and wind are now cheaper than fossil fuels in most markets. EV adoption is accelerating globally, benefiting battery and charging infrastructure companies. Government incentives (IRA, EU Green Deal) are providing strong tailwinds. This is a decade-long structural trend.",
        "founder": "Climate tech is the next trillion-dollar opportunity. Carbon capture, grid-scale storage, and sustainable materials are attracting significant VC interest. Government subsidies are de-risking many climate ventures. Build for unit economics from day one — investors want climate solutions that are also great businesses.",
    },
    "sports": {
        "student": "Sports news snapshot: The sports world is seeing incredible action right now with breaking records and intense match rivalries. For students, engaging in or following sports is a great way to maintain balance and community. Keep an eye on the emerging esports scene as well!",
        "investor": "Sports industry update: Media rights for major sporting events continue to command premium valuations. Franchises are seeing significant capital appreciation. Sports tech, wearable analytics, and fan engagement platforms represent strong investment opportunities as the sector digitizes further.",
        "founder": "Sports tech opportunities: The intersection of sports and technology is booming. Wearable biometric trackers, AI-driven coaching apps, and immersive fan experiences in massive sports like cricket and football are highly attractive to VCs. Finding specific niches in amateur sports operations also shows great promise."
    },
}

def _get_fallback(query: str, role: str) -> str:
    """Get a fixed fallback response for all queries to ensure a predictable demo."""
    q_lower = query.lower()
    for topic, responses in TOPIC_FALLBACKS.items():
        if topic in q_lower or (topic == "sports" and any(w in q_lower for w in ["cricket", "football", "tennis", "olympics"])):
            return responses.get(role, responses["student"])
            
    clean_query = query.replace(" news", "").replace("latest ", "").strip().title()
    if not clean_query:
        clean_query = "Current Events"
        
    if role == "investor":
        return f"Market update on {clean_query}: The {clean_query} sector is experiencing significant volatility and new investment opportunities. Watch for emerging startups and policy changes that could drive future valuations in this space."
    elif role == "founder":
        return f"Industry update on {clean_query}: The {clean_query} space is ripe for disruption. Innovators are finding new ways to capture market share, and VC interest is shifting toward specialized solutions within this vertical."
    else:
        return f"Here is your news snapshot for '{clean_query}': There are rapid developments and new trends emerging globally regarding {clean_query}. Whether for academic study or personal interest, staying updated on this topic is essential right now!"

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
    def _make_article(title, source, time_ago, image, description=""):
        return {
            "title": title,
            "source": source,
            "timeAgo": time_ago,
            "image": image,
            "url": "",  # No external links
            "description": description,
        }

    q_lower = query.lower()
    if "sport" in q_lower or "cricket" in q_lower or "football" in q_lower:
        return [
            _make_article("Major Cricket Tournament Final Announced", "SportsNet", "2 hours ago", "https://images.unsplash.com/photo-1540747913346-19e32fc3e629?w=400&h=250&fit=crop", "The highly anticipated cricket finals are set to take place next week with record audience expected."),
            _make_article("Football League Sees Record Goal Scoring Weekend", "Global Sports", "4 hours ago", "https://images.unsplash.com/photo-1518605368461-1eb49de659ca?w=400&h=250&fit=crop", "Strikers across the top leagues break seasonal records in a thrilling weekend of football."),
            _make_article("New AI Analytics Transforming Athletes' Training", "Tech In Sports", "6 hours ago", "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=250&fit=crop", "Teams are increasingly relying on machine learning to optimize performance and prevent injuries."),
            _make_article("Emerging Tennis Star Shocks the World Number One", "CourtSide", "8 hours ago", "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=400&h=250&fit=crop", "A massive upset in the open tournament as a wild card entrant defeats the top seed."),
            _make_article("Global Broadcast Rights Re-negotiated for Billions", "Sports Business", "12 hours ago", "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400&h=250&fit=crop", "Tech giants secure streaming rights for major global sports franchises in a landmark deal."),
        ]

    clean_query = query.replace(" news", "").replace("latest ", "").strip().title()
    if not clean_query:
        clean_query = "Global News"

    return [
        _make_article(f"Breaking Developments in {clean_query}", "Global News", "2 hours ago", "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=250&fit=crop", f"New insights and rapid trends emerging in the world of {clean_query} are capturing global attention today."),
        _make_article(f"How {clean_query} is Shaping the Future", "Trends & Insights", "4 hours ago", "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=250&fit=crop", f"Industry experts weigh in on the long-term impact of recent {clean_query} events on the broader market."),
        _make_article(f"Top 5 Things You Need to Know About {clean_query}", "Daily Highlights", "6 hours ago", "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=400&h=250&fit=crop", f"A comprehensive breakdown of the most essential updates regarding {clean_query} this week."),
        _make_article(f"The Economic Impact of {clean_query}", "Market Watch", "8 hours ago", "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=250&fit=crop", f"Analyzing the financial and social repercussions of the latest shifts in {clean_query}."),
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
    has_real_articles = any(a.get("url") for a in articles)

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
            max_tokens=400,
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
    # Smarter regional query building using user location
    api_query = query
    
    # Inject location context for local/regional queries
    if user_location and user_location != "Global":
        loc_city = user_location.split(",")[0].strip()
        if domain == "local" and loc_city.lower() not in api_query.lower():
            api_query = f"{loc_city} {api_query}"
        elif domain == "all" and loc_city.lower() not in api_query.lower():
            # Lightly hint at location for general queries
            api_query = f"{api_query} {loc_city}"
    
    if language != "English":
        # Add English translation hint for NewsAPI (which is mostly English content)
        lang_hints = {
            "Hindi": "India Hindi news",
            "Tamil": "India Tamil news",
            "Telugu": "India Telugu news",
            "Malayalam": "India Kerala Malayalam news",
            "Kannada": "India Karnataka Kannada news",
            "Bengali": "India Bengal Bengali news",
            "Marathi": "India Maharashtra Marathi news",
            "Gujarati": "India Gujarat Gujarati news",
            "Odia": "India Odisha Odia news",
            "Urdu": "India Urdu news",
        }
        hint = lang_hints.get(language, f"India {language} news")
        api_query = f"{query} {hint}"
    
    if domain != "all" and domain not in api_query.lower():
        api_query = f"{api_query} {domain}"
    
    print(f"[*] Query: '{query}' | Location: '{user_location}' | API Query: '{api_query}'", flush=True)
    articles = fetch_news(api_query)
    
    # CASCADING FALLBACK: If hyper-local regional query fails, broaden the scope
    # e.g., "Jammikunta, Telangana, India news" -> "Telangana, India news" -> "India news"
    fallback_query = query
    while not articles and ", " in fallback_query:
        parts = fallback_query.split(", ", 1)
        if len(parts) > 1:
            fallback_query = parts[1]
            print(f"[*] NewsAPI found 0 articles. Broadening query recursively: {fallback_query}", flush=True)
            articles = fetch_news(fallback_query)
        else:
            break

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
