import React, { useEffect, useState, useCallback } from 'react';
import type {
  SessionKPIs,
  HourlyDemand,
  DailyDemand,
  MonthlyDemand,
  HeatmapPoint,
  StationSummary,
  CapacityRiskRecord,
} from './types';
import { Header } from './components/Header';
import { KPICard } from './components/KPICard';
import { FilterBar } from './components/FilterBar';
import { HourlyDemandChart } from './components/HourlyDemandChart';
import { SiteComparisonCard } from './components/SiteComparisonCard';
import { DailyMonthlyCharts } from './components/DailyMonthlyCharts';
import { DemandHeatmap } from './components/DemandHeatmap';
import { CapacityRiskTable } from './components/CapacityRiskTable';
import { BusinessInsights } from './components/BusinessInsights';
import {
  Layers,
  Zap,
  Clock,
  Timer,
  AlertTriangle,
  Loader2,
  Calendar,
} from 'lucide-react';

const API_BASE = 'http://localhost:5001/api';

export const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [dbConnected, setDbConnected] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [site, setSite] = useState<string>('all');
  const [dayType, setDayType] = useState<string>('all');
  const [userType, setUserType] = useState<string>('all');
  const [selectedStation, setSelectedStation] = useState<string>('all');
  const [availableStations, setAvailableStations] = useState<{ station_id: string; site_name: string }[]>([]);

  // Analytical Data States
  const [kpis, setKpis] = useState<SessionKPIs | null>(null);
  const [hourlyData, setHourlyData] = useState<HourlyDemand[]>([]);
  const [dailyData, setDailyData] = useState<DailyDemand[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyDemand[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapPoint[]>([]);
  const [stationSummary, setStationSummary] = useState<StationSummary[]>([]);
  const [capacityRisk, setCapacityRisk] = useState<CapacityRiskRecord[]>([]);

  // Fetch Filter Options once
  useEffect(() => {
    fetch(`${API_BASE}/filters/options`)
      .then((res) => res.json())
      .then((data) => {
        if (data.stations) {
          setAvailableStations(data.stations);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch filter options from backend:', err);
      });
  }, []);

  // Fetch Dashboard Data whenever filters change
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (site !== 'all') params.append('site', site);
    if (dayType !== 'all') params.append('day_type', dayType);
    if (userType !== 'all') params.append('user_type', userType);
    if (selectedStation !== 'all') params.append('station', selectedStation);

    const queryStr = params.toString() ? `?${params.toString()}` : '';

    try {
      const [
        kpiRes,
        hourlyRes,
        dailyRes,
        monthlyRes,
        heatRes,
        stationsRes,
        riskRes,
      ] = await Promise.all([
        fetch(`${API_BASE}/kpis${queryStr}`),
        fetch(`${API_BASE}/demand/hourly${queryStr}`),
        fetch(`${API_BASE}/demand/daily${queryStr}`),
        fetch(`${API_BASE}/demand/monthly${queryStr}`),
        fetch(`${API_BASE}/demand/heatmap${queryStr}`),
        fetch(`${API_BASE}/stations${queryStr}`),
        fetch(`${API_BASE}/capacity-risk${queryStr}`),
      ]);

      if (!kpiRes.ok) throw new Error(`Backend returned status ${kpiRes.status}`);

      const kpisData = await kpiRes.json();
      const hourly = await hourlyRes.json();
      const daily = await dailyRes.json();
      const monthly = await monthlyRes.json();
      const heatmap = await heatRes.json();
      const stations = await stationsRes.json();
      const risk = await riskRes.json();

      setKpis(kpisData);
      setHourlyData(hourly);
      setDailyData(daily);
      setMonthlyData(monthly);
      setHeatmapData(heatmap);
      setStationSummary(stations);
      setCapacityRisk(risk);
      setDbConnected(true);
      setLoading(false);
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(`Failed connecting to backend API: ${err.message}. Ensure backend is running.`);
      setDbConnected(false);
      setLoading(false);
    }
  }, [site, dayType, userType, selectedStation]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleResetFilters = () => {
    setSite('all');
    setDayType('all');
    setUserType('all');
    setSelectedStation('all');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header
        dbConnected={dbConnected}
        totalSessions={kpis ? kpis.total_sessions : 27870}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Controls */}
        <FilterBar
          site={site}
          onSiteChange={setSite}
          dayType={dayType}
          onDayTypeChange={setDayType}
          userType={userType}
          onUserTypeChange={setUserType}
          selectedStation={selectedStation}
          onStationChange={setSelectedStation}
          availableStations={availableStations}
          onReset={handleResetFilters}
          totalFiltered={kpis ? kpis.total_sessions : 0}
        />

        {loading ? (
          <div className="h-96 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <span className="text-sm font-medium">Querying PostgreSQL database...</span>
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-3">
            <AlertTriangle className="w-6 h-6" />
            <div>
              <div className="font-bold">Database Query Error</div>
              <div className="text-xs text-rose-300/80">{error}</div>
            </div>
          </div>
        ) : kpis ? (
          <div className="space-y-6">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard
                title="Total Verified Sessions"
                value={kpis.total_sessions.toLocaleString()}
                subtext={`${kpis.active_chargers} active EVSE chargers`}
                icon={Layers}
                color="indigo"
              />
              <KPICard
                title="Total Energy Delivered"
                value={`${Number(kpis.total_energy_kwh).toLocaleString()} kWh`}
                subtext={`Avg ${kpis.avg_energy_per_session} kWh/session`}
                icon={Zap}
                color="cyan"
              />
              <KPICard
                title="Avg Connection Duration"
                value={`${kpis.avg_dwell_hours} hrs`}
                subtext={`Active power: ${kpis.avg_charging_hours} hrs`}
                icon={Clock}
                color="amber"
              />
              <KPICard
                title="Idle Stall Occupancy"
                value={`${kpis.avg_idle_hours} hrs`}
                subtext={`${kpis.idle_dwell_pct}% of total dwell is idle`}
                icon={Timer}
                color="emerald"
              />
            </div>

            {/* Peak Arrival Window Highlight Bar */}
            <div className="p-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-900/40 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                <span className="text-slate-300">
                  <strong className="text-white">Peak Arrival Window:</strong>{' '}
                  <span className="text-amber-400 font-bold font-mono text-sm">{kpis.peak_hour} PST</span> ({kpis.peak_hour_sessions.toLocaleString()} sessions)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span className="text-slate-300">
                  <strong className="text-white">Busiest Day:</strong>{' '}
                  <span className="text-indigo-400 font-bold">{kpis.peak_day}</span> ({kpis.peak_day_sessions.toLocaleString()} sessions)
                </span>
              </div>
              <div className="text-slate-400">
                Data Source: <span className="text-white font-semibold">Caltech Adaptive Charging Network</span>
              </div>
            </div>

            {/* Site Operations Card (Caltech vs JPL & Dwell Paradox) */}
            <SiteComparisonCard
              stations={stationSummary}
              selectedSite={site}
              onSelectSite={setSite}
            />

            {/* Hourly Arrival & Demand Chart */}
            <HourlyDemandChart data={hourlyData} />

            {/* Daily & Monthly Charts */}
            <DailyMonthlyCharts dailyData={dailyData} monthlyData={monthlyData} />

            {/* Congestion Heatmap */}
            <DemandHeatmap data={heatmapData} />

            {/* Capacity Risk Management Table */}
            <CapacityRiskTable
              data={capacityRisk}
              onSelectCharger={setSelectedStation}
            />

            {/* Business Insights & Recommendations */}
            <BusinessInsights />
          </div>
        ) : null}
      </main>

      <footer className="border-t border-slate-800/80 py-6 mt-12 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>ACN-Data EV Charging Analytics — Built with PostgreSQL, Express, React & Tailwind CSS</span>
          <span>Source: Caltech Adaptive Charging Network (`ev.caltech.edu/dataset`)</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
