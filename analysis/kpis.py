"""
KPI Layer & Capacity Risk Model
EV Charging Demand & Utilization Analytics (ACN-Data)
"""

import sqlite3
import os
import pandas as pd
import numpy as np

def get_connection():
    db_path = "data/acn_charging.db"
    return sqlite3.connect(db_path)

def calculate_kpis():
    conn = get_connection()
    df = pd.read_sql_query("SELECT * FROM charging_sessions", conn)
    conn.close()

    total_sessions = len(df)
    total_energy_kwh = df["kwh_delivered"].sum()
    avg_energy_session = df["kwh_delivered"].mean()
    avg_connection_duration = df["connection_duration_hours"].mean()
    avg_charging_duration = df["charging_duration_hours"].dropna().mean()
    avg_idle_duration = df["idle_duration_hours"].mean()

    # Peak hour
    hourly_counts = df.groupby("hour").size()
    peak_hour = hourly_counts.idxmax()
    peak_hour_sessions = hourly_counts.max()

    # Peak day
    day_counts = df.groupby(["day_of_week", "day_name"]).size().reset_index(name="sessions")
    peak_day_row = day_counts.sort_values("sessions", ascending=False).iloc[0]
    peak_day = peak_day_row["day_name"]
    peak_day_sessions = peak_day_row["sessions"]

    # Station & Charger Rankings
    site_stats = df.groupby("site_name").agg(
        sessions=("session_id", "count"),
        total_kwh=("kwh_delivered", "sum"),
        avg_dwell=("connection_duration_hours", "mean"),
        avg_idle=("idle_duration_hours", "mean")
    ).reset_index()

    charger_stats = df.groupby(["station_id", "site_name"]).agg(
        sessions=("session_id", "count"),
        total_kwh=("kwh_delivered", "sum"),
        total_occupied_hours=("connection_duration_hours", "sum")
    ).reset_index()

    # Annual Utilization Proxy Formula:
    # Utilization Proxy = Total Occupied Hours / (365 days * 24 hours available per year)
    charger_stats["annual_utilization_proxy"] = (
        charger_stats["total_occupied_hours"] / (365.0 * 24.0)
    ).round(4)
    charger_stats["utilization_pct"] = (charger_stats["annual_utilization_proxy"] * 100).round(1)

    most_utilized_charger = charger_stats.sort_values("annual_utilization_proxy", ascending=False).iloc[0]

    # Weekday vs Weekend
    day_type_stats = df.groupby("is_weekend").agg(
        sessions=("session_id", "count"),
        total_kwh=("kwh_delivered", "sum"),
        avg_kwh=("kwh_delivered", "mean"),
        avg_dwell=("connection_duration_hours", "mean")
    ).reset_index()
    day_type_stats["type"] = day_type_stats["is_weekend"].map({0: "Weekday", 1: "Weekend"})

    # Monthly Trends
    monthly_stats = df.groupby(["month", "month_name"]).agg(
        sessions=("session_id", "count"),
        total_kwh=("kwh_delivered", "sum")
    ).reset_index().sort_values("month")
    monthly_stats["session_mom_growth"] = monthly_stats["sessions"].pct_change() * 100

    # Rule-Based Capacity Risk Model:
    # High Risk: Peak Hour (07:00-11:00) Utilization >= 50% OR Overall Utilization >= 35%
    # Monitor: Peak Hour Utilization >= 35% OR Overall Utilization >= 25%
    # Normal: Below 25%
    peak_df = df[df["hour"].between(7, 11)]
    peak_hours_by_charger = peak_df.groupby("station_id")["connection_duration_hours"].sum().reset_index()
    peak_hours_by_charger.rename(columns={"connection_duration_hours": "peak_occupied_hours"}, inplace=True)

    charger_risk = pd.merge(charger_stats, peak_hours_by_charger, on="station_id", how="left")
    charger_risk["peak_occupied_hours"] = charger_risk["peak_occupied_hours"].fillna(0.0)
    # Peak hours available: 365 days * 5 peak hours (07-11)
    charger_risk["peak_utilization_proxy"] = (charger_risk["peak_occupied_hours"] / (365.0 * 5.0)).round(4)

    def assign_risk(row):
        if row["peak_utilization_proxy"] >= 0.50 or row["annual_utilization_proxy"] >= 0.35:
            return "High Risk"
        elif row["peak_utilization_proxy"] >= 0.35 or row["annual_utilization_proxy"] >= 0.25:
            return "Monitor"
        else:
            return "Normal"

    charger_risk["capacity_risk_category"] = charger_risk.apply(assign_risk, axis=1)

    print("=" * 70)
    print("EXECUTIVE KPI LAYER (Caltech & JPL ACN-Data)")
    print("=" * 70)
    print(f"Total Charging Sessions:          {total_sessions:,}")
    print(f"Total Energy Delivered:           {total_energy_kwh:,.1f} kWh")
    print(f"Average Energy per Session:       {avg_energy_session:.2f} kWh")
    print(f"Average Stall Occupancy Dwell:    {avg_connection_duration:.2f} hours")
    print(f"Average Active Power Draw:        {avg_charging_duration:.2f} hours")
    print(f"Average Idle Unproductive Dwell:  {avg_idle_duration:.2f} hours ({avg_idle_duration/avg_connection_duration*100:.1f}% of dwell)")
    print(f"Peak Charging Arrival Hour:       {peak_hour:02d}:00 Local Time ({peak_hour_sessions:,} sessions)")
    print(f"Peak Day of Week:                 {peak_day} ({peak_day_sessions:,} sessions)")
    print(f"Most Utilized EVSE Charger:       {most_utilized_charger['station_id']} ({most_utilized_charger['site_name']}) @ {most_utilized_charger['utilization_pct']}% utilization")
    print(f"Total EVSE Units Monitored:       {len(charger_stats)}")
    print(f"Capacity Risk Classification:     {dict(charger_risk['capacity_risk_category'].value_counts())}")
    print("=" * 70)

    return {
        "total_sessions": total_sessions,
        "total_energy_kwh": total_energy_kwh,
        "avg_energy_session": avg_energy_session,
        "avg_connection_duration": avg_connection_duration,
        "avg_charging_duration": avg_charging_duration,
        "avg_idle_duration": avg_idle_duration,
        "peak_hour": peak_hour,
        "peak_day": peak_day,
        "site_stats": site_stats,
        "charger_risk": charger_risk
    }

if __name__ == "__main__":
    calculate_kpis()
