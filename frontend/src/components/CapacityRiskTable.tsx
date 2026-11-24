import React, { useState } from 'react';
import type { CapacityRiskRecord } from '../types';
import {
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  ArrowUpDown,
  Download,
  Search,
  BatteryCharging,
  Info,
  X,
} from 'lucide-react';

interface CapacityRiskTableProps {
  data: CapacityRiskRecord[];
  onSelectCharger?: (stationId: string) => void;
}

export const CapacityRiskTable: React.FC<CapacityRiskTableProps> = ({ data, onSelectCharger }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<'all' | 'Capacity Risk' | 'Monitor' | 'Normal'>('all');
  const [sortField, setSortField] = useState<keyof CapacityRiskRecord>('peak_utilization_pct');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedRecord, setSelectedRecord] = useState<CapacityRiskRecord | null>(null);

  const handleSort = (field: keyof CapacityRiskRecord) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filtered = data
    .filter((row) => {
      const matchSearch =
        row.station_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.site_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchRisk = riskFilter === 'all' || row.capacity_flag === riskFilter;
      return matchSearch && matchRisk;
    })
    .sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDirection === 'asc' ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal);
    });

  const exportCSV = () => {
    const headers = [
      'EVSE Station ID',
      'Site Name',
      'Total Sessions',
      'Peak Sessions (07-11 AM)',
      'Total kWh Delivered',
      'Total Occupied Hours',
      'Overall Utilization Proxy %',
      'Peak Utilization Proxy %',
      'Capacity Risk Flag',
    ];
    const rows = filtered.map((r) => [
      `"${r.station_id}"`,
      `"${r.site_name}"`,
      r.total_sessions,
      r.peak_sessions,
      Number(r.total_kwh).toFixed(1),
      Number(r.total_occupied_hours).toFixed(1),
      `${r.overall_utilization_pct}%`,
      `${r.peak_utilization_pct}%`,
      `"${r.capacity_flag}"`,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `acn_charger_capacity_risk_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderBadge = (flag: CapacityRiskRecord['capacity_flag']) => {
    switch (flag) {
      case 'Capacity Risk':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertTriangle className="w-3 h-3" />
            Capacity Risk
          </span>
        );
      case 'Monitor':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertCircle className="w-3 h-3" />
            Monitor
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            Normal
          </span>
        );
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-xl shadow-xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <BatteryCharging className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white tracking-tight">
              EVSE Charger Capacity Risk Model
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Rule-based capacity risk scoring based on peak arrival hours (07:00–11:00 AM PST) and 24/7 occupancy
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Risk category pills */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-medium">
            {(['all', 'Capacity Risk', 'Monitor', 'Normal'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setRiskFilter(cat)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  riskFilter === cat
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {cat === 'all' ? 'All Units' : cat}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative flex-1 md:w-48">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter EVSE ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800/70 border border-slate-700/60 text-xs rounded-xl pl-9 pr-3 py-1.5 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors shadow-sm"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            Export
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800/80">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-800/50 text-[11px] uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-800">
            <tr>
              <th
                onClick={() => handleSort('station_id')}
                className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1">
                  EVSE Charger
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('site_name')}
                className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1">
                  Site
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('total_sessions')}
                className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1">
                  Total Sessions
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('total_kwh')}
                className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1">
                  Energy Delivered
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('overall_utilization_pct')}
                className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1">
                  Annual Utilization Proxy
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('peak_utilization_pct')}
                className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1">
                  Peak-Hour Congestion
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="py-3 px-4">Risk Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-slate-500">
                  No EVSE units match the filter criteria.
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr
                  key={item.station_id}
                  onClick={() => setSelectedRecord(item)}
                  className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                >
                  <td className="py-3 px-4 font-mono font-semibold text-white">
                    {item.station_id}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300">
                      {item.site_name}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono">{item.total_sessions.toLocaleString()}</td>
                  <td className="py-3 px-4 font-mono text-cyan-400">
                    {Math.round(Number(item.total_kwh)).toLocaleString()} kWh
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs w-10">{item.overall_utilization_pct}%</span>
                      <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full"
                          style={{ width: `${Math.min(100, item.overall_utilization_pct)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs w-11 font-semibold text-amber-400">
                        {item.peak_utilization_pct}%
                      </span>
                      <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            Number(item.peak_utilization_pct) >= 50
                              ? 'bg-rose-500'
                              : Number(item.peak_utilization_pct) >= 35
                              ? 'bg-amber-400'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, item.peak_utilization_pct)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">{renderBadge(item.capacity_flag)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Drilldown Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedRecord(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <BatteryCharging className="w-6 h-6 text-amber-400" />
              <div>
                <h3 className="text-base font-bold text-white">EVSE Charger Detail</h3>
                <span className="text-xs font-mono text-indigo-400">{selectedRecord.station_id}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs mb-5">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block mb-1">Operating Facility</span>
                <span className="font-semibold text-white text-sm">{selectedRecord.site_name}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block mb-1">Risk Category</span>
                <div>{renderBadge(selectedRecord.capacity_flag)}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block mb-1">Total Sessions</span>
                <span className="font-bold text-white font-mono text-sm">
                  {selectedRecord.total_sessions.toLocaleString()}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block mb-1">Peak Sessions (07-11h)</span>
                <span className="font-bold text-amber-400 font-mono text-sm">
                  {selectedRecord.peak_sessions.toLocaleString()}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block mb-1">Energy Throughput</span>
                <span className="font-bold text-cyan-400 font-mono text-sm">
                  {Math.round(Number(selectedRecord.total_kwh)).toLocaleString()} kWh
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block mb-1">Peak-Hour Congestion</span>
                <span className="font-bold text-rose-400 font-mono text-sm">
                  {selectedRecord.peak_utilization_pct}%
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              {onSelectCharger && (
                <button
                  onClick={() => {
                    onSelectCharger(selectedRecord.station_id);
                    setSelectedRecord(null);
                  }}
                  className="flex-1 py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
                >
                  Filter Dashboard by this EVSE
                </button>
              )}
              <button
                onClick={() => setSelectedRecord(null)}
                className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Callout */}
      <div className="mt-4 p-4 rounded-xl bg-indigo-950/30 border border-indigo-900/40 flex items-start gap-3 text-xs text-indigo-200">
        <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-white">Capacity Risk Methodology:</strong> Calibrated against the real ACN dataset.
          EVSEs showing ≥50% peak-hour utilization or ≥35% 24/7 occupancy are classified as <strong>Capacity Risk</strong>.
          Chargers between 35%–49% peak utilization are placed under <strong>Monitor</strong>.
          Click any charger row for full details or to filter the dashboard.
        </p>
      </div>
    </div>
  );
};
