-- ============================================================================
-- ACN-Data Real EV Charging Analytics: SQL Analysis Suite
-- Sourced from Caltech & JPL Adaptive Charging Networks (27,870 sessions)
-- Database: PostgreSQL / ANSI SQL Compatible
-- ============================================================================

-- ----------------------------------------------------------------------------
-- SECTION 1: OVERALL KPI EXECUTIVE SUMMARY
-- ----------------------------------------------------------------------------
SELECT 
    COUNT(*) AS total_sessions,
    COUNT(DISTINCT station_id) AS active_evse_chargers,
    COUNT(DISTINCT site_name) AS operating_sites,
    COUNT(DISTINCT user_id) AS registered_users,
    ROUND(SUM(kwh_delivered), 1) AS total_kwh_delivered,
    ROUND(AVG(kwh_delivered), 2) AS avg_kwh_per_session,
    ROUND(AVG(connection_duration_hours), 2) AS avg_connection_dwell_hours,
    ROUND(AVG(charging_duration_hours), 2) AS avg_active_charging_hours,
    ROUND(AVG(idle_duration_hours), 2) AS avg_idle_stall_hours
FROM charging_sessions;

-- ----------------------------------------------------------------------------
-- SECTION 2: DEMAND ANALYSIS (TEMPORAL PATTERNS)
-- ----------------------------------------------------------------------------

-- 2.1 Charging Sessions & Energy by Arrival Hour (0–23)
SELECT 
    hour,
    COUNT(*) AS sessions,
    ROUND(SUM(kwh_delivered), 1) AS total_energy_kwh,
    ROUND(AVG(kwh_delivered), 2) AS avg_energy_kwh,
    ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) AS pct_of_daily_sessions
FROM charging_sessions
GROUP BY hour
ORDER BY hour;

-- 2.2 Charging Sessions & Energy by Day of Week
SELECT 
    day_of_week,
    day_name,
    COUNT(*) AS sessions,
    ROUND(SUM(kwh_delivered), 1) AS total_energy_kwh,
    ROUND(AVG(kwh_delivered), 2) AS avg_energy_kwh,
    ROUND(AVG(connection_duration_hours), 2) AS avg_dwell_hours
FROM charging_sessions
GROUP BY day_of_week, day_name
ORDER BY day_of_week;

-- 2.3 Weekday vs. Weekend Comparative Analysis (CASE Statement)
SELECT 
    CASE WHEN is_weekend = 1 THEN 'Weekend' ELSE 'Weekday' END AS day_type,
    COUNT(*) AS sessions,
    ROUND(SUM(kwh_delivered), 1) AS total_energy_kwh,
    ROUND(AVG(kwh_delivered), 2) AS avg_energy_per_session,
    ROUND(AVG(connection_duration_hours), 2) AS avg_dwell_hours,
    ROUND(AVG(idle_duration_hours), 2) AS avg_idle_hours
FROM charging_sessions
GROUP BY CASE WHEN is_weekend = 1 THEN 'Weekend' ELSE 'Weekday' END;

-- 2.4 Monthly Charging Trend & Growth
SELECT 
    month,
    month_name,
    COUNT(*) AS sessions,
    ROUND(SUM(kwh_delivered), 1) AS total_energy_kwh,
    ROUND(AVG(kwh_delivered), 2) AS avg_energy_kwh,
    ROUND(AVG(connection_duration_hours), 2) AS avg_dwell_hours
FROM charging_sessions
GROUP BY month, month_name
ORDER BY month;

-- ----------------------------------------------------------------------------
-- SECTION 3: THE "DWELL TIME PARADOX" (ACTIVE CHARGING VS. IDLE OCCUPANCY)
-- ----------------------------------------------------------------------------

-- 3.1 Dwell Time Efficiency Breakdown by Site
SELECT 
    site_name,
    COUNT(*) AS sessions,
    ROUND(SUM(connection_duration_hours), 1) AS total_occupied_hours,
    ROUND(SUM(charging_duration_hours), 1) AS total_active_charging_hours,
    ROUND(SUM(idle_duration_hours), 1) AS total_idle_wasted_hours,
    ROUND(100.0 * SUM(charging_duration_hours) / NULLIF(SUM(connection_duration_hours), 0), 1) AS pct_active_utilization,
    ROUND(100.0 * SUM(idle_duration_hours) / NULLIF(SUM(connection_duration_hours), 0), 1) AS pct_idle_occupancy
FROM charging_sessions
GROUP BY site_name;

-- ----------------------------------------------------------------------------
-- SECTION 4: STATION & EVSE CHARGER PERFORMANCE
-- ----------------------------------------------------------------------------

-- 4.1 Top 10 Most Utilized EVSE Chargers (By Total Energy & Sessions)
SELECT 
    station_id,
    site_name,
    COUNT(*) AS sessions,
    ROUND(SUM(kwh_delivered), 1) AS total_kwh,
    ROUND(AVG(kwh_delivered), 2) AS avg_kwh_per_session,
    ROUND(SUM(connection_duration_hours), 1) AS total_occupied_hours,
    ROUND(AVG(idle_duration_hours), 2) AS avg_idle_hours
FROM charging_sessions
GROUP BY station_id, site_name
ORDER BY total_kwh DESC
LIMIT 10;

-- 4.2 EVSE Utilization Proxy Calculation
-- Formula: Total Occupied Hours / (Number of Operational Days * 24 Hours)
WITH station_operational_stats AS (
    SELECT 
        station_id,
        site_name,
        COUNT(*) AS sessions,
        ROUND(SUM(kwh_delivered), 1) AS total_kwh,
        ROUND(SUM(connection_duration_hours), 1) AS total_occupied_hours,
        COUNT(DISTINCT date) AS active_days
    FROM charging_sessions
    GROUP BY station_id, site_name
)
SELECT 
    station_id,
    site_name,
    sessions,
    total_kwh,
    total_occupied_hours,
    ROUND(total_occupied_hours / (365.0 * 24.0), 3) AS annual_utilization_proxy,
    ROUND(100.0 * (total_occupied_hours / (365.0 * 24.0)), 1) AS utilization_pct
FROM station_operational_stats
ORDER BY annual_utilization_proxy DESC;

-- ----------------------------------------------------------------------------
-- SECTION 5: ADVANCED SQL (CTEs, WINDOW FUNCTIONS & CAPACITY RISK)
-- ----------------------------------------------------------------------------

-- 5.1 CTE & Window Function: Top 3 Busiest EVSE Chargers Per Site by Month
WITH monthly_station_load AS (
    SELECT 
        site_name,
        month,
        month_name,
        station_id,
        COUNT(*) AS session_count,
        ROUND(SUM(kwh_delivered), 1) AS total_kwh
    FROM charging_sessions
    GROUP BY site_name, month, month_name, station_id
),
ranked_chargers AS (
    SELECT 
        site_name,
        month,
        month_name,
        station_id,
        session_count,
        total_kwh,
        DENSE_RANK() OVER (
            PARTITION BY site_name, month 
            ORDER BY session_count DESC
        ) AS site_monthly_rank
    FROM monthly_station_load
)
SELECT *
FROM ranked_chargers
WHERE site_monthly_rank <= 3
ORDER BY site_name, month, site_monthly_rank;

-- 5.2 Capacity Risk Classification Model (Rule-Based Analytics)
-- Peak Hours Defined as 07:00 to 11:00 AM PST (Morning Arrival Commute)
WITH peak_vs_total_usage AS (
    SELECT 
        station_id,
        site_name,
        COUNT(*) AS total_sessions,
        SUM(CASE WHEN hour BETWEEN 7 AND 11 THEN 1 ELSE 0 END) AS peak_sessions,
        ROUND(SUM(kwh_delivered), 1) AS total_kwh,
        ROUND(SUM(connection_duration_hours), 1) AS total_occupied_hours,
        ROUND(SUM(CASE WHEN hour BETWEEN 7 AND 11 THEN connection_duration_hours ELSE 0 END), 1) AS peak_occupied_hours
    FROM charging_sessions
    GROUP BY station_id, site_name
),
station_risk_scoring AS (
    SELECT 
        station_id,
        site_name,
        total_sessions,
        peak_sessions,
        total_kwh,
        total_occupied_hours,
        ROUND(total_occupied_hours / (365.0 * 24.0), 3) AS overall_utilization_proxy,
        ROUND(peak_occupied_hours / (365.0 * 5.0), 3) AS peak_utilization_proxy
    FROM peak_vs_total_usage
)
SELECT 
    station_id,
    site_name,
    total_sessions,
    peak_sessions,
    total_kwh,
    total_occupied_hours,
    ROUND(100.0 * overall_utilization_proxy, 1) AS overall_utilization_pct,
    ROUND(100.0 * peak_utilization_proxy, 1) AS peak_utilization_pct,
    CASE 
        WHEN peak_utilization_proxy >= 0.50 OR overall_utilization_proxy >= 0.35 THEN 'Capacity Risk'
        WHEN peak_utilization_proxy >= 0.35 OR overall_utilization_proxy >= 0.25 THEN 'Monitor'
        ELSE 'Normal'
    END AS capacity_risk_category
FROM station_risk_scoring
ORDER BY peak_utilization_proxy DESC;

-- 5.3 User Cohort Analysis: Repeat Frequency & Driver Loyalty
SELECT 
    CASE 
        WHEN user_id IS NULL THEN 'Unregistered Guest'
        WHEN session_count >= 50 THEN 'Super User (50+ sessions)'
        WHEN session_count >= 20 THEN 'Frequent Commuter (20-49)'
        WHEN session_count >= 5 THEN 'Regular Driver (5-19)'
        ELSE 'Occasional Visitor (1-4)'
    END AS user_cohort,
    COUNT(*) AS distinct_drivers,
    SUM(session_count) AS total_sessions,
    ROUND(SUM(total_kwh), 1) AS total_energy_kwh,
    ROUND(AVG(total_kwh / session_count), 2) AS avg_kwh_per_session
FROM (
    SELECT 
        user_id,
        COUNT(*) AS session_count,
        SUM(kwh_delivered) AS total_kwh
    FROM charging_sessions
    GROUP BY user_id
) user_summary
GROUP BY 
    CASE 
        WHEN user_id IS NULL THEN 'Unregistered Guest'
        WHEN session_count >= 50 THEN 'Super User (50+ sessions)'
        WHEN session_count >= 20 THEN 'Frequent Commuter (20-49)'
        WHEN session_count >= 5 THEN 'Regular Driver (5-19)'
        ELSE 'Occasional Visitor (1-4)'
    END
ORDER BY total_sessions DESC;
