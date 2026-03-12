#!/usr/bin/env python3
"""
Fetch race telemetry data from FastF1 for seasons 2023-2025.

Outputs JSON files to data/telemetry/{year}/{round}.json with lap times,
positions, tire compounds, pit stops, and safety car data.
"""

import json
import os
import sys
import traceback
from pathlib import Path

import fastf1
import numpy as np
import pandas as pd

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

CACHE_DIR = "/tmp/fastf1_cache"
SEASONS = [2023, 2024, 2025]
PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data"
OUTPUT_DIR = DATA_DIR / "telemetry"

# ---------------------------------------------------------------------------
# Driver code -> Jolpica driverId mapping
#
# FastF1 uses 3-letter abbreviations. We need to map them to the driverId
# format used in the app (e.g. "max-verstappen"). We load from drivers.json
# and filter by season activity so codes map to the correct driver (e.g.
# VER -> max-verstappen not jos-verstappen).
# ---------------------------------------------------------------------------

def build_driver_map(year: int) -> dict[str, dict]:
    """Build a mapping from FastF1 3-letter code to driver info for a given year."""
    drivers_path = DATA_DIR / "drivers.json"
    with open(drivers_path) as f:
        all_drivers = json.load(f)

    code_map: dict[str, dict] = {}
    for d in all_drivers:
        code = d.get("code", "")
        seasons = d.get("seasons", [])
        if code and year in seasons:
            code_map[code] = {
                "id": d["id"],
                "abbreviation": code,
            }
    return code_map


# FastF1 team name -> app team-id mapping
TEAM_NAME_MAP = {
    # 2024-2025 names
    "Red Bull Racing": "red-bull",
    "Mercedes": "mercedes",
    "Ferrari": "ferrari",
    "McLaren": "mclaren",
    "Aston Martin": "aston-martin",
    "Alpine": "alpine",
    "Williams": "williams",
    "RB": "racing-bulls",
    "Racing Bulls": "racing-bulls",
    "Kick Sauber": "kick-sauber",
    "Haas F1 Team": "haas",
    "Haas": "haas",
    # 2023 names
    "Alfa Romeo": "alfa-romeo",
    "AlphaTauri": "alphatauri",
    "Alpha Tauri": "alphatauri",
    # Fallbacks
    "Cadillac": "cadillac",
    "Audi": "audi",
    "Sauber": "kick-sauber",
}


def map_team_name(fastf1_team: str) -> str:
    """Map FastF1 team name to app team ID."""
    if fastf1_team in TEAM_NAME_MAP:
        return TEAM_NAME_MAP[fastf1_team]
    # Fallback: lowercase and hyphenate
    return fastf1_team.lower().replace(" ", "-")


# ---------------------------------------------------------------------------
# Lap time formatting
# ---------------------------------------------------------------------------

def format_lap_time(td) -> tuple[str, int]:
    """Convert a pandas Timedelta to (formatted string, milliseconds)."""
    if pd.isna(td):
        return ("", 0)
    total_ms = int(td.total_seconds() * 1000)
    minutes = total_ms // 60000
    seconds = (total_ms % 60000) / 1000
    formatted = f"{minutes}:{seconds:06.3f}"
    return (formatted, total_ms)


# ---------------------------------------------------------------------------
# Safety car / VSC / Red flag detection from race control messages
# ---------------------------------------------------------------------------

def extract_safety_cars(session) -> list[dict]:
    """Extract safety car, VSC, and red flag periods from race control messages."""
    try:
        msgs = session.race_control_messages
    except Exception:
        return []

    if msgs is None or len(msgs) == 0:
        return []

    periods: list[dict] = []
    current_sc = None
    current_vsc = None
    current_red = None

    for _, msg in msgs.iterrows():
        message = str(msg.get("Message", "")).upper()
        category = str(msg.get("Category", ""))
        flag = str(msg.get("Flag", "")).upper()
        lap = msg.get("Lap", None)
        if pd.isna(lap):
            continue
        lap = int(lap)

        # Safety Car
        if category == "SafetyCar":
            if "VIRTUAL" not in message:
                # Full safety car
                if "DEPLOYED" in message:
                    current_sc = {"type": "SC", "startLap": lap, "endLap": lap}
                elif "IN THIS LAP" in message or "ENDING" in message:
                    if current_sc:
                        current_sc["endLap"] = lap
                        periods.append(current_sc)
                        current_sc = None
            else:
                # VSC
                if "DEPLOYED" in message:
                    current_vsc = {"type": "VSC", "startLap": lap, "endLap": lap}
                elif "ENDING" in message:
                    if current_vsc:
                        current_vsc["endLap"] = lap
                        periods.append(current_vsc)
                        current_vsc = None

        # Red flag from Flag field
        if flag == "RED" and "RED FLAG" in message:
            current_red = {"type": "RED", "startLap": lap, "endLap": lap}

        # Track clear / green after red flag
        if current_red and ("TRACK CLEAR" in message or "STANDING START" in message or "ROLLING START" in message):
            current_red["endLap"] = lap
            periods.append(current_red)
            current_red = None

    # Close any still-open periods
    if current_sc:
        periods.append(current_sc)
    if current_vsc:
        periods.append(current_vsc)
    if current_red:
        periods.append(current_red)

    return periods


# ---------------------------------------------------------------------------
# Pit stop extraction from stint changes
# ---------------------------------------------------------------------------

def extract_pit_stops(laps_df, driver_code: str, driver_id: str) -> list[dict]:
    """Extract pit stops for a driver by looking at stint transitions."""
    driver_laps = laps_df[laps_df["Driver"] == driver_code].sort_values("LapNumber")
    if len(driver_laps) == 0:
        return []

    pit_stops = []
    prev_stint = None
    prev_compound = None

    for _, lap in driver_laps.iterrows():
        stint = lap.get("Stint")
        compound = lap.get("Compound", "UNKNOWN")

        if pd.isna(stint):
            continue

        stint = int(stint)

        if prev_stint is not None and stint != prev_stint:
            # Stint changed - pit stop happened on the previous lap
            pit_lap = int(lap["LapNumber"]) - 1
            if pit_lap < 1:
                pit_lap = 1

            # Estimate pit duration from the in-lap/out-lap times
            duration = 0.0
            pit_in = lap.get("PitOutTime")
            if not pd.isna(pit_in):
                duration = round(pit_in.total_seconds(), 1) if hasattr(pit_in, "total_seconds") else 0.0

            # If we can't get duration from PitOutTime, try a default
            if duration <= 0 or duration > 60:
                duration = 0.0

            pit_stops.append({
                "driverId": driver_id,
                "lap": pit_lap,
                "duration": duration,
                "compound": compound if not pd.isna(compound) else "UNKNOWN",
            })

        prev_stint = stint
        prev_compound = compound

    return pit_stops


# ---------------------------------------------------------------------------
# Main fetch logic
# ---------------------------------------------------------------------------

def fetch_race(year: int, round_num: int, driver_map: dict) -> dict | None:
    """Fetch and process telemetry data for a single race."""
    try:
        session = fastf1.get_session(year, round_num, "R")
        session.load(laps=True, telemetry=False, weather=False, messages=True)
    except Exception as e:
        print(f"    [WARN] Could not load session: {e}")
        return None

    laps_df = session.laps
    if laps_df is None or len(laps_df) == 0:
        print("    [WARN] No lap data available")
        return None

    # Get total laps from the maximum LapNumber
    total_laps = int(laps_df["LapNumber"].max())

    # Process each driver
    drivers_data: dict[str, dict] = {}
    all_pit_stops: list[dict] = []

    for driver_code in sorted(laps_df["Driver"].unique()):
        driver_laps = laps_df[laps_df["Driver"] == driver_code].sort_values("LapNumber")
        if len(driver_laps) == 0:
            continue

        # Map to our driver ID
        if driver_code in driver_map:
            driver_id = driver_map[driver_code]["id"]
        else:
            # Try to find by matching - skip unknown drivers
            print(f"    [WARN] Unknown driver code: {driver_code}, skipping")
            continue

        # Get team
        team_fastf1 = driver_laps.iloc[0].get("Team", "Unknown")
        team_id = map_team_name(str(team_fastf1)) if not pd.isna(team_fastf1) else "unknown"

        # Process laps
        lap_entries = []
        for _, lap in driver_laps.iterrows():
            lap_num = lap.get("LapNumber")
            position = lap.get("Position")
            lap_time = lap.get("LapTime")
            compound = lap.get("Compound", "UNKNOWN")
            stint = lap.get("Stint")

            if pd.isna(lap_num):
                continue

            time_str, time_ms = format_lap_time(lap_time)

            lap_entries.append({
                "lap": int(lap_num),
                "position": int(position) if not pd.isna(position) else 0,
                "time": time_str,
                "timeMs": time_ms,
                "compound": str(compound) if not pd.isna(compound) else "UNKNOWN",
                "stint": int(stint) if not pd.isna(stint) else 1,
            })

        if len(lap_entries) == 0:
            continue

        drivers_data[driver_id] = {
            "abbreviation": driver_code,
            "teamId": team_id,
            "laps": lap_entries,
        }

        # Extract pit stops
        pits = extract_pit_stops(laps_df, driver_code, driver_id)
        all_pit_stops.extend(pits)

    if len(drivers_data) == 0:
        print("    [WARN] No driver data processed")
        return None

    # Extract safety cars
    safety_cars = extract_safety_cars(session)

    return {
        "year": year,
        "round": round_num,
        "totalLaps": total_laps,
        "drivers": drivers_data,
        "pitStops": all_pit_stops,
        "safetyCars": safety_cars,
    }


def main():
    # Set up cache
    os.makedirs(CACHE_DIR, exist_ok=True)
    fastf1.Cache.enable_cache(CACHE_DIR)

    print("=" * 60)
    print("FastF1 Telemetry Data Fetcher")
    print("=" * 60)

    for year in SEASONS:
        print(f"\n{'='*60}")
        print(f"Season {year}")
        print(f"{'='*60}")

        # Build driver map for this season
        driver_map = build_driver_map(year)
        print(f"  Driver map: {len(driver_map)} drivers for {year}")

        # Get schedule
        try:
            schedule = fastf1.get_event_schedule(year)
            races = schedule[schedule["RoundNumber"] > 0]
        except Exception as e:
            print(f"  [ERROR] Could not get schedule: {e}")
            continue

        # Create output directory
        year_dir = OUTPUT_DIR / str(year)
        os.makedirs(year_dir, exist_ok=True)

        success_count = 0
        skip_count = 0
        error_count = 0

        for _, event in races.iterrows():
            round_num = int(event["RoundNumber"])
            event_name = event["EventName"]

            # Check if output already exists
            output_path = year_dir / f"{round_num}.json"
            if output_path.exists():
                print(f"  Round {round_num:2d} | {event_name:40s} | CACHED")
                success_count += 1
                continue

            print(f"  Round {round_num:2d} | {event_name:40s} | Fetching...", end=" ", flush=True)

            try:
                result = fetch_race(year, round_num, driver_map)
                if result:
                    with open(output_path, "w") as f:
                        json.dump(result, f, separators=(",", ":"))
                    driver_count = len(result["drivers"])
                    pit_count = len(result["pitStops"])
                    sc_count = len(result["safetyCars"])
                    print(f"OK ({driver_count} drivers, {pit_count} pits, {sc_count} SC)")
                    success_count += 1
                else:
                    print("SKIPPED (no data)")
                    skip_count += 1
            except Exception as e:
                print(f"ERROR: {e}")
                traceback.print_exc()
                error_count += 1

        print(f"\n  Season {year} summary: {success_count} OK, {skip_count} skipped, {error_count} errors")

    print(f"\n{'='*60}")
    print("Done!")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
