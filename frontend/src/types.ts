export interface SessionKPIs {
  total_sessions: number;
  active_chargers: number;
  total_sites: number;
  unique_users: number;
  total_energy_kwh: number | string;
  avg_energy_per_session: number | string;
  avg_dwell_hours: number | string;
  avg_charging_hours: number | string;
  avg_idle_hours: number | string;
  peak_hour: string;
  peak_hour_sessions: number;
  peak_day: string;
  peak_day_sessions: number;
  idle_dwell_pct: number | string;
}

export interface HourlyDemand {
  hour: number;
  sessions: number;
  total_kwh: number;
  avg_kwh: number;
  avg_dwell_hours: number;
  avg_charging_hours: number;
}

export interface DailyDemand {
  day_of_week: number;
  day_name: string;
  sessions: number;
  total_kwh: number;
  avg_kwh: number;
  avg_dwell_hours: number;
}

export interface MonthlyDemand {
  month: number;
  month_name: string;
  sessions: number;
  total_kwh: number;
  avg_kwh: number;
  avg_dwell_hours: number;
}

export interface HeatmapPoint {
  day_name: string;
  day_of_week: number;
  hour: number;
  count: number;
}

export interface StationSummary {
  site_name: string;
  sessions: number;
  charger_count: number;
  total_kwh: number;
  avg_kwh: number;
  total_occupied_hours: number;
  avg_dwell_hours: number;
  avg_charging_hours: number;
  avg_idle_hours: number;
  idle_pct: number;
}

export interface ChargerDetail {
  station_id: string;
  site_name: string;
  sessions: number;
  total_kwh: number;
  avg_kwh: number;
  total_occupied_hours: number;
  avg_duration_hours: number;
  avg_idle_hours: number;
  utilization_proxy_pct: number;
}

export interface CapacityRiskRecord {
  station_id: string;
  site_name: string;
  total_sessions: number;
  peak_sessions: number;
  total_kwh: number;
  total_occupied_hours: number;
  peak_occupied_hours: number;
  overall_utilization_pct: number;
  peak_utilization_pct: number;
  capacity_flag: 'Capacity Risk' | 'Monitor' | 'Normal';
}
