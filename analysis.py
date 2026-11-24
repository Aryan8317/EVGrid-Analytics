
import pandas as pd
import matplotlib.pyplot as plt

df = pd.read_csv("data/ev_charging_sessions.csv", parse_dates=["session_start"])

completed = df[df["status"] == "Completed"].copy()

print("Rows:", len(df))
print("Completed sessions:", len(completed))
print("Total energy (kWh):", round(completed["energy_kwh"].sum(), 2))
print("Total revenue:", round(completed["revenue"].sum(), 2))

# Peak-hour demand
hourly = completed.groupby("hour").agg(
    sessions=("session_id", "count"),
    energy_kwh=("energy_kwh", "sum"),
    revenue=("revenue", "sum")
).reset_index()

hourly.plot(x="hour", y="sessions", kind="line", marker="o",
            title="Charging Sessions by Hour")
plt.ylabel("Sessions")
plt.tight_layout()
plt.show()

# Station performance
station = completed.groupby("station").agg(
    sessions=("session_id", "count"),
    energy_kwh=("energy_kwh", "sum"),
    revenue=("revenue", "sum")
).sort_values("revenue", ascending=False)

station["revenue_per_session"] = station["revenue"] / station["sessions"]
print("\nTop stations:\n", station.head())

# Customer segment
segment = completed.groupby("customer_segment").agg(
    sessions=("session_id", "count"),
    avg_energy_kwh=("energy_kwh", "mean"),
    avg_revenue=("revenue", "mean")
).sort_values("avg_revenue", ascending=False)

print("\nCustomer segments:\n", segment)
