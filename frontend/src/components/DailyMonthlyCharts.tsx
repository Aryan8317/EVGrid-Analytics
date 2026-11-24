import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { DailyDemand, MonthlyDemand } from '../types';
import { Calendar, TrendingUp } from 'lucide-react';

interface DailyMonthlyChartsProps {
  dailyData: DailyDemand[];
  monthlyData: MonthlyDemand[];
}

export const DailyMonthlyCharts: React.FC<DailyMonthlyChartsProps> = ({
  dailyData,
  monthlyData,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Daily Demand */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-xl shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-400" />
              <h3 className="text-lg font-bold text-white tracking-tight">Demand by Day of Week</h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Weekday commuter surge vs. weekend operational drop
            </p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="day_name" stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(val) => val.slice(0, 3)} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={{ stroke: '#334155' }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload as DailyDemand;
                    return (
                      <div className="rounded-xl border border-slate-700 bg-slate-900/95 p-3.5 shadow-2xl backdrop-blur-md text-xs">
                        <div className="font-semibold text-slate-200">{d.day_name}</div>
                        <div className="mt-2 space-y-1">
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-400">Sessions:</span>
                            <span className="font-bold text-white">{d.sessions.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-400">Total Energy:</span>
                            <span className="font-bold text-cyan-400">{Math.round(d.total_kwh).toLocaleString()} kWh</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-400">Avg Dwell:</span>
                            <span className="font-bold text-amber-400">{d.avg_dwell_hours} hrs</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="sessions" radius={[6, 6, 0, 0]}>
                {dailyData.map((d, index) => (
                  <Cell
                    key={`day-${index}`}
                    fill={d.day_of_week >= 5 ? '#334155' : '#6366f1'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Demand */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-xl shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-bold text-white tracking-tight">Monthly Energy & Sessions (2019)</h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">12-month trajectory across full operating year</p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="month_name" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={{ stroke: '#334155' }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload as MonthlyDemand;
                    return (
                      <div className="rounded-xl border border-slate-700 bg-slate-900/95 p-3.5 shadow-2xl backdrop-blur-md text-xs">
                        <div className="font-semibold text-slate-200">{d.month_name} 2019</div>
                        <div className="mt-2 space-y-1">
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-400">Total Sessions:</span>
                            <span className="font-bold text-white">{d.sessions.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-400">Energy Delivered:</span>
                            <span className="font-bold text-emerald-400">{Math.round(d.total_kwh).toLocaleString()} kWh</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-400">Avg kWh / Session:</span>
                            <span className="font-bold text-cyan-400">{d.avg_kwh} kWh</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey="sessions"
                name="Sessions"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
