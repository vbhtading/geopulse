"use client";

import { MarketInstrument } from "@/lib/types";
import { useState } from "react";
import MiniSparkline from "./MiniSparkline";

interface MarketTickerProps {
  instruments: MarketInstrument[];
  onInstrumentClick?: (instrument: MarketInstrument) => void;
}

export default function MarketTicker({ instruments, onInstrumentClick }: MarketTickerProps) {
  return (
    <div className="ticker overflow-x-auto whitespace-nowrap flex items-center py-1 text-sm">
      <div className="flex items-center px-3 text-[#6f7685] text-xs font-medium tracking-[1px] shrink-0 mr-2">
        LIVE MARKETS
      </div>
      {instruments.map((inst, index) => {
        const isUp = inst.change >= 0;
        return (
          <button
            key={`${inst.symbol}-${index}`}
            onClick={() => onInstrumentClick?.(inst)}
            className="ticker-item flex items-center gap-3 text-left hover:bg-[#1a1f2a] active:bg-[#11141c] transition-colors shrink-0"
          >
            <div>
              <div className="font-mono text-xs text-[#a1a7b5]">{inst.symbol}</div>
              <div className="font-medium text-[13px] leading-none mt-0.5">{inst.name}</div>
            </div>
            <div className="text-right min-w-[78px]">
              <div className="font-mono font-semibold tracking-tight">
                {inst.symbol.includes("USD") || inst.symbol === "USDCNY"
                  ? inst.price.toFixed(3)
                  : inst.price.toLocaleString()}
              </div>
              <div className={`font-mono text-xs ${isUp ? "price-up" : "price-down"}`}>
                {isUp ? "+" : ""}
                {inst.change.toFixed(2)}%
              </div>
            </div>
            <div className="pl-1 opacity-75">
              <MiniSparkline data={inst.history} width={56} height={20} />
            </div>
          </button>
        );
      })}
      <div className="px-4 text-[10px] text-[#6f7685] shrink-0">LIVE (real + simulated drift)</div>
    </div>
  );
}
