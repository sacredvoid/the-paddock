#!/usr/bin/env python3
"""
Fetch detailed car telemetry (speed, throttle, brake) from FastF1.
Fetches the fastest lap telemetry per driver per race.
Downsamples to ~300 points per lap for web performance.
"""
import fastf1
import json
import numpy as np
from pathlib import Path

fastf1.Cache.enable_cache('/tmp/fastf1_cache')

DATA_DIR = Path(__file__).parent.parent / "data" / "telemetry-detail"

# Load driver data to map FastF1 abbreviations to our driver IDs
DRIVERS_PATH = Path(__file__).parent.parent / "data" / "drivers.json"
with open(DRIVERS_PATH) as f:
    all_drivers = json.load(f)


def build_driver_map(year):
    """Build code -> driverId mapping, filtered by active seasons."""
    mapping = {}
    for d in all_drivers:
        if d.get("code") and year in d.get("seasons", []):
            mapping[d["code"]] = d["id"]
    return mapping


SEASONS = [2024]
SAMPLE_POINTS = 300


def downsample(arr, target_len):
    """Downsample array to target length using evenly-spaced indices."""
    if len(arr) <= target_len:
        return arr.tolist() if hasattr(arr, 'tolist') else list(arr)
    indices = np.linspace(0, len(arr) - 1, target_len).astype(int)
    result = arr[indices]
    return result.tolist() if hasattr(result, 'tolist') else [arr[i] for i in indices]


def fetch_race_telemetry(year, round_num, driver_map):
    """Fetch fastest lap telemetry for each driver in a race."""
    print(f"  Loading {year} Round {round_num}...", flush=True)

    try:
        session = fastf1.get_session(year, round_num, 'R')
        session.load(laps=True, telemetry=True, weather=False, messages=False)
    except Exception as e:
        print(f"    ERROR loading session: {e}", flush=True)
        return None

    drivers_data = {}

    for drv_abbrev in session.laps['Driver'].unique():
        driver_id = driver_map.get(drv_abbrev)
        if not driver_id:
            continue

        try:
            # Get the fastest lap for this driver
            driver_laps = session.laps.pick_drivers(drv_abbrev)
            fastest = driver_laps.pick_fastest()

            # pick_fastest() returns a Lap (pandas Series subclass)
            # Check if it's valid
            if fastest is None:
                continue
            # Check for NaT lap time (indicates no valid fastest lap)
            import pandas as pd
            if pd.isna(fastest['LapTime']):
                continue

            # Get telemetry for the fastest lap
            tel = fastest.get_telemetry()

            if tel is None or len(tel) == 0:
                continue

            # Extract numpy arrays
            distance = tel['Distance'].values
            speed = tel['Speed'].values
            throttle = tel['Throttle'].values
            # Brake is boolean in FastF1 - convert to float (0.0 or 1.0)
            brake = tel['Brake'].values.astype(float)
            gear = tel['nGear'].values.astype(int)
            rpm = tel['RPM'].values if 'RPM' in tel.columns else np.zeros(len(speed))

            n = min(SAMPLE_POINTS, len(distance))

            # Format lap time as string
            lap_time = str(fastest['LapTime'])

            drivers_data[driver_id] = {
                "abbreviation": drv_abbrev,
                "lapTime": lap_time,
                "distance": [round(v, 1) for v in downsample(distance, n)],
                "speed": [round(v, 1) for v in downsample(speed, n)],
                "throttle": [round(v, 1) for v in downsample(throttle, n)],
                "brake": [round(v, 2) for v in downsample(brake, n)],
                "gear": [int(v) for v in downsample(gear, n)],
                "rpm": [round(v, 0) for v in downsample(rpm, n)],
            }

            print(f"    {drv_abbrev} ({driver_id}): {n} points", flush=True)

        except Exception as e:
            print(f"    {drv_abbrev}: error - {e}", flush=True)
            continue

    if not drivers_data:
        return None

    # Get circuit/event info
    circuit_name = str(session.event['EventName']) if hasattr(session, 'event') else f"Round {round_num}"

    return {
        "year": year,
        "round": round_num,
        "raceName": circuit_name,
        "drivers": drivers_data,
    }


def main():
    for year in SEASONS:
        print(f"\n=== {year} Season ===", flush=True)
        driver_map = build_driver_map(year)
        print(f"  Driver map: {len(driver_map)} drivers", flush=True)

        out_dir = DATA_DIR / str(year)
        out_dir.mkdir(parents=True, exist_ok=True)

        # Get the schedule to know how many rounds
        schedule = fastf1.get_event_schedule(year)
        race_events = schedule[schedule['EventFormat'] != 'testing']

        for _, event in race_events.iterrows():
            round_num = int(event['RoundNumber'])
            if round_num == 0:
                continue

            out_file = out_dir / f"{round_num}.json"

            # Skip if already fetched
            if out_file.exists():
                print(f"  Round {round_num}: cached, skipping", flush=True)
                continue

            result = fetch_race_telemetry(year, round_num, driver_map)

            if result:
                with open(out_file, 'w') as f:
                    json.dump(result, f, separators=(',', ':'))
                size_kb = out_file.stat().st_size / 1024
                print(f"    Saved: {size_kb:.1f} KB ({len(result['drivers'])} drivers)", flush=True)
            else:
                print(f"    No data available", flush=True)

    print("\n=== Done ===", flush=True)


if __name__ == "__main__":
    main()
