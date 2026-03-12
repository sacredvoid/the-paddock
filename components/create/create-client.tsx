"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { getAllDrivers } from "@/lib/data";
import { getDriverImageUrl } from "@/lib/images";
import type { Driver, Season } from "@/lib/types";
import Image from "next/image";
import {
  Download,
  Copy,
  Check,
  User,
  Users,
  Trophy,
  BarChart3,
  Sun,
  Moon,
  Square,
  RectangleHorizontal,
  ImageIcon,
  X,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CardType = "driver" | "head-to-head" | "race-result" | "standings";
type ThemeMode = "dark" | "light";
type CardSize = "square" | "landscape";

const CARD_TYPES: { value: CardType; label: string; icon: typeof User }[] = [
  { value: "driver", label: "Driver", icon: User },
  { value: "head-to-head", label: "Head-to-Head", icon: Users },
  { value: "race-result", label: "Race Result", icon: Trophy },
  { value: "standings", label: "Standings", icon: BarChart3 },
];

const YEAR_RANGE = Array.from({ length: 2024 - 2014 + 1 }, (_, i) => 2024 - i);

// ---------------------------------------------------------------------------
// Searchable Driver Picker (single selection)
// ---------------------------------------------------------------------------

function DriverPickerSingle({
  label,
  selectedSlug,
  onChange,
  drivers,
}: {
  label: string;
  selectedSlug: string;
  onChange: (slug: string) => void;
  drivers: Driver[];
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const selectedDriver = useMemo(
    () => drivers.find((d) => d.slug === selectedSlug),
    [drivers, selectedSlug]
  );

  const filtered = useMemo(() => {
    if (!search) return drivers;
    const q = search.toLowerCase();
    return drivers.filter(
      (d) =>
        d.firstName.toLowerCase().includes(q) ||
        d.lastName.toLowerCase().includes(q) ||
        d.code?.toLowerCase().includes(q)
    );
  }, [drivers, search]);

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-text-secondary">
        {label}
      </label>

      {/* Selected driver chip */}
      {selectedDriver && (
        <div className="mb-2 flex items-center gap-2 rounded-lg border border-[rgba(255,255,255,0.06)] bg-surface-2 px-3 py-2">
          {getDriverImageUrl(selectedDriver.id) && (
            <Image
              src={getDriverImageUrl(selectedDriver.id)!}
              alt=""
              width={24}
              height={24}
              className="rounded-full"
            />
          )}
          <span className="text-sm font-medium text-text-primary">
            {selectedDriver.firstName} {selectedDriver.lastName}
          </span>
          <span className="ml-auto text-xs text-text-secondary">
            {selectedDriver.code}
          </span>
          <button
            onClick={() => {
              onChange("");
              setOpen(true);
            }}
            className="ml-1 rounded-full p-0.5 text-text-secondary hover:bg-surface-3 hover:text-text-primary"
          >
            <X className="size-3" />
          </button>
        </div>
      )}

      {/* Search input */}
      {(!selectedDriver || open) && (
        <div className="relative">
          <input
            type="text"
            placeholder="Search driver..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            className="w-full rounded-lg border border-[rgba(255,255,255,0.06)] bg-surface-2 px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-glow focus:outline-none"
          />
          {open && filtered.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-y-auto rounded-lg border border-[rgba(255,255,255,0.06)] bg-surface-2 shadow-lg">
              {filtered.slice(0, 15).map((d) => {
                const imageUrl = getDriverImageUrl(d.id);
                return (
                  <button
                    key={d.id}
                    onClick={() => {
                      onChange(d.slug);
                      setSearch("");
                      setOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text-primary hover:bg-surface-3"
                  >
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt=""
                        width={20}
                        height={20}
                        className="rounded-full"
                      />
                    ) : (
                      <User className="size-4 text-text-tertiary" />
                    )}
                    <span>
                      {d.firstName} {d.lastName}
                    </span>
                    <span className="ml-auto text-xs text-text-secondary">
                      {d.code}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Race Picker (for race-result card type)
// ---------------------------------------------------------------------------

function RaceDropdown({
  seasonData,
  selectedRound,
  onChange,
}: {
  seasonData: Season | null;
  selectedRound: number | null;
  onChange: (round: number) => void;
}) {
  if (!seasonData) return null;

  const races = seasonData.races.filter(
    (r) => r.results && r.results.length > 0
  );

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-text-secondary">
        Race
      </label>
      <div className="grid max-h-48 grid-cols-1 gap-1 overflow-y-auto rounded-lg border border-[rgba(255,255,255,0.06)] bg-surface-2 p-2">
        {races.map((race) => (
          <button
            key={race.round}
            onClick={() => onChange(race.round)}
            className={`rounded-md px-3 py-1.5 text-left text-sm transition-colors ${
              selectedRound === race.round
                ? "bg-glow/10 text-glow"
                : "text-text-primary hover:bg-surface-3"
            }`}
          >
            <span className="stats-number mr-2 text-xs text-text-secondary">
              R{race.round}
            </span>
            {race.name}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Create Client
// ---------------------------------------------------------------------------

export function CreateClient() {
  // Card configuration state
  const [cardType, setCardType] = useState<CardType>("driver");
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [size, setSize] = useState<CardSize>("square");

  // Driver card state
  const [driverSlug, setDriverSlug] = useState("");

  // Head-to-head state
  const [driver1Slug, setDriver1Slug] = useState("");
  const [driver2Slug, setDriver2Slug] = useState("");

  // Race result state
  const [raceYear, setRaceYear] = useState(2024);
  const [raceRound, setRaceRound] = useState<number | null>(null);

  // Standings state
  const [standingsYear, setStandingsYear] = useState(2024);

  // Season data for race picker
  const [seasonData, setSeasonData] = useState<Season | null>(null);
  const [loadingSeason, setLoadingSeason] = useState(false);

  // Clipboard feedback
  const [copied, setCopied] = useState(false);

  // All drivers (static data)
  const allDrivers = useMemo(() => {
    const drivers = getAllDrivers();
    return drivers.sort((a, b) => a.lastName.localeCompare(b.lastName));
  }, []);

  // Load season data when year changes (for race-result type)
  useEffect(() => {
    if (cardType !== "race-result") return;
    let cancelled = false;
    setLoadingSeason(true);
    import(`@/data/seasons/${raceYear}.json`)
      .then((mod) => {
        if (!cancelled) {
          setSeasonData(mod.default as Season);
          setRaceRound(null);
        }
      })
      .catch(() => {
        if (!cancelled) setSeasonData(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingSeason(false);
      });
    return () => {
      cancelled = true;
    };
  }, [raceYear, cardType]);

  // Build the OG image URL from current state
  const ogUrl = useMemo(() => {
    const base = `/api/og`;
    const params = new URLSearchParams();
    params.set("theme", theme);
    params.set("size", size);

    switch (cardType) {
      case "driver":
        if (!driverSlug) return null;
        params.set("slug", driverSlug);
        return `${base}/driver?${params.toString()}`;
      case "head-to-head":
        if (!driver1Slug || !driver2Slug) return null;
        params.set("driver1", driver1Slug);
        params.set("driver2", driver2Slug);
        return `${base}/head-to-head?${params.toString()}`;
      case "race-result":
        if (!raceRound) return null;
        params.set("year", String(raceYear));
        params.set("round", String(raceRound));
        return `${base}/race-result?${params.toString()}`;
      case "standings":
        params.set("year", String(standingsYear));
        return `${base}/standings?${params.toString()}`;
      default:
        return null;
    }
  }, [
    cardType,
    theme,
    size,
    driverSlug,
    driver1Slug,
    driver2Slug,
    raceYear,
    raceRound,
    standingsYear,
  ]);

  // Check if the form is complete enough to show preview
  const isReady = ogUrl !== null;

  // Build full shareable URL
  const shareableUrl = useMemo(() => {
    if (!ogUrl) return "";
    if (typeof window === "undefined") return "";
    return `${window.location.origin}${ogUrl}`;
  }, [ogUrl]);

  // Download handler
  const handleDownload = useCallback(async () => {
    if (!ogUrl) return;
    try {
      const res = await fetch(ogUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const filename = `paddock-${cardType}-${size}.png`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // silent fail
    }
  }, [ogUrl, cardType, size]);

  // Copy link handler
  const handleCopyLink = useCallback(async () => {
    if (!shareableUrl) return;
    try {
      await navigator.clipboard.writeText(shareableUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // silent fail
    }
  }, [shareableUrl]);

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      {/* ---- Sidebar Controls ---- */}
      <div className="flex flex-col gap-5">
        {/* Card Type Selector */}
        <div>
          <label className="mb-2 block text-sm font-medium text-text-secondary">
            Card Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {CARD_TYPES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setCardType(value)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                  cardType === value
                    ? "border-glow bg-glow/10 text-glow"
                    : "border-[rgba(255,255,255,0.06)] bg-surface-2 text-text-primary hover:bg-surface-3"
                }`}
              >
                <Icon className="size-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic form fields based on card type */}
        {cardType === "driver" && (
          <DriverPickerSingle
            label="Driver"
            selectedSlug={driverSlug}
            onChange={setDriverSlug}
            drivers={allDrivers}
          />
        )}

        {cardType === "head-to-head" && (
          <>
            <DriverPickerSingle
              label="Driver 1"
              selectedSlug={driver1Slug}
              onChange={setDriver1Slug}
              drivers={allDrivers}
            />
            <DriverPickerSingle
              label="Driver 2"
              selectedSlug={driver2Slug}
              onChange={setDriver2Slug}
              drivers={allDrivers}
            />
          </>
        )}

        {cardType === "race-result" && (
          <>
            <div>
              <label className="mb-2 block text-sm font-medium text-text-secondary">
                Season
              </label>
              <select
                value={raceYear}
                onChange={(e) => setRaceYear(Number(e.target.value))}
                className="w-full rounded-lg border border-[rgba(255,255,255,0.06)] bg-surface-2 px-3 py-2 text-sm text-text-primary focus:border-glow focus:outline-none"
              >
                {YEAR_RANGE.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            {loadingSeason ? (
              <div className="h-32 animate-pulse rounded-lg bg-surface-1" />
            ) : (
              <RaceDropdown
                seasonData={seasonData}
                selectedRound={raceRound}
                onChange={setRaceRound}
              />
            )}
          </>
        )}

        {cardType === "standings" && (
          <div>
            <label className="mb-2 block text-sm font-medium text-text-secondary">
              Season
            </label>
            <select
              value={standingsYear}
              onChange={(e) => setStandingsYear(Number(e.target.value))}
              className="w-full rounded-lg border border-[rgba(255,255,255,0.06)] bg-surface-2 px-3 py-2 text-sm text-text-primary focus:border-glow focus:outline-none"
            >
              {YEAR_RANGE.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-[rgba(255,255,255,0.06)]" />

        {/* Theme Toggle */}
        <div>
          <label className="mb-2 block text-sm font-medium text-text-secondary">
            Theme
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setTheme("dark")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                theme === "dark"
                  ? "border-glow bg-glow/10 text-glow"
                  : "border-[rgba(255,255,255,0.06)] bg-surface-2 text-text-primary hover:bg-surface-3"
              }`}
            >
              <Moon className="size-4" />
              Dark
            </button>
            <button
              onClick={() => setTheme("light")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                theme === "light"
                  ? "border-glow bg-glow/10 text-glow"
                  : "border-[rgba(255,255,255,0.06)] bg-surface-2 text-text-primary hover:bg-surface-3"
              }`}
            >
              <Sun className="size-4" />
              Light
            </button>
          </div>
        </div>

        {/* Size Toggle */}
        <div>
          <label className="mb-2 block text-sm font-medium text-text-secondary">
            Size
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setSize("square")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                size === "square"
                  ? "border-glow bg-glow/10 text-glow"
                  : "border-[rgba(255,255,255,0.06)] bg-surface-2 text-text-primary hover:bg-surface-3"
              }`}
            >
              <Square className="size-4" />
              Square
            </button>
            <button
              onClick={() => setSize("landscape")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                size === "landscape"
                  ? "border-glow bg-glow/10 text-glow"
                  : "border-[rgba(255,255,255,0.06)] bg-surface-2 text-text-primary hover:bg-surface-3"
              }`}
            >
              <RectangleHorizontal className="size-4" />
              Landscape
            </button>
          </div>
          <p className="mt-1 text-xs text-text-tertiary">
            {size === "square"
              ? "1080 x 1080 - best for Instagram"
              : "1200 x 630 - best for Twitter/X"}
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-[rgba(255,255,255,0.06)]" />

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={handleDownload}
            disabled={!isReady}
            className="flex items-center justify-center gap-2 rounded-lg bg-glow px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download className="size-4" />
            Download Image
          </button>
          <button
            onClick={handleCopyLink}
            disabled={!isReady}
            className="flex items-center justify-center gap-2 rounded-lg border border-[rgba(255,255,255,0.06)] bg-surface-2 px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-3 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {copied ? (
              <>
                <Check className="size-4 text-green-400" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="size-4" />
                Copy Link
              </>
            )}
          </button>
        </div>
      </div>

      {/* ---- Preview Area ---- */}
      <div className="flex flex-col items-center gap-4">
        {isReady ? (
          <div
            className={`relative w-full overflow-hidden rounded-xl border border-[rgba(255,255,255,0.06)] bg-surface-1 ${
              size === "square" ? "max-w-[540px]" : "max-w-[700px]"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={ogUrl}
              src={ogUrl}
              alt={`${cardType} card preview`}
              className="h-auto w-full"
            />
          </div>
        ) : (
          <div className="flex w-full max-w-[540px] flex-col items-center justify-center gap-3 rounded-xl border border-[rgba(255,255,255,0.06)] bg-surface-1 px-6 py-32">
            <ImageIcon className="size-10 text-text-tertiary" />
            <p className="text-center text-text-secondary">
              {cardType === "driver" && "Select a driver to preview your card"}
              {cardType === "head-to-head" &&
                "Select two drivers to preview your card"}
              {cardType === "race-result" &&
                "Select a season and race to preview your card"}
              {cardType === "standings" && "Choose a season to preview standings"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
