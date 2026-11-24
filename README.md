# EV Charging Demand & Utilization Analytics (ACN-Data)

An end-to-end, resume-ready **Data Analyst portfolio project** analyzing real-world electric vehicle (EV) charging behavior, charger utilization, and infrastructure capacity risk using **27,870 actual charging sessions** from the **Adaptive Charging Network (ACN-Data) by Caltech**.

---

## 1. Project Overview

As electric vehicle adoption expands, charging network operators and facility managers face critical operational challenges: transformer peak capacity limits, unpredictable commuter arrival surges, and **charger hoarding / idle dwell waste** (vehicles remaining plugged in long after charging has finished).

This project demonstrates a production-grade analytical pipeline:
1. **Ingesting & cleaning** real open-access telemetry data from the Caltech ACN Portal.
2. **Structuring relational storage** in PostgreSQL with parameterized indexing.
3. **Advanced SQL analytics** (CTEs, Window Functions, cohort segmentations).
4. **Python KPI and EDA engine** generating publication-quality visual models.
5. **Interactive Full-Stack Web Dashboard** powered by Node.js/Express, PostgreSQL, and React.js with Tailwind CSS and Recharts.

---

## 2. Dataset: Caltech ACN-Data

- **Official Source**: [https://ev.caltech.edu/dataset](https://ev.caltech.edu/dataset)
- **Citation**: *Lee, Zachary J., Tongxin Li, and Steven H. Low. "ACN-Data: Analysis and Applications of an Open EV Charging Dataset." ACM e-Energy, 2019.*
- **Scope**: 27,870 verified charging sessions recorded across 2019 at two major Southern California facilities:
  - **Caltech Academic Campus** (Pasadena, CA) — 54 Level 2 EVSEs.
  - **NASA Jet Propulsion Laboratory (JPL)** (La Cañada, CA) — 52 Level 2 EVSEs.
- **Hardware Standard**: SAE J1772 Level 2 AC charging infrastructure.

> **Integrity Note**: Unlike projects relying on synthetic datasets, this project contains **zero fabricated values**. Financial revenue and battery SOC % were omitted because real J1772 hardware and university networks do not record commercial retail billing or battery percentage over the pilot wire. Detailed documentation is provided in [DATA_DICTIONARY.md](DATA_DICTIONARY.md).

---

## 3. Tech Stack

- **Data Processing & Pipeline**: Python 3.12, Pandas, NumPy, Requests
- **Database Layer**: PostgreSQL 16 (Relational DB with B-tree indexing), SQLite3 (local fallback)
- **SQL Analytics**: CTEs, `DENSE_RANK()`, `SUM() OVER ()`, Date/Time functions, CASE statements
- **Python EDA & Visualizations**: Plotly, Matplotlib
- **Backend API**: Node.js, Express.js, `pg` (node-postgres connection pool)
- **Frontend Web App**: React 19, TypeScript, Vite, Tailwind CSS v4, Recharts, Lucide Icons

---

## 4. Database Schema (`charging_sessions`)

The dataset is modeled in PostgreSQL 16 under the `charging_sessions` table:

```sql
CREATE TABLE charging_sessions (
    session_id VARCHAR(100) PRIMARY KEY,
    site_id VARCHAR(20),
    site_name VARCHAR(50),               -- 'Caltech' or 'JPL'
    station_id VARCHAR(50),              -- Unique EVSE Hardware ID
    space_id VARCHAR(50),                -- Parking space stall ID
    cluster_id VARCHAR(50),
    user_id VARCHAR(50),                 -- Anonymized mobile app driver ID
    user_type VARCHAR(50),               -- 'Registered User' vs 'Guest'
    connection_time_utc TIMESTAMPTZ,
    disconnect_time_utc TIMESTAMPTZ,
    done_charging_time_utc TIMESTAMPTZ,  -- Power cutoff timestamp
    connection_time_local TIMESTAMP,     -- Converted to America/Los_Angeles
    disconnect_time_local TIMESTAMP,
    done_charging_time_local TIMESTAMP,
    date DATE,
    hour INTEGER,                        -- 0-23 arrival hour (PST)
    day_of_week INTEGER,                 -- 0 (Monday) to 6 (Sunday)
    day_name VARCHAR(20),
    month INTEGER,
    month_name VARCHAR(10),
    is_weekend BOOLEAN,
    connection_duration_hours NUMERIC(8, 2), -- Total dwell time in stall
    charging_duration_hours NUMERIC(8, 2),   -- Active current draw
    idle_duration_hours NUMERIC(8, 2),       -- Unproductive dwell post-charge
    kwh_delivered NUMERIC(10, 3),            -- Energy delivered
    kwh_requested NUMERIC(10, 2),
    miles_requested NUMERIC(10, 1),
    minutes_available NUMERIC(10, 2),
    avg_charging_power_kw NUMERIC(8, 2),
    payment_required BOOLEAN
);

CREATE INDEX idx_pg_site ON charging_sessions(site_name);
CREATE INDEX idx_pg_station ON charging_sessions(station_id);
CREATE INDEX idx_pg_date ON charging_sessions(date);
CREATE INDEX idx_pg_hour ON charging_sessions(hour);
```

---

## 5. Important KPI Layer

| Key Performance Indicator | Real Value | Description & Business Meaning |
|---|---|---|
| **Total Charging Sessions** | **27,870** | Total validated sessions across 2019 |
| **Total Energy Delivered** | **346,374.4 kWh** | Total net electrical energy delivered |
| **Average Energy / Session** | **12.43 kWh** | Typical energy intake (~40–45 miles of range) |
| **Average Stall Dwell Time** | **6.70 hours** | Mean time an EV physically blocks the charger |
| **Average Active Charging Time**| **3.69 hours** | Actual time electricity flows into battery |
| **Average Idle Stall Waste** | **2.94 hours** | **43.9% of total dwell** is unproductive blockage |
| **Peak Arrival Hour** | **07:00 AM PST** | Single busiest hour with **6,009 sessions (21.6%)** |
| **Peak Day of Week** | **Wednesday** | **5,595 sessions** (Tuesday & Wednesday mid-week peak) |
| **Weekend Demand Drop** | **-88.0%** | Sunday drops to 446 sessions total |
| **Most Utilized Charger** | **EVSE 1-1-178-823** | **42.0% 24/7 annual occupancy** at NASA JPL |

---

## 6. Utilization & Capacity Risk Methodology

### Utilization Proxy Formula
Because charging equipment is physically installed 24/7, the standard annual utilization formula is defined as:

$$\text{Annual Utilization Proxy} = \frac{\sum \text{Connection Duration (hours)}}{365 \times 24 \text{ hours}} = \frac{\sum \text{Occupied Hours}}{8,760}$$

### Peak-Hour Congestion Proxy
Commuter arrival demand is concentrated heavily between 07:00 and 11:00 AM PST (5-hour window). Peak-hour utilization isolates this critical morning window:

$$\text{Peak-Hour Utilization Proxy} = \frac{\sum \text{Occupied Hours during 07:00–11:00 AM}}{365 \times 5 \text{ hours}}$$

### Rule-Based Capacity Risk Tiers
- **Capacity Risk (High)**: $\text{Peak Utilization} \ge 50\%$ OR $\text{Annual Utilization} \ge 35\%$ (55 EVSE units).
- **Monitor**: $35\% \le \text{Peak Utilization} < 50\%$ (31 EVSE units).
- **Normal**: $\text{Peak Utilization} < 35\%$ and $\text{Annual Utilization} < 25\%$ (20 EVSE units).

---

## 7. Key Business Insights

1. **The Dwell Time Paradox (43.9% Idle Stall Waste)**:
   While vehicles remain connected for an average of **6.70 hours**, active battery charging completes in only **3.69 hours**. Drivers leave fully-charged vehicles blocking chargers for **2.94 hours** per session—accumulating over **81,000 unproductive stall hours annually**.
2. **Morning Commuter Influx Concentration (07:00–09:00 AM)**:
   Over **41% of all daily charging sessions arrive between 07:00 and 09:00 AM**, with 07:00 AM alone accounting for 6,009 sessions (21.6%). This creates severe local transformer peak load stress.
3. **Severe Midweek vs. Weekend Asymmetry**:
   Demand peaks mid-week (Wednesday: 5,595 sessions; Thursday: 5,411 sessions) and collapses by **88% on weekends** (Sunday: 446 sessions), confirming workplace-commuter operational profile.
4. **Site Workload Specialization**:
   NASA JPL accounts for **72.7% of total electrical consumption (251,826 kWh)** with high shift dwell times (7.16h), whereas Caltech operates with higher turnover (5.94h).
5. **Driver Cohort Skew**:
   The top **15.2% of frequent drivers** (charging 50+ times/year) consume **52.4% of total energy delivered**, proving that infrastructure demand is driven by a core group of daily commuters.
6. **Hardware Bottlenecks**:
   **55 out of 106 EVSE units** trigger the Capacity Risk threshold during morning peaks, while the lowest-quartile chargers sit under 15% occupancy, revealing uneven traffic distribution within parking garages.

---

## 8. How to Run

### Prerequisites
- Node.js (v18+) and npm
- Python (3.10+)
- PostgreSQL 16 (`brew install postgresql@16` on macOS)

### 1. Database & Pipeline Setup
```bash
# Start PostgreSQL
brew services start postgresql@16

# Setup Python virtual environment
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt psycopg2-binary

# Run data ingestion pipeline (downloads & cleans real ACN-Data)
python data_pipeline.py

# Load data into PostgreSQL
python load_to_postgres.py
```

### 2. Run Python EDA & Visualizations
```bash
# Generates 8 interactive Plotly HTML figures in analysis/figures/
python analysis/eda.py
python analysis/kpis.py
```

### 3. Launch Backend API (Express.js)
```bash
cd backend
npm install
npm start
# API runs on http://localhost:5001
```

### 4. Launch React Frontend Dashboard
```bash
cd frontend
npm install
npm run dev
# Dashboard runs on http://localhost:5173
```

---

## 9. Future Improvements

1. **Automated Valet & Cable Extension Simulation**: Evaluate the capacity unlock of Level 2 dual-cord EVSE switching to dynamically serve adjacent stalls once the first vehicle enters idle dwell.
2. **Time-of-Use (TOU) Tariff Financial Modeling**: Integrate Southern California Edison (SCE) Commercial EV rates (e.g. TOU-EV-8) to calculate demand charge savings from smart peak curtailment.
3. **Machine Learning Queue Forecasting**: Implement short-term arrival forecasting (ARIMA / Prophet) for driver-facing parking space availability apps.
