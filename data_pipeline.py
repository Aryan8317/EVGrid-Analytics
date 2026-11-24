import json
import os
import pandas as pd
import numpy as np

def run_pipeline():
    raw_path = "data/raw/acn_raw_sessions.json"
    if not os.path.exists(raw_path):
        raise FileNotFoundError(f"Raw data file not found at {raw_path}")
    
    print("=" * 60)
    print("STEP 1: Ingesting Raw Caltech ACN-Data JSON Records...")
    print("=" * 60)
    with open(raw_path, "r") as f:
        raw_records = json.load(f)
    print(f"Total raw records loaded: {len(raw_records):,}")

    # Flatten JSON structure into tabular rows
    rows = []
    for r in raw_records:
        user_inputs = r.get("userInputs") or []
        first_input = user_inputs[0] if len(user_inputs) > 0 and isinstance(user_inputs[0], dict) else {}

        rows.append({
            "session_id": r.get("sessionID") or r.get("_id"),
            "raw_id": r.get("_id"),
            "site_id": r.get("siteID"),
            "station_id": r.get("stationID"),
            "space_id": r.get("spaceID"),
            "cluster_id": r.get("clusterID"),
            "connection_time_raw": r.get("connectionTime"),
            "disconnect_time_raw": r.get("disconnectTime"),
            "done_charging_time_raw": r.get("doneChargingTime"),
            "kwh_delivered": r.get("kWhDelivered"),
            "timezone": r.get("timezone", "America/Los_Angeles"),
            "user_id": r.get("userID"),
            "wh_per_mile": first_input.get("WhPerMile"),
            "kwh_requested": first_input.get("kWhRequested"),
            "miles_requested": first_input.get("milesRequested"),
            "minutes_available": first_input.get("minutesAvailable"),
            "payment_required": first_input.get("paymentRequired")
        })

    df = pd.DataFrame(rows)
    print(f"Initial tabular dataframe shape: {df.shape}")

    print("\n" + "=" * 60)
    print("STEP 2: Data Cleaning & Normalization")
    print("=" * 60)

    # 1. Deduplicate by session_id
    init_count = len(df)
    df = df.drop_duplicates(subset=["session_id"]).copy()
    dupes_removed = init_count - len(df)
    print(f"Duplicate records removed: {dupes_removed:,}")

    # 2. Site Name mapping
    site_map = {
        "0001": "JPL",
        "0002": "Caltech",
        "0003": "Office 1"
    }
    df["site_name"] = df["site_id"].map(site_map)
    # Infer if site_name is unmapped based on station prefix
    df.loc[df["site_name"].isna() & df["station_id"].str.startswith("1-", na=False), "site_name"] = "JPL"
    df.loc[df["site_name"].isna() & df["station_id"].str.startswith("2-", na=False), "site_name"] = "Caltech"
    df["site_name"] = df["site_name"].fillna("Unknown Site")

    # 3. Parse UTC Timestamps
    df["connection_time_utc"] = pd.to_datetime(df["connection_time_raw"], format="%a, %d %b %Y %H:%M:%S GMT", errors="coerce", utc=True)
    df["disconnect_time_utc"] = pd.to_datetime(df["disconnect_time_raw"], format="%a, %d %b %Y %H:%M:%S GMT", errors="coerce", utc=True)
    df["done_charging_time_utc"] = pd.to_datetime(df["done_charging_time_raw"], format="%a, %d %b %Y %H:%M:%S GMT", errors="coerce", utc=True)

    # Remove records with unparseable connection or disconnect times
    valid_times = df["connection_time_utc"].notna() & df["disconnect_time_utc"].notna()
    invalid_time_count = len(df) - valid_times.sum()
    df = df[valid_times].copy()
    print(f"Invalid timestamp records removed: {invalid_time_count:,}")

    # 4. Local Time Conversion (America/Los_Angeles - Pacific Time)
    df["connection_time_local"] = df["connection_time_utc"].dt.tz_convert("America/Los_Angeles")
    df["disconnect_time_local"] = df["disconnect_time_utc"].dt.tz_convert("America/Los_Angeles")
    df["done_charging_time_local"] = df["done_charging_time_utc"].dt.tz_convert("America/Los_Angeles")

    # 5. Calculate Durations (hours)
    # Total connection time (stall occupancy)
    df["connection_duration_hours"] = (df["disconnect_time_utc"] - df["connection_time_utc"]).dt.total_seconds() / 3600.0

    # Active charging time (from plug-in until battery stopped drawing current)
    df["charging_duration_hours"] = (df["done_charging_time_utc"] - df["connection_time_utc"]).dt.total_seconds() / 3600.0
    # Negative charging duration means doneChargingTime preceded connectionTime (sensor clock error) -> set NaN
    df.loc[df["charging_duration_hours"] < 0, "charging_duration_hours"] = np.nan

    # Idle dwell time: vehicle stayed plugged in after battery was full
    df["idle_duration_hours"] = df["connection_duration_hours"] - df["charging_duration_hours"].fillna(df["connection_duration_hours"])
    df["idle_duration_hours"] = df["idle_duration_hours"].clip(lower=0.0)

    # 6. Temporal Features (Local Pacific Time)
    df["date"] = df["connection_time_local"].dt.strftime("%Y-%m-%d")
    df["hour"] = df["connection_time_local"].dt.hour
    df["day_of_week"] = df["connection_time_local"].dt.dayofweek # 0=Monday, 6=Sunday
    df["day_name"] = df["connection_time_local"].dt.day_name()
    df["month"] = df["connection_time_local"].dt.month
    df["month_name"] = df["connection_time_local"].dt.strftime("%b")
    df["is_weekend"] = df["day_of_week"] >= 5

    # 7. Energy and Power metrics
    df["kwh_delivered"] = pd.to_numeric(df["kwh_delivered"], errors="coerce").fillna(0.0)
    
    # Calculate average delivery power in kW (kWh / charging hours)
    df["avg_charging_power_kw"] = np.where(
        (df["charging_duration_hours"] > 0.05) & (df["kwh_delivered"] > 0),
        (df["kwh_delivered"] / df["charging_duration_hours"]).round(2),
        np.nan
    )

    # 8. User categorization
    df["user_type"] = np.where(df["user_id"].notna() & (df["user_id"] != ""), "Registered User", "Guest / Unregistered")

    # 9. Outlier and Anomaly Filtering:
    # Level 2 charging stations typically deliver between 0.5 kWh and 90 kWh.
    # Sessions < 0.1 kWh represent failed connection attempts or immediate unplugging.
    # Sessions > 120 hours or > 120 kWh represent forgotten vehicles or metering glitch.
    initial_clean_len = len(df)
    valid_sessions = (
        (df["kwh_delivered"] >= 0.2) &
        (df["kwh_delivered"] <= 120.0) &
        (df["connection_duration_hours"] >= 0.05) &
        (df["connection_duration_hours"] <= 72.0)
    )
    outliers_removed = initial_clean_len - valid_sessions.sum()
    df_cleaned = df[valid_sessions].copy()
    print(f"Zero-energy, micro-connection (<3 min), or extreme outlier (>72h) sessions filtered: {outliers_removed:,}")

    # Format numeric columns cleanly
    df_cleaned["kwh_delivered"] = df_cleaned["kwh_delivered"].round(3)
    df_cleaned["connection_duration_hours"] = df_cleaned["connection_duration_hours"].round(2)
    df_cleaned["charging_duration_hours"] = df_cleaned["charging_duration_hours"].round(2)
    df_cleaned["idle_duration_hours"] = df_cleaned["idle_duration_hours"].round(2)

    print("\n" + "=" * 60)
    print("STEP 3: Dataset Summary after Cleaning")
    print("=" * 60)
    print(f"Total Valid Sessions: {len(df_cleaned):,}")
    print(f"Date Range: {df_cleaned['date'].min()} to {df_cleaned['date'].max()}")
    print(f"Total Sites: {df_cleaned['site_name'].nunique()} ({list(df_cleaned['site_name'].unique())})")
    print(f"Total Physical EVSE Chargers (station_id): {df_cleaned['station_id'].nunique()}")
    print(f"Total Unique Users (user_id): {df_cleaned['user_id'].dropna().nunique()}")
    print(f"Total Energy Delivered: {df_cleaned['kwh_delivered'].sum():,.1f} kWh")
    print(f"Average Energy per Session: {df_cleaned['kwh_delivered'].mean():.2f} kWh")
    print(f"Average Connection Dwell Time: {df_cleaned['connection_duration_hours'].mean():.2f} hours")
    print(f"Average Active Charging Time: {df_cleaned['charging_duration_hours'].mean():.2f} hours")
    print(f"Average Idle Stall Occupancy: {df_cleaned['idle_duration_hours'].mean():.2f} hours")

    # Select core cleaned columns for analytical clarity
    final_cols = [
        "session_id",
        "site_id",
        "site_name",
        "station_id",
        "space_id",
        "cluster_id",
        "user_id",
        "user_type",
        "connection_time_utc",
        "disconnect_time_utc",
        "done_charging_time_utc",
        "connection_time_local",
        "disconnect_time_local",
        "done_charging_time_local",
        "date",
        "hour",
        "day_of_week",
        "day_name",
        "month",
        "month_name",
        "is_weekend",
        "connection_duration_hours",
        "charging_duration_hours",
        "idle_duration_hours",
        "kwh_delivered",
        "kwh_requested",
        "miles_requested",
        "minutes_available",
        "avg_charging_power_kw",
        "payment_required"
    ]
    
    os.makedirs("data/cleaned", exist_ok=True)
    out_csv = "data/cleaned/acn_charging_sessions.csv"
    df_cleaned[final_cols].to_csv(out_csv, index=False)
    print(f"\nCleaned dataset exported successfully to {out_csv}")

    # Copy to frontend public folder for direct browser fallback
    frontend_data_dir = "frontend/public/data"
    os.makedirs(frontend_data_dir, exist_ok=True)
    df_cleaned[final_cols].to_csv(os.path.join(frontend_data_dir, "acn_charging_sessions.csv"), index=False)
    print(f"Cleaned dataset copied to {frontend_data_dir}/acn_charging_sessions.csv")

if __name__ == "__main__":
    run_pipeline()
