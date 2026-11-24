const express = require('express');
const cors = require('cors');
const { query } = require('./db');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Helper to construct dynamic WHERE clauses safely
function buildWhereClause(reqQuery, startIndex = 1) {
  const conditions = [];
  const params = [];
  let paramIdx = startIndex;

  if (reqQuery.site && reqQuery.site !== 'all') {
    conditions.push(`site_name = $${paramIdx++}`);
    params.push(reqQuery.site);
  }

  if (reqQuery.station && reqQuery.station !== 'all') {
    conditions.push(`station_id = $${paramIdx++}`);
    params.push(reqQuery.station);
  }

  if (reqQuery.day_type && reqQuery.day_type !== 'all') {
    if (reqQuery.day_type === 'weekday') {
      conditions.push(`is_weekend = false`);
    } else if (reqQuery.day_type === 'weekend') {
      conditions.push(`is_weekend = true`);
    }
  }

  if (reqQuery.user_type && reqQuery.user_type !== 'all') {
    conditions.push(`user_type = $${paramIdx++}`);
    params.push(reqQuery.user_type);
  }

  if (reqQuery.date_from) {
    conditions.push(`date >= $${paramIdx++}`);
    params.push(reqQuery.date_from);
  }

  if (reqQuery.date_to) {
    conditions.push(`date <= $${paramIdx++}`);
    params.push(reqQuery.date_to);
  }

  const whereStr = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { whereStr, params };
}

// ----------------------------------------------------------------------------
// 1. GET /api/kpis
// Executive summary metrics based on real ACN data
// ----------------------------------------------------------------------------
app.get('/api/kpis', async (req, res) => {
  try {
    const { whereStr, params } = buildWhereClause(req.query);

    const kpiSql = `
      SELECT 
        COUNT(*)::int AS total_sessions,
        COUNT(DISTINCT station_id)::int AS active_chargers,
        COUNT(DISTINCT site_name)::int AS total_sites,
        COUNT(DISTINCT user_id)::int AS unique_users,
        ROUND(COALESCE(SUM(kwh_delivered), 0)::numeric, 1) AS total_energy_kwh,
        ROUND(COALESCE(AVG(kwh_delivered), 0)::numeric, 2) AS avg_energy_per_session,
        ROUND(COALESCE(AVG(connection_duration_hours), 0)::numeric, 2) AS avg_dwell_hours,
        ROUND(COALESCE(AVG(charging_duration_hours), 0)::numeric, 2) AS avg_charging_hours,
        ROUND(COALESCE(AVG(idle_duration_hours), 0)::numeric, 2) AS avg_idle_hours
      FROM charging_sessions
      ${whereStr}
    `;

    const kpis = await query(kpiSql, params);

    // Peak hour query
    const peakHourSql = `
      SELECT hour, COUNT(*)::int AS session_count
      FROM charging_sessions
      ${whereStr}
      GROUP BY hour
      ORDER BY session_count DESC
      LIMIT 1
    `;
    const peakHourRes = await query(peakHourSql, params);

    // Peak day query
    const peakDaySql = `
      SELECT day_name, COUNT(*)::int AS session_count
      FROM charging_sessions
      ${whereStr}
      GROUP BY day_name, day_of_week
      ORDER BY session_count DESC
      LIMIT 1
    `;
    const peakDayRes = await query(peakDaySql, params);

    res.json({
      ...kpis[0],
      peak_hour: peakHourRes[0] ? `${String(peakHourRes[0].hour).padStart(2, '0')}:00` : 'N/A',
      peak_hour_sessions: peakHourRes[0] ? peakHourRes[0].session_count : 0,
      peak_day: peakDayRes[0] ? peakDayRes[0].day_name : 'N/A',
      peak_day_sessions: peakDayRes[0] ? peakDayRes[0].session_count : 0,
      idle_dwell_pct: kpis[0].avg_dwell_hours > 0 
        ? ((kpis[0].avg_idle_hours / kpis[0].avg_dwell_hours) * 100).toFixed(1) 
        : 0
    });
  } catch (err) {
    console.error('Error in /api/kpis:', err);
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------------------------------
// 2. GET /api/demand/hourly
// 24-hour demand pattern with active charging vs idle dwell
// ----------------------------------------------------------------------------
app.get('/api/demand/hourly', async (req, res) => {
  try {
    const { whereStr, params } = buildWhereClause(req.query);

    const sql = `
      SELECT 
        hour,
        COUNT(*)::int AS sessions,
        ROUND(SUM(kwh_delivered)::numeric, 1) AS total_kwh,
        ROUND(AVG(kwh_delivered)::numeric, 2) AS avg_kwh,
        ROUND(AVG(connection_duration_hours)::numeric, 2) AS avg_dwell_hours,
        ROUND(AVG(charging_duration_hours)::numeric, 2) AS avg_charging_hours
      FROM charging_sessions
      ${whereStr}
      GROUP BY hour
      ORDER BY hour ASC
    `;

    const rows = await query(sql, params);
    
    // Fill all 24 hours if missing
    const fullHours = Array.from({ length: 24 }, (_, i) => {
      const match = rows.find(r => Number(r.hour) === i);
      return match || {
        hour: i,
        sessions: 0,
        total_kwh: 0,
        avg_kwh: 0,
        avg_dwell_hours: 0,
        avg_charging_hours: 0
      };
    });

    res.json(fullHours);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------------------------------
// 3. GET /api/demand/daily
// Monday through Sunday demand distribution
// ----------------------------------------------------------------------------
app.get('/api/demand/daily', async (req, res) => {
  try {
    const { whereStr, params } = buildWhereClause(req.query);

    const sql = `
      SELECT 
        day_of_week,
        day_name,
        COUNT(*)::int AS sessions,
        ROUND(SUM(kwh_delivered)::numeric, 1) AS total_kwh,
        ROUND(AVG(kwh_delivered)::numeric, 2) AS avg_kwh,
        ROUND(AVG(connection_duration_hours)::numeric, 2) AS avg_dwell_hours
      FROM charging_sessions
      ${whereStr}
      GROUP BY day_of_week, day_name
      ORDER BY day_of_week ASC
    `;

    const rows = await query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------------------------------
// 4. GET /api/demand/monthly
// Monthly trajectory (Jan - Dec 2019)
// ----------------------------------------------------------------------------
app.get('/api/demand/monthly', async (req, res) => {
  try {
    const { whereStr, params } = buildWhereClause(req.query);

    const sql = `
      SELECT 
        month,
        month_name,
        COUNT(*)::int AS sessions,
        ROUND(SUM(kwh_delivered)::numeric, 1) AS total_kwh,
        ROUND(AVG(kwh_delivered)::numeric, 2) AS avg_kwh,
        ROUND(AVG(connection_duration_hours)::numeric, 2) AS avg_dwell_hours
      FROM charging_sessions
      ${whereStr}
      GROUP BY month, month_name
      ORDER BY month ASC
    `;

    const rows = await query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------------------------------
// 5. GET /api/demand/heatmap
// Day of Week x Hour matrix
// ----------------------------------------------------------------------------
app.get('/api/demand/heatmap', async (req, res) => {
  try {
    const { whereStr, params } = buildWhereClause(req.query);

    const sql = `
      SELECT 
        day_name,
        day_of_week,
        hour,
        COUNT(*)::int AS count
      FROM charging_sessions
      ${whereStr}
      GROUP BY day_name, day_of_week, hour
      ORDER BY day_of_week ASC, hour ASC
    `;

    const rows = await query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------------------------------
// 6. GET /api/stations
// Site comparison (Caltech vs JPL) with Dwell Paradox metrics
// ----------------------------------------------------------------------------
app.get('/api/stations', async (req, res) => {
  try {
    const { whereStr, params } = buildWhereClause(req.query);

    const sql = `
      SELECT 
        site_name,
        COUNT(*)::int AS sessions,
        COUNT(DISTINCT station_id)::int AS charger_count,
        ROUND(SUM(kwh_delivered)::numeric, 1) AS total_kwh,
        ROUND(AVG(kwh_delivered)::numeric, 2) AS avg_kwh,
        ROUND(SUM(connection_duration_hours)::numeric, 1) AS total_occupied_hours,
        ROUND(AVG(connection_duration_hours)::numeric, 2) AS avg_dwell_hours,
        ROUND(AVG(charging_duration_hours)::numeric, 2) AS avg_charging_hours,
        ROUND(AVG(idle_duration_hours)::numeric, 2) AS avg_idle_hours,
        ROUND(100.0 * AVG(idle_duration_hours) / NULLIF(AVG(connection_duration_hours), 0), 1) AS idle_pct
      FROM charging_sessions
      ${whereStr}
      GROUP BY site_name
      ORDER BY total_kwh DESC
    `;

    const rows = await query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------------------------------
// 7. GET /api/stations/:id
// Detailed breakdown for a single site or single EVSE
// ----------------------------------------------------------------------------
app.get('/api/stations/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const isSite = id.toLowerCase() === 'caltech' || id.toLowerCase() === 'jpl';

    const whereField = isSite ? 'LOWER(site_name) = LOWER($1)' : 'station_id = $1';
    
    const summarySql = `
      SELECT 
        site_name,
        station_id,
        COUNT(*)::int AS sessions,
        ROUND(SUM(kwh_delivered)::numeric, 1) AS total_kwh,
        ROUND(AVG(kwh_delivered)::numeric, 2) AS avg_kwh,
        ROUND(AVG(connection_duration_hours)::numeric, 2) AS avg_dwell_hours,
        ROUND(AVG(charging_duration_hours)::numeric, 2) AS avg_charging_hours,
        ROUND(AVG(idle_duration_hours)::numeric, 2) AS avg_idle_hours
      FROM charging_sessions
      WHERE ${whereField}
      GROUP BY site_name, station_id
      ORDER BY sessions DESC
      LIMIT 50
    `;

    const rows = await query(summarySql, [id]);
    res.json({ id, details: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------------------------------
// 8. GET /api/chargers
// Charger-level usage, total hours, utilization proxy
// ----------------------------------------------------------------------------
app.get('/api/chargers', async (req, res) => {
  try {
    const { whereStr, params } = buildWhereClause(req.query);

    const sql = `
      SELECT 
        station_id,
        site_name,
        COUNT(*)::int AS sessions,
        ROUND(SUM(kwh_delivered)::numeric, 1) AS total_kwh,
        ROUND(AVG(kwh_delivered)::numeric, 2) AS avg_kwh,
        ROUND(SUM(connection_duration_hours)::numeric, 1) AS total_occupied_hours,
        ROUND(AVG(connection_duration_hours)::numeric, 2) AS avg_duration_hours,
        ROUND(AVG(idle_duration_hours)::numeric, 2) AS avg_idle_hours,
        ROUND(100.0 * (SUM(connection_duration_hours) / (365.0 * 24.0)), 1) AS utilization_proxy_pct
      FROM charging_sessions
      ${whereStr}
      GROUP BY station_id, site_name
      ORDER BY total_kwh DESC
      LIMIT 100
    `;

    const rows = await query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------------------------------
// 9. GET /api/capacity-risk
// Rule-based capacity-risk scoring (CTE + peak-hour analysis)
// ----------------------------------------------------------------------------
app.get('/api/capacity-risk', async (req, res) => {
  try {
    const { whereStr, params } = buildWhereClause(req.query);

    // Advanced CTE for Capacity Risk
    const sql = `
      WITH charger_peak AS (
        SELECT 
          station_id,
          site_name,
          COUNT(*)::int AS total_sessions,
          SUM(CASE WHEN hour BETWEEN 7 AND 11 THEN 1 ELSE 0 END)::int AS peak_sessions,
          ROUND(SUM(kwh_delivered)::numeric, 1) AS total_kwh,
          ROUND(SUM(connection_duration_hours)::numeric, 1) AS total_occupied_hours,
          ROUND(SUM(CASE WHEN hour BETWEEN 7 AND 11 THEN connection_duration_hours ELSE 0 END)::numeric, 1) AS peak_occupied_hours
        FROM charging_sessions
        ${whereStr}
        GROUP BY station_id, site_name
      )
      SELECT 
        station_id,
        site_name,
        total_sessions,
        peak_sessions,
        total_kwh,
        total_occupied_hours,
        peak_occupied_hours,
        ROUND(100.0 * (total_occupied_hours / (365.0 * 24.0)), 1) AS overall_utilization_pct,
        ROUND(100.0 * (peak_occupied_hours / (365.0 * 5.0)), 1) AS peak_utilization_pct,
        CASE 
          WHEN (peak_occupied_hours / (365.0 * 5.0)) >= 0.50 OR (total_occupied_hours / (365.0 * 24.0)) >= 0.35 THEN 'Capacity Risk'
          WHEN (peak_occupied_hours / (365.0 * 5.0)) >= 0.35 OR (total_occupied_hours / (365.0 * 24.0)) >= 0.25 THEN 'Monitor'
          ELSE 'Normal'
        END AS capacity_flag
      FROM charger_peak
      ORDER BY peak_utilization_pct DESC
    `;

    const rows = await query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------------------------------
// 10. GET /api/filters/options
// Available sites, stations, and date range
// ----------------------------------------------------------------------------
app.get('/api/filters/options', async (req, res) => {
  try {
    const sites = await query(`SELECT DISTINCT site_name FROM charging_sessions WHERE site_name IS NOT NULL ORDER BY site_name`);
    const stations = await query(`SELECT DISTINCT station_id, site_name FROM charging_sessions ORDER BY station_id`);
    const dateRange = await query(`SELECT MIN(date) AS min_date, MAX(date) AS max_date FROM charging_sessions`);

    res.json({
      sites: sites.map(s => s.site_name),
      stations: stations.map(s => ({ station_id: s.station_id, site_name: s.site_name })),
      dateRange: dateRange[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', engine: 'Node.js Express + PostgreSQL/SQLite', timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`[Backend] ACN Analytics API running on http://localhost:${PORT}`);
});
