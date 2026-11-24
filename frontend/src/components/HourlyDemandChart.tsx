import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import type { HourlyDemand } from '../types';
import { Clock, Zap, Timer } from 'lucide-react';

interface HourlyDemandChartProps {
  data: HourlyDemand[];
}

export const HourlyDemandChart: React.FC<HourlyDemandChartProps> = ({ data }) => {
  const [mode, setMode] = useState<'sessions' | 'energy' | 'dwell'>('sessions');

  const formattedData = data.map((d) => ({
    ...d,
    hourLabel: `${String(d.hour).padStart(2, '0')}:00`,
  }));

  const peak = formattedData.reduce(
    (max, curr) => (curr.sessions > (max?.sessions || 0) ? curr : max),
    formattedData[0]
  );

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-xl shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-white tracking-tight">Hourly Arrival & Demand Profile</h3>
            {peak && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Peak: {peak.hourLabel} ({peak.sessions.toLocaleString()} sessions)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            24-hour diurnal arrival curve in local California Pacific Time (PST/PDT)
          </p>
        </div>

        <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/50">
          <button
            onClick={() => setMode('sessions')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              mode === 'sessions'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Arrivals
          </button>
          <button
            onClick={() => setMode('energy')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              mode === 'energy'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Energy (kWh)
          </button>
          <button
            onClick={() => setMode('dwell')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              mode === 'dwell'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Timer className="w-3.5 h-3.5" />
            Dwell vs Charge
          </button>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {mode === 'dwell' ? (
            <BarChart data={formattedData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="hourLabel" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
                unit="h"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload as HourlyDemand & { hourLabel: string };
                    return (
                      <div className="rounded-xl border border-slate-700 bg-slate-900/95 p-3.5 shadow-2xl backdrop-blur-md text-xs">
                        <div className="font-semibold text-slate-200">{d.hourLabel} Window</div>
                        <div className="mt-2 space-y-1">
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-400">Total Stall Dwell:</span>
                            <span className="font-bold text-amber-400">{d.avg_dwell_hours} hrs</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-400">Active Power Draw:</span>
                            <span className="font-bold text-cyan-400">{d.avg_charging_hours} hrs</span>
                          </div>
                          <div className="flex justify-between gap-4 border-t border-slate-800 pt-1">
                            <span className="text-slate-400">Idle Blocking Time:</span>
                            <span className="font-bold text-rose-400">
                              {(d.avg_dwell_hours - d.avg_charging_hours).toFixed(2)} hrs
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="top"
                height={30}
                wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
              />
              <Bar dataKey="avg_dwell_hours" name="Stall Dwell (hrs)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="avg_charging_hours" name="Active Power (hrs)" fill="#06b6d4" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
            <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="hourColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={mode === 'sessions' ? '#6366f1' : '#06b6d4'} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={mode === 'sessions' ? '#6366f1' : '#06b6d4'} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="hourLabel" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
                tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val)}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload as HourlyDemand & { hourLabel: string };
                    return (
                      <div className="rounded-xl border border-slate-700 bg-slate-900/95 p-3.5 shadow-2xl backdrop-blur-md text-xs">
                        <div className="font-semibold text-slate-200">{d.hourLabel} Window</div>
                        <div className="mt-2 space-y-1">
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-400">Total Arrivals:</span>
                            <span className="font-bold text-white">{d.sessions.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-400">Energy Delivered:</span>
                            <span className="font-bold text-cyan-400">{Math.round(d.total_kwh).toLocaleString()} kWh</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-400">Avg kWh / Session:</span>
                            <span className="font-bold text-emerald-400">{d.avg_kwh} kWh</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey={mode === 'sessions' ? 'sessions' : 'total_kwh'}
                stroke={mode === 'sessions' ? '#6366f1' : '#06b6d4'}
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#hourColor)"
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
