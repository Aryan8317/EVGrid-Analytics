"""
Data Cleaning & Normalization Module
EV Charging Demand & Utilization Analytics (ACN-Data)
"""

import pandas as pd
import numpy as np

def clean_charging_data(raw_df: pd.DataFrame) -> pd.DataFrame:
    """
    Cleans raw ACN-Data sessions:
    - Deduplicates on session_id
    - Maps site names
    - Converts UTC timestamps to local America/Los_Angeles timezone
    - Calculates active charging, connection dwell, and idle durations
    - Removes sensor anomalies, failed micro-sessions (<3 min), and outliers (>72h or >120 kWh)
    """
    df = raw_df.drop_duplicates(subset=["session_id"]).copy()

    # Map Site Names
    site_map = {"0001": "JPL", "0002": "Caltech", "0003": "Office 1"}
    df["site_name"] = df["site_id"].map(site_map)
    df.loc[df["site_name"].isna() & df["station_id"].str.startswith("1-", na=False), "site_name"] = "JPL"
    df.loc[df["site_name"].isna() & df["station_id"].str.startswith("2-", na=False), "site_name"] = "Caltech"
    df["site_name"] = df["site_name"].fillna("Unknown Site")

    # Parse UTC Timestamps
    df["connection_time_utc"] = pd.to_datetime(df["connection_time_raw"], errors="coerce", utc=True)
    df["disconnect_time_utc"] = pd.to_datetime(df["disconnect_time_raw"], errors="coerce", utc=True)
    df["done_charging_time_utc"] = pd.to_datetime(df["done_charging_time_raw"], errors="coerce", utc=True)

    # Filter out missing required timestamps
    df = df[df["connection_time_utc"].notna() & df["disconnect_time_utc"].notna()].copy()

    # Local Time Conversion (America/Los_Angeles)
    df["connection_time_local"] = df["connection_time_utc"].dt.tz_convert("America/Los_Angeles")
    df["disconnect_time_local"] = df["disconnect_time_utc"].dt.tz_convert("America/Los_Angeles")
    df["done_charging_time_local"] = df["done_charging_time_utc"].dt.tz_convert("America/Los_Angeles")

    # Durations in hours
    df["connection_duration_hours"] = (df["disconnect_time_utc"] - df["connection_time_utc"]).dt.total_seconds() / 3600.0
    df["charging_duration_hours"] = (df["done_charging_time_utc"] - df["connection_time_utc"]).dt.total_seconds() / 3600.0
    df.loc[df["charging_duration_hours"] < 0, "charging_duration_hours"] = np.nan

    # Idle dwell: stall blocked without power draw
    df["idle_duration_hours"] = (df["connection_duration_hours"] - df["charging_duration_hours"].fillna(df["connection_duration_hours"])).clip(lower=0.0)

    # Temporal breakdowns (Local Pacific Time)
    df["date"] = df["connection_time_local"].dt.strftime("%Y-%m-%d")
    df["hour"] = df["connection_time_local"].dt.hour
    df["day_of_week"] = df["connection_time_local"].dt.dayofweek
    df["day_name"] = df["connection_time_local"].dt.day_name()
    df["month"] = df["connection_time_local"].dt.month
    df["month_name"] = df["connection_time_local"].dt.strftime("%b")
    df["is_weekend"] = df["day_of_week"] >= 5

    df["kwh_delivered"] = pd.to_numeric(df["kwh_delivered"], errors="coerce").fillna(0.0)
    df["avg_charging_power_kw"] = np.where(
        (df["charging_duration_hours"] > 0.05) & (df["kwh_delivered"] > 0),
        (df["kwh_delivered"] / df["charging_duration_hours"]).round(2),
        np.nan
    )
    df["user_type"] = np.where(df["user_id"].notna() & (df["user_id"] != ""), "Registered User", "Guest / Unregistered")

    # Real-world Level 2 plausibility boundaries
    valid_sessions = (
        (df["kwh_delivered"] >= 0.2) &
        (df["kwh_delivered"] <= 120.0) &
        (df["connection_duration_hours"] >= 0.05) &
        (df["connection_duration_hours"] <= 72.0)
    )
    return df[valid_sessions].copy()

if __name__ == "__main__":
    print("Testing data cleaning module...")
