import { NextResponse } from "next/server";
import Parser from "rss-parser";
import { Article, Region, Topic } from "@/lib/types";

const parser = new Parser({
  customFields: {
    item: ["description", "content:encoded", "pubDate"],
  },
});

// High-signal keyword list to keep only relevant geopolitics + macro markets content
const KEEP_KEYWORDS = [
  "ukraine", "russia", "putin", "zelensky", "nato", "sanction", "oil", "gas", "brent", "wti", "opec",
  "china", "taiwan", "beijing", "xi", "hong kong", "south china sea", "philippines", "india", "modi",
  "israel", "gaza", "hamas", "hezbollah", "houthi", "red sea", "iran", "nuclear", "tehran",
  "fed", "ecb", "central bank", "rate cut", "inflation", "tariff", "trade war", "export control",
  "rare earth", "copper", "gold", "commodity", "shipping", "container", "suez", "panama",
  "defense", "military", "missile", "drone", "war", "conflict", "ceasefire", "diplomacy",
  "middle east", "saudi", "uae", "yemen", "sudan", "africa", "mali", "burkina", "niger",
  "japan", "korea", "north korea", "pyongyang", "semiconductor", "tsmc", "chip",
];

const DROP_KEYWORDS = [
  "sport", "football", "cricket", "entertainment", "celebrity", "movie", "music", "weather",
  "local", "obituary", "lifestyle", "fashion", "travel", "recipe", "review", "opinion", "editorial",
];

function isRelevant(text: string): boolean {
  const t = text.toLowerCase();
  if (DROP_KEYWORDS.some((k) => t.includes(k))) return false;
  return KEEP_KEYWORDS.some((k) => t.includes(k));
}

function inferCategory(text: string): "geopolitics" | "markets" {
  const t = text.toLowerCase();
  const marketSignals = ["fed", "ecb", "rate", "oil", "gold", "copper", "commodity", "stock", "equity", "index", "brent", "opec", "tariff", "export", "chip", "semiconductor", "currency", "yen", "dollar"];
  return marketSignals.some((s) => t.includes(s)) ? "markets" : "geopolitics";
}

function inferRegions(text: string): Region[] {
  const t = text.toLowerCase();
  const regions: Region[] = [];
  if (t.includes("ukraine") || t.includes("russia") || t.includes("nato") || t.includes("europe")) regions.push("Europe", "Russia & Central Asia");
  if (t.includes("israel") || t.includes("gaza") || t.includes("iran") || t.includes("saudi") || t.includes("houthi") || t.includes("red sea") || t.includes("middle east")) regions.push("Middle East");
  if (t.includes("china") || t.includes("taiwan") || t.includes("japan") || t.includes("korea") || t.includes("asia") || t.includes("india") || t.includes("philippine")) regions.push("Asia-Pacific");
  if (t.includes("africa") || t.includes("sudan") || t.includes("mali") || t.includes("sahel")) regions.push("Africa");
  if (t.includes("america") || t.includes("us ") || t.includes("united states") || t.includes("brazil") || t.includes("venezuela")) regions.push("Americas");
  if (regions.length === 0) regions.push("Global");
  return [...new Set(regions)];
}

function inferTopics(text: string): Topic[] {
  const t = text.toLowerCase();
  const topics: Topic[] = [];
  if (t.includes("defense") || t.includes("military") || t.includes("missile") || t.includes("drone") || t.includes("nato")) topics.push("Defense & Security");
  if (t.includes("oil") || t.includes("gas") || t.includes("opec") || t.includes("energy")) topics.push("Energy & Oil");
  if (t.includes("tariff") || t.includes("trade") || t.includes("export control")) topics.push("Trade & Tariffs");
  if (t.includes("fed") || t.includes("ecb") || t.includes("central bank") || t.includes("rate")) topics.push("Central Banks & Policy");
  if (t.includes("gold") || t.includes("copper") || t.includes("commodity") || t.includes("rare earth")) topics.push("Commodities");
  if (t.includes("shipping") || t.includes("red sea") || t.includes("container")) topics.push("Shipping & Logistics");
  if (t.includes("sanction")) topics.push("Sanctions");
  if (t.includes("chip") || t.includes("semiconductor") || t.includes("tsmc")) topics.push("Technology & Export Controls");
  if (topics.length === 0) topics.push("Diplomacy");
  return [...new Set(topics)];
}

function inferImpact(text: string): "High" | "Medium" | "Low" {
  const t = text.toLowerCase();
  if (t.includes("strike") || t.includes("attack") || t.includes("war") || t.includes("nuclear") || t.includes("record") || t.includes("surge")) return "High";
  if (t.includes("rises") || t.includes("falls") || t.includes("agrees") || t.includes("talks")) return "Medium";
  return "Low";
}

// Sources we trust for geopolitics & macro markets (RSS must be public)
const FEEDS = [
  { url: "https://feeds.reuters.com/reuters/worldNews", source: "Reuters" },
  { url: "https://feeds.reuters.com/reuters/businessNews", source: "Reuters" },
  { url: "https://www.aljazeera.com/xml/rss/all.xml", source: "Al Jazeera" },
  { url: "https://feeds.bbci.co.uk/news/world/rss.xml", source: "BBC" },
  { url: "https://www.ft.com/rss/world", source: "Financial Times" },
  { url: "https://asia.nikkei.com/rss/feed/nikkei-Asian-Review", source: "Nikkei Asia" },
];

export async function GET() {
  const results: Article[] = [];
  const seenTitles = new Set<string>();

  await Promise.all(
    FEEDS.map(async (feed) => {
      try {
        const parsed = await parser.parseURL(feed.url);
        for (const item of parsed.items.slice(0, 12)) {
          const title = item.title || "";
          const content = (item.contentSnippet || item.content || item["content:encoded"] || item.description || "").toString();
          const combined = `${title} ${content}`;

          if (!isRelevant(combined) || seenTitles.has(title)) continue;
          seenTitles.add(title);

          const pubDate = item.pubDate ? new Date(item.pubDate) : new Date();
          if (isNaN(pubDate.getTime())) continue;

          results.push({
            id: `rss-${feed.source}-${title.slice(0, 24).replace(/\s+/g, "-")}`,
            title,
            summary: content.slice(0, 240).replace(/\s+/g, " ").trim() + (content.length > 240 ? "..." : ""),
            body: content.slice(0, 820).replace(/\s+/g, " ").trim(),
            source: feed.source,
            url: item.link || "https://www.reuters.com/",
            publishedAt: pubDate.toISOString(),
            category: inferCategory(combined),
            regions: inferRegions(combined),
            topics: inferTopics(combined),
            impact: inferImpact(combined),
          });
        }
      } catch (e) {
        // Silently ignore individual feed failures (CORS, downtime, etc.)
        console.warn(`Failed to fetch ${feed.url}:`, e);
      }
    })
  );

  // Sort newest first
  results.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  return NextResponse.json({ 
    articles: results.slice(0, 30), 
    fetchedAt: new Date().toISOString(),
    count: results.length 
  });
}
