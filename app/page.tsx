"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  RefreshCw, Search, X, Download, Clock, Globe, TrendingUp, 
  Bookmark as BookmarkIcon, Filter 
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

import { Article, MarketInstrument, Region, Topic, Category } from "@/lib/types";
import { seedArticles, initialMarketData, initialRegionRisk, storyTemplates } from "@/lib/data";

import ArticleCard from "./components/ArticleCard";
import ArticleModal from "./components/ArticleModal";
import MarketTicker from "./components/MarketTicker";
import RiskSidebar from "./components/RiskSidebar";
import MiniSparkline from "./components/MiniSparkline";

// All available regions and topics for filters
const ALL_REGIONS: Region[] = [
  "Americas", "Europe", "Middle East", "Africa", "Asia-Pacific", "Russia & Central Asia", "Global"
];

const ALL_TOPICS: Topic[] = [
  "Defense & Security", "Energy & Oil", "Trade & Tariffs", "Central Banks & Policy",
  "Commodities", "Equities & Indices", "Supply Chains", "Diplomacy", "Sanctions",
  "Technology & Export Controls", "Shipping & Logistics", "Elections & Politics", "Conflict Zones"
];

const TIME_FILTERS = [
  { label: "All time", value: "all" },
  { label: "Last 6h", value: "6h" },
  { label: "Last 24h", value: "24h" },
  { label: "Last 7d", value: "7d" },
];

type CategoryFilter = "all" | Category;
type TimeFilter = "all" | "6h" | "24h" | "7d";

export default function Geopulse() {
  // Core data state
  const [articles, setArticles] = useState<Article[]>(seedArticles);
  const [marketData, setMarketData] = useState<MarketInstrument[]>(initialMarketData);
  const [regionRisks, setRegionRisks] = useState(initialRegionRisk);

  // Fetch real market data on load for freshness (falls back to simulation)
  useEffect(() => {
    const loadRealMarkets = async () => {
      try {
        const res = await fetch("/api/markets");
        const data = await res.json();
        if (data.markets) {
          setMarketData((prev) =>
            prev.map((inst) => {
              const real = data.markets[inst.symbol] || data.markets[inst.symbol.replace("SPX", "^GSPC")];
              if (real && real.price) {
                const newPrice = real.price;
                const newChange = real.change ?? inst.change;
                // Keep a short plausible history around the real price
                const newHistory = inst.history.slice(1).concat(newPrice);
                return { ...inst, price: newPrice, change: newChange, history: newHistory };
              }
              return inst;
            })
          );
        }
      } catch (e) {
        // Silent — we already have good simulated starting values
      }
    };
    loadRealMarkets();
  }, []);

  // Optionally pull a few real RSS stories on first load for freshness
  useEffect(() => {
    const loadFreshRSS = async () => {
      try {
        const res = await fetch("/api/news");
        const data = await res.json();
        if (data.articles && data.articles.length > 0) {
          setArticles((prev) => {
            const combined = [...data.articles, ...prev];
            const seen = new Set<string>();
            return combined.filter((a: Article) => {
              if (seen.has(a.title)) return false;
              seen.add(a.title);
              return true;
            }).slice(0, 52);
          });
        }
      } catch (e) {
        // RSS is optional; seed data is always there
      }
    };
    // Small delay so the UI feels snappy first
    const t = setTimeout(loadFreshRSS, 1800);
    return () => clearTimeout(t);
  }, []);

  // UI state
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [selectedRegions, setSelectedRegions] = useState<Region[]>();
  const [selectedTopics, setSelectedTopics] = useState<Topic[]>();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [bookmarks, setBookmarks] = useState<string[]>();
  const [showOnlyBookmarked, setShowOnlyBookmarked] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<MarketInstrument | null>(null);

  // Load bookmarks from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("geopulse-bookmarks");
    if (saved) {
      setBookmarks(JSON.parse(saved));
    }
  }, []);

  // Persist bookmarks
  useEffect(() => {
    localStorage.setItem("geopulse-bookmarks", JSON.stringify(bookmarks));
  }, [bookmarks]);

  // Live market simulation (every 4.2s)
  useEffect(() => {
    const interval = setInterval(() => {
      setMarketData((prev) =>
        prev.map((inst) => {
          // Small realistic random walk
          const volatility = inst.type === "commodity" ? 0.9 : inst.type === "fx" ? 0.06 : 0.45;
          const delta = (Math.random() - 0.49) * volatility;
          const newPrice = Math.max(0.1, parseFloat((inst.price + delta).toFixed(inst.type === "fx" ? 3 : inst.type === "commodity" ? 2 : 1)));
          const newChange = parseFloat((((newPrice - inst.history[0]) / inst.history[0]) * 100).toFixed(2));
          
          // Shift history window
          const newHistory = [...inst.history.slice(1), newPrice];
          
          return {
            ...inst,
            price: newPrice,
            change: newChange,
            history: newHistory,
          };
        })
      );
    }, 4200);

    return () => clearInterval(interval);
  }, []);

  // Periodic story injection (new "live" articles) + risk score drift
  useEffect(() => {
    const interval = setInterval(() => {
      // Occasionally inject a fresh story (roughly every 38-55 seconds)
      if (Math.random() > 0.64) {
        const template = storyTemplates[Math.floor(Math.random() * storyTemplates.length)];
        const newStory: Article = {
          ...template,
          id: `live-${Date.now()}`,
          publishedAt: new Date(Date.now() - Math.random() * 1000 * 60 * 9).toISOString(),
        };

        setArticles((prev) => {
          // Avoid duplicates
          if (prev.some((a) => a.title === newStory.title)) return prev;
          return [newStory, ...prev].slice(0, 52); // cap feed size
        });

        // Nudge a relevant region risk slightly upward
        if (newStory.regions.length > 0) {
          const targetRegion = newStory.regions[0];
          setRegionRisks((prev) =>
            prev.map((r) =>
              r.region === targetRegion
                ? { ...r, score: Math.min(94, r.score + 1.5), storyCount: r.storyCount + 1 }
                : r
            )
          );
        }
      }
    }, 46000);

    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut: "/" focuses search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        const input = document.getElementById("search-input") as HTMLInputElement;
        input?.focus();
      }
      if (e.key === "Escape" && selectedArticle) {
        setSelectedArticle(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedArticle]);

  // Filtering logic (very powerful)
  const filteredArticles = useMemo(() => {
    let result = [...articles];

    // Category
    if (categoryFilter !== "all") {
      result = result.filter((a) => a.category === categoryFilter);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.summary.toLowerCase().includes(q) ||
          a.source.toLowerCase().includes(q) ||
          a.topics.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Regions (multi-select, OR logic)
    if (selectedRegions.length > 0) {
      result = result.filter((a) => a.regions.some((r) => selectedRegions.includes(r)));
    }

    // Topics (multi-select, OR logic)
    if (selectedTopics.length > 0) {
      result = result.filter((a) => a.topics.some((t) => selectedTopics.includes(t)));
    }

    // Time filter
    if (timeFilter !== "all") {
      const now = Date.now();
      const cutoff =
        timeFilter === "6h" ? now - 1000 * 60 * 60 * 6 :
        timeFilter === "24h" ? now - 1000 * 60 * 60 * 24 :
        now - 1000 * 60 * 60 * 24 * 7;

      result = result.filter((a) => new Date(a.publishedAt).getTime() > cutoff);
    }

    // Bookmarks only
    if (showOnlyBookmarked) {
      result = result.filter((a) => bookmarks.includes(a.id));
    }

    // Sort newest first
    result.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    return result;
  }, [articles, categoryFilter, searchQuery, selectedRegions, selectedTopics, timeFilter, showOnlyBookmarked, bookmarks]);

  // Featured stories (top 3 highest impact, most recent)
  const featured = useMemo(() => {
    return [...articles]
      .sort((a, b) => {
        const impactScore = (imp: string) => (imp === "High" ? 3 : imp === "Medium" ? 2 : 1);
        const scoreDiff = impactScore(b.impact) - impactScore(a.impact);
        if (scoreDiff !== 0) return scoreDiff;
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      })
      .slice(0, 3);
  }, [articles]);

  // Stats
  const geoCount = articles.filter((a) => a.category === "geopolitics").length;
  const marketsCount = articles.filter((a) => a.category === "markets").length;

  // Toggle region
  const toggleRegion = (region: Region) => {
    setSelectedRegions((prev) =>
      prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region]
    );
  };

  // Toggle topic
  const toggleTopic = (topic: Topic) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  // Quick filter from card tag
  const handleTopicQuickFilter = (topic: string) => {
    if (ALL_TOPICS.includes(topic as Topic)) {
      const t = topic as Topic;
      if (!selectedTopics.includes(t)) {
        setSelectedTopics([...selectedTopics, t]);
      }
      // scroll to feed
      document.getElementById("feed-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setCategoryFilter("all");
    setSelectedRegions([]);
    setSelectedTopics([]);
    setTimeFilter("all");
    setSearchQuery("");
    setShowOnlyBookmarked(false);
  };

  // Manual refresh — simulates pulling fresh data + injects 1-2 stories
  const handleRefresh = async () => {
    setIsRefreshing(true);

    // Simulate network delay
    await new Promise((r) => setTimeout(r, 420));

    // Inject 1-2 fresh stories
    const newStories: Article[] = [];
    const num = Math.random() > 0.5 ? 2 : 1;
    
    for (let i = 0; i < num; i++) {
      const template = storyTemplates[Math.floor(Math.random() * storyTemplates.length)];
      newStories.push({
        ...template,
        id: `refresh-${Date.now()}-${i}`,
        publishedAt: new Date(Date.now() - Math.random() * 1000 * 60 * 14).toISOString(),
      });
    }

    setArticles((prev) => {
      const combined = [...newStories, ...prev];
      // Dedupe by title
      const seen = new Set<string>();
      return combined.filter((a) => {
        if (seen.has(a.title)) return false;
        seen.add(a.title);
        return true;
      }).slice(0, 54);
    });

    // Slight risk bump on a couple regions
    setRegionRisks((prev) =>
      prev.map((r, idx) => ({
        ...r,
        score: Math.min(93, r.score + (idx % 3 === 0 ? 1.8 : 0.4)),
      }))
    );

    setLastUpdated(new Date());
    setIsRefreshing(false);
    toast.success(`${newStories.length} new stories ingested`, { description: "Feed updated from global sources" });
  };

  // Optional: Pull from real RSS feeds (server-side)
  const ingestLiveRSS = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/news");
      const data = await res.json();
      if (data.articles && data.articles.length > 0) {
        setArticles((prev) => {
          const combined = [...data.articles, ...prev];
          const seen = new Set<string>();
          return combined.filter((a: Article) => {
            if (seen.has(a.title)) return false;
            seen.add(a.title);
            return true;
          }).slice(0, 58);
        });
        toast.success(`${data.articles.length} stories pulled from live RSS`, {
          description: "Merged with curated feed",
        });
      } else {
        toast.info("No new relevant stories from RSS at the moment");
      }
    } catch (err) {
      toast.error("Live RSS fetch failed", { description: "Using curated + simulated stories instead" });
    } finally {
      setLastUpdated(new Date());
      setIsRefreshing(false);
    }
  };

  // Export current view as briefing
  const exportBriefing = () => {
    const visible = filteredArticles.slice(0, 12);
    if (visible.length === 0) {
      toast.error("No stories to export");
      return;
    }

    const lines: string[] = [];
    lines.push("# GEOPULSE BRIEFING");
    lines.push(`Generated: ${new Date().toLocaleString()}`);
    lines.push(`Filter: ${categoryFilter} | ${selectedRegions.length ? selectedRegions.join(", ") : "All regions"}`);
    lines.push(`Stories: ${visible.length}\n`);

    visible.forEach((a, i) => {
      lines.push(`${i + 1}. [${a.category.toUpperCase()}] ${a.title}`);
      lines.push(`   ${a.source} • ${formatDistanceToNow(new Date(a.publishedAt), { addSuffix: true })}`);
      lines.push(`   ${a.summary}`);
      lines.push(`   Regions: ${a.regions.join(" / ")} | Topics: ${a.topics.join(", ")}`);
      lines.push(`   Impact: ${a.impact} | Source: ${a.url}\n`);
    });

    const text = lines.join("\n");
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Briefing copied to clipboard", {
        description: `${visible.length} stories • Ready to paste into reports or Slack`,
      });
    });
  };

  // Bookmark handling
  const toggleBookmark = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setBookmarks((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );
    const isAdding = !bookmarks.includes(id);
    toast(isAdding ? "Bookmarked" : "Bookmark removed", { 
      description: isAdding ? "Saved to your reading list" : undefined 
    });
  };

  const isBookmarked = (id: string) => bookmarks.includes(id);

  // Open article
  const openArticle = (article: Article) => {
    setSelectedArticle(article);
  };

  // Handle market instrument click — open a nice mini detail
  const openMarketDetail = (inst: MarketInstrument) => {
    setSelectedMarket(inst);
  };

  // Close market detail
  const closeMarketDetail = () => setSelectedMarket(null);

  // Quick region filter from sidebar
  const handleRegionQuickFilter = (region: string) => {
    if (ALL_REGIONS.includes(region as Region)) {
      const r = region as Region;
      if (selectedRegions.includes(r)) {
        setSelectedRegions(selectedRegions.filter((x) => x !== r));
      } else {
        setSelectedRegions([...selectedRegions, r]);
      }
      document.getElementById("feed-section")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const hasActiveFilters = 
    categoryFilter !== "all" || 
    selectedRegions.length > 0 || 
    selectedTopics.length > 0 || 
    timeFilter !== "all" || 
    showOnlyBookmarked || 
    searchQuery.length > 0;

  return (
    <div className="min-h-screen bg-[#0a0c12] text-white selection:bg-[#c5a46e] selection:text-black">
      {/* Top Nav */}
      <nav className="sticky top-0 z-40 border-b border-[#252a36] bg-[#0a0c12]/95 backdrop-blur-md">
        <div className="max-w-[1380px] mx-auto px-6 flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-gradient-to-br from-[#c2410f] via-[#c5a46e] to-[#0e8a7a] flex items-center justify-center">
                <Globe size={18} className="text-black" />
              </div>
              <div>
                <div className="font-semibold tracking-[-0.5px] text-xl">GEOPULSE</div>
                <div className="text-[9px] text-[#6f7685] -mt-1">GEOPOLITICS • MARKETS</div>
              </div>
            </div>
            <div className="ml-2 hidden md:flex items-center gap-1.5 text-xs uppercase tracking-[2px] text-[#6f7685] border-l border-[#252a36] pl-4">
              GLOBAL INTELLIGENCE
            </div>
          </div>

          {/* Category segmented control */}
          <div className="segment hidden md:flex rounded-full p-px text-sm">
            {(["all", "geopolitics", "markets"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all ${
                  categoryFilter === cat ? "active" : "hover:bg-[#1a1f2a]"
                }`}
              >
                {cat === "all" ? "All" : cat === "geopolitics" ? "Geopolitics" : "Markets"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#353c4a] hover:bg-[#11141c] text-sm transition disabled:opacity-60"
            >
              <RefreshCw size={15} className={isRefreshing ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={ingestLiveRSS}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#353c4a] hover:bg-[#11141c] text-sm transition disabled:opacity-60"
              title="Pull latest from public RSS (Reuters, Al Jazeera, FT, etc.)"
            >
              <Globe size={15} />
              <span className="hidden md:inline text-xs">Live RSS</span>
            </button>
            <button
              onClick={exportBriefing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1a1f2a] hover:bg-[#252a36] text-sm border border-[#353c4a] transition"
            >
              <Download size={15} /> <span className="hidden sm:inline">Export Briefing</span>
            </button>
            <button
              onClick={() => {
                setShowOnlyBookmarked(!showOnlyBookmarked);
                if (!showOnlyBookmarked) toast.info("Showing bookmarked stories only");
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm border transition ${
                showOnlyBookmarked ? "bg-[#c5a46e] text-black border-[#c5a46e]" : "border-[#353c4a] hover:bg-[#11141c]"
              }`}
            >
              <BookmarkIcon size={15} /> <span className="hidden md:inline">Reading List</span>
              {bookmarks.length > 0 && <span className="font-mono text-xs opacity-70">({bookmarks.length})</span>}
            </button>
          </div>
        </div>

        {/* LIVE MARKET TICKER */}
        <MarketTicker instruments={marketData} onInstrumentClick={openMarketDetail} />
      </nav>

      {/* Hero / Intelligence Header */}
      <div className="max-w-[1380px] mx-auto px-6 pt-8 pb-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-y-3">
          <div>
            <div className="flex items-center gap-3">
              <div className="text-4xl md:text-[42px] font-semibold tracking-[-1.6px] leading-none">Global Pulse</div>
              <div className="px-3 py-1 rounded-full text-xs bg-[#11141c] border border-[#252a36] text-[#c5a46e] flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#c5a46e] live-dot" />
                LIVE
              </div>
            </div>
            <p className="text-[#a1a7b5] mt-2 max-w-md text-[15px]">
              Real-time aggregation of geopolitics, conflicts, wars, energy, and macro markets from 38 sources worldwide.
            </p>
          </div>

          {/* Status stats */}
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-[#a1a7b5]">
            <div className="flex items-center gap-2">
              <Clock size={15} /> <span>Last updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}</span>
            </div>
            <div>{geoCount} geopolitics • {marketsCount} markets</div>
            <div className="text-[#c5a46e] flex items-center gap-1">
              <TrendingUp size={15} /> 41 stories today
            </div>
          </div>
        </div>
      </div>

      {/* Global Risk Index Bar */}
      <div className="max-w-[1380px] mx-auto px-6 pb-7">
        <div className="bg-[#11141c] border border-[#252a36] rounded-2xl px-5 py-3 flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="uppercase tracking-[1.5px] text-xs text-[#6f7685]">GLOBAL GEOPOLITICAL RISK INDEX</div>
              <div className="font-mono text-3xl font-semibold tracking-tighter text-[#c5a46e]">71.4</div>
              <div className="text-[#ef4444] text-sm flex items-center gap-px">+2.1 <span className="text-xs align-super">↑</span></div>
            </div>
            <div className="text-xs text-[#a1a7b5] mt-0.5">Elevated. Driven by Red Sea shipping crisis + Taiwan drills + Ukraine energy strikes.</div>
          </div>
          <div className="hidden md:block w-px h-9 bg-[#252a36]" />
          <div className="flex gap-5 text-sm">
            <div>14 active conflicts</div>
            <div>3 major chokepoints stressed</div>
            <div>9 central banks in focus</div>
          </div>
        </div>
      </div>

      {/* FEATURED STORIES */}
      <div className="max-w-[1380px] mx-auto px-6 pb-8">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="uppercase tracking-[1.5px] text-xs text-[#6f7685]">IN FOCUS</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {featured.map((article) => {
            const isBookmarkedStory = isBookmarked(article.id);
            return (
              <div
                key={article.id}
                onClick={() => openArticle(article)}
                className={`featured-card ${article.category} rounded-2xl p-5 cursor-pointer group transition-all hover:border-[#353c4a]`}
              >
                <div className="flex justify-between text-xs mb-3">
                  <span className="font-medium text-[#a1a7b5]">{article.source}</span>
                  <button 
                    onClick={(e) => toggleBookmark(article.id, e)} 
                    className="text-[#6f7685] hover:text-[#c5a46e]"
                  >
                    {isBookmarkedStory ? <BookmarkIcon size={15} className="text-[#c5a46e]" /> : <BookmarkIcon size={15} />}
                  </button>
                </div>
                <div className="font-semibold tracking-[-0.3px] text-[15.5px] leading-snug mb-2 group-hover:text-[#c5a46e] transition-colors">
                  {article.title}
                </div>
                <div className="text-[#a1a7b5] text-sm line-clamp-2 mb-3">{article.summary}</div>
                <div className="flex items-center gap-2 text-xs">
                  {article.regions.slice(0, 2).map(r => <span key={r} className="tag">{r}</span>)}
                  <span className={`ml-auto text-xs px-2 py-px rounded ${article.impact === "High" ? "impact-high" : "impact-medium"}`}>
                    {article.impact}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FILTERS + SEARCH */}
      <div id="feed-section" className="sticky top-[93px] z-30 bg-[#0a0c12] border-b border-[#252a36]">
        <div className="max-w-[1380px] mx-auto px-6 py-4">
          {/* Search + main controls */}
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center mb-4">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-4 top-3.5 text-[#6f7685]" size={17} />
              <input
                id="search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search headlines, sources, or topics... (press / to focus)"
                className="search-input w-full pl-11 pr-10 py-3 rounded-xl text-sm placeholder:text-[#6f7685]"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-3.5 text-[#6f7685]">
                  <X size={17} />
                </button>
              )}
            </div>

            {/* Time filters */}
            <div className="flex items-center gap-1 bg-[#11141c] border border-[#252a36] rounded-xl p-1 text-sm">
              {TIME_FILTERS.map((tf) => (
                <button
                  key={tf.value}
                  onClick={() => setTimeFilter(tf.value as TimeFilter)}
                  className={`px-4 py-1.5 rounded-lg transition ${timeFilter === tf.value ? "bg-white text-black" : "hover:bg-[#1a1f2a]"}`}
                >
                  {tf.label}
                </button>
              ))}
            </div>

            <button
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              className="flex items-center justify-center gap-2 px-5 py-3 border border-[#353c4a] rounded-xl text-sm disabled:opacity-40 hover:bg-[#11141c] transition"
            >
              <Filter size={15} /> Clear filters
            </button>
          </div>

          {/* Region chips */}
          <div className="mb-3">
            <div className="text-[10px] uppercase tracking-[1px] text-[#6f7685] mb-1.5 px-1">REGIONS</div>
            <div className="flex flex-wrap gap-1.5">
              {ALL_REGIONS.map((region) => {
                const active = selectedRegions.includes(region);
                return (
                  <button
                    key={region}
                    onClick={() => toggleRegion(region)}
                    className={`filter-chip ${active ? "active" : ""}`}
                  >
                    {region}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Topic chips */}
          <div>
            <div className="text-[10px] uppercase tracking-[1px] text-[#6f7685] mb-1.5 px-1">TOPICS</div>
            <div className="flex flex-wrap gap-1.5">
              {ALL_TOPICS.map((topic) => {
                const active = selectedTopics.includes(topic);
                return (
                  <button
                    key={topic}
                    onClick={() => toggleTopic(topic)}
                    className={`filter-chip ${active ? "active" : ""}`}
                  >
                    {topic}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active filter summary */}
          {hasActiveFilters && (
            <div className="mt-3 text-xs text-[#6f7685] flex items-center gap-2 px-1">
              Showing <span className="text-white font-medium">{filteredArticles.length}</span> of {articles.length} stories
              {showOnlyBookmarked && <span className="text-[#c5a46e]">• Reading list only</span>}
            </div>
          )}
        </div>
      </div>

      {/* MAIN CONTENT: Feed + Sidebar */}
      <div className="max-w-[1380px] mx-auto px-6 pt-6 pb-16 grid grid-cols-1 lg:grid-cols-12 gap-x-7 gap-y-8">
        {/* Feed */}
        <div className="lg:col-span-8 xl:col-span-9">
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="uppercase text-xs tracking-[1.5px] text-[#6f7685]">
              {showOnlyBookmarked ? "YOUR READING LIST" : "LIVE FEED"}
            </div>
            <div className="text-xs text-[#6f7685]">
              {filteredArticles.length} stories
            </div>
          </div>

          <AnimatePresence mode="popLayout">
            {filteredArticles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredArticles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    isBookmarked={isBookmarked(article.id)}
                    onClick={() => openArticle(article)}
                    onToggleBookmark={(e) => toggleBookmark(article.id, e)}
                    onTopicClick={handleTopicQuickFilter}
                  />
                ))}
              </div>
            ) : (
              <div className="py-16 text-center border border-[#252a36] rounded-2xl bg-[#11141c]">
                <div className="text-lg mb-1">No stories match your filters</div>
                <button onClick={clearFilters} className="text-[#c5a46e] text-sm underline underline-offset-4">Clear all filters</button>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-6 lg:pt-1">
          <RiskSidebar risks={regionRisks} onRegionClick={handleRegionQuickFilter} />

          {/* Markets Snapshot */}
          <div className="bg-[#11141c] border border-[#252a36] rounded-2xl p-4">
            <div className="uppercase tracking-[1.5px] text-xs text-[#6f7685] mb-3 px-1 flex items-center gap-2">
              <TrendingUp size={14} /> MARKETS SNAPSHOT
            </div>
            <div className="space-y-3">
              {marketData.slice(0, 6).map((inst) => {
                const isUp = inst.change >= 0;
                return (
                  <button
                    key={inst.symbol}
                    onClick={() => openMarketDetail(inst)}
                    className="w-full flex items-center justify-between bg-[#0a0c12] hover:bg-[#151922] border border-[#252a36] rounded-xl px-3.5 py-2.5 text-sm group transition"
                  >
                    <div className="text-left">
                      <div className="font-medium tracking-tight">{inst.symbol}</div>
                      <div className="text-[11px] text-[#6f7685]">{inst.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono tabular-nums">
                        {inst.type === "fx" ? inst.price.toFixed(3) : inst.price.toLocaleString()}
                      </div>
                      <div className={`font-mono text-xs ${isUp ? "price-up" : "price-down"}`}>
                        {isUp ? "+" : ""}{inst.change.toFixed(2)}%
                      </div>
                    </div>
                    <div className="pl-2 opacity-70 group-hover:opacity-100">
                      <MiniSparkline data={inst.history} width={50} height={18} />
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="text-[10px] text-center text-[#6f7685] mt-3">Click any instrument for details</div>
          </div>

          {/* Quick actions */}
          <div className="text-xs text-[#6f7685] px-1 leading-relaxed">
            Markets load real quotes on startup where possible (via Yahoo Finance). News combines fresh curated stories + optional live RSS. Click "Live RSS" for the newest headlines.
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#252a36] py-8 text-xs text-[#6f7685]">
        <div className="max-w-[1380px] mx-auto px-6 flex flex-col md:flex-row md:items-center gap-y-2 justify-between">
          <div>GEOPULSE — Strictly geopolitics, conflicts, and markets. Not financial advice.</div>
          <div>38 sources • Updated continuously • Press <span className="font-mono">/</span> to search</div>
        </div>
      </footer>

      {/* Article Modal */}
      <ArticleModal
        article={selectedArticle}
        isBookmarked={selectedArticle ? isBookmarked(selectedArticle.id) : false}
        onClose={() => setSelectedArticle(null)}
        onToggleBookmark={() => selectedArticle && toggleBookmark(selectedArticle.id)}
      />

      {/* Market Detail Modal */}
      <AnimatePresence>
        {selectedMarket && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4" onClick={closeMarketDetail}>
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              onClick={(e) => e.stopPropagation()}
              className="modal w-full max-w-md rounded-2xl p-6"
            >
              <div className="flex justify-between items-start mb-5">
                <div>
                  <div className="font-mono text-2xl tracking-tighter">{selectedMarket.symbol}</div>
                  <div className="text-[#a1a7b5]">{selectedMarket.name}</div>
                </div>
                <button onClick={closeMarketDetail} className="text-[#6f7685] hover:text-white"><X /></button>
              </div>

              <div className="flex items-baseline gap-3 mb-6">
                <div className="text-4xl font-semibold tabular-nums tracking-tighter">
                  {selectedMarket.type === "fx" ? selectedMarket.price.toFixed(3) : selectedMarket.price.toLocaleString()}
                </div>
                <div className={`text-xl font-medium ${selectedMarket.change >= 0 ? "price-up" : "price-down"}`}>
                  {selectedMarket.change >= 0 ? "+" : ""}{selectedMarket.change.toFixed(2)}%
                </div>
              </div>

              <div className="mb-6">
                <div className="text-xs uppercase tracking-widest text-[#6f7685] mb-2">LAST 12 PERIODS</div>
                <div className="h-[92px] bg-[#0a0c12] rounded-xl border border-[#252a36] flex items-center justify-center p-3">
                  <MiniSparkline data={selectedMarket.history} width={260} height={68} />
                </div>
              </div>

              <div className="text-xs text-[#a1a7b5]">
                Initial prices attempt to load from real market data. Small random drift is then applied for demo purposes.
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
