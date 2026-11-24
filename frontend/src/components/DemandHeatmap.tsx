import React, { useState } from 'react';
import type { HeatmapPoint } from '../types';
import { Calendar, Flame } from 'lucide-react';

interface HeatmapProps {
  data: HeatmapPoint[];
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export const DemandHeatmap: React.FC<HeatmapProps> = ({ data }) => {
  const [hoveredCell, setHoveredCell] = useState<{
    day: string;
    hour: number;
    count: number;
  } | null>(null);

  const matrix = new Map<string, number>();
  let maxCount = 1;

  data.forEach((d) => {
    const key = `${d.day_name}-${d.hour}`;
    matrix.set(key, d.count);
    if (d.count > maxCount) maxCount = d.count;
  });

  const getColor = (count: number) => {
    if (count === 0) return 'bg-slate-900/60 border-slate-800/40 text-slate-600';
    const ratio = count / maxCount;
    if (ratio < 0.15) return 'bg-indigo-950/60 border-indigo-900/30 text-indigo-400';
    if (ratio < 0.35) return 'bg-indigo-800/70 border-indigo-700/50 text-indigo-300';
    if (ratio < 0.60) return 'bg-indigo-600/80 border-indigo-500/60 text-indigo-100';
    if (ratio < 0.85) return 'bg-violet-500 border-violet-400 text-white';
    return 'bg-amber-400 border-amber-300 text-slate-950 font-bold shadow-sm shadow-amber-500/40';
  };

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-xl shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-white tracking-tight">Demand Congestion Heatmap</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Visualizing arrival frequency matrix across days and hours (PST)
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Low</span>
          <div className="flex gap-1 items-center">
            <span className="w-3.5 h-3.5 rounded bg-indigo-950/70 border border-indigo-900/50" />
            <span className="w-3.5 h-3.5 rounded bg-indigo-700/80 border border-indigo-600" />
            <span className="w-3.5 h-3.5 rounded bg-indigo-500 border border-indigo-400" />
            <span className="w-3.5 h-3.5 rounded bg-amber-400 border border-amber-300" />
          </div>
          <span className="font-semibold text-amber-400 flex items-center gap-0.5">
            <Flame className="w-3 h-3" /> Peak Morning Arrival
          </span>
        </div>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="min-w-[700px]">
          <div className="grid grid-cols-[80px_repeat(24,minmax(0,1fr))] gap-1 mb-1 text-[10px] text-slate-400 text-center font-medium">
            <div className="text-left font-semibold pl-1 text-slate-500">Day / Hr</div>
            {HOURS.map((hr) => (
              <div key={hr} className="truncate">
                {hr % 3 === 0 ? `${hr}h` : ''}
              </div>
            ))}
          </div>

          <div className="space-y-1">
            {DAYS_OF_WEEK.map((day) => (
              <div key={day} className="grid grid-cols-[80px_repeat(24,minmax(0,1fr))] gap-1 items-center">
                <div className="text-xs font-medium text-slate-300 truncate pl-1">
                  {day.slice(0, 3)}
                </div>
                {HOURS.map((hour) => {
                  const count = matrix.get(`${day}-${hour}`) || 0;
                  return (
                    <div
                      key={hour}
                      onMouseEnter={() => setHoveredCell({ day, hour, count })}
                      onMouseLeave={() => setHoveredCell(null)}
                      className={`h-7 rounded border transition-transform duration-150 flex items-center justify-center cursor-pointer hover:scale-125 hover:z-20 hover:shadow-lg ${getColor(
                        count
                      )}`}
                    >
                      {count === maxCount && (
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
        {hoveredCell ? (
          <div className="flex items-center gap-3 text-slate-200">
            <span className="font-semibold text-indigo-400">{hoveredCell.day}</span>
            <span className="text-slate-400">Window:</span>
            <span className="font-semibold font-mono">
              {String(hoveredCell.hour).padStart(2, '0')}:00 - {String(hoveredCell.hour + 1).padStart(2, '0')}:00
            </span>
            <span className="text-slate-400">Total Arrivals:</span>
            <span className="font-bold text-amber-400 font-mono">{hoveredCell.count.toLocaleString()}</span>
          </div>
        ) : (
          <span className="text-slate-500 italic">
            Hover over blocks to see exact arrivals. Note the heavy commuter peak on Tuesday–Thursday between 07:00–09:00.
          </span>
        )}
        <span className="text-slate-500 font-mono text-[11px]">24 hrs × 7 days</span>
      </div>
    </div>
  );
};
