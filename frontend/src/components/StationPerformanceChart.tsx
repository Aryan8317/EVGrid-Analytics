import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { MapPin, IndianRupee, Zap } from 'lucide-react';

interface StationPerformanceData {
  station: string;
  sessions: number;
  revenue: number;
  energy_kwh: number;
  avg_revenue_per_session: number;
}

interface StationPerformanceChartProps {
  data: StationPerformanceData[];
}

const BAR_COLORS = ['#3b82f6', '#06b6d4', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899'];

export const StationPerformanceChart: React.FC<StationPerformanceChartProps> = ({ data }) => {
  const [metric, setMetric] = useState<'revenue' | 'energy' | 'sessions'>('revenue');

  const sortedData = [...data].sort((a, b) => {
    const valA = metric === 'energy' ? a.energy_kwh : a[metric];
    const valB = metric === 'energy' ? b.energy_kwh : b[metric];
    return valB - valA;
  });

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-xl shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-bold text-white tracking-tight">Revenue & Performance by Station</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">Comparing station financial return and operational throughput</p>
        </div>

        <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/50">
          <button
            onClick={() => setMetric('revenue')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              metric === 'revenue'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <IndianRupee className="w-3.5 h-3.5" />
            Revenue
          </button>
          <button
            onClick={() => setMetric('energy')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              metric === 'energy'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Energy
          </button>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sortedData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="station"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              interval={0}
              angle={-20}
              textAnchor="end"
              height={40}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              tickFormatter={(val) =>
                metric === 'revenue'
                  ? `₹${(val / 1000).toFixed(0)}k`
                  : `${(val / 1000).toFixed(0)}k`
              }
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as StationPerformanceData;
                  return (
                    <div className="rounded-xl border border-slate-700 bg-slate-900/95 p-3.5 shadow-2xl backdrop-blur-md">
                      <div className="text-xs font-semibold text-slate-200">{item.station}</div>
                      <div className="mt-2 space-y-1 text-xs">
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-400">Total Revenue:</span>
                          <span className="font-bold text-emerald-400">₹{Math.round(item.revenue).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-400">Energy Consumed:</span>
                          <span className="font-bold text-cyan-400">{Math.round(item.energy_kwh).toLocaleString()} kWh</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-400">Sessions:</span>
                          <span className="font-bold text-white">{item.sessions.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between gap-4 pt-1 border-t border-slate-800">
                          <span className="text-slate-400">Rev / Session:</span>
                          <span className="font-bold text-blue-400">₹{item.avg_revenue_per_session.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey={metric === 'energy' ? 'energy_kwh' : metric} radius={[6, 6, 0, 0]}>
              {sortedData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
