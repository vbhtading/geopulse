"use client";

interface MiniSparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}

export default function MiniSparkline({ data, color = "#14b8a6", width = 64, height = 24 }: MiniSparklineProps) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  const last = data[data.length - 1];
  const first = data[0];
  const isUp = last >= first;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={isUp ? "#22c55e" : "#ef4444"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={(data.length - 1) / (data.length - 1) * width}
        cy={height - ((last - min) / range) * height}
        r="1.5"
        fill={isUp ? "#22c55e" : "#ef4444"}
      />
    </svg>
  );
}
