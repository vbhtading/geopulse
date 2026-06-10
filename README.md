# GEOPULSE

**Premium real-time news aggregator focused exclusively on geopolitics, wars, conflicts, diplomacy, and global markets.**

Beautiful, fast, and extremely high-signal. Built in Next.js 16 with TypeScript, Framer Motion, and a sophisticated dark editorial design.

## Highlights

- **Strict topical focus** — Only geopolitics + macro markets. No sports, entertainment, or fluff.
- **Wide global coverage** — 30+ high-quality curated stories across Americas, Europe, Middle East, Africa, Asia-Pacific, Russia & Central Asia.
- **Stunning UI** — Live updating market ticker with sparklines, powerful multi-filter system (category, region, topic, time, search), featured stories, rich article modals, risk sidebar.
- **Live feel** — Simulated realistic market price movement every few seconds + periodic new story injection.
- **Real RSS ingestion** (optional) — One-click "Live RSS" pulls from Reuters, Al Jazeera, BBC, FT, Nikkei and merges relevant stories.
- **Power user features** — Keyboard search (`/`), export current view as a briefing (clipboard), persistent bookmarks / reading list, instant topic and region filtering from cards.
- **Production-ready foundation** — Clean types, API route for live feeds, easy to wire real market data providers.

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Key Interactions

- **Live ticker** — Click any instrument for a quick chart modal.
- **Filters** — Combine regions + topics + category + recency. All reactive with smooth layout animations.
- **Cards** — Click anywhere to open a rich reading modal with context callouts. Click topic tags to filter instantly.
- **Refresh / Live RSS** — Top nav buttons pull fresh simulated or real-world stories.
- **Export Briefing** — Exports the currently filtered view as clean markdown ready for Slack / Notion / reports.
- **Bookmarks** — Heart icon or the Reading List button. Persisted in localStorage.
- **Keyboard** — Press `/` to focus search anywhere. `Esc` closes modals.

## Data & Extensibility

- Seed data lives in `lib/data.ts` (easy to expand).
- Live RSS logic is in `app/api/news/route.ts` — heavily keyword-filtered to stay on-topic.
- Market data is currently simulated but the structure makes it trivial to plug in real providers (Polygon, Yahoo Finance unofficial, etc.).

## Tech

- Next.js 16 (App Router) + TypeScript
- Tailwind + custom premium dark theme
- Framer Motion (layout + modal animations)
- Sonner (toasts)
- date-fns, lucide-react, recharts (mini sparklines)

Built to feel like a Bloomberg terminal lite crossed with The Economist — but laser-focused on the intersection of power and capital.
