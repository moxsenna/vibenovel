import React from 'react'

interface StatItem {
  label: string
  value: string | number
  emoji: string
}

interface StatsBarProps {
  stats: StatItem[]
}

export const StatsBar: React.FC<StatsBarProps> = ({ stats }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
    {stats.map((stat, i) => (
      <div
        key={i}
        className="bg-surface-container card-gradient rounded-[20px] p-5 inner-glow hover-glow transition-all duration-300 flex items-center gap-4"
      >
        <span className="text-3xl">{stat.emoji}</span>
        <div>
          <p className="text-label-md text-on-surface-variant uppercase tracking-wider">{stat.label}</p>
          <p className="text-headline-md text-primary-fixed-dim">{stat.value}</p>
        </div>
      </div>
    ))}
  </div>
)
