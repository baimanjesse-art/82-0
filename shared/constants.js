export const POSITIONS = ["PG", "SG", "SF", "PF", "C"];

export const POSITION_INDEX = { PG: 0, SG: 1, SF: 2, PF: 3, C: 4 };

export const DECADES = [
  "1960s",
  "1970s",
  "1980s",
  "1990s",
  "2000s",
  "2010s",
  "2020s",
];

export const DECADE_INDEX = Object.fromEntries(
  DECADES.map((d, i) => [d, i])
);

export const ROUNDS = 5;

export const PICK_TIMER_SECONDS = 40;

export const EMOTES = ["🔥", "😂", "🤯", "🧊", "🐐", "🗑️", "😤", "🍀"];

// Team display metadata. Historical franchise names get their own entries.
export const TEAM_META = {
  "Boston Celtics": { abbr: "BOS", color: "#007A33" },
  "Los Angeles Lakers": { abbr: "LAL", color: "#552583" },
  "Philadelphia 76ers": { abbr: "PHI", color: "#006BB6" },
  "Cincinnati Royals": { abbr: "CIN", color: "#0B5394" },
  "New York Knicks": { abbr: "NYK", color: "#F58426" },
  "St. Louis Hawks": { abbr: "STL", color: "#C8102E" },
  "San Francisco Warriors": { abbr: "SFW", color: "#1D428A" },
  "Baltimore Bullets": { abbr: "BAL", color: "#DF4601" },
  "Detroit Pistons": { abbr: "DET", color: "#C8102E" },
  "Milwaukee Bucks": { abbr: "MIL", color: "#00471B" },
  "Golden State Warriors": { abbr: "GSW", color: "#1D428A" },
  "Portland Trail Blazers": { abbr: "POR", color: "#E03A3E" },
  "Washington Bullets": { abbr: "WAS", color: "#002B5C" },
  "Denver Nuggets": { abbr: "DEN", color: "#0E2240" },
  "Phoenix Suns": { abbr: "PHX", color: "#E56020" },
  "Seattle SuperSonics": { abbr: "SEA", color: "#00653A" },
  "Buffalo Braves": { abbr: "BUF", color: "#FF8C00" },
  "Houston Rockets": { abbr: "HOU", color: "#CE1141" },
  "Kansas City Kings": { abbr: "KCK", color: "#0046AD" },
  "Atlanta Hawks": { abbr: "ATL", color: "#C8102E" },
  "San Antonio Spurs": { abbr: "SAS", color: "#8A8D8F" },
  "Utah Jazz": { abbr: "UTA", color: "#002B5C" },
  "Chicago Bulls": { abbr: "CHI", color: "#CE1141" },
  "Dallas Mavericks": { abbr: "DAL", color: "#00538C" },
  "New Jersey Nets": { abbr: "NJN", color: "#CE1141" },
  "Cleveland Cavaliers": { abbr: "CLE", color: "#860038" },
  "Orlando Magic": { abbr: "ORL", color: "#0077C0" },
  "Charlotte Hornets": { abbr: "CHA", color: "#00788C" },
  "Miami Heat": { abbr: "MIA", color: "#98002E" },
  "Minnesota Timberwolves": { abbr: "MIN", color: "#0C2340" },
  "Indiana Pacers": { abbr: "IND", color: "#002D62" },
  "Sacramento Kings": { abbr: "SAC", color: "#5A2D81" },
  "Toronto Raptors": { abbr: "TOR", color: "#CE1141" },
  "Washington Wizards": { abbr: "WSH", color: "#002B5C" },
  "New Orleans Hornets": { abbr: "NOH", color: "#00778B" },
  "New Orleans Pelicans": { abbr: "NOP", color: "#0C2340" },
  "Oklahoma City Thunder": { abbr: "OKC", color: "#007AC1" },
  "Los Angeles Clippers": { abbr: "LAC", color: "#C8102E" },
  "Memphis Grizzlies": { abbr: "MEM", color: "#5D76A9" },
  "Brooklyn Nets": { abbr: "BKN", color: "#1A1A1A" },
};

export function teamMeta(team) {
  return TEAM_META[team] || { abbr: team.slice(0, 3).toUpperCase(), color: "#555" };
}
