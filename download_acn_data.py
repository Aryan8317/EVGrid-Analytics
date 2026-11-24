import requests
import json
import re
import os
import time

def fetch_acn_data(site, start_date, end_date):
    """
    Downloads real session data from the official Caltech ACN-Data portal.
    """
    url = "https://ev.caltech.edu/dataset"
    session = requests.Session()
    session.headers.update({"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"})
    
    print(f"Connecting to Caltech ACN-Data portal for site: {site} ({start_date} to {end_date})...")
    resp = session.get(url, timeout=30)
    if resp.status_code != 200:
        raise Exception(f"Failed to access portal: status {resp.status_code}")
    
    token_match = re.search(r'name=["\']csrf_token["\'][^>]*value=["\']([^"\']+)["\']', resp.text)
    if not token_match:
        raise Exception("Could not find CSRF token on ACN portal")
    csrf_token = token_match.group(1)
    
    post_data = {
        "csrf_token": csrf_token,
        "site": site,
        "start": start_date,
        "end": end_date,
        "min_kWh": "",
        "submit": "Download"
    }
    
    post_resp = session.post(url, data=post_data, headers={"Referer": url}, timeout=60)
    if post_resp.status_code != 200:
        raise Exception(f"Download failed: status {post_resp.status_code}")
    
    data = post_resp.json()
    items = data.get("_items", [])
    print(f"Successfully retrieved {len(items)} sessions from {site}.")
    return items

def main():
    os.makedirs("data/raw", exist_ok=True)
    all_sessions = []
    
    # We fetch a comprehensive 1-year window (2019 - early 2020) across both Caltech and JPL sites
    # Representing normal pre-pandemic workplace charging operations
    sites = [
        ("Caltech", "01/01/2019", "12/31/2019"),
        ("JPL", "01/01/2019", "12/31/2019")
    ]
    
    for site, start, end in sites:
        try:
            sessions = fetch_acn_data(site, start, end)
            all_sessions.extend(sessions)
            time.sleep(2)
        except Exception as e:
            print(f"Error fetching {site}: {e}")
            
    print(f"Total raw sessions collected across all sites: {len(all_sessions)}")
    raw_path = "data/raw/acn_raw_sessions.json"
    with open(raw_path, "w") as f:
        json.dump(all_sessions, f, indent=2)
    print(f"Saved raw dataset to {raw_path}")

if __name__ == "__main__":
    main()
