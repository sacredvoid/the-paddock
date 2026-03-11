export const TEAM_COLORS: Record<string, { primary: string; secondary: string }> = {
  "red_bull": { primary: "#3671C6", secondary: "#1B3A6B" },
  "mercedes": { primary: "#27F4D2", secondary: "#00A19C" },
  "ferrari": { primary: "#E8002D", secondary: "#A80020" },
  "mclaren": { primary: "#FF8000", secondary: "#CC6600" },
  "aston_martin": { primary: "#229971", secondary: "#174F3B" },
  "alpine": { primary: "#FF87BC", secondary: "#CC6C96" },
  "williams": { primary: "#64C4FF", secondary: "#4A93BF" },
  "rb": { primary: "#6692FF", secondary: "#4D6EBF" },
  "kick_sauber": { primary: "#52E252", secondary: "#3DAB3D" },
  "haas": { primary: "#B6BABD", secondary: "#898C8E" },
  // Historic teams
  "lotus": { primary: "#FFB800", secondary: "#CC9300" },
  "brabham": { primary: "#00783E", secondary: "#005A2E" },
  "tyrrell": { primary: "#0044AA", secondary: "#003380" },
  "benetton": { primary: "#00A550", secondary: "#007A3B" },
  "brawn": { primary: "#B5F500", secondary: "#8AB900" },
  "jordan": { primary: "#FFC700", secondary: "#CCA000" },
  "force_india": { primary: "#F596C8", secondary: "#C2789F" },
  "racing_point": { primary: "#F596C8", secondary: "#C2789F" },
  "toro_rosso": { primary: "#469BFF", secondary: "#3578CC" },
  "alphatauri": { primary: "#4E7C9B", secondary: "#3B5D74" },
  "renault": { primary: "#FFF500", secondary: "#CCC400" },
  "minardi": { primary: "#000000", secondary: "#333333" },
  "caterham": { primary: "#005030", secondary: "#003820" },
  "marussia": { primary: "#6E0000", secondary: "#520000" },
  "manor": { primary: "#ED1C24", secondary: "#B8151B" },
  "sauber": { primary: "#006EFF", secondary: "#0054BF" },
  "alfa_romeo": { primary: "#A50F2D", secondary: "#7C0B22" },
};

export function getTeamColor(teamId: string): string {
  return TEAM_COLORS[teamId]?.primary ?? "#888888";
}
