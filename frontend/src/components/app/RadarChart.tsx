'use client';

// ============================================================================
// File: frontend/src/components/app/RadarChart.tsx
// Description: Lightweight SVG Radar / Spider Chart for multi-dimensional interview scoring
// ============================================================================

import React from 'react';

interface RadarChartProps {
  data: {
    axis: string;
    value: number; // 0 to 100
  }[];
  size?: number;
}

export function RadarChart({ data, size = 260 }: RadarChartProps) {
  const center = size / 2;
  const radius = center - 36;
  const angleStep = (Math.PI * 2) / data.length;

  // Grid levels (25%, 50%, 75%, 100%)
  const levels = [0.25, 0.5, 0.75, 1];

  // Calculate polygon points
  const points = data.map((d, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const r = (d.value / 100) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="flex flex-col items-center justify-center relative">
      <svg width={size} height={size} className="overflow-visible">
        {/* Background Grid Rings */}
        {levels.map((lvl, idx) => {
          const r = radius * lvl;
          const gridPoints = data.map((_, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const x = center + r * Math.cos(angle);
            const y = center + r * Math.sin(angle);
            return `${x},${y}`;
          }).join(' ');

          return (
            <polygon
              key={idx}
              points={gridPoints}
              fill="none"
              stroke="currentColor"
              className="text-black/[0.08] dark:text-white/[0.08]"
              strokeWidth="1"
            />
          );
        })}

        {/* Axis Spokes */}
        {data.map((_, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const x = center + radius * Math.cos(angle);
          const y = center + radius * Math.sin(angle);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="currentColor"
              className="text-black/[0.08] dark:text-white/[0.08]"
              strokeWidth="1"
            />
          );
        })}

        {/* Shaded Area Polygon */}
        <polygon
          points={points}
          fill="url(#radarGradient)"
          stroke="#6C5CE7"
          strokeWidth="2.5"
          className="transition-all duration-700 ease-out drop-shadow-md"
        />

        {/* Score Data Dots */}
        {data.map((d, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const r = (d.value / 100) * radius;
          const x = center + r * Math.cos(angle);
          const y = center + r * Math.sin(angle);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="4"
              className="fill-white dark:fill-[#121217] stroke-[#6C5CE7]"
              strokeWidth="2"
            />
          );
        })}

        {/* Gradient Definition */}
        <defs>
          <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6C5CE7" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* Axis Labels */}
        {data.map((d, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const labelR = radius + 22;
          const x = center + labelR * Math.cos(angle);
          const y = center + labelR * Math.sin(angle);
          return (
            <text
              key={i}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              className="text-[10px] font-bold fill-[#5A5A63] dark:fill-[#A1A1AA]"
            >
              {d.axis}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
