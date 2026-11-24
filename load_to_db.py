import sqlite3
import pandas as pd
import os

def load_data():
    csv_path = "data/cleaned/acn_charging_sessions.csv"
    db_path = "data/acn_charging.db"
    
    print(f"Loading cleaned data from {csv_path} into SQLite database {db_path}...")
    df = pd.read_csv(csv_path)
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Drop existing table if exists
    cursor.execute("DROP TABLE IF EXISTS charging_sessions")
    
    # Create structured table schema matching PostgreSQL types
    cursor.execute("""
    CREATE TABLE charging_sessions (
        session_id TEXT PRIMARY KEY,
        site_id TEXT,
        site_name TEXT,
        station_id TEXT,
        space_id TEXT,
        cluster_id TEXT,
        user_id TEXT,
        user_type TEXT,
        connection_time_utc TEXT,
        disconnect_time_utc TEXT,
        done_charging_time_utc TEXT,
        connection_time_local TEXT,
        disconnect_time_local TEXT,
        done_charging_time_local TEXT,
        date TEXT,
        hour INTEGER,
        day_of_week INTEGER,
        day_name TEXT,
        month INTEGER,
        month_name TEXT,
        is_weekend INTEGER,
        connection_duration_hours REAL,
        charging_duration_hours REAL,
        idle_duration_hours REAL,
        kwh_delivered REAL,
        kwh_requested REAL,
        miles_requested REAL,
        minutes_available REAL,
        avg_charging_power_kw REAL,
        payment_required INTEGER
    )
    """)
    
    # Write dataframe to table
    df.to_sql("charging_sessions", conn, if_exists="append", index=False)
    
    # Create analytical indexes for performance
    cursor.execute("CREATE INDEX idx_site ON charging_sessions(site_name)")
    cursor.execute("CREATE INDEX idx_station ON charging_sessions(station_id)")
    cursor.execute("CREATE INDEX idx_date ON charging_sessions(date)")
    cursor.execute("CREATE INDEX idx_hour ON charging_sessions(hour)")
    cursor.execute("CREATE INDEX idx_day_of_week ON charging_sessions(day_of_week)")
    cursor.execute("CREATE INDEX idx_user ON charging_sessions(user_id)")
    
    conn.commit()
    count = cursor.execute("SELECT count(*) FROM charging_sessions").fetchone()[0]
    print(f"Successfully loaded {count:,} sessions into database table 'charging_sessions'.")
    conn.close()

if __name__ == "__main__":
    load_data()
