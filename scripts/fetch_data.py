#!/usr/bin/env python3
"""
Fetch F1 data from the Jolpica (Ergast) API and write structured JSON files
for The Paddock Next.js site to consume at build time.

Strategy: Fetch season-level data first (schedule, results, standings), then
derive driver/team/circuit stats from that data. This minimizes API calls
compared to fetching individual driver/team endpoints.

API docs: https://api.jolpi.ca/ergast/f1/
Rate limits: 4 requests/second, 500 requests/hour
"""

import json
import hashlib
import time
import sys
from collections import defaultdict
from pathlib import Path
from typing import Any

import requests

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

BASE_URL = "https://api.jolpi.ca/ergast/f1"
REQUEST_DELAY = 0.5  # seconds between requests
MAX_RETRIES = 8  # more retries for hourly rate limit recovery
CACHE_DIR = Path(__file__).parent / ".cache"
DATA_DIR = Path(__file__).parent.parent / "data"
SEASON_DIR = DATA_DIR / "seasons"

SEASON_START = 2000
SEASON_END = 2025

# Team colors (duplicated from lib/team-colors.ts so JSON includes them)
TEAM_COLORS: dict[str, str] = {
    "red_bull": "#3671C6",
    "mercedes": "#27F4D2",
    "ferrari": "#E8002D",
    "mclaren": "#FF8000",
    "aston_martin": "#229971",
    "alpine": "#FF87BC",
    "williams": "#64C4FF",
    "rb": "#6692FF",
    "kick_sauber": "#52E252",
    "haas": "#B6BABD",
    "lotus": "#FFB800",
    "brabham": "#00783E",
    "tyrrell": "#0044AA",
    "benetton": "#00A550",
    "brawn": "#B5F500",
    "jordan": "#FFC700",
    "force_india": "#F596C8",
    "racing_point": "#F596C8",
    "toro_rosso": "#469BFF",
    "alphatauri": "#4E7C9B",
    "renault": "#FFF500",
    "minardi": "#000000",
    "caterham": "#005030",
    "marussia": "#6E0000",
    "manor": "#ED1C24",
    "sauber": "#006EFF",
    "alfa_romeo": "#A50F2D",
}

# ---------------------------------------------------------------------------
# HTTP helpers
# ---------------------------------------------------------------------------

request_count = 0


def cache_key(url: str) -> str:
    return hashlib.sha256(url.encode()).hexdigest()


def fetch_json(endpoint: str) -> dict[str, Any]:
    """Fetch JSON from the Jolpica API with caching, rate limiting, and retry."""
    global request_count

    url = f"{BASE_URL}/{endpoint}" if not endpoint.startswith("http") else endpoint
    key = cache_key(url)
    cache_path = CACHE_DIR / f"{key}.json"

    if cache_path.exists():
        with open(cache_path) as f:
            return json.load(f)

    CACHE_DIR.mkdir(parents=True, exist_ok=True)

    for attempt in range(MAX_RETRIES):
        request_count += 1
        time.sleep(REQUEST_DELAY)

        try:
            resp = requests.get(url, timeout=30)

            if resp.status_code == 429:
                # Escalating backoff: 2, 4, 8, 16, 30, 60, 90, 120
                backoff = min(2 ** attempt * 2, 120)
                if attempt >= 3:
                    backoff = max(backoff, 60)  # at least 60s after 3 failures
                print(f"    Rate limited (429). Waiting {backoff}s (retry {attempt + 1}/{MAX_RETRIES})...", flush=True)
                time.sleep(backoff)
                continue

            if resp.status_code >= 500:
                backoff = min(2 ** attempt * 2, 60)
                print(f"    Server error ({resp.status_code}). Waiting {backoff}s (retry {attempt + 1}/{MAX_RETRIES})...", flush=True)
                time.sleep(backoff)
                continue

            if resp.status_code == 400:
                return {}

            resp.raise_for_status()
            data = resp.json()

            with open(cache_path, "w") as f:
                json.dump(data, f)

            return data

        except requests.exceptions.Timeout:
            backoff = min(2 ** attempt * 2, 60)
            print(f"    Timeout. Waiting {backoff}s (retry {attempt + 1}/{MAX_RETRIES})...", flush=True)
            time.sleep(backoff)
            continue
        except requests.exceptions.RequestException as e:
            print(f"    ERROR: {e}", flush=True)
            return {}

    print(f"    FAILED after {MAX_RETRIES} retries: {url}", flush=True)
    return {}


def fetch_all_pages(endpoint: str, limit: int = 1000) -> list[dict]:
    """Fetch all pages from a paginated Jolpica endpoint."""
    sep = "&" if "?" in endpoint else "?"
    first_page = fetch_json(f"{endpoint}{sep}limit={limit}&offset=0")

    mrdata = first_page.get("MRData", {})
    total = int(mrdata.get("total", 0))

    # Find the data table key (ends in "Table")
    table_key = None
    for k in mrdata:
        if k.endswith("Table"):
            table_key = k
            break
    if not table_key:
        return []

    table = mrdata[table_key]

    # Find the list key inside the table
    list_key = None
    for k in table:
        if isinstance(table[k], list):
            list_key = k
            break
    if not list_key:
        return []

    results = list(table[list_key])

    # Paginate
    offset = limit
    while offset < total:
        page = fetch_json(f"{endpoint}{sep}limit={limit}&offset={offset}")
        page_items = page.get("MRData", {}).get(table_key, {}).get(list_key, [])
        if not page_items:
            break
        results.extend(page_items)
        offset += limit

    return results


# ---------------------------------------------------------------------------
# Utilities
# ---------------------------------------------------------------------------

def slugify(text: str) -> str:
    return text.lower().replace(" ", "-").replace(".", "").replace("'", "")


def safe_int(val: Any, default: int = 0) -> int:
    try:
        return int(val)
    except (ValueError, TypeError):
        return default


def safe_float(val: Any, default: float = 0.0) -> float:
    try:
        return float(val)
    except (ValueError, TypeError):
        return default


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w") as f:
        json.dump(data, f, indent=2)


# ---------------------------------------------------------------------------
# Phase 1: Fetch all season data (the core data source)
# ---------------------------------------------------------------------------

def fetch_all_seasons() -> dict[int, dict]:
    """Fetch schedule, results, and standings for all seasons in scope."""
    print(f"\n=== Phase 1: Fetching {SEASON_END - SEASON_START + 1} seasons ===", flush=True)
    seasons = {}
    total = SEASON_END - SEASON_START + 1

    for i, year in enumerate(range(SEASON_START, SEASON_END + 1), 1):
        print(f"  Season {year}... ({i}/{total})", flush=True)
        season = fetch_season_data(year)
        seasons[year] = season
        write_json(SEASON_DIR / f"{year}.json", season)

    return seasons


def fetch_season_data(year: int) -> dict:
    """Fetch and structure a single season's data."""
    # Schedule
    schedule = fetch_all_pages(f"{year}.json")

    # Results
    results_raw = fetch_all_pages(f"{year}/results.json")
    results_by_round: dict[int, list] = {}
    for race in results_raw:
        rnd = safe_int(race.get("round", 0))
        for r in race.get("Results", []):
            results_by_round.setdefault(rnd, []).append(r)

    # Build race list
    races = []
    for race in schedule:
        rnd = safe_int(race.get("round", 0))
        circuit = race.get("Circuit", {})

        race_results = []
        for r in results_by_round.get(rnd, []):
            time_val = r.get("Time", {}).get("time", "") if isinstance(r.get("Time"), dict) else ""
            race_results.append({
                "position": safe_int(r.get("position", 0)),
                "driverId": r.get("Driver", {}).get("driverId", ""),
                "teamId": r.get("Constructor", {}).get("constructorId", ""),
                "grid": safe_int(r.get("grid", 0)),
                "laps": safe_int(r.get("laps", 0)),
                "status": r.get("status", ""),
                "points": safe_float(r.get("points", 0)),
                "time": time_val,
            })
        race_results.sort(key=lambda x: x["position"])

        races.append({
            "round": rnd,
            "name": race.get("raceName", ""),
            "circuitId": circuit.get("circuitId", ""),
            "date": race.get("date", ""),
            "results": race_results,
        })

    races.sort(key=lambda x: x["round"])

    # Driver standings
    standings_raw = fetch_all_pages(f"{year}/driverStandings.json")
    driver_standings = []
    for s in standings_raw:
        driver_standings.append({
            "position": safe_int(s.get("position", 0)),
            "id": s.get("Driver", {}).get("driverId", ""),
            "points": safe_float(s.get("points", 0)),
            "wins": safe_int(s.get("wins", 0)),
        })
    driver_standings.sort(key=lambda x: x["position"])

    # Champion
    champion = None
    if driver_standings:
        champ = driver_standings[0]
        champ_team = ""
        for s in standings_raw:
            if s.get("Driver", {}).get("driverId") == champ["id"]:
                constructors = s.get("Constructors", [])
                if constructors:
                    champ_team = constructors[0].get("constructorId", "")
                break
        champion = {"driverId": champ["id"], "teamId": champ_team}

    # Constructor standings (1958+)
    constructor_standings = []
    constructor_champion = None
    if year >= 1958:
        con_raw = fetch_all_pages(f"{year}/constructorStandings.json")
        for s in con_raw:
            constructor_standings.append({
                "position": safe_int(s.get("position", 0)),
                "id": s.get("Constructor", {}).get("constructorId", ""),
                "points": safe_float(s.get("points", 0)),
                "wins": safe_int(s.get("wins", 0)),
            })
        constructor_standings.sort(key=lambda x: x["position"])
        if constructor_standings:
            constructor_champion = {"teamId": constructor_standings[0]["id"]}

    return {
        "year": year,
        "champion": champion,
        "constructorChampion": constructor_champion,
        "races": races,
        "driverStandings": driver_standings,
        "constructorStandings": constructor_standings,
    }


# ---------------------------------------------------------------------------
# Phase 2: Fetch driver & constructor lists from API, compute stats from seasons
# ---------------------------------------------------------------------------

def build_driver_stats_from_seasons(seasons: dict[int, dict]) -> dict[str, dict]:
    """Aggregate driver stats from season data without extra API calls."""
    stats: dict[str, dict] = defaultdict(lambda: {
        "wins": 0, "podiums": 0, "poles": 0, "fastestLaps": 0,
        "races": 0, "points": 0.0, "dnfs": 0,
        "totalFinishPos": 0, "finishedRaces": 0, "bestFinish": 999,
        "seasons": set(), "championships": 0,
    })

    for year, season in seasons.items():
        # Count championships
        if season.get("champion") and season["champion"].get("driverId"):
            champ_id = season["champion"]["driverId"]
            stats[champ_id]["championships"] += 1

        for race in season.get("races", []):
            for r in race.get("results", []):
                did = r["driverId"]
                if not did:
                    continue

                s = stats[did]
                pos = r["position"]
                grid = r["grid"]
                pts = r["points"]
                status = r["status"]

                s["races"] += 1
                s["points"] += pts
                s["seasons"].add(year)

                if pos == 1:
                    s["wins"] += 1
                if 1 <= pos <= 3:
                    s["podiums"] += 1
                if grid == 1:
                    s["poles"] += 1

                is_finished = status == "Finished" or status.startswith("+")
                if not is_finished and pos > 0:
                    s["dnfs"] += 1
                if is_finished and pos > 0:
                    s["totalFinishPos"] += pos
                    s["finishedRaces"] += 1
                if 0 < pos < s["bestFinish"]:
                    s["bestFinish"] = pos

    # Finalize stats
    result = {}
    for did, s in stats.items():
        total = s["races"]
        finished = s["finishedRaces"]
        result[did] = {
            "championships": s["championships"],
            "wins": s["wins"],
            "podiums": s["podiums"],
            "poles": s["poles"],
            "fastestLaps": s["fastestLaps"],  # We can't get this from basic results
            "races": total,
            "points": s["points"],
            "dnfs": s["dnfs"],
            "winRate": round(s["wins"] / total, 2) if total > 0 else 0,
            "podiumRate": round(s["podiums"] / total, 2) if total > 0 else 0,
            "averageFinish": round(s["totalFinishPos"] / finished, 1) if finished > 0 else 0,
            "bestFinish": s["bestFinish"] if s["bestFinish"] < 999 else 0,
            "seasons": sorted(s["seasons"]),
        }
    return result


def build_team_stats_from_seasons(seasons: dict[int, dict]) -> dict[str, dict]:
    """Aggregate constructor stats from season data."""
    stats: dict[str, dict] = defaultdict(lambda: {
        "wins": 0, "podiums": 0, "poles": 0,
        "points": 0.0, "races": set(), "seasons": set(),
        "championships": 0,
    })

    for year, season in seasons.items():
        # Count constructor championships
        if season.get("constructorChampion") and season["constructorChampion"].get("teamId"):
            cid = season["constructorChampion"]["teamId"]
            stats[cid]["championships"] += 1

        for race in season.get("races", []):
            for r in race.get("results", []):
                tid = r["teamId"]
                if not tid:
                    continue

                s = stats[tid]
                pos = r["position"]
                grid = r["grid"]
                pts = r["points"]

                race_key = f"{year}-{race['round']}"
                s["races"].add(race_key)
                s["seasons"].add(year)
                s["points"] += pts

                if pos == 1:
                    s["wins"] += 1
                if 1 <= pos <= 3:
                    s["podiums"] += 1
                if grid == 1:
                    s["poles"] += 1

    result = {}
    for cid, s in stats.items():
        sorted_seasons = sorted(s["seasons"])
        result[cid] = {
            "championships": s["championships"],
            "wins": s["wins"],
            "poles": s["poles"],
            "podiums": s["podiums"],
            "races": len(s["races"]),
            "points": s["points"],
            "firstEntry": sorted_seasons[0] if sorted_seasons else 0,
            "lastEntry": sorted_seasons[-1] if sorted_seasons else 0,
        }
    return result


def fetch_drivers(driver_stats: dict[str, dict]) -> list[dict]:
    """Fetch driver list from API and merge with computed stats."""
    print("\n=== Phase 2a: Fetching driver list ===", flush=True)
    raw_drivers = fetch_all_pages("drivers.json")
    print(f"  Found {len(raw_drivers)} total drivers", flush=True)

    drivers = []
    for d in raw_drivers:
        driver_id = d.get("driverId", "")
        first = d.get("givenName", "")
        last = d.get("familyName", "")

        stats = driver_stats.get(driver_id)
        seasons_list = stats["seasons"] if stats else []
        is_active = any(s >= SEASON_END - 1 for s in seasons_list) if seasons_list else False

        entry = {
            "id": driver_id,
            "slug": slugify(f"{first} {last}"),
            "firstName": first,
            "lastName": last,
            "nationality": d.get("nationality", ""),
            "dateOfBirth": d.get("dateOfBirth", ""),
            "number": safe_int(d.get("permanentNumber", "0")),
            "code": d.get("code", ""),
            "isActive": is_active,
            "stats": {k: v for k, v in stats.items() if k != "seasons"} if stats else None,
            "seasons": seasons_list,
        }
        drivers.append(entry)

    # Sort: drivers with stats first (by wins desc), then rest alphabetically
    drivers.sort(key=lambda d: (
        -(d["stats"] or {}).get("wins", 0),
        d["lastName"],
    ))

    return drivers


def fetch_teams(team_stats: dict[str, dict]) -> list[dict]:
    """Fetch constructor list from API and merge with computed stats."""
    print("\n=== Phase 2b: Fetching constructor list ===", flush=True)
    raw = fetch_all_pages("constructors.json")
    print(f"  Found {len(raw)} total constructors", flush=True)

    teams = []
    for c in raw:
        cid = c.get("constructorId", "")
        name = c.get("name", "")
        stats = team_stats.get(cid)
        color = TEAM_COLORS.get(cid, "#888888")

        is_active = False
        if stats and stats.get("lastEntry"):
            is_active = stats["lastEntry"] >= SEASON_END - 1

        teams.append({
            "id": cid,
            "slug": slugify(name),
            "name": name,
            "nationality": c.get("nationality", ""),
            "color": color,
            "isActive": is_active,
            "stats": stats,
        })

    teams.sort(key=lambda t: (
        -(t["stats"] or {}).get("wins", 0),
        t["name"],
    ))

    return teams


# ---------------------------------------------------------------------------
# Phase 3: Circuits
# ---------------------------------------------------------------------------

def fetch_circuits(seasons: dict[int, dict]) -> list[dict]:
    """Fetch circuit list and compute race counts from season data."""
    print("\n=== Phase 3: Fetching circuits ===", flush=True)
    raw = fetch_all_pages("circuits.json")
    print(f"  Found {len(raw)} circuits", flush=True)

    # Count races per circuit from our season data
    circuit_race_counts: dict[str, int] = defaultdict(int)
    for year, season in seasons.items():
        for race in season.get("races", []):
            cid = race.get("circuitId", "")
            if cid:
                circuit_race_counts[cid] += 1

    circuits = []
    for c in raw:
        cid = c.get("circuitId", "")
        name = c.get("circuitName", "")
        loc = c.get("Location", {})

        circuits.append({
            "id": cid,
            "slug": slugify(name),
            "name": name,
            "country": loc.get("country", ""),
            "city": loc.get("locality", ""),
            "lat": safe_float(loc.get("lat", 0)),
            "lng": safe_float(loc.get("long", 0)),
            "totalRaces": circuit_race_counts.get(cid, 0),
        })

    circuits.sort(key=lambda c: -c["totalRaces"])
    return circuits


# ---------------------------------------------------------------------------
# Phase 4: Records
# ---------------------------------------------------------------------------

def compute_records(drivers: list[dict], teams: list[dict]) -> list[dict]:
    """Compute all-time records from driver and team data."""
    print("\n=== Phase 4: Computing records ===", flush=True)

    records = []

    def top_entries(items, key_fn, id_field="driverId", limit=20):
        scored = []
        for item in items:
            val = key_fn(item)
            if val and val > 0:
                scored.append({"id": item["id"], "value": val})
        scored.sort(key=lambda x: -x["value"])
        return [
            {"rank": rank, id_field: e["id"], "value": e["value"]}
            for rank, e in enumerate(scored[:limit], 1)
        ]

    detailed_drivers = [d for d in drivers if d.get("stats")]
    detailed_teams = [t for t in teams if t.get("stats")]

    # Driver records
    for title, key in [
        ("Most Race Wins", "wins"),
        ("Most Pole Positions", "poles"),
        ("Most Podium Finishes", "podiums"),
        ("Most Fastest Laps", "fastestLaps"),
        ("Most Championships", "championships"),
        ("Most Race Entries", "races"),
        ("Most Career Points", "points"),
    ]:
        records.append({
            "category": "drivers",
            "title": title,
            "entries": top_entries(detailed_drivers, lambda d, k=key: d["stats"][k]),
        })

    # Win rate (min 50 races)
    records.append({
        "category": "drivers",
        "title": "Highest Win Rate (min 50 races)",
        "entries": top_entries(
            [d for d in detailed_drivers if d["stats"]["races"] >= 50],
            lambda d: d["stats"]["winRate"],
        ),
    })

    # Constructor records
    for title, key in [
        ("Most Constructor Wins", "wins"),
        ("Most Constructor Championships", "championships"),
        ("Most Constructor Pole Positions", "poles"),
        ("Most Constructor Podiums", "podiums"),
        ("Most Constructor Race Entries", "races"),
    ]:
        records.append({
            "category": "constructors",
            "title": title,
            "entries": top_entries(detailed_teams, lambda t, k=key: t["stats"][k], id_field="teamId"),
        })

    return records


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    global request_count
    start_time = time.time()

    print("=" * 60, flush=True)
    print("The Paddock - F1 Data Pipeline", flush=True)
    print("=" * 60, flush=True)
    print(f"Seasons: {SEASON_START}-{SEASON_END}", flush=True)
    print(f"Cache: {CACHE_DIR}", flush=True)
    print(f"Output: {DATA_DIR}", flush=True)
    print(flush=True)

    # Ensure directories
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    SEASON_DIR.mkdir(parents=True, exist_ok=True)
    CACHE_DIR.mkdir(parents=True, exist_ok=True)

    # Phase 1: Fetch all season data (this is the bulk of API calls)
    seasons = fetch_all_seasons()

    # Phase 2: Compute stats from season data, then fetch entity lists
    print("\n  Computing driver stats from season data...", flush=True)
    driver_stats = build_driver_stats_from_seasons(seasons)
    print(f"  Found stats for {len(driver_stats)} drivers", flush=True)

    print("  Computing team stats from season data...", flush=True)
    team_stats = build_team_stats_from_seasons(seasons)
    print(f"  Found stats for {len(team_stats)} teams", flush=True)

    drivers = fetch_drivers(driver_stats)
    write_json(DATA_DIR / "drivers.json", drivers)
    detailed_d = sum(1 for d in drivers if d.get("stats"))
    print(f"  Wrote {len(drivers)} drivers ({detailed_d} with stats)", flush=True)

    teams = fetch_teams(team_stats)
    write_json(DATA_DIR / "teams.json", teams)
    detailed_t = sum(1 for t in teams if t.get("stats"))
    print(f"  Wrote {len(teams)} teams ({detailed_t} with stats)", flush=True)

    # Phase 3: Circuits (derived from season data, only needs list from API)
    circuits = fetch_circuits(seasons)
    write_json(DATA_DIR / "circuits.json", circuits)
    print(f"  Wrote {len(circuits)} circuits", flush=True)

    # Phase 4: Records
    records = compute_records(drivers, teams)
    write_json(DATA_DIR / "records.json", records)
    print(f"  Wrote {len(records)} record categories", flush=True)

    # Summary
    elapsed = time.time() - start_time
    minutes = int(elapsed // 60)
    seconds = int(elapsed % 60)
    total_seasons = SEASON_END - SEASON_START + 1

    print(flush=True)
    print("=" * 60, flush=True)
    print("DONE!", flush=True)
    print(f"  API requests: {request_count}", flush=True)
    print(f"  Time: {minutes}m {seconds}s", flush=True)
    print(f"  Drivers: {len(drivers)} ({detailed_d} with stats)", flush=True)
    print(f"  Teams: {len(teams)} ({detailed_t} with stats)", flush=True)
    print(f"  Circuits: {len(circuits)}", flush=True)
    print(f"  Seasons: {total_seasons}", flush=True)
    print(f"  Records: {len(records)} categories", flush=True)
    print("=" * 60, flush=True)


if __name__ == "__main__":
    main()
