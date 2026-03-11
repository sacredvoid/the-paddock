#!/usr/bin/env python3
"""
Fetch visual assets for The Paddock:
1. Circuit track SVGs from f1db GitHub repo
2. Driver headshot URL mappings from OpenF1 API
3. Team logo URL mappings via logo.dev
"""

import json
import time
from pathlib import Path

import requests

DATA_DIR = Path(__file__).parent.parent / "data"
PUBLIC_DIR = Path(__file__).parent.parent / "public"
CIRCUITS_SVG_DIR = PUBLIC_DIR / "circuits"
F1DB_DIR = Path(__file__).parent / "f1db"

# ---------------------------------------------------------------------------
# 1. Circuit Track SVGs
# ---------------------------------------------------------------------------

def fetch_circuit_svgs():
    """Download the latest layout SVG for each circuit from f1db repo."""
    print("=== Fetching circuit SVGs ===", flush=True)
    CIRCUITS_SVG_DIR.mkdir(parents=True, exist_ok=True)

    # Load layouts to find the latest layout for each circuit
    layouts = json.load(open(F1DB_DIR / "f1db-circuits-layouts.json"))

    # Group by circuit, keep the latest (highest numbered) layout
    latest_layouts: dict[str, str] = {}
    for layout in layouts:
        cid = layout["circuitId"]
        lid = layout["id"]
        if cid not in latest_layouts or lid > latest_layouts[cid]:
            latest_layouts[cid] = lid

    # Download white-outline SVGs from f1db repo
    base_url = "https://raw.githubusercontent.com/f1db/f1db/main/src/assets/circuits/white-outline"

    downloaded = 0
    skipped = 0
    failed = 0

    for circuit_id, layout_id in sorted(latest_layouts.items()):
        svg_path = CIRCUITS_SVG_DIR / f"{circuit_id}.svg"

        if svg_path.exists():
            skipped += 1
            continue

        url = f"{base_url}/{layout_id}.svg"
        try:
            resp = requests.get(url, timeout=15)
            if resp.status_code == 200:
                svg_path.write_text(resp.text)
                downloaded += 1
                print(f"  Downloaded: {circuit_id} ({layout_id})", flush=True)
            else:
                print(f"  Failed ({resp.status_code}): {circuit_id} ({layout_id})", flush=True)
                failed += 1
        except Exception as e:
            print(f"  Error: {circuit_id} - {e}", flush=True)
            failed += 1

        time.sleep(0.1)  # Be nice to GitHub

    print(f"  Downloaded: {downloaded}, Skipped: {skipped}, Failed: {failed}", flush=True)


# ---------------------------------------------------------------------------
# 2. Driver Headshot URLs
# ---------------------------------------------------------------------------

def fetch_driver_headshots():
    """Fetch driver headshot URLs from OpenF1 API."""
    print("\n=== Fetching driver headshots ===", flush=True)

    # Fetch from multiple recent sessions to get all drivers
    # Use a known 2025 session and 2024 sessions for broader coverage
    all_drivers: dict[str, dict] = {}

    for session_key in ["latest", "9158", "9574"]:
        try:
            url = f"https://api.openf1.org/v1/drivers?session_key={session_key}"
            resp = requests.get(url, timeout=15)
            if resp.status_code == 200:
                drivers = resp.json()
                for d in drivers:
                    name = d.get("full_name", "")
                    headshot = d.get("headshot_url", "")
                    if name and headshot:
                        # Create a slug-like key for matching
                        key = name.lower().replace(" ", "-")
                        all_drivers[key] = {
                            "fullName": d.get("full_name", ""),
                            "nameAcronym": d.get("name_acronym", ""),
                            "driverNumber": d.get("driver_number"),
                            "headshotUrl": headshot.replace("/1col/", "/2col-retina/"),
                            "teamName": d.get("team_name", ""),
                            "teamColour": d.get("team_colour", ""),
                            "countryCode": d.get("country_code", ""),
                        }
        except Exception as e:
            print(f"  Error fetching session {session_key}: {e}", flush=True)

    # Also build a mapping by driver number and acronym for easier matching
    # Load our driver data to create the mapping
    our_drivers = json.load(open(DATA_DIR / "drivers.json"))

    headshot_map: dict[str, str] = {}

    for our_driver in our_drivers:
        did = our_driver["id"]
        code = our_driver.get("code", "").upper()
        number = our_driver.get("number", 0)
        first = our_driver.get("firstName", "").upper()
        last = our_driver.get("lastName", "").upper()

        # Try to match by full name, then by acronym
        matched = False
        for key, openf1_driver in all_drivers.items():
            openf1_name = openf1_driver["fullName"].upper()
            openf1_code = openf1_driver["nameAcronym"].upper()
            openf1_num = openf1_driver.get("driverNumber")

            if (code and code == openf1_code) or \
               (number and number == openf1_num) or \
               (last in openf1_name and first[:3] in openf1_name):
                headshot_map[did] = openf1_driver["headshotUrl"]
                matched = True
                break

    print(f"  Matched {len(headshot_map)} driver headshots out of {len(our_drivers)} drivers", flush=True)

    # Write the mapping
    write_json(DATA_DIR / "driver-images.json", headshot_map)
    print(f"  Wrote driver-images.json", flush=True)


# ---------------------------------------------------------------------------
# 3. Team Logo URLs
# ---------------------------------------------------------------------------

def build_team_logos():
    """Create team logo URL mappings using logo.dev API."""
    print("\n=== Building team logo URLs ===", flush=True)

    LOGO_TOKEN = "pk_EGtpgpUgRZmFBbUBnNgl5A"

    # Map team IDs to their official website domains
    team_domains: dict[str, str] = {
        "red-bull": "redbullracing.com",
        "mercedes": "mercedesamgf1.com",
        "ferrari": "ferrari.com",
        "mclaren": "mclaren.com",
        "aston-martin": "astonmartinf1.com",
        "alpine": "alpinecars.com",
        "williams": "williamsf1.com",
        "racing-bulls": "visacashapprb.com",
        "kick-sauber": "sfracing.com",
        "haas": "haasf1team.com",
        "cadillac": "cadillac.com",
        "audi": "audi.com",
        # Recent historic
        "rb": "visacashapprb.com",
        "alphatauri": "scuderiaalphatauri.com",
        "toro-rosso": "redbull.com",
        "racing-point": "astonmartinf1.com",
        "force-india": "astonmartinf1.com",
        "alfa-romeo": "alfaromeo.com",
        "sauber": "sfracing.com",
        "renault": "renault.com",
        # Classic teams with recognizable brands
        "lotus": "lotuscars.com",
        "brabham": "brabham.com",
        "benetton": "benetton.com",
        "brawn": "mercedesamgf1.com",
        "jordan": "jordangrandprix.com",
        "jaguar": "jaguar.com",
        "toyota": "toyota.com",
        "honda": "honda.com",
        "prost": "prost.com",
    }

    logo_map: dict[str, str] = {}
    for team_id, domain in team_domains.items():
        logo_map[team_id] = f"https://img.logo.dev/{domain}?token={LOGO_TOKEN}&format=png"

    write_json(DATA_DIR / "team-logos.json", logo_map)
    print(f"  Created logo URLs for {len(logo_map)} teams", flush=True)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def write_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w") as f:
        json.dump(data, f, indent=2)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    print("=" * 60, flush=True)
    print("The Paddock - Asset Fetcher", flush=True)
    print("=" * 60, flush=True)

    fetch_circuit_svgs()
    fetch_driver_headshots()
    build_team_logos()

    print("\n" + "=" * 60, flush=True)
    print("DONE!", flush=True)
    print("=" * 60, flush=True)


if __name__ == "__main__":
    main()
