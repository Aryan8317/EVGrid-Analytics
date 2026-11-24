import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

interface MonthlyDataPoint {
  month: number;
  month_name: string;
  revenue: number;
  energy_kwh: number;
  sessions: number;
}

interface MonthlyTrendChartProps {
  data: MonthlyDataPoint[];
}

export const MonthlyTrendChart: React.FC<MonthlyTrendChartProps> = ({ data }) => {
  const sortedData = [...data].sort((a, b) => a.month - b.month);

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-xl shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-white tracking-tight">Monthly Revenue & Energy Trend</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">12-month trajectory across Jan – Dec 2025</p>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sortedData} margin={{ top: 10, right: 15, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="month_name"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />
            <YAxis
              yAxisId="left"
              stroke="#10b981"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#06b6d4"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as MonthlyDataPoint;
                  return (
                    <div className="rounded-xl border border-slate-700 bg-slate-900/95 p-3.5 shadow-2xl backdrop-blur-md">
                      <div className="text-xs font-semibold text-slate-200">{item.month_name} 2025</div>
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
                          <span className="text-slate-400">Total Sessions:</span>
                          <span className="font-bold text-white">{item.sessions.toLocaleString()}</span>
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
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="revenue"
              name="Revenue (₹)"
              stroke="#10b981"
              strokeWidth={3}
              dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="energy_kwh"
              name="Energy (kWh)"
              stroke="#06b6d4"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={{ r: 3, fill: '#06b6d4', strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
