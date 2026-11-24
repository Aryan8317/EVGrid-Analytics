import React from 'react';
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
import { Users } from 'lucide-react';

interface SegmentDataPoint {
  customer_segment: string;
  sessions: number;
  avg_energy_kwh: number;
  avg_revenue: number;
  total_revenue: number;
}

interface SegmentAnalysisProps {
  data: SegmentDataPoint[];
}

const COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981'];

export const SegmentAnalysisChart: React.FC<SegmentAnalysisProps> = ({ data }) => {
  const sorted = [...data].sort((a, b) => b.total_revenue - a.total_revenue);

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-xl shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-violet-400" />
            <h3 className="text-lg font-bold text-white tracking-tight">Customer Segment Analysis</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Energy usage and monetization breakdown per customer segment
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
        {/* Chart */}
        <div className="lg:col-span-2 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sorted} layout="vertical" margin={{ top: 5, right: 20, left: 35, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis
                type="number"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
                tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
              />
              <YAxis
                type="category"
                dataKey="customer_segment"
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload as SegmentDataPoint;
                    return (
                      <div className="rounded-xl border border-slate-700 bg-slate-900/95 p-3.5 shadow-2xl backdrop-blur-md">
                        <div className="text-xs font-semibold text-slate-200">{item.customer_segment}</div>
                        <div className="mt-2 space-y-1 text-xs">
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-400">Total Revenue:</span>
                            <span className="font-bold text-emerald-400">₹{Math.round(item.total_revenue).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-400">Avg Revenue / Session:</span>
                            <span className="font-bold text-violet-400">₹{item.avg_revenue.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-400">Avg Energy / Session:</span>
                            <span className="font-bold text-cyan-400">{item.avg_energy_kwh.toFixed(1)} kWh</span>
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
              <Bar dataKey="total_revenue" radius={[0, 6, 6, 0]}>
                {sorted.map((_, index) => (
                  <Cell key={`segment-cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Segment Cards */}
        <div className="space-y-2.5">
          {sorted.map((seg, idx) => (
            <div
              key={seg.customer_segment}
              className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                />
                <div>
                  <div className="text-xs font-semibold text-white">{seg.customer_segment}</div>
                  <div className="text-[11px] text-slate-400">{seg.sessions.toLocaleString()} sessions</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-emerald-400">
                  ₹{(seg.total_revenue / 1000).toFixed(0)}k
                </div>
                <div className="text-[11px] text-slate-400">~{seg.avg_energy_kwh.toFixed(1)} kWh/s</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
