#!/usr/bin/env python3
"""
Transform F1DB JSON data into The Paddock's data format.

F1DB (https://github.com/f1db/f1db) provides comprehensive F1 data from 1950
to present. This script reads the split JSON files and produces the data/*.json
files that Next.js consumes at build time.

No API calls needed - everything comes from the downloaded F1DB release.
"""

import json
from collections import defaultdict
from pathlib import Path

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

F1DB_DIR = Path(__file__).parent / "f1db"
DATA_DIR = Path(__file__).parent.parent / "data"
SEASON_DIR = DATA_DIR / "seasons"

# Season range for detailed season pages (race-by-race data)
SEASON_START = 1950
SEASON_END = 2026

# Team colors for UI display
TEAM_COLORS: dict[str, str] = {
    "red-bull": "#3671C6",
    "mercedes": "#27F4D2",
    "ferrari": "#E8002D",
    "mclaren": "#FF8000",
    "aston-martin": "#229971",
    "alpine": "#FF87BC",
    "williams": "#64C4FF",
    "rb": "#6692FF",
    "racing-bulls": "#6692FF",
    "kick-sauber": "#52E252",
    "haas": "#B6BABD",
    "lotus": "#FFB800",
    "brabham": "#00783E",
    "tyrrell": "#0044AA",
    "benetton": "#00A550",
    "brawn": "#B5F500",
    "jordan": "#FFC700",
    "force-india": "#F596C8",
    "racing-point": "#F596C8",
    "toro-rosso": "#469BFF",
    "alphatauri": "#4E7C9B",
    "renault": "#FFF500",
    "minardi": "#000000",
    "caterham": "#005030",
    "marussia": "#6E0000",
    "manor": "#ED1C24",
    "sauber": "#006EFF",
    "alfa-romeo": "#A50F2D",
    "cadillac": "#C0C0C0",
    "audi": "#000000",
    "honda": "#E40521",
    "bar": "#FFFFFF",
    "jaguar": "#006633",
    "toyota": "#CC0000",
    "super-aguri": "#FFFFFF",
    "hrt": "#968C6D",
    "virgin": "#C82E37",
    "spyker": "#FF6600",
    "midland": "#FF4500",
    "prost": "#0055A4",
    "arrows": "#FF8C00",
    "stewart": "#FFFFFF",
    "lola": "#009900",
    "footwork": "#0000CD",
    "simtek": "#800080",
    "pacific": "#228B22",
    "larrousse": "#FFD700",
    "andrea-moda": "#006400",
    "fondmetal": "#4169E1",
    "dallara": "#DC143C",
    "leyton-house": "#20B2AA",
    "osella": "#FF6347",
    "rial": "#4682B4",
    "eurobrun": "#2F4F4F",
    "coloni": "#F0E68C",
    "life": "#808080",
    "ago": "#708090",
    "onyx": "#800000",
    "zakspeed": "#696969",
    "ligier": "#0000FF",
    "march": "#800080",
    "ags": "#9932CC",
    "dallara-f1": "#FF1493",
    "cooper": "#009B3A",
    "brm": "#006B3F",
    "vanwall": "#006400",
    "maserati": "#B22222",
    "honda-rbpt": "#E40521",
    "alpine-renault": "#FF87BC",
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def load_f1db(name: str) -> list[dict]:
    path = F1DB_DIR / f"f1db-{name}.json"
    with open(path) as f:
        return json.load(f)


def write_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w") as f:
        json.dump(data, f, indent=2)


def slugify(text: str) -> str:
    return text.lower().replace(" ", "-").replace(".", "").replace("'", "")


# ---------------------------------------------------------------------------
# Build countries lookup
# ---------------------------------------------------------------------------

def build_country_lookup() -> dict[str, dict]:
    countries = load_f1db("countries")
    return {c["id"]: c for c in countries}


# ---------------------------------------------------------------------------
# Drivers
# ---------------------------------------------------------------------------

def build_drivers(country_lookup: dict) -> list[dict]:
    print("Building drivers...", flush=True)
    raw_drivers = load_f1db("drivers")
    race_results = load_f1db("races-race-results")
    fastest_laps = load_f1db("races-fastest-laps")
    season_driver_standings = load_f1db("seasons-driver-standings")

    # Count fastest laps (position 1) per driver
    fl_counts: dict[str, int] = defaultdict(int)
    for fl in fastest_laps:
        if fl.get("positionNumber") == 1:
            fl_counts[fl["driverId"]] += 1

    # Figure out which seasons each driver raced in
    driver_seasons: dict[str, set] = defaultdict(set)
    for rr in race_results:
        did = rr.get("driverId", "")
        if did and rr.get("year"):
            driver_seasons[did].add(rr["year"])

    # Compute per-driver stats from race results for dnfs, avg finish, best finish
    driver_race_stats: dict[str, dict] = defaultdict(lambda: {
        "dnfs": 0, "totalFinishPos": 0, "finishedRaces": 0, "bestFinish": 999,
    })
    for rr in race_results:
        did = rr.get("driverId", "")
        if not did:
            continue
        s = driver_race_stats[did]
        pos = rr.get("positionNumber")
        status = rr.get("positionText", "")

        if pos and pos > 0:
            if pos < s["bestFinish"]:
                s["bestFinish"] = pos
            s["totalFinishPos"] += pos
            s["finishedRaces"] += 1
        elif status in ("DNF", "DSQ", "DNS", "DNQ", "EX", "NC"):
            s["dnfs"] += 1

    # Build driver list
    drivers = []
    for d in raw_drivers:
        did = d["id"]
        total_races = d.get("totalRaceStarts", 0) or d.get("totalRaceEntries", 0) or 0
        wins = d.get("totalRaceWins", 0) or 0
        podiums = d.get("totalPodiums", 0) or 0
        poles = d.get("totalPolePositions", 0) or 0
        fl = fl_counts.get(did, 0)
        championships = d.get("totalChampionshipWins", 0) or 0
        points = d.get("totalChampionshipPoints", 0) or d.get("totalPoints", 0) or 0

        rs = driver_race_stats.get(did, {})
        dnfs = rs.get("dnfs", 0)
        finished = rs.get("finishedRaces", 0)
        best = rs.get("bestFinish", 999)

        seasons = sorted(driver_seasons.get(did, set()))
        is_active = any(s >= 2025 for s in seasons)

        nationality = ""
        nat_id = d.get("nationalityCountryId", "")
        if nat_id and nat_id in country_lookup:
            nationality = country_lookup[nat_id].get("demonym", "") or country_lookup[nat_id].get("name", "")

        # Skip drivers with zero race starts (test/Friday drivers only)
        if total_races == 0 and not seasons:
            continue

        stats = {
            "championships": championships,
            "wins": wins,
            "podiums": podiums,
            "poles": poles,
            "fastestLaps": fl,
            "races": total_races,
            "points": points,
            "dnfs": dnfs,
            "winRate": round(wins / total_races, 3) if total_races > 0 else 0,
            "podiumRate": round(podiums / total_races, 3) if total_races > 0 else 0,
            "averageFinish": round(rs["totalFinishPos"] / finished, 1) if finished > 0 else 0,
            "bestFinish": best if best < 999 else 0,
        }

        drivers.append({
            "id": did,
            "slug": slugify(f"{d.get('firstName', '')} {d.get('lastName', '')}"),
            "firstName": d.get("firstName", ""),
            "lastName": d.get("lastName", ""),
            "nationality": nationality,
            "dateOfBirth": d.get("dateOfBirth", ""),
            "number": d.get("permanentNumber") or 0,
            "code": d.get("abbreviation", ""),
            "isActive": is_active,
            "stats": stats,
            "seasons": seasons,
        })

    # Sort: most wins first, then by last name
    drivers.sort(key=lambda x: (-(x["stats"]["wins"]), x["lastName"]))
    print(f"  {len(drivers)} drivers", flush=True)
    return drivers


# ---------------------------------------------------------------------------
# Teams (Constructors)
# ---------------------------------------------------------------------------

def build_teams(country_lookup: dict) -> list[dict]:
    print("Building teams...", flush=True)
    raw = load_f1db("constructors")
    race_results = load_f1db("races-race-results")
    season_standings = load_f1db("seasons-constructor-standings")

    # Compute per-team season range and pole counts from race results
    team_seasons: dict[str, set] = defaultdict(set)
    team_poles: dict[str, int] = defaultdict(int)
    team_race_keys: dict[str, set] = defaultdict(set)

    # Get starting grid for pole positions
    starting_grid = load_f1db("races-starting-grid-positions")
    for sg in starting_grid:
        if sg.get("positionNumber") == 1:
            team_poles[sg.get("constructorId", "")] += 1

    for rr in race_results:
        cid = rr.get("constructorId", "")
        if cid and rr.get("year"):
            team_seasons[cid].add(rr["year"])
            team_race_keys[cid].add(f"{rr['year']}-{rr['round']}")

    # Count championships from season standings
    team_championships: dict[str, int] = defaultdict(int)
    for s in season_standings:
        if s.get("championshipWon"):
            team_championships[s["constructorId"]] += 1

    teams = []
    for c in raw:
        cid = c["id"]
        seasons = sorted(team_seasons.get(cid, set()))
        if not seasons:
            continue

        nationality = ""
        country_id = c.get("countryId", "")
        if country_id and country_id in country_lookup:
            nationality = country_lookup[country_id].get("demonym", "") or country_lookup[country_id].get("name", "")

        color = TEAM_COLORS.get(cid, "#888888")
        is_active = any(s >= 2025 for s in seasons)

        stats = {
            "championships": team_championships.get(cid, 0),
            "wins": c.get("totalRaceWins", 0) or 0,
            "poles": team_poles.get(cid, 0),
            "podiums": c.get("totalPodiums", 0) or 0,
            "races": len(team_race_keys.get(cid, set())),
            "points": c.get("totalChampionshipPoints", 0) or c.get("totalPoints", 0) or 0,
            "firstEntry": seasons[0] if seasons else 0,
            "lastEntry": seasons[-1] if seasons else 0,
        }

        teams.append({
            "id": cid,
            "slug": slugify(c.get("name", "")),
            "name": c.get("name", ""),
            "nationality": nationality,
            "color": color,
            "isActive": is_active,
            "stats": stats,
        })

    teams.sort(key=lambda t: (-(t["stats"]["wins"]), t["name"]))
    print(f"  {len(teams)} teams", flush=True)
    return teams


# ---------------------------------------------------------------------------
# Circuits
# ---------------------------------------------------------------------------

def build_circuits(country_lookup: dict) -> list[dict]:
    print("Building circuits...", flush=True)
    raw = load_f1db("circuits")

    circuits = []
    for c in raw:
        country_id = c.get("countryId", "")
        country_name = country_lookup.get(country_id, {}).get("name", "") if country_id else ""

        circuits.append({
            "id": c["id"],
            "slug": slugify(c.get("name", "")),
            "name": c.get("fullName", c.get("name", "")),
            "country": country_name,
            "city": c.get("placeName", ""),
            "lat": c.get("latitude", 0) or 0,
            "lng": c.get("longitude", 0) or 0,
            "totalRaces": c.get("totalRacesHeld", 0) or 0,
        })

    circuits.sort(key=lambda x: -x["totalRaces"])
    print(f"  {len(circuits)} circuits", flush=True)
    return circuits


# ---------------------------------------------------------------------------
# Seasons (with race data)
# ---------------------------------------------------------------------------

def build_seasons(country_lookup: dict) -> dict[int, dict]:
    print("Building seasons...", flush=True)
    races = load_f1db("races")
    race_results = load_f1db("races-race-results")
    qualifying_results = load_f1db("races-qualifying-results")
    pit_stops = load_f1db("races-pit-stops")
    season_driver_standings = load_f1db("seasons-driver-standings")
    season_constructor_standings = load_f1db("seasons-constructor-standings")
    grands_prix = load_f1db("grands-prix")
    starting_grid = load_f1db("races-starting-grid-positions")

    gp_lookup = {gp["id"]: gp for gp in grands_prix}

    # Index race results by (year, round)
    results_idx: dict[tuple, list] = defaultdict(list)
    for rr in race_results:
        results_idx[(rr["year"], rr["round"])].append(rr)

    # Index qualifying by (year, round)
    quali_idx: dict[tuple, list] = defaultdict(list)
    for qr in qualifying_results:
        quali_idx[(qr["year"], qr["round"])].append(qr)

    # Index pit stops by (year, round)
    pits_idx: dict[tuple, list] = defaultdict(list)
    for ps in pit_stops:
        pits_idx[(ps["year"], ps["round"])].append(ps)

    # Index starting grid by (year, round) for grid positions
    grid_idx: dict[tuple, dict] = defaultdict(dict)
    for sg in starting_grid:
        grid_idx[(sg["year"], sg["round"])][sg.get("driverId", "")] = sg.get("positionNumber", 0) or 0

    # Build seasons
    seasons: dict[int, dict] = {}

    for race in races:
        year = race["year"]
        if year < SEASON_START or year > SEASON_END:
            continue

        rnd = race["round"]
        key = (year, rnd)

        gp = gp_lookup.get(race.get("grandPrixId", ""), {})
        race_name = gp.get("fullName", gp.get("name", f"Round {rnd}"))

        # Build race results
        race_res = []
        for rr in sorted(results_idx.get(key, []), key=lambda x: x.get("positionDisplayOrder", 999)):
            pos = rr.get("positionNumber") or 0
            status_text = rr.get("positionText", "")
            if status_text in ("DNF", "DSQ", "DNS", "DNQ", "EX", "NC"):
                status = status_text
            elif pos > 0:
                status = "Finished"
            else:
                status = status_text or "Unknown"

            # Format time
            time_str = ""
            if rr.get("time"):
                time_str = rr["time"]
            elif rr.get("gap"):
                time_str = rr["gap"]

            grid_pos = grid_idx.get(key, {}).get(rr.get("driverId", ""), 0)

            race_res.append({
                "position": pos,
                "driverId": rr.get("driverId", ""),
                "teamId": rr.get("constructorId", ""),
                "grid": grid_pos,
                "laps": rr.get("laps") or 0,
                "status": status,
                "points": rr.get("points") or 0,
                "time": time_str,
            })

        # Build qualifying results
        quali_res = []
        for qr in sorted(quali_idx.get(key, []), key=lambda x: x.get("positionDisplayOrder", 999)):
            quali_res.append({
                "position": qr.get("positionNumber") or 0,
                "driverId": qr.get("driverId", ""),
                "teamId": qr.get("constructorId", ""),
                "q1": qr.get("q1", "") or "",
                "q2": qr.get("q2", "") or "",
                "q3": qr.get("q3", "") or "",
            })

        # Build pit stops
        pit_data = []
        for ps in sorted(pits_idx.get(key, []), key=lambda x: (x.get("driverId", ""), x.get("stop", 0))):
            time_str = ""
            if ps.get("timeMillis"):
                secs = ps["timeMillis"] / 1000
                time_str = f"{secs:.3f}"
            elif ps.get("time"):
                time_str = ps["time"]

            pit_data.append({
                "driverId": ps.get("driverId", ""),
                "lap": ps.get("lap") or 0,
                "stop": ps.get("stop") or 0,
                "duration": time_str,
                "time": "",
            })

        race_entry = {
            "round": rnd,
            "name": race_name,
            "circuitId": race.get("circuitId", ""),
            "date": race.get("date", ""),
            "results": race_res,
        }
        if quali_res:
            race_entry["qualifying"] = quali_res
        if pit_data:
            race_entry["pitStops"] = pit_data

        if year not in seasons:
            seasons[year] = {
                "year": year,
                "champion": None,
                "constructorChampion": None,
                "races": [],
                "driverStandings": [],
                "constructorStandings": [],
            }
        seasons[year]["races"].append(race_entry)

    # Sort races within each season
    for year in seasons:
        seasons[year]["races"].sort(key=lambda r: r["round"])

    # Add driver standings
    for s in season_driver_standings:
        year = s["year"]
        if year not in seasons:
            continue
        seasons[year]["driverStandings"].append({
            "position": s.get("positionNumber") or 0,
            "id": s.get("driverId", ""),
            "points": s.get("points") or 0,
            "wins": 0,  # Not in season standings, computed below
        })
        if s.get("championshipWon"):
            seasons[year]["champion"] = {"driverId": s["driverId"], "teamId": ""}

    # Sort driver standings
    for year in seasons:
        seasons[year]["driverStandings"].sort(key=lambda x: x["position"] if x["position"] > 0 else 999)

    # Compute wins per driver per season from race results
    for year, season in seasons.items():
        driver_wins: dict[str, int] = defaultdict(int)
        for race in season["races"]:
            for r in race["results"]:
                if r["position"] == 1:
                    driver_wins[r["driverId"]] += 1
                    # Set champion's team
                    if season["champion"] and season["champion"]["driverId"] == r["driverId"]:
                        season["champion"]["teamId"] = r["teamId"]
        for ds in season["driverStandings"]:
            ds["wins"] = driver_wins.get(ds["id"], 0)

    # Add constructor standings
    for s in season_constructor_standings:
        year = s["year"]
        if year not in seasons:
            continue
        seasons[year]["constructorStandings"].append({
            "position": s.get("positionNumber") or 0,
            "id": s.get("constructorId", ""),
            "points": s.get("points") or 0,
            "wins": 0,
        })
        if s.get("championshipWon"):
            seasons[year]["constructorChampion"] = {"teamId": s["constructorId"]}

    # Sort constructor standings
    for year in seasons:
        seasons[year]["constructorStandings"].sort(key=lambda x: x["position"] if x["position"] > 0 else 999)

    # Compute constructor wins per season
    for year, season in seasons.items():
        team_wins: dict[str, int] = defaultdict(int)
        for race in season["races"]:
            for r in race["results"]:
                if r["position"] == 1:
                    team_wins[r["teamId"]] += 1
        for cs in season["constructorStandings"]:
            cs["wins"] = team_wins.get(cs["id"], 0)

    print(f"  {len(seasons)} seasons ({min(seasons.keys())}-{max(seasons.keys())})", flush=True)
    return seasons


# ---------------------------------------------------------------------------
# Records
# ---------------------------------------------------------------------------

def compute_records(drivers: list[dict], teams: list[dict]) -> list[dict]:
    print("Computing records...", flush=True)
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

    print(f"  {len(records)} record categories", flush=True)
    return records


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    print("=" * 60, flush=True)
    print("The Paddock - F1DB Data Transform", flush=True)
    print("=" * 60, flush=True)

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    SEASON_DIR.mkdir(parents=True, exist_ok=True)

    country_lookup = build_country_lookup()

    drivers = build_drivers(country_lookup)
    write_json(DATA_DIR / "drivers.json", drivers)

    teams = build_teams(country_lookup)
    write_json(DATA_DIR / "teams.json", teams)

    circuits = build_circuits(country_lookup)
    write_json(DATA_DIR / "circuits.json", circuits)

    seasons = build_seasons(country_lookup)
    for year, season_data in seasons.items():
        write_json(SEASON_DIR / f"{year}.json", season_data)

    records = compute_records(drivers, teams)
    write_json(DATA_DIR / "records.json", records)

    # Summary
    total_races = sum(len(s["races"]) for s in seasons.values())
    print(flush=True)
    print("=" * 60, flush=True)
    print("DONE!", flush=True)
    print(f"  Drivers: {len(drivers)}", flush=True)
    print(f"  Teams: {len(teams)}", flush=True)
    print(f"  Circuits: {len(circuits)}", flush=True)
    print(f"  Seasons: {len(seasons)}", flush=True)
    print(f"  Total races: {total_races}", flush=True)
    print(f"  Records: {len(records)} categories", flush=True)
    print("=" * 60, flush=True)


if __name__ == "__main__":
    main()
