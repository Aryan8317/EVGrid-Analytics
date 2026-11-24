
import streamlit as st
import pandas as pd
import plotly.express as px

st.set_page_config(page_title="EV Charging Analytics", layout="wide")

@st.cache_data
def load_data():
    return pd.read_csv("data/ev_charging_sessions.csv", parse_dates=["session_start"])

df = load_data()
completed = df[df["status"] == "Completed"].copy()

st.title("EV Charging Demand & Utilization Analytics")
st.caption("Analyst portfolio project — charging demand, station performance, revenue and capacity risk")

# Sidebar filters
st.sidebar.header("Filters")
stations = st.sidebar.multiselect(
    "Station",
    sorted(completed["station"].unique()),
    default=sorted(completed["station"].unique())
)
segments = st.sidebar.multiselect(
    "Customer segment",
    sorted(completed["customer_segment"].unique()),
    default=sorted(completed["customer_segment"].unique())
)

f = completed[
    completed["station"].isin(stations) &
    completed["customer_segment"].isin(segments)
]

c1, c2, c3, c4 = st.columns(4)
c1.metric("Sessions", f"{len(f):,}")
c2.metric("Energy Consumed", f"{f.energy_kwh.sum():,.0f} kWh")
c3.metric("Revenue", f"₹{f.revenue.sum():,.0f}")
c4.metric("Avg Session", f"{f.duration_min.mean():.1f} min")

st.divider()

left, right = st.columns(2)

hourly = f.groupby("hour", as_index=False).agg(
    sessions=("session_id","count"),
    energy_kwh=("energy_kwh","sum")
)
fig = px.line(hourly, x="hour", y="sessions", markers=True,
              title="Charging Demand by Hour")
fig.update_layout(xaxis_title="Hour of Day", yaxis_title="Sessions")
left.plotly_chart(fig, use_container_width=True)

station = f.groupby("station", as_index=False).agg(
    sessions=("session_id","count"),
    revenue=("revenue","sum"),
    energy_kwh=("energy_kwh","sum")
).sort_values("revenue", ascending=False)

fig = px.bar(station, x="station", y="revenue",
             title="Revenue by Station")
fig.update_layout(xaxis_title="", yaxis_title="Revenue (₹)")
right.plotly_chart(fig, use_container_width=True)

left, right = st.columns(2)

heat = f.groupby(["day_name","hour"], as_index=False).size()
day_order = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]
heat["day_name"] = pd.Categorical(heat["day_name"], categories=day_order, ordered=True)
heat = heat.sort_values(["day_name","hour"])

fig = px.density_heatmap(
    heat, x="hour", y="day_name", z="size",
    title="Demand Heatmap", nbinsx=24
)
left.plotly_chart(fig, use_container_width=True)

monthly = f.groupby(["month","month_name"], as_index=False).agg(
    revenue=("revenue","sum"),
    energy_kwh=("energy_kwh","sum")
).sort_values("month")

fig = px.line(monthly, x="month_name", y="revenue", markers=True,
              title="Monthly Revenue Trend")
right.plotly_chart(fig, use_container_width=True)

st.subheader("Station Capacity Risk")

risk = f.groupby(["station","charger_capacity"], as_index=False).agg(
    sessions=("session_id","count"),
    occupied_hours=("occupied_hours","sum"),
    revenue=("revenue","sum")
)
risk["utilization_proxy"] = (
    risk["occupied_hours"] /
    (risk["charger_capacity"] * 24 * 365)
)
risk["capacity_flag"] = risk["utilization_proxy"].apply(
    lambda x: "Capacity Risk" if x >= 0.55 else
              ("Monitor" if x >= 0.40 else "Normal")
)

st.dataframe(
    risk.sort_values("utilization_proxy", ascending=False)
        .style.format({
            "occupied_hours":"{:.1f}",
            "revenue":"₹{:,.0f}",
            "utilization_proxy":"{:.1%}"
        }),
    use_container_width=True
)

st.info(
    "Business interpretation: stations with consistently high utilization during peak "
    "hours can be candidates for additional chargers, while low-utilization stations "
    "may need pricing or demand-generation strategies."
)
