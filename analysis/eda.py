"""
Exploratory Data Analysis (EDA) Module
EV Charging Demand & Utilization Analytics (ACN-Data)
Generates 8 Core Analytical Visualizations using Plotly
"""

import sqlite3
import os
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots

def run_eda():
    os.makedirs("analysis/figures", exist_ok=True)
    conn = sqlite3.connect("data/acn_charging.db")
    df = pd.read_sql_query("SELECT * FROM charging_sessions", conn)
    conn.close()

    print(f"Loaded {len(df):,} sessions for EDA plotting...")

    # Set dark professional theme template
    template = "plotly_dark"

    # 1. Sessions by Hour (0-23)
    hourly = df.groupby(["hour", "site_name"]).size().reset_index(name="sessions")
    fig1 = px.bar(
        hourly, x="hour", y="sessions", color="site_name", barmode="group",
        title="1. EV Charging Arrivals by Hour of Day (Local Pacific Time)",
        labels={"hour": "Hour of Day (0-23)", "sessions": "Number of Sessions", "site_name": "Operating Site"},
        template=template,
        color_discrete_map={"Caltech": "#6366f1", "JPL": "#06b6d4"}
    )
    fig1.update_layout(xaxis=dict(tickmode="linear", tick0=0, dtick=1))
    fig1.write_html("analysis/figures/1_sessions_by_hour.html")
    print("Saved 1_sessions_by_hour.html")

    # 2. Sessions by Day of Week
    day_order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    daily = df.groupby(["day_name", "site_name"]).size().reset_index(name="sessions")
    daily["day_name"] = pd.Categorical(daily["day_name"], categories=day_order, ordered=True)
    daily = daily.sort_values("day_name")

    fig2 = px.bar(
        daily, x="day_name", y="sessions", color="site_name", barmode="group",
        title="2. Charging Demand by Day of Week",
        labels={"day_name": "Day of Week", "sessions": "Total Sessions", "site_name": "Site"},
        template=template,
        color_discrete_map={"Caltech": "#6366f1", "JPL": "#06b6d4"}
    )
    fig2.write_html("analysis/figures/2_sessions_by_day_of_week.html")
    print("Saved 2_sessions_by_day_of_week.html")

    # 3. Monthly Demand
    monthly = df.groupby(["month", "month_name", "site_name"]).size().reset_index(name="sessions").sort_values("month")
    fig3 = px.line(
        monthly, x="month_name", y="sessions", color="site_name", markers=True,
        title="3. Monthly Session Volume Trajectory (2019)",
        labels={"month_name": "Month", "sessions": "Sessions", "site_name": "Site"},
        template=template,
        color_discrete_map={"Caltech": "#6366f1", "JPL": "#06b6d4"}
    )
    fig3.write_html("analysis/figures/3_monthly_demand.html")
    print("Saved 3_monthly_demand.html")

    # 4. Energy Consumption Trend (Cumulative & Monthly kWh)
    monthly_energy = df.groupby(["month", "month_name"]).agg(
        total_kwh=("kwh_delivered", "sum"),
        avg_kwh=("kwh_delivered", "mean")
    ).reset_index().sort_values("month")

    fig4 = make_subplots(specs=[[{"secondary_y": True}]])
    fig4.add_trace(
        go.Bar(x=monthly_energy["month_name"], y=monthly_energy["total_kwh"], name="Total Energy (kWh)", marker_color="#10b981"),
        secondary_y=False
    )
    fig4.add_trace(
        go.Scatter(x=monthly_energy["month_name"], y=monthly_energy["avg_kwh"], name="Avg kWh / Session", mode="lines+markers", line=dict(color="#f59e0b", width=3)),
        secondary_y=True
    )
    fig4.update_layout(title="4. Monthly Energy Delivered & Session Intensity", template=template)
    fig4.update_yaxes(title_text="Total kWh Delivered", secondary_y=False)
    fig4.update_yaxes(title_text="Avg kWh / Session", secondary_y=True)
    fig4.write_html("analysis/figures/4_energy_consumption_trend.html")
    print("Saved 4_energy_consumption_trend.html")

    # 5. Station / Site Comparison: Active vs Idle Time
    site_dwell = df.groupby("site_name").agg(
        avg_active=("charging_duration_hours", "mean"),
        avg_idle=("idle_duration_hours", "mean")
    ).reset_index()

    fig5 = go.Figure(data=[
        go.Bar(name="Active Charging (hrs)", x=site_dwell["site_name"], y=site_dwell["avg_active"], marker_color="#3b82f6"),
        go.Bar(name="Idle Dwell Waste (hrs)", x=site_dwell["site_name"], y=site_dwell["avg_idle"], marker_color="#f43f5e")
    ])
    fig5.update_layout(
        barmode="stack",
        title="5. The Dwell Time Paradox: Active Charging vs Idle Stall Occupancy by Site",
        yaxis_title="Average Hours per Session",
        template=template
    )
    fig5.write_html("analysis/figures/5_station_comparison.html")
    print("Saved 5_station_comparison.html")

    # 6. Charging Duration Distribution
    fig6 = px.histogram(
        df, x="connection_duration_hours", color="site_name", nbins=50,
        title="6. Distribution of Session Connection Dwell Durations",
        labels={"connection_duration_hours": "Occupancy Duration (hours)", "site_name": "Site"},
        template=template,
        color_discrete_map={"Caltech": "#6366f1", "JPL": "#06b6d4"}
    )
    fig6.write_html("analysis/figures/6_charging_duration_distribution.html")
    print("Saved 6_charging_duration_distribution.html")

    # 7. Demand Heatmap (Day of Week x Hour of Day)
    heat = df.groupby(["day_name", "hour"]).size().reset_index(name="sessions")
    heat_pivot = heat.pivot(index="day_name", columns="hour", values="sessions").reindex(day_order).fillna(0)

    fig7 = px.imshow(
        heat_pivot,
        labels=dict(x="Hour of Day (PST)", y="Day of Week", color="Sessions"),
        x=[f"{h:02d}:00" for h in range(24)],
        y=day_order,
        title="7. ACN Charging Demand Heatmap (Arrival Time Matrix)",
        color_continuous_scale="Viridis",
        template=template
    )
    fig7.write_html("analysis/figures/7_demand_heatmap.html")
    print("Saved 7_demand_heatmap.html")

    # 8. Charger Utilization (Top 25 EVSEs)
    charger_util = df.groupby(["station_id", "site_name"])["connection_duration_hours"].sum().reset_index()
    charger_util["utilization_proxy_pct"] = (charger_util["connection_duration_hours"] / (365.0 * 24.0) * 100).round(1)
    top_chargers = charger_util.sort_values("utilization_proxy_pct", ascending=False).head(25)

    fig8 = px.bar(
        top_chargers, x="station_id", y="utilization_proxy_pct", color="site_name",
        title="8. Top 25 Most Congested EVSE Chargers (Annual Utilization Proxy %)",
        labels={"station_id": "EVSE ID", "utilization_proxy_pct": "Utilization Proxy (%)", "site_name": "Site"},
        template=template,
        color_discrete_map={"Caltech": "#6366f1", "JPL": "#06b6d4"}
    )
    fig8.update_layout(xaxis_tickangle=-45)
    fig8.write_html("analysis/figures/8_charger_utilization.html")
    print("Saved 8_charger_utilization.html")

    print("\nAll 8 EDA visualizations generated and saved to analysis/figures/")

if __name__ == "__main__":
    run_eda()
