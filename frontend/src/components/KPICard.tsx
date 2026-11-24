import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string;
  subtext?: string;
  icon: LucideIcon;
  color: 'emerald' | 'cyan' | 'violet' | 'amber' | 'blue' | 'indigo';
  trend?: string;
}

const colorStyles = {
  indigo: {
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/20 hover:border-indigo-500/40',
    iconColor: 'text-indigo-400',
    iconBg: 'bg-indigo-500/20',
  },
  emerald: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20 hover:border-emerald-500/40',
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/20',
  },
  cyan: {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20 hover:border-cyan-500/40',
    iconColor: 'text-cyan-400',
    iconBg: 'bg-cyan-500/20',
  },
  violet: {
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20 hover:border-violet-500/40',
    iconColor: 'text-violet-400',
    iconBg: 'bg-violet-500/20',
  },
  amber: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20 hover:border-amber-500/40',
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/20',
  },
  blue: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20 hover:border-blue-500/40',
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-500/20',
  },
};

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtext,
  icon: Icon,
  color,
  trend,
}) => {
  const style = colorStyles[color];

  return (
    <div
      className={`rounded-2xl border ${style.border} ${style.bg} backdrop-blur-md p-5 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </span>
        <div className={`p-2.5 rounded-xl ${style.iconBg} ${style.iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-3">
        <div className="text-3xl font-bold tracking-tight text-white">{value}</div>
        <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
          {subtext && <span>{subtext}</span>}
          {trend && (
            <span className="font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              {trend}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
