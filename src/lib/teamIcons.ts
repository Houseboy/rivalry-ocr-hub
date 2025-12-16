// Team icons configuration with reliable SVG sources
type TeamIcons = Record<string, string>;

// Premier League (England)
const premierLeague: TeamIcons = {
  'Arsenal': 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg',
  'Aston Villa': 'https://upload.wikimedia.org/wikipedia/en/f/f9/Aston_Villa_FC_crest_%282016%29.svg',
  'Bournemouth': 'https://upload.wikimedia.org/wikipedia/en/e/eb/AFC_Bournemouth_%282013%29.svg',
  'Brentford': 'https://upload.wikimedia.org/wikipedia/en/2/2a/Brentford_FC_crest.svg',
  'Brighton': 'https://upload.wikimedia.org/wikipedia/en/f/fd/Brighton_%26_Hove_Albion_logo.svg',
  'Chelsea': 'https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg',
  'Crystal Palace': 'https://upload.wikimedia.org/wikipedia/en/0/0c/Crystal_Palace_FC_logo.svg',
  'Everton': 'https://upload.wikimedia.org/wikipedia/en/7/7c/Everton_FC_logo.svg',
  'Fulham': 'https://upload.wikimedia.org/wikipedia/en/e/eb/Fulham_FC_%28shield%29.svg',
  'Leeds United': 'https://upload.wikimedia.org/wikipedia/en/5/54/Leeds_United_F.C._logo.svg',
  'Leicester City': 'https://upload.wikimedia.org/wikipedia/en/2/2d/Leicester_City_crest.svg',
  'Liverpool': 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg',
  'Manchester City': 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg',
  'Manchester United': 'https://www.manutd.com/assets/images/logo.png',
  'Newcastle United': 'https://upload.wikimedia.org/wikipedia/en/5/56/Newcastle_United_Logo.svg',
  'Nottingham Forest': 'https://upload.wikimedia.org/wikipedia/en/e/e5/Nottingham_Forest_F.C._logo.svg',
  'Southampton': 'https://upload.wikimedia.org/wikipedia/en/c/c9/FC_Southampton.svg',
  'Tottenham': 'https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg',
  'West Ham': 'https://upload.wikimedia.org/wikipedia/en/c/c2/West_Ham_United_FC_logo.svg',
  'Wolverhampton': 'https://upload.wikimedia.org/wikipedia/en/f/fc/Wolverhampton_Wanderers.svg'
};

// La Liga (Spain) - Using official SVG badges where available
const laLiga: TeamIcons = {
  'Alaves': 'https://upload.wikimedia.org/wikipedia/en/5/5e/Deportivo_Alav%C3%A9s_logo.svg',
  'Almeria': 'https://upload.wikimedia.org/wikipedia/en/5/5d/UD_Almer%C3%ADa_logo.svg',
  'Athletic Bilbao': 'https://upload.wikimedia.org/wikipedia/en/0/0f/Athletic_Club_Bilbao_logo.svg',
  'Atletico Madrid': 'https://upload.wikimedia.org/wikipedia/commons/f/f4/Atletico_Madrid_2017_logo.svg',
  'Barcelona': 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg',
  'Celta Vigo': 'https://upload.wikimedia.org/wikipedia/en/1/12/RC_Celta_de_Vigo_logo.svg',
  'Cadiz': 'https://upload.wikimedia.org/wikipedia/en/8/8e/Cadiz_CF_logo.svg',
  'Getafe': 'https://upload.wikimedia.org/wikipedia/en/0/0d/Getafe_CF_logo.svg',
  'Girona': 'https://upload.wikimedia.org/wikipedia/en/9/9e/Girona_FC_logo.svg',
  'Granada': 'https://upload.wikimedia.org/wikipedia/en/5/53/Granada_CF_logo.svg',
  'Las Palmas': 'https://upload.wikimedia.org/wikipedia/en/2/20/UD_Las_Palmas_logo.svg',
  'Mallorca': 'https://upload.wikimedia.org/wikipedia/en/f/f5/RCD_Mallorca_logo.svg',
  'Osasuna': 'https://upload.wikimedia.org/wikipedia/en/8/82/CA_Osasuna_logo.svg',
  'Rayo Vallecano': 'https://upload.wikimedia.org/wikipedia/en/6/6a/Rayo_Vallecano_logo.svg',
  'Real Betis': 'https://upload.wikimedia.org/wikipedia/en/8/8f/Real_Betis_logo.svg',
  'Real Madrid': 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg',
  'Real Sociedad': 'https://upload.wikimedia.org/wikipedia/en/f/f1/Real_Sociedad_logo.svg',
  'Sevilla': 'https://upload.wikimedia.org/wikipedia/en/8/86/Sevilla_FC_logo.svg',
  'Valencia': 'https://upload.wikimedia.org/wikipedia/en/7/75/Valencia_CF_Logo.svg',
  'Villarreal': 'https://upload.wikimedia.org/wikipedia/en/7/70/Villarreal_CF_logo.svg'
};

// Bundesliga (Germany)
const bundesliga: TeamIcons = {
  'Bayern Munich': 'https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg',
  'Borussia Dortmund': 'https://upload.wikimedia.org/wikipedia/en/6/66/Borussia_Dortmund_logo.svg',
  'RB Leipzig': 'https://upload.wikimedia.org/wikipedia/en/0/04/RB_Leipzig_2014_logo.svg',
  'Bayer Leverkusen': 'https://upload.wikimedia.org/wikipedia/en/5/59/Bayer_04_Leverkusen_logo.svg',
  'Eintracht Frankfurt': 'https://upload.wikimedia.org/wikipedia/commons/0/04/Eintracht_Frankfurt_Logo.svg',
  'Wolfsburg': 'https://upload.wikimedia.org/wikipedia/en/f/f3/VfL_Wolfsburg_Logo.svg',
  'Borussia Mönchengladbach': 'https://upload.wikimedia.org/wikipedia/commons/8/81/Borussia_M%C3%B6nchengladbach_logo.svg',
  'Hoffenheim': 'https://upload.wikimedia.org/wikipedia/en/0/00/1899_Hoffenheim_Logo.svg',
  'Freiburg': 'https://upload.wikimedia.org/wikipedia/en/3/3d/SC_Freiburg_logo.svg',
  'Union Berlin': 'https://upload.wikimedia.org/wikipedia/en/0/04/FC_Union_Berlin_Logo.svg'
};

// Serie A (Italy)
const serieA: TeamIcons = {
  'Inter': 'https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg',
  'AC Milan': 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_of_AC_Milan.svg',
  'Juventus': 'https://upload.wikimedia.org/wikipedia/commons/1/15/Juventus_FC_2017_icon.svg',
  'Napoli': 'https://upload.wikimedia.org/wikipedia/commons/2/28/S.S.C._Napoli_logo.svg',
  'Roma': 'https://upload.wikimedia.org/wikipedia/en/f/f7/AS_Roma_logo_%282017%29.svg',
  'Lazio': 'https://upload.wikimedia.org/wikipedia/en/5/5e/S.S._Lazio_badge_2017.png',
  'Atalanta': 'https://upload.wikimedia.org/wikipedia/en/6/66/AtalantaBC.svg',
  'Fiorentina': 'https://upload.wikimedia.org/wikipedia/en/f/f9/ACF_Fiorentina_2.svg',
  'Torino': 'https://upload.wikimedia.org/wikipedia/en/1/1d/Torino_FC_Logo_2017.png',
  'Bologna': 'https://upload.wikimedia.org/wikipedia/en/9/92/Bologna_F.C._1909_logo.svg'
};

// Ligue 1 (France)
const ligue1: TeamIcons = {
  'PSG': 'https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg',
  'Marseille': 'https://upload.wikimedia.org/wikipedia/en/4/43/Olympique_Marseille.svg',
  'Lyon': 'https://upload.wikimedia.org/wikipedia/en/9/9c/Olympique_Lyonnais.svg',
  'Monaco': 'https://upload.wikimedia.org/wikipedia/en/2/21/AS_Monaco_FC.svg',
  'Lille': 'https://upload.wikimedia.org/wikipedia/en/8/81/Lille_OSC_2018.png',
  'Rennes': 'https://upload.wikimedia.org/wikipedia/en/6/6a/Stade_Rennais_FC.svg',
  'Nice': 'https://upload.wikimedia.org/wikipedia/en/0/0c/OGC_Nice_logo.svg',
  'Lens': 'https://upload.wikimedia.org/wikipedia/en/0/0f/Racing_Club_de_Lens_logo.svg',
  'Nantes': 'https://upload.wikimedia.org/wikipedia/en/d/d1/FC_Nantes_logo.svg',
  'Reims': 'https://upload.wikimedia.org/wikipedia/en/7/7d/Stade_Reims_logo.svg'
};

// Combine all leagues into a single lookup object
const allTeams: Record<string, string> = {
  ...premierLeague,
  ...laLiga,
  ...bundesliga,
  ...serieA,
  ...ligue1,
  // Add common alternative names
  'Man Utd': premierLeague['Manchester United'],
  'Man United': premierLeague['Manchester United'],
  'Man City': premierLeague['Manchester City'],
  'Spurs': premierLeague['Tottenham'],
  'Wolves': premierLeague['Wolverhampton'],
  'Newcastle': premierLeague['Newcastle United'],
  'Leicester': premierLeague['Leicester City'],
  'Brighton & Hove Albion': premierLeague['Brighton'],
  'AFC Bournemouth': premierLeague['Bournemouth'],
  'Nottm Forest': premierLeague['Nottingham Forest'],
  'Inter Milan': serieA['Inter'],
  'AC Milan': serieA['AC Milan'],
  'Bayern': bundesliga['Bayern Munich'],
  'Dortmund': bundesliga['Borussia Dortmund'],
  'PSG': ligue1['PSG'],
  'Olympique Marseille': ligue1['Marseille'],
  'Olympique Lyonnais': ligue1['Lyon'],
  // La Liga alternative names
  'Atlético Madrid': laLiga['Atletico Madrid'],
  'Atletico': laLiga['Atletico Madrid'],
  'Atletico de Madrid': laLiga['Atletico Madrid'],
  'Athletic Club': laLiga['Athletic Bilbao'],
  'Athletic Bilbao': laLiga['Athletic Bilbao'],
  'Real Betis Balompié': laLiga['Real Betis'],
  'Betis': laLiga['Real Betis'],
  'RC Celta': laLiga['Celta Vigo'],
  'RC Celta de Vigo': laLiga['Celta Vigo'],
  'Celta': laLiga['Celta Vigo'],
  'Barca': laLiga['Barcelona'],
  'FC Barcelona': laLiga['Barcelona'],
  'Real Madrid CF': laLiga['Real Madrid'],
  'Real Madrid Club de Fútbol': laLiga['Real Madrid'],
  'Real': laLiga['Real Madrid'],
  'Real Sociedad de Fútbol': laLiga['Real Sociedad'],
  'Sociedad': laLiga['Real Sociedad'],
  'Sevilla FC': laLiga['Sevilla'],
  'Valencia CF': laLiga['Valencia'],
  'Villarreal CF': laLiga['Villarreal'],
  'Elche': 'https://upload.wikimedia.org/wikipedia/en/7/7d/Elche_CF_logo.svg',
  'Espanyol': 'https://upload.wikimedia.org/wikipedia/en/5/56/RCD_Espanyol_logo_2019.svg',
  'Deportivo Alavés': laLiga['Alaves'],
  'UD Almería': laLiga['Almeria'],
  'Cádiz CF': laLiga['Cadiz'],
  'Girona FC': laLiga['Girona'],
  'Granada CF': laLiga['Granada'],
  'UD Las Palmas': laLiga['Las Palmas'],
  'RCD Mallorca': laLiga['Mallorca'],
  'CA Osasuna': laLiga['Osasuna'],
  'Rayo Vallecano de Madrid': laLiga['Rayo Vallecano']
};

/**
 * Get the URL for a team's icon
 * @param teamName - The name of the team
 * @param size - The size of the icon (for fallback only)
 * @returns URL to the team's icon
 */
export const getTeamIconUrl = (teamName: string, size: number = 100): string => {
  if (!teamName) return `https://img.icons8.com/color/${size}/icons8-football-100.png`;
  
  const normalizedTeam = teamName.trim().toLowerCase();
  
  // Try exact match first
  const exactMatch = Object.entries(allTeams).find(
    ([name]) => name.toLowerCase() === normalizedTeam
  );
  
  if (exactMatch) return exactMatch[1];
  
  // Try partial match if no exact match found
  const partialMatch = Object.entries(allTeams).find(
    ([name]) => name.toLowerCase().includes(normalizedTeam) || 
               normalizedTeam.includes(name.toLowerCase())
  );
  
  if (partialMatch) return partialMatch[1];
  
  // Fallback to Icons8 with a football icon
  const iconName = teamName.toLowerCase().replace(/\s+/g, '-');
  return `https://img.icons8.com/color/${size}/icons8-${iconName}.png`;
};

/**
 * Get the URL for a team's SVG icon (higher quality)
 * @param teamName - The name of the team
 * @returns URL to the team's SVG icon, or null if not available
 */
export const getTeamIconSvgUrl = (teamName: string): string | null => {
  if (!teamName) return null;
  
  const url = getTeamIconUrl(teamName);
  return url.endsWith('.svg') ? url : null;
};
