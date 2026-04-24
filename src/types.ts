// ─── Regions & Routing ──────────────────────────────────────────────────────

export type Region =
  | 'br1' | 'na1' | 'euw1' | 'eun1' | 'kr'
  | 'jp1' | 'la1' | 'la2' | 'oc1'  | 'tr1' | 'ru';

export type RegionalCluster = 'americas' | 'europe' | 'asia' | 'sea';

export const REGION_TO_CLUSTER: Record<Region, RegionalCluster> = {
  br1: 'americas', na1: 'americas', la1: 'americas', la2: 'americas',
  euw1: 'europe',  eun1: 'europe',  tr1: 'europe',   ru: 'europe',
  kr: 'asia',      jp1: 'asia',
  oc1: 'sea',
};

export const REGION_LABELS: Record<Region, string> = {
  br1:  'Brazil (BR)',
  na1:  'North America (NA)',
  euw1: 'EU West (EUW)',
  eun1: 'EU Nordic & East (EUNE)',
  kr:   'Korea (KR)',
  jp1:  'Japan (JP)',
  la1:  'Latin America North (LAN)',
  la2:  'Latin America South (LAS)',
  oc1:  'Oceania (OCE)',
  tr1:  'Turkey (TR)',
  ru:   'Russia (RU)',
};

// ─── Queue Types ─────────────────────────────────────────────────────────────

export const QUEUE_MAP: Record<number, string> = {
  420:  'Ranked Solo/Duo',
  440:  'Ranked Flex',
  450:  'ARAM',
  400:  'Normal Draft',
  430:  'Normal Blind',
  700:  'Clash',
  0:    'Custom',
  490:  'Quickplay',
  900:  'URF',
  1020: 'One for All',
  1300: 'Nexus Blitz',
  1400: 'Ultimate Spellbook',
  1700: 'Arena',
  1900: 'URF',
};

export type QueueFilter = 'all' | 'ranked' | 'normal' | 'aram';

export const QUEUE_FILTER_IDS: Record<QueueFilter, number[] | null> = {
  all:    null,
  ranked: [420, 440],
  normal: [400, 430, 490],
  aram:   [450],
};

// ─── Riot API DTOs ────────────────────────────────────────────────────────────

export interface RiotAccount {
  puuid:    string;
  gameName: string;
  tagLine:  string;
}

export interface Summoner {
  id:             string;
  accountId:      string;
  puuid:          string;
  name:           string;
  profileIconId:  number;
  summonerLevel:  number;
  revisionDate:   number;
}

export interface ChampionMastery {
  championId:                    number;
  championLevel:                 number;
  championPoints:                number;
  lastPlayTime:                  number;
  championPointsSinceLastLevel:  number;
  championPointsUntilNextLevel:  number;
  chestGranted:                  boolean;
  tokensEarned:                  number;
  summonerId:                    string;
}

export interface MatchParticipant {
  puuid:                          string;
  summonerName:                   string;
  riotIdGameName:                 string;
  riotIdTagline:                  string;
  championName:                   string;
  championId:                     number;
  kills:                          number;
  deaths:                         number;
  assists:                        number;
  win:                            boolean;
  totalDamageDealtToChampions:    number;
  totalMinionsKilled:             number;
  neutralMinionsKilled:           number;
  goldEarned:                     number;
  visionScore:                    number;
  teamPosition:                   string;
  individualPosition:             string;
  doubleKills:                    number;
  tripleKills:                    number;
  quadraKills:                    number;
  pentaKills:                     number;
  item0: number; item1: number; item2: number;
  item3: number; item4: number; item5: number; item6: number;
}

export interface MatchInfo {
  gameId:       number;
  gameDuration: number;
  gameMode:     string;
  gameType:     string;
  gameVersion:  string;
  queueId:      number;
  participants: MatchParticipant[];
  gameCreation: number;
  gameEndTimestamp?: number;
}

export interface Match {
  metadata: { dataVersion: string; matchId: string; participants: string[] };
  info:     MatchInfo;
}

// ─── Ranked / Leaderboard ────────────────────────────────────────────────────

export interface LeagueEntry {
  puuid:         string;           // presente na API atual
  summonerId?:   string;           // deprecated - pode não vir
  summonerName:  string;           // vazio na API atual - resolvemos via puuid
  displayName?:  string;           // gameName#tagLine resolvido por nós
  leaguePoints:  number;
  rank:          string;
  wins:          number;
  losses:        number;
  veteran:       boolean;
  inactive:      boolean;
  freshBlood:    boolean;
  hotStreak:     boolean;
}

export interface LeagueList {
  leagueId: string;
  entries:  LeagueEntry[];
  tier:     string;
  name:     string;
  queue:    string;
}

export type TopTier = 'CHALLENGER' | 'GRANDMASTER' | 'MASTER';
