# ACN-Data EV Charging Sessions: Data Dictionary

This document details all columns present in the cleaned analytical dataset (`data/cleaned/acn_charging_sessions.csv`), sourced from the **Adaptive Charging Network (ACN-Data) by the California Institute of Technology (Caltech)**.

Every field is explicitly tagged as either an **`Original ACN-Data field`** or a **`Derived analytical field`**.

---

## 1. Session & Hardware Identifiers

| Column Name | Data Type | Field Classification | Meaning & Business Context | Source |
|---|---|---|---|---|
| `session_id` | `VARCHAR(64)` | **Original ACN-Data field** | Unique primary key identifier for each EV charging session. | ACN-Data (`sessionID` / `_id`) |
| `site_id` | `VARCHAR(16)` | **Original ACN-Data field** | Code indicating the physical operating site (`0002` = Caltech Campus; `0001` = JPL / NASA Jet Propulsion Lab). | ACN-Data (`siteID`) |
| `site_name` | `VARCHAR(32)` | **Derived analytical field** | Normalized human-readable site name (`Caltech` or `JPL`). | Derived by mapping `site_id` |
| `station_id` | `VARCHAR(32)` | **Original ACN-Data field** | Unique EVSE identifier for the physical dual-port or single-port charging unit (e.g., `2-39-139-28`). | ACN-Data (`stationID`) |
| `space_id` | `VARCHAR(32)` | **Original ACN-Data field** | Specific parking stall identifier corresponding to the EVSE spot (e.g., `CA-303`). | ACN-Data (`spaceID`) |
| `cluster_id` | `VARCHAR(16)` | **Original ACN-Data field** | Electrical substation or parking structure cluster identifier within the facility. | ACN-Data (`clusterID`) |

---

## 2. Timestamps & Temporal Features

*Note: All original datetimes are in UTC GMT. Local conversions use the official site timezone (`America/Los_Angeles` / US Pacific Time) to capture true human behavioral patterns.*

| Column Name | Data Type | Field Classification | Meaning & Business Context | Source |
|---|---|---|---|---|
| `connection_time_utc` | `TIMESTAMP WITH TIME ZONE` | **Original ACN-Data field** | UTC timestamp recorded when the user physically plugged the J1772 cable into the vehicle. | ACN-Data (`connectionTime`) |
| `disconnect_time_utc` | `TIMESTAMP WITH TIME ZONE` | **Original ACN-Data field** | UTC timestamp recorded when the vehicle unplugged and released the connector. | ACN-Data (`disconnectTime`) |
| `done_charging_time_utc` | `TIMESTAMP WITH TIME ZONE` | **Original ACN-Data field** | UTC timestamp marking the last non-zero current draw (when vehicle reached 100% full charge or stopped charging). Null if session was unplugged before finishing. | ACN-Data (`doneChargingTime`) |
| `connection_time_local` | `TIMESTAMP` | **Derived analytical field** | Local California time of vehicle plug-in. | Converted from `connection_time_utc` to Pacific Time |
| `disconnect_time_local` | `TIMESTAMP` | **Derived analytical field** | Local California time of vehicle departure. | Converted from `disconnect_time_utc` to Pacific Time |
| `done_charging_time_local` | `TIMESTAMP` | **Derived analytical field** | Local California time when charging completed. | Converted from `done_charging_time_utc` to Pacific Time |
| `date` | `DATE` | **Derived analytical field** | Calendar date (`YYYY-MM-DD`) of plug-in arrival. | Extracted from `connection_time_local` |
| `hour` | `INTEGER` | **Derived analytical field** | Hour of day (0–23) of arrival in local time. | Extracted from `connection_time_local` |
| `day_of_week` | `INTEGER` | **Derived analytical field** | Day of week integer index (0 = Monday, 6 = Sunday). | Extracted from `connection_time_local` |
| `day_name` | `VARCHAR(16)` | **Derived analytical field** | Full day name (`Monday` through `Sunday`). | Extracted from `connection_time_local` |
| `month` | `INTEGER` | **Derived analytical field** | Month integer (1 = January, 12 = December). | Extracted from `connection_time_local` |
| `month_name` | `VARCHAR(8)` | **Derived analytical field** | Abbreviated month string (`Jan` through `Dec`). | Extracted from `connection_time_local` |
| `is_weekend` | `BOOLEAN` | **Derived analytical field** | Flag: `TRUE` if Saturday or Sunday, `FALSE` for weekdays. | Evaluated where `day_of_week >= 5` |

---

## 3. Duration & Dwell Metrics (The Dwell Time Paradox)

| Column Name | Data Type | Field Classification | Meaning & Business Context | Source / Formula |
|---|---|---|---|---|
| `connection_duration_hours` | `NUMERIC(6,2)` | **Derived analytical field** | Total physical occupancy time the EV occupied the parking stall. | `(disconnect_time - connection_time) / 3600` |
| `charging_duration_hours` | `NUMERIC(6,2)` | **Derived analytical field** | Active electrical power transfer duration from plug-in until battery ceased drawing current. | `(done_charging_time - connection_time) / 3600` |
| `idle_duration_hours` | `NUMERIC(6,2)` | **Derived analytical field** | **Idle Stall Occupancy Time**: Hours the vehicle remained parked at the charger after the battery was already completely full. Key operational waste metric. | `MAX(0, connection_duration - charging_duration)` |

---

## 4. Energy & Operational Metrics

| Column Name | Data Type | Field Classification | Meaning & Business Context | Source / Formula |
|---|---|---|---|---|
| `kwh_delivered` | `NUMERIC(8,3)` | **Original ACN-Data field** | Total net electrical energy delivered to the vehicle in kilowatt-hours. | ACN-Data (`kWhDelivered`) |
| `avg_charging_power_kw` | `NUMERIC(6,2)` | **Derived analytical field** | Average delivery power rate during active charging. Level 2 chargers typically deliver 3.3 kW to 6.6 kW. | `kwh_delivered / charging_duration_hours` |
| `user_id` | `VARCHAR(32)` | **Original ACN-Data field** | Anonymized user account identifier registered in the ACN mobile app. Null for guest/unclaimed sessions. | ACN-Data (`userID`) |
| `user_type` | `VARCHAR(32)` | **Derived analytical field** | User engagement segment: `'Registered User'` vs `'Guest / Unregistered'`. | Derived based on `user_id IS NOT NULL` |
| `kwh_requested` | `NUMERIC(6,2)` | **Original ACN-Data field** | Desired energy requested by user in mobile app (optional user input). | ACN-Data (`userInputs[0].kWhRequested`) |
| `miles_requested` | `NUMERIC(6,1)` | **Original ACN-Data field** | Desired estimated driving range in miles requested by user. | ACN-Data (`userInputs[0].milesRequested`) |
| `minutes_available` | `INTEGER` | **Original ACN-Data field** | Self-reported expected parking duration reported by the user at plug-in. | ACN-Data (`userInputs[0].minutesAvailable`) |
| `payment_required` | `BOOLEAN` | **Original ACN-Data field** | Indicates whether the session required user payment authorization. | ACN-Data (`userInputs[0].paymentRequired`) |

---

## 5. Fields Intentionally Omitted & Rationale

| Omitted Metric | Rationale for Exclusion |
|---|---|
| Synthetic Gross Revenue (₹ / $) | The raw ACN-Data dataset does not capture retail billing transactions or commercial energy tariff schedules. Financial amounts are not fabricated. |
| Battery State of Charge (SOC %) | SAE J1772 hardware does not pass battery pack state-of-charge percentage between vehicle and EVSE. |
| Connector Type (`CCS2`, `Type 2`) | ACN charging stations exclusively deploy North American Level 2 SAE J1772 connectors. |
| Synthetic Persona (`Fleet`, `Intercity`) | Actual users are university researchers, faculty, staff, and national laboratory aerospace personnel. |
