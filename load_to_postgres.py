import psycopg2
import pandas as pd
import os

def load_to_postgres():
    csv_path = "data/cleaned/acn_charging_sessions.csv"
    print(f"Loading cleaned dataset into PostgreSQL database 'acn_charging'...")
    df = pd.read_csv(csv_path)

    conn = psycopg2.connect(
        dbname="acn_charging",
        user=os.environ.get("USER", "aryangautam"),
        host="localhost",
        port=5432
    )
    cur = conn.cursor()

    # Drop existing table if exists
    cur.execute("DROP TABLE IF EXISTS charging_sessions CASCADE;")

    # Create schema
    cur.execute("""
    CREATE TABLE charging_sessions (
        session_id VARCHAR(100) PRIMARY KEY,
        site_id VARCHAR(20),
        site_name VARCHAR(50),
        station_id VARCHAR(50),
        space_id VARCHAR(50),
        cluster_id VARCHAR(50),
        user_id VARCHAR(50),
        user_type VARCHAR(50),
        connection_time_utc TIMESTAMPTZ,
        disconnect_time_utc TIMESTAMPTZ,
        done_charging_time_utc TIMESTAMPTZ,
        connection_time_local TIMESTAMP,
        disconnect_time_local TIMESTAMP,
        done_charging_time_local TIMESTAMP,
        date DATE,
        hour INTEGER,
        day_of_week INTEGER,
        day_name VARCHAR(20),
        month INTEGER,
        month_name VARCHAR(10),
        is_weekend BOOLEAN,
        connection_duration_hours NUMERIC(8, 2),
        charging_duration_hours NUMERIC(8, 2),
        idle_duration_hours NUMERIC(8, 2),
        kwh_delivered NUMERIC(10, 3),
        kwh_requested NUMERIC(10, 2),
        miles_requested NUMERIC(10, 1),
        minutes_available NUMERIC(10, 2),
        avg_charging_power_kw NUMERIC(8, 2),
        payment_required BOOLEAN
    );
    """)

    # Use fast COPY or execute_batch
    from io import StringIO
    sio = StringIO()
    df.to_csv(sio, index=False, header=True)
    sio.seek(0)

    cur.copy_expert("COPY charging_sessions FROM STDIN WITH CSV HEADER", sio)

    # Create indexes for analytical speed
    cur.execute("CREATE INDEX idx_pg_site ON charging_sessions(site_name);")
    cur.execute("CREATE INDEX idx_pg_station ON charging_sessions(station_id);")
    cur.execute("CREATE INDEX idx_pg_date ON charging_sessions(date);")
    cur.execute("CREATE INDEX idx_pg_hour ON charging_sessions(hour);")
    cur.execute("CREATE INDEX idx_pg_day ON charging_sessions(day_of_week);")
    cur.execute("CREATE INDEX idx_pg_user ON charging_sessions(user_id);")

    conn.commit()

    cur.execute("SELECT count(*) FROM charging_sessions;")
    row_count = cur.fetchone()[0]
    print(f"Successfully loaded {row_count:,} sessions into PostgreSQL table 'charging_sessions'.")

    cur.close()
    conn.close()

if __name__ == "__main__":
    load_to_postgres()
