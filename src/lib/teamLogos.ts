type CountryPath =
  | "england"
  | "spain"
  | "italy"
  | "germany"
  | "france"
  | "usa"
  | "saudi-arabia"
  | "brazil"
  | string;

const TEAM_LOGO_CACHE_PREFIX = "teamLogoUrl:";

const leagueTypeToCountryPath: Record<string, CountryPath> = {
  "premier-league": "england",
  laliga: "spain",
  "serie-a": "italy",
  bundesliga: "germany",
  "ligue-1": "france",
  mls: "usa",
  "saudi-pro-league": "saudi-arabia",
  brasileirao: "brazil",
};

const teamSlugOverrides: Record<string, Record<string, string>> = {
  "premier-league": {
    "Ipswich Town": "ipswich",
    "Manchester City": "manchester-city",
    "Manchester United": "manchester-united",
    "Newcastle United": "newcastle",
    "Nottingham Forest": "nottingham-forest",
    "Tottenham": "tottenham",
    "West Ham United": "west-ham",
    "Wolverhampton": "wolverhampton-wanderers",
  },
  laliga: {
    "Atlético Madrid": "atletico-madrid",
    "Real Madrid": "real-madrid",
    "Real Sociedad": "real-sociedad",
    "Athletic Bilbao": "athletic",
    "Rayo Vallecano": "rayo-vallecano",
    "Las Palmas": "las-palmas",
    "Celta Vigo": "celta",
    "Betis": "real-betis",
    "Alavés": "deportivo-alaves",
  },
  "serie-a": {
    "AC Milan": "milan",
    "Inter Milan": "inter",
  },
  bundesliga: {
    "Bayern Munich": "bayern-munchen",
    "Bayer Leverkusen": "bayer-leverkusen",
    "Borussia Dortmund": "borussia-dortmund",
    "Borussia M'gladbach": "borussia-monchengladbach",
    "Mainz 05": "mainz",
    "RB Leipzig": "rb-leipzig",
    "Union Berlin": "union-berlin",
    "Werder Bremen": "werder-bremen",
  },
  "ligue-1": {
    "Paris Saint-Germain": "paris-saint-germain",
    "Saint-Étienne": "as-saint-etienne",
  },
  mls: {
    "Inter Miami": "inter-miami-cf",
    LAFC: "los-angeles-fc",
    "LA Galaxy": "la-galaxy",
    "New York City FC": "new-york-city",
    "New York Red Bulls": "new-york-red-bulls",
    "St. Louis City SC": "st-louis-city-sc",
    "Sporting Kansas City": "sporting-kansas-city",
    "D.C. United": "dc-united",
  },
  "saudi-pro-league": {
    "Al-Ahli": "al-ahli",
    "Al-Ettifaq": "al-ettifaq",
    "Al-Fateh": "al-fateh",
    "Al-Fayha": "al-fayha",
    "Al-Hazm": "al-hazem",
    "Al-Hilal": "al-hilal",
    "Al-Ittihad": "al-ittihad",
    "Al-Khaleej": "al-khaleej",
    "Al-Nassr": "al-nassr",
    "Al-Okhdood": "al-okhdood",
    "Al-Qadisiyah": "al-qadsiah",
    "Al-Raed": "al-raed",
    "Al-Riyadh": "al-riyadh",
    "Al-Shabab": "al-shabab",
    "Al-Taawoun": "al-taawoun",
    "Al-Wehda": "al-wehda",
    Damac: "damac",
    Neom: "neom-sc",
  },
  brasileirao: {
    "Atlético Mineiro": "atletico-mineiro",
    "Athletico Paranaense": "athletico-paranaense",
    "Red Bull Bragantino": "rb-bragantino",
    "São Paulo": "sao-paulo",
    "Vasco da Gama": "vasco-da-gama",
  },
};

const slugify = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const getCacheKey = (leagueType: string, teamName: string) =>
  `${TEAM_LOGO_CACHE_PREFIX}${leagueType}:${teamName}`;

const getCachedLogoUrl = (leagueType: string, teamName: string) => {
  try {
    return localStorage.getItem(getCacheKey(leagueType, teamName));
  } catch {
    return null;
  }
};

const setCachedLogoUrl = (leagueType: string, teamName: string, url: string) => {
  try {
    localStorage.setItem(getCacheKey(leagueType, teamName), url);
  } catch {
    // ignore
  }
};

const getCountryPathForLeagueType = (leagueType: string): CountryPath | null =>
  leagueTypeToCountryPath[leagueType] || null;

const getTeamSlug = (leagueType: string, teamName: string) => {
  const override = teamSlugOverrides[leagueType]?.[teamName];
  if (override) return override;
  return slugify(teamName);
};

const extractSvgUrlFromMarkdown = (markdown: string) => {
  const directDownload = markdown.match(/\[Download SVG\]\((https:\/\/images\.football-logos\.cc\/[^)]+\.svg)\)/i);
  if (directDownload?.[1]) return directDownload[1];

  const anyImages = markdown.match(/\((https:\/\/images\.football-logos\.cc\/[^)]+\.svg)\)/i);
  if (anyImages?.[1]) return anyImages[1];

  return null;
};

export const resolveTeamLogoUrl = async (params: {
  leagueType: string;
  teamName: string;
}): Promise<string | null> => {
  const cached = getCachedLogoUrl(params.leagueType, params.teamName);
  if (cached) return cached;

  const countryPath = getCountryPathForLeagueType(params.leagueType);
  if (!countryPath) return null;

  const teamSlug = getTeamSlug(params.leagueType, params.teamName);
  if (!teamSlug) return null;

  const teamPage = `https://football-logos.cc/${countryPath}/${teamSlug}/`;

  try {
    const res = await fetch(`https://r.jina.ai/${teamPage}`);
    if (!res.ok) return null;

    const markdown = await res.text();
    const svgUrl = extractSvgUrlFromMarkdown(markdown);
    if (!svgUrl) return null;

    setCachedLogoUrl(params.leagueType, params.teamName, svgUrl);
    return svgUrl;
  } catch {
    return null;
  }
};
