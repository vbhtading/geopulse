"use client";

import { RegionRisk } from "@/lib/types";
import { motion } from "framer-motion";

interface RiskSidebarProps {
  risks: RegionRisk[];
  onRegionClick: (region: string) => void;
}

const levelColor = {
  High: "var(--risk-high)",
  Elevated: "var(--risk-elevated)",
  Moderate: "var(--risk-moderate)",
  Low: "var(--risk-low)",
};

export default function RiskSidebar({ risks, onRegionClick }: RiskSidebarProps) {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="text-sm font-semibold tracking-tight">REGIONAL RISK</div>
          <div className="text-[10px] text-[#6f7685] uppercase tracking-widest">Live</div>
        </div>
        <div className="space-y-3">
          {risks.map((risk) => (
            <button
              key={risk.region}
              onClick={() => onRegionClick(risk.region)}
              className="w-full text-left bg-[#11141c] hover:bg-[#1a1f2a] border border-[#252a36] hover:border-[#353c4a] rounded-xl p-3.5 transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm group-hover:text-[#c5a46e] transition-colors">{risk.region}</span>
                <span className="text-xs text-[#6f7685]">{risk.storyCount} stories</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="risk-bar flex-1">
                  <div
                    className="risk-fill"
                    style={{
                      width: `${risk.score}%`,
                      background: levelColor[risk.level],
                    }}
                  />
                </div>
                <span className="font-mono text-xs w-8 text-right" style={{ color: levelColor[risk.level] }}>
                  {risk.score}
                </span>
              </div>
              <div className="text-[10px] mt-1 text-[#6f7685]">{risk.level} RISK</div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#11141c] border border-[#252a36] rounded-xl p-4">
        <div className="text-sm font-semibold mb-3 tracking-tight">KEY METRICS</div>
        <div className="space-y-2.5 text-sm">
          <div className="flex justify-between">
            <span className="text-[#a1a7b5]">Active major conflicts</span>
            <span className="font-medium">11</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#a1a7b5]">Sanctions regimes active</span>
            <span className="font-medium">27</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#a1a7b5]">Oil transit chokepoints stressed</span>
            <span className="font-medium">3</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#a1a7b5]">Central banks in play</span>
            <span className="font-medium">9</span>
          </div>
        </div>
      </div>
    </div>
  );
}
