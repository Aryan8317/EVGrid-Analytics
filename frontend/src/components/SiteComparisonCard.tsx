import React from 'react';
import type { StationSummary } from '../types';
import { Building2, Clock } from 'lucide-react';

interface SiteComparisonCardProps {
  stations: StationSummary[];
  selectedSite: string;
  onSelectSite: (site: string) => void;
}

export const SiteComparisonCard: React.FC<SiteComparisonCardProps> = ({
  stations,
  selectedSite,
  onSelectSite,
}) => {
  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-xl shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-white tracking-tight">
              Site Operations & The Dwell Time Paradox
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Comparing Academic Campus (Caltech) vs. National Aerospace Workplace (JPL)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {stations.map((s) => {
          const isSelected = selectedSite.toLowerCase() === s.site_name.toLowerCase();
          const idleRatio = s.avg_dwell_hours > 0 ? (s.avg_idle_hours / s.avg_dwell_hours) * 100 : 0;
          const activeRatio = 100 - idleRatio;

          return (
            <div
              key={s.site_name}
              onClick={() => onSelectSite(isSelected ? 'all' : s.site_name)}
              className={`p-5 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-indigo-950/40 border-indigo-500 shadow-lg shadow-indigo-500/10'
                  : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-white">{s.site_name}</span>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {s.site_name === 'Caltech' ? 'University Campus' : 'NASA / JPL Lab'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {s.charger_count} EVSE Units • {s.sessions.toLocaleString()} sessions
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-bold text-emerald-400 font-mono">
                    {Math.round(s.total_kwh).toLocaleString()} kWh
                  </div>
                  <div className="text-[11px] text-slate-400">~{s.avg_kwh} kWh/session</div>
                </div>
              </div>

              {/* Dwell Breakdown Progress Bar */}
              <div className="mt-4 pt-3 border-t border-slate-800/80">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    Avg Session Duration:
                  </span>
                  <span className="font-semibold text-white font-mono">{s.avg_dwell_hours} hrs</span>
                </div>

                {/* Stacked bar: Active vs Idle */}
                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-cyan-500"
                    style={{ width: `${activeRatio}%` }}
                    title={`Active Charging: ${s.avg_charging_hours}h (${activeRatio.toFixed(1)}%)`}
                  />
                  <div
                    className="h-full bg-rose-500"
                    style={{ width: `${idleRatio}%` }}
                    title={`Idle Stall Waste: ${s.avg_idle_hours}h (${idleRatio.toFixed(1)}%)`}
                  />
                </div>

                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 text-cyan-400">
                    <span className="w-2 h-2 rounded-full bg-cyan-500" />
                    <span>Active Power: {s.avg_charging_hours}h ({activeRatio.toFixed(0)}%)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-rose-400">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span className="font-semibold">
                      Idle Waste: {s.avg_idle_hours}h ({idleRatio.toFixed(0)}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Callout */}
              <div className="mt-3 text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                {s.site_name === 'Caltech' ? (
                  <span>
                    <strong>Campus Profile:</strong> Higher student/faculty dwell variance with {idleRatio.toFixed(0)}% idle time, indicating significant charger-sharing opportunity.
                  </span>
                ) : (
                  <span>
                    <strong>Workplace Profile:</strong> High morning volume aligned with 8-hour aerospace shifts; vehicle batteries fill within 4 hours, leaving 3+ hours idle.
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
