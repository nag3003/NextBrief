import express from "express";
import http from "http";
import { Server } from "socket.io";
import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

// Load environment variables from the parent backend/.env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../backend/.env") });

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

const PORT = 5002; // Separate from Flask (5001) and Vite (5173)
const API_KEY = process.env.NEWSAPI_KEY;

// Keep track of articles already pushed to avoid duplicates
let lastArticles = new Set();
const MAX_HISTORY = 1000;

const fetchBreakingNews = async (country = "in") => {
  try {
    const res = await axios.get(
      `https://newsapi.org/v2/top-headlines?country=${country}&pageSize=5&apiKey=${API_KEY}`
    );
    return res.data.articles || [];
  } catch (err) {
    console.error(`[NewsAPI Error] ${err.message}`);
    return [];
  }
};

const checkForUpdates = async () => {
  // We'll iterate over countries connected to the socket to provide localized breaking news
  // For now, let's fetch India (in) by default as per user preference
  const articles = await fetchBreakingNews("in");

  const newArticles = articles.filter(
    (a) => a.url && !lastArticles.has(a.url)
  );

  if (newArticles.length > 0) {
    newArticles.forEach((a) => {
      lastArticles.add(a.url);
      // Prune old entries
      if (lastArticles.size > MAX_HISTORY) {
        const first = lastArticles.values().next().value;
        lastArticles.delete(first);
      }
    });

    io.emit("breaking-news", newArticles);
    console.log(`🚨 Broadcasted ${newArticles.length} new breaking news items.`);
  }
};

io.on("connection", (socket) => {
  console.log(`[Socket] User connected: ${socket.id}`);
  
  socket.on("set-location", (country) => {
    socket.country = country;
    console.log(`[Socket] User ${socket.id} set country to: ${country}`);
  });

  socket.on("disconnect", () => {
    console.log(`[Socket] User disconnected: ${socket.id}`);
  });
});

// Run check every 45 seconds (NewsAPI rate limit friendly)
setInterval(checkForUpdates, 45000);

// Initial check on startup
checkForUpdates();

server.listen(PORT, () => {
  console.log(`[RealTime] Server running on port ${PORT}`);
});
