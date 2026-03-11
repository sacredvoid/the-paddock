import driverImagesData from "@/data/driver-images.json";
import teamLogosData from "@/data/team-logos.json";

const driverImages = driverImagesData as Record<string, string>;
const teamLogos = teamLogosData as Record<string, string>;

export function getDriverImageUrl(driverId: string): string | null {
  return driverImages[driverId] ?? null;
}

export function getTeamLogoUrl(teamId: string): string | null {
  return teamLogos[teamId] ?? null;
}

export function getCircuitSvgPath(circuitId: string): string {
  return `/circuits/${circuitId}.svg`;
}
