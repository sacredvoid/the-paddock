#!/usr/bin/env python3
"""
Train an XGBoost race-finish-position predictor using historical F1 data (2014-2025).

Features:
  - grid_position: qualifying grid slot (1-20)
  - constructor_strength: constructor championship points at time of race, normalised 0-1
  - driver_form: rolling 5-race average finish position
  - driver_circuit_history: average finish at this circuit from prior years
  - teammate_quali_gap: qualifying time delta to teammate (seconds, 0 if unavailable)
  - circuit_type: categorical encoding (street=0, mixed=1, high_speed=2)
  - is_wet: binary flag (default 0 - weather data not available in dataset)

Target: finishing position clipped to 1-20.

Outputs:
  - public/models/race-predictor.onnx
  - public/models/model-metadata.json
"""

from __future__ import annotations

import json
import os
import re
import sys
from collections import defaultdict
from pathlib import Path
from typing import Any

import numpy as np
from sklearn.model_selection import TimeSeriesSplit
from sklearn.metrics import mean_absolute_error, mean_squared_error

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

SEASONS_DIR = Path(__file__).resolve().parent.parent / "data" / "seasons"
OUTPUT_DIR = Path(__file__).resolve().parent.parent / "public" / "models"
YEARS = range(2014, 2026)  # 2014 through 2025 inclusive

# Circuit type mapping: street=0, mixed=1, high_speed=2
CIRCUIT_TYPE_MAP: dict[str, int] = {
    # Street circuits
    "monaco": 0,
    "marina-bay": 0,
    "baku": 0,
    "jeddah": 0,
    "las-vegas": 0,
    "miami": 0,
    # Mixed circuits
    "melbourne": 1,
    "hungaroring": 1,
    "zandvoort": 1,
    "montreal": 1,
    "mexico-city": 1,
    "interlagos": 1,
    "austin": 1,
    "imola": 1,
    "istanbul": 1,
    "portimao": 1,
    "mugello": 1,
    "nurburgring": 1,
    "sochi": 1,
    "shanghai": 1,
    "sepang": 1,
    "yas-marina": 1,
    "lusail": 1,
    "paul-ricard": 1,
    # High-speed circuits
    "monza": 2,
    "spa-francorchamps": 2,
    "silverstone": 2,
    "spielberg": 2,
    "suzuka": 2,
    "bahrain": 2,
    "catalunya": 2,
    "hockenheimring": 2,
}

FEATURE_NAMES = [
    "grid_position",
    "constructor_strength",
    "driver_form",
    "driver_circuit_history",
    "teammate_quali_gap",
    "circuit_type",
    "is_wet",
    "driver_championship_pos",
]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def parse_laptime(s: str | None) -> float | None:
    """Convert a lap-time string like '1:29.374' to seconds. Returns None on failure."""
    if not s:
        return None
    m = re.match(r"^(\d+):(\d+\.\d+)$", s.strip())
    if not m:
        return None
    return int(m.group(1)) * 60 + float(m.group(2))


def best_quali_time(entry: dict[str, Any]) -> float | None:
    """Return the best qualifying time (in seconds) for a qualifying entry."""
    times: list[float] = []
    for session in ("q3", "q2", "q1"):
        t = parse_laptime(entry.get(session, ""))
        if t is not None:
            times.append(t)
    return min(times) if times else None


def load_season(year: int) -> dict[str, Any] | None:
    """Load a season JSON file. Returns None if file is missing."""
    path = SEASONS_DIR / f"{year}.json"
    if not path.exists():
        return None
    with open(path) as f:
        return json.load(f)


# ---------------------------------------------------------------------------
# Feature engineering
# ---------------------------------------------------------------------------


def build_dataset() -> tuple[np.ndarray, np.ndarray, list[dict[str, Any]]]:
    """
    Walk every race from 2014 to 2025 and produce (X, y, metadata_rows).

    metadata_rows stores per-sample info (year, round, driverId, circuitId) for
    diagnostics; it is not used in training.
    """

    # Accumulators for rolling / historical features
    # driver_form_history[driverId] = list of recent finish positions (most recent last)
    driver_form_history: dict[str, list[int]] = defaultdict(list)
    # circuit_history[(driverId, circuitId)] = list of finishes at this circuit
    circuit_history: dict[tuple[str, str], list[int]] = defaultdict(list)
    # constructor_points[year][teamId] = cumulative points so far this season
    constructor_points: dict[int, dict[str, float]] = defaultdict(lambda: defaultdict(float))
    # driver_points[year][driverId] = cumulative points so far this season
    driver_points: dict[int, dict[str, float]] = defaultdict(lambda: defaultdict(float))

    X_rows: list[list[float]] = []
    y_rows: list[float] = []
    meta_rows: list[dict[str, Any]] = []

    for year in YEARS:
        season = load_season(year)
        if season is None:
            print(f"  [WARN] Season file for {year} not found, skipping.")
            continue

        races = season.get("races", [])
        print(f"  {year}: {len(races)} races")

        for race in races:
            round_num = race.get("round", 0)
            circuit_id = race.get("circuitId", "unknown")
            results = race.get("results", [])
            qualifying = race.get("qualifying", [])

            # Build a lookup: driverId -> qualifying entry
            quali_lookup: dict[str, dict[str, Any]] = {}
            for qe in qualifying:
                quali_lookup[qe["driverId"]] = qe

            # Build a lookup: teamId -> list of (driverId, best_quali_time)
            team_quali: dict[str, list[tuple[str, float | None]]] = defaultdict(list)
            for qe in qualifying:
                team_quali[qe["teamId"]].append((qe["driverId"], best_quali_time(qe)))

            # Max constructor points this season so far (for normalisation)
            max_cp = max(constructor_points[year].values()) if constructor_points[year] else 1.0
            if max_cp == 0:
                max_cp = 1.0

            for res in results:
                driver_id = res.get("driverId", "unknown")
                team_id = res.get("teamId", "unknown")
                finish_pos = res.get("position")
                grid_pos = res.get("grid")

                if finish_pos is None or grid_pos is None:
                    continue

                # Clip positions to 1-20
                finish_pos = int(max(1, min(20, finish_pos)))
                grid_pos = int(max(1, min(20, grid_pos)))

                # -- Feature: constructor_strength (normalised 0-1) --
                raw_cp = constructor_points[year].get(team_id, 0.0)
                constructor_strength = raw_cp / max_cp

                # -- Feature: driver_form (exponentially weighted 5-race avg finish) --
                recent = driver_form_history[driver_id][-5:]
                if recent:
                    weights = np.array([0.1, 0.15, 0.2, 0.25, 0.3][-len(recent):])
                    weights = weights / weights.sum()
                    driver_form = float(np.average(recent, weights=weights))
                else:
                    driver_form = 10.0  # neutral default

                # -- Feature: driver_circuit_history --
                hist = circuit_history.get((driver_id, circuit_id), [])
                driver_circuit_hist = float(np.mean(hist)) if hist else 10.0

                # -- Feature: teammate_quali_gap --
                teammate_gap = 0.0
                driver_best = None
                teammate_best = None
                for d_id, t in team_quali.get(team_id, []):
                    if d_id == driver_id:
                        driver_best = t
                    else:
                        # In case of more than 2 drivers per team (rare), take
                        # the first teammate found.
                        if teammate_best is None:
                            teammate_best = t
                if driver_best is not None and teammate_best is not None:
                    teammate_gap = driver_best - teammate_best  # positive = slower

                # -- Feature: circuit_type --
                circuit_type = CIRCUIT_TYPE_MAP.get(circuit_id, 1)  # default mixed

                # -- Feature: is_wet (always 0, no weather data) --
                is_wet = 0

                # -- Feature: driver_championship_pos (current WDC standing, normalised 0-1) --
                dp = driver_points[year]
                if dp:
                    sorted_drivers = sorted(dp.items(), key=lambda x: -x[1])
                    pos = next((i + 1 for i, (d, _) in enumerate(sorted_drivers) if d == driver_id), 10)
                    total_drivers = len(sorted_drivers)
                    driver_champ_pos = pos / max(total_drivers, 1)
                else:
                    driver_champ_pos = 0.5  # neutral for first race of season

                X_rows.append([
                    float(grid_pos),
                    constructor_strength,
                    driver_form,
                    driver_circuit_hist,
                    teammate_gap,
                    float(circuit_type),
                    float(is_wet),
                    float(driver_champ_pos),
                ])
                y_rows.append(float(finish_pos))
                meta_rows.append({
                    "year": year,
                    "round": round_num,
                    "driverId": driver_id,
                    "circuitId": circuit_id,
                })

            # ---- Post-race updates (after features are computed for this race) ----
            for res in results:
                driver_id = res.get("driverId", "unknown")
                team_id = res.get("teamId", "unknown")
                finish_pos = res.get("position")
                pts = res.get("points", 0)

                if finish_pos is None:
                    continue
                finish_pos = int(max(1, min(20, finish_pos)))

                driver_form_history[driver_id].append(finish_pos)
                circuit_history[(driver_id, circuit_id)].append(finish_pos)
                constructor_points[year][team_id] += pts
                driver_points[year][driver_id] += pts

    X = np.array(X_rows, dtype=np.float32)
    y = np.array(y_rows, dtype=np.float32)
    return X, y, meta_rows


# ---------------------------------------------------------------------------
# Training
# ---------------------------------------------------------------------------


def train_and_export(X: np.ndarray, y: np.ndarray, meta: list[dict[str, Any]]) -> None:
    import xgboost as xgb

    print(f"\nDataset: {X.shape[0]} samples, {X.shape[1]} features")

    # ------------------------------------------------------------------
    # 3-fold temporal cross-validation
    # ------------------------------------------------------------------
    print("\n--- 3-fold temporal cross-validation ---")
    tscv = TimeSeriesSplit(n_splits=3)
    fold_metrics: list[dict[str, float]] = []

    for fold_idx, (train_idx, val_idx) in enumerate(tscv.split(X)):
        X_tr, X_val = X[train_idx], X[val_idx]
        y_tr, y_val = y[train_idx], y[val_idx]

        model = xgb.XGBRegressor(
            objective="reg:pseudohubererror",
            n_estimators=1000,
            max_depth=4,
            learning_rate=0.1,
            subsample=0.7,
            colsample_bytree=0.7,
            reg_alpha=1.0,
            reg_lambda=1.0,
            min_child_weight=5,
            random_state=42,
            early_stopping_rounds=50,
        )
        model.fit(
            X_tr, y_tr,
            eval_set=[(X_val, y_val)],
            verbose=False,
        )

        preds = model.predict(X_val)
        mae = mean_absolute_error(y_val, preds)
        rmse = float(np.sqrt(mean_squared_error(y_val, preds)))
        best_iter = model.best_iteration if hasattr(model, 'best_iteration') else 300
        fold_metrics.append({"mae": mae, "rmse": rmse, "best_iter": best_iter})
        print(f"  Fold {fold_idx + 1}: MAE={mae:.3f}  RMSE={rmse:.3f}  best_iter={best_iter}  (val size={len(val_idx)})")

    avg_mae = float(np.mean([m["mae"] for m in fold_metrics]))
    avg_rmse = float(np.mean([m["rmse"] for m in fold_metrics]))
    avg_best_iter = int(np.mean([m["best_iter"] for m in fold_metrics]))
    print(f"  Average: MAE={avg_mae:.3f}  RMSE={avg_rmse:.3f}  avg_best_iter={avg_best_iter}")

    # ------------------------------------------------------------------
    # Train final model on all data using avg best iteration from CV
    # ------------------------------------------------------------------
    print(f"\nTraining final model on all data (n_estimators={avg_best_iter}) ...")
    final_model = xgb.XGBRegressor(
        objective="reg:squarederror",
        n_estimators=avg_best_iter,
        max_depth=4,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        reg_alpha=1.0,
        reg_lambda=1.0,
        min_child_weight=5,
        random_state=42,
    )
    final_model.fit(X, y, verbose=False)

    # Feature importances
    importances = final_model.feature_importances_
    print("\nFeature importances:")
    for name, imp in sorted(zip(FEATURE_NAMES, importances), key=lambda x: -x[1]):
        print(f"  {name}: {imp:.4f}")

    # ------------------------------------------------------------------
    # Export to ONNX
    # ------------------------------------------------------------------
    print("\nExporting to ONNX ...")
    try:
        from onnxmltools import convert_xgboost
        from onnxmltools.convert.common.data_types import FloatTensorType

        onnx_model = convert_xgboost(
            final_model.get_booster(),
            initial_types=[("features", FloatTensorType([None, len(FEATURE_NAMES)]))],
            target_opset=15,
        )
    except ImportError:
        # Fallback: try skl2onnx
        from skl2onnx import convert_sklearn
        from skl2onnx.common.data_types import FloatTensorType

        onnx_model = convert_sklearn(
            final_model,
            initial_types=[("features", FloatTensorType([None, len(FEATURE_NAMES)]))],
            target_opset=15,
        )

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    onnx_path = OUTPUT_DIR / "race-predictor.onnx"
    with open(onnx_path, "wb") as f:
        f.write(onnx_model.SerializeToString())
    print(f"  Saved ONNX model to {onnx_path}")

    # ------------------------------------------------------------------
    # Validate ONNX model loads correctly
    # ------------------------------------------------------------------
    try:
        import onnxruntime as ort

        sess = ort.InferenceSession(str(onnx_path))
        test_input = {sess.get_inputs()[0].name: X[:5]}
        test_preds = sess.run(None, test_input)[0]
        print(f"  ONNX validation passed (sample preds: {test_preds.flatten()[:5]})")
    except Exception as e:
        print(f"  [WARN] ONNX runtime validation skipped: {e}")

    # ------------------------------------------------------------------
    # Compute normalisation statistics for features
    # ------------------------------------------------------------------
    feature_stats: dict[str, dict[str, float]] = {}
    for i, name in enumerate(FEATURE_NAMES):
        col = X[:, i]
        feature_stats[name] = {
            "min": float(np.min(col)),
            "max": float(np.max(col)),
            "mean": float(np.mean(col)),
            "std": float(np.std(col)),
        }

    # ------------------------------------------------------------------
    # Save metadata
    # ------------------------------------------------------------------
    metadata = {
        "model_file": "race-predictor.onnx",
        "feature_names": FEATURE_NAMES,
        "feature_count": len(FEATURE_NAMES),
        "training_years": list(YEARS),
        "total_samples": int(X.shape[0]),
        "circuit_type_mapping": CIRCUIT_TYPE_MAP,
        "circuit_type_labels": {
            "0": "street",
            "1": "mixed",
            "2": "high_speed",
        },
        "feature_descriptions": {
            "grid_position": "Qualifying grid position (1-20)",
            "constructor_strength": "Constructor championship points normalised 0-1 at time of race",
            "driver_form": "Rolling 5-race average finish position (lower is better)",
            "driver_circuit_history": "Average finish at this circuit from prior years",
            "teammate_quali_gap": "Qualifying time delta to teammate in seconds (positive = slower)",
            "circuit_type": "Circuit category: street=0, mixed=1, high_speed=2",
            "is_wet": "Wet weather flag (0 or 1, default 0)",
            "driver_championship_pos": "Driver WDC standing position normalised 0-1 (0 = leader)",
        },
        "feature_normalization": feature_stats,
        "validation_metrics": {
            "cv_folds": 3,
            "avg_mae": round(avg_mae, 4),
            "avg_rmse": round(avg_rmse, 4),
            "fold_details": [
                {"fold": i + 1, "mae": round(m["mae"], 4), "rmse": round(m["rmse"], 4)}
                for i, m in enumerate(fold_metrics)
            ],
        },
    }

    meta_path = OUTPUT_DIR / "model-metadata.json"
    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"  Saved metadata to {meta_path}")

    print("\nDone!")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    print("=" * 60)
    print("F1 Race Position Predictor - XGBoost Training")
    print("=" * 60)

    print(f"\nLoading seasons {min(YEARS)}-{max(YEARS)} from {SEASONS_DIR} ...")
    X, y, meta = build_dataset()

    if X.shape[0] == 0:
        print("ERROR: No training samples found. Check that season JSON files exist.")
        sys.exit(1)

    train_and_export(X, y, meta)


if __name__ == "__main__":
    main()
