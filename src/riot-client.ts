import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  RiotAccount, Summoner, ChampionMastery, Match, LeagueList,
  Region, RegionalCluster, REGION_TO_CLUSTER, TopTier, QueueFilter, QUEUE_FILTER_IDS,
} from './types';
import { withCache } from './cache';

// ─── Error handling ───────────────────────────────────────────────────────────

export class RiotApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) { super(message); this.name = 'RiotApiError'; }
}

function handleAxiosError(err: unknown): never {
  if (axios.isAxiosError(err)) {
    const e = err as AxiosError;
    const status = e.response?.status;
    const messages: Record<number, string> = {
      400: 'Requisição inválida. Verifique os parâmetros.',
      401: 'API Key inválida ou ausente. Configure RIOT_API_KEY no arquivo .env',
      403: 'Acesso negado. API Key pode ter expirado.',
      404: 'Recurso não encontrado (jogador, partida, etc).',
      429: 'Limite de requisições atingido. Aguarde alguns segundos e tente novamente.',
      500: 'Erro interno no servidor da Riot. Tente mais tarde.',
      503: 'Serviço da Riot indisponível. Tente mais tarde.',
    };
    throw new RiotApiError(
      status && messages[status]
        ? messages[status]
        : `Erro HTTP ${status}: ${e.message}`,
      status,
    );
  }
  throw new RiotApiError(`Erro de rede: ${(err as Error).message}`);
}

// ─── Client ───────────────────────────────────────────────────────────────────

export class RiotClient {
  private platform: AxiosInstance;
  private regional: AxiosInstance;
  private cluster:  RegionalCluster;
  private region:   Region;

  constructor(apiKey: string, region: Region) {
    this.region  = region;
    this.cluster = REGION_TO_CLUSTER[region];

    const headers = { 'X-Riot-Token': apiKey };

    this.platform = axios.create({
      baseURL: `https://${region}.api.riotgames.com`,
      headers,
      timeout: 15_000,
    });

    this.regional = axios.create({
      baseURL: `https://${this.cluster}.api.riotgames.com`,
      headers,
      timeout: 15_000,
    });
  }

  // ─── Account ───────────────────────────────────────────────────────────────

  async getAccountByPuuid(puuid: string): Promise<RiotAccount> {
    return withCache(`account_puuid_${puuid}`, async () => {
      try {
        const res = await this.regional.get<RiotAccount>(
          `/riot/account/v1/accounts/by-puuid/${puuid}`
        );
        return res.data;
      } catch (e) { handleAxiosError(e); }
    });
  }

  async getAccountByRiotId(gameName: string, tagLine: string): Promise<RiotAccount> {
    return withCache(`account_${gameName}_${tagLine}`, async () => {
      try {
        const res = await this.regional.get<RiotAccount>(
          `/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`
        );
        return res.data;
      } catch (e) { handleAxiosError(e); }
    });
  }

  async getSummonerById(summonerId: string): Promise<Summoner> {
    return withCache(`summoner_id_${summonerId}_${this.region}`, async () => {
      try {
        const res = await this.platform.get<Summoner>(
          `/lol/summoner/v4/summoners/${summonerId}`
        );
        return res.data;
      } catch (e) { handleAxiosError(e); }
    });
  }

  async getSummonerByPuuid(puuid: string): Promise<Summoner> {
    return withCache(`summoner_${puuid}_${this.region}`, async () => {
      try {
        const res = await this.platform.get<Summoner>(
          `/lol/summoner/v4/summoners/by-puuid/${puuid}`
        );
        return res.data;
      } catch (e) { handleAxiosError(e); }
    });
  }

  // ─── Masteries ─────────────────────────────────────────────────────────────

  async getTopMasteries(puuid: string, count = 5): Promise<ChampionMastery[]> {
    return withCache(`masteries_${puuid}_${this.region}_${count}`, async () => {
      try {
        const res = await this.platform.get<ChampionMastery[]>(
          `/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/top`,
          { params: { count } }
        );
        return res.data;
      } catch (e) { handleAxiosError(e); }
    });
  }

  // ─── Matches ───────────────────────────────────────────────────────────────

  async getMatchIds(
    puuid: string,
    count: number,
    filter: QueueFilter,
    start = 0,
  ): Promise<string[]> {
    const queueIds = QUEUE_FILTER_IDS[filter];
    const params: Record<string, unknown> = { count, start };

    // Riot API only accepts a single queue param at a time; for multi-queue we fetch each separately
    if (queueIds && queueIds.length === 1) {
      params.queue = queueIds[0];
    }

    const cacheKey = `matchids_${puuid}_${this.cluster}_${count}_${filter}_${start}`;
    return withCache(cacheKey, async () => {
      try {
        if (queueIds && queueIds.length > 1) {
          // fetch each queue type and merge
          const results = await Promise.all(
            queueIds.map(q =>
              this.regional
                .get<string[]>(`/lol/match/v5/matches/by-puuid/${puuid}/ids`, {
                  params: { count, start, queue: q },
                })
                .then(r => r.data)
                .catch(() => [] as string[])
            )
          );
          // merge, dedupe, keep at most `count` most recent
          const merged = [...new Set(results.flat())].slice(0, count);
          return merged;
        }

        const res = await this.regional.get<string[]>(
          `/lol/match/v5/matches/by-puuid/${puuid}/ids`,
          { params }
        );
        return res.data;
      } catch (e) { handleAxiosError(e); }
    }, 3 * 60 * 1000); // 3 min TTL for match IDs
  }

  async getMatch(matchId: string): Promise<Match> {
    return withCache(`match_${matchId}`, async () => {
      try {
        const res = await this.regional.get<Match>(`/lol/match/v5/matches/${matchId}`);
        return res.data;
      } catch (e) { handleAxiosError(e); }
    }, 60 * 60 * 1000); // 1h TTL – completed matches never change
  }

  async getMatches(
    puuid: string,
    count: number,
    filter: QueueFilter,
    start = 0,
  ): Promise<Match[]> {
    const ids     = await this.getMatchIds(puuid, count, filter, start);
    const results = await Promise.allSettled(ids.map(id => this.getMatch(id)));
    return results
      .filter((r): r is PromiseFulfilledResult<Match> => r.status === 'fulfilled')
      .map(r => r.value);
  }

  // ─── Leaderboard ───────────────────────────────────────────────────────────

  async getLeaderboard(tier: TopTier, queue = 'RANKED_SOLO_5x5'): Promise<LeagueList> {
    const cacheKey = `leaderboard_${tier}_${queue}_${this.region}`;
    return withCache(cacheKey, async () => {
      try {
        const endpoint =
          tier === 'CHALLENGER'  ? 'challengerleagues' :
          tier === 'GRANDMASTER' ? 'grandmasterleagues' : 'masterleagues';
        const res = await this.platform.get<LeagueList>(
          `/lol/league/v4/${endpoint}/by-queue/${queue}`
        );
        return res.data;
      } catch (e) { handleAxiosError(e); }
    }, 10 * 60 * 1000); // 10 min TTL
  }
}
// appended below existing methods — will be accessible on the class via prototype merge
