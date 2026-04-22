'use client'

import { scoreColor } from '@/lib/scoring'

interface Props {
  score: number
  size?: 'sm' | 'md' | 'lg'
  label?: string
}

const SIZES = {
  sm: { r: 26, cx: 34, cy: 34, vb: '0 0 68 68', sw: 6, fs: 13 },
  md: { r: 38, cx: 48, cy: 48, vb: '0 0 96 96', sw: 8, fs: 18 },
  lg: { r: 52, cx: 64, cy: 64, vb: '0 0 128 128', sw: 10, fs: 24 },
}

export function ScoreGauge({ score, size = 'md', label }: Props) {
  const { r, cx, cy, vb, sw, fs } = SIZES[size]
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const color = scoreColor(score)

  const sizeClass = size === 'sm' ? 'w-17 h-17' : size === 'md' ? 'w-24 h-24' : 'w-32 h-32'

  return (
    <div className="flex flex-col items-center gap-1">
      <svg viewBox={vb} className={sizeClass}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth={sw} />
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: 'stroke-dashoffset 0.4s ease' }}
        />
        <text
          x={cx} y={cy}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={fs}
          fontWeight="700"
          fill="#111827"
        >
          {score}
        </text>
      </svg>
      {label && <span className="text-xs text-gray-500 font-medium">{label}</span>}
    </div>
  )
}
