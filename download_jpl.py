import requests
import json
import re
import os
import time

def fetch_chunk(site, start, end):
    url = "https://ev.caltech.edu/dataset"
    s = requests.Session()
    s.headers.update({"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"})
    r = s.get(url, timeout=30)
    token = re.search(r'name=["\']csrf_token["\'][^>]*value=["\']([^"\']+)["\']', r.text).group(1)
    
    data = {
        "csrf_token": token,
        "site": site,
        "start": start,
        "end": end,
        "min_kWh": "",
        "submit": "Download"
    }
    resp = s.post(url, data=data, headers={"Referer": url}, timeout=90)
    if resp.status_code == 200:
        try:
            items = resp.json().get("_items", [])
            print(f"Retrieved {len(items)} sessions from {site} ({start} - {end})")
            return items
        except Exception as e:
            print(f"JSON decode error: {e}")
            return []
    return []

# Load Caltech sessions already downloaded
with open("data/raw/acn_raw_sessions.json", "r") as f:
    caltech_sessions = json.load(f)

print(f"Existing Caltech sessions: {len(caltech_sessions)}")

jpl_chunks = [
    ("01/01/2019", "04/30/2019"),
    ("05/01/2019", "08/31/2019"),
    ("09/01/2019", "12/31/2019")
]

all_sessions = list(caltech_sessions)
for start, end in jpl_chunks:
    sessions = fetch_chunk("JPL", start, end)
    all_sessions.extend(sessions)
    time.sleep(2)

print(f"Total sessions combined (Caltech + JPL): {len(all_sessions)}")
with open("data/raw/acn_raw_sessions.json", "w") as f:
    json.dump(all_sessions, f, indent=2)

print("Saved combined raw dataset to data/raw/acn_raw_sessions.json")
