import { NextResponse } from "next/server";

const SYMBOLS = ["^GSPC", "^IXIC", "^DJI", "CL=F", "GC=F", "BZ=F", "EURUSD=X", "USDJPY=X"];

interface YahooChartResponse {
  chart?: {
    result?: Array<{
      meta?: {
        regularMarketPrice?: number;
        previousClose?: number;
      };
    }>;
  };
}

function getChange(current: number, previous: number): number {
  if (!previous || previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

export async function GET() {
  const results: Record<string, { price: number; change: number }> = {};

  await Promise.all(
    SYMBOLS.map(async (symbol) => {
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
        const res = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; Geopulse/1.0)",
          },
          next: { revalidate: 30 }, // cache for 30s
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data: YahooChartResponse = await res.json();
        const meta = data.chart?.result?.[0]?.meta;

        if (meta?.regularMarketPrice) {
          const price = meta.regularMarketPrice;
          const prev = meta.previousClose ?? price;
          const change = getChange(price, prev);

          results[symbol] = {
            price: Math.round(price * (symbol.includes("USD") || symbol.includes("JPY") ? 1000 : 100)) / (symbol.includes("USD") || symbol.includes("JPY") ? 1000 : 100),
            change: Math.round(change * 100) / 100,
          };
        }
      } catch (e) {
        // Silent fallback — caller will use simulation
        console.warn(`Yahoo fetch failed for ${symbol}:`, e);
      }
    })
  );

  return NextResponse.json({
    markets: results,
    fetchedAt: new Date().toISOString(),
  });
}
