import { getAllDrivers, getAllTeams, getAllCircuits, getAvailableSeasons } from "./data";

export interface SearchEntry {
  type: "driver" | "team" | "circuit" | "season" | "learn";
  title: string;
  subtitle: string;
  href: string;
}

export function buildSearchIndex(): SearchEntry[] {
  const entries: SearchEntry[] = [];

  // Drivers
  for (const d of getAllDrivers()) {
    if (!d.stats) continue; // skip drivers without data
    entries.push({
      type: "driver",
      title: `${d.firstName} ${d.lastName}`,
      subtitle: `${d.nationality} - ${d.stats.wins} wins, ${d.stats.races} races`,
      href: `/drivers/${d.slug}`,
    });
  }

  // Teams
  for (const t of getAllTeams()) {
    if (!t.stats) continue;
    entries.push({
      type: "team",
      title: t.name,
      subtitle: `${t.nationality} - ${t.stats.wins} wins`,
      href: `/teams/${t.slug}`,
    });
  }

  // Circuits
  for (const c of getAllCircuits()) {
    entries.push({
      type: "circuit",
      title: c.name,
      subtitle: `${c.city}, ${c.country} - ${c.totalRaces} races`,
      href: `/circuits/${c.slug}`,
    });
  }

  // Seasons
  for (const year of getAvailableSeasons()) {
    entries.push({
      type: "season",
      title: `${year} Season`,
      subtitle: "Formula 1 World Championship",
      href: `/seasons/${year}`,
    });
  }

  // Learn topics
  const learnTopics = [
    { slug: "race-weekend", title: "Race Weekend Structure", subtitle: "Beginner - How an F1 weekend works" },
    { slug: "tire-compounds", title: "Tire Compounds", subtitle: "Beginner - Understanding F1 tires" },
    { slug: "drs-and-overtaking", title: "DRS and Overtaking", subtitle: "Beginner - How DRS works" },
    { slug: "flags", title: "F1 Flags", subtitle: "Beginner - What each flag means" },
    { slug: "points-system", title: "Points System", subtitle: "Beginner - How points are awarded" },
    { slug: "pit-strategy", title: "Pit Strategy", subtitle: "Intermediate - Undercut, overcut, safety car windows" },
    { slug: "regulations-timeline", title: "Regulations Timeline", subtitle: "Intermediate - Key regulation changes" },
    { slug: "safety-evolution", title: "Safety Evolution", subtitle: "Intermediate - From no helmets to Halo" },
  ];
  for (const topic of learnTopics) {
    entries.push({
      type: "learn",
      title: topic.title,
      subtitle: topic.subtitle,
      href: `/learn/${topic.slug}`,
    });
  }

  return entries;
}
