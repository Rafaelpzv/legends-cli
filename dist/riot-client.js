"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiotClient = exports.RiotApiError = void 0;
const axios_1 = __importDefault(require("axios"));
const types_1 = require("./types");
const cache_1 = require("./cache");
// ─── Error handling ───────────────────────────────────────────────────────────
class RiotApiError extends Error {
    constructor(message, status) {
        super(message);
        this.status = status;
        this.name = 'RiotApiError';
    }
}
exports.RiotApiError = RiotApiError;
function handleAxiosError(err) {
    if (axios_1.default.isAxiosError(err)) {
        const e = err;
        const status = e.response?.status;
        const messages = {
            400: 'Requisição inválida. Verifique os parâmetros.',
            401: 'API Key inválida ou ausente. Configure RIOT_API_KEY no arquivo .env',
            403: 'Acesso negado. API Key pode ter expirado.',
            404: 'Recurso não encontrado (jogador, partida, etc).',
            429: 'Limite de requisições atingido. Aguarde alguns segundos e tente novamente.',
            500: 'Erro interno no servidor da Riot. Tente mais tarde.',
            503: 'Serviço da Riot indisponível. Tente mais tarde.',
        };
        throw new RiotApiError(status && messages[status]
            ? messages[status]
            : `Erro HTTP ${status}: ${e.message}`, status);
    }
    throw new RiotApiError(`Erro de rede: ${err.message}`);
}
// ─── Client ───────────────────────────────────────────────────────────────────
class RiotClient {
    constructor(apiKey, region) {
        this.region = region;
        this.cluster = types_1.REGION_TO_CLUSTER[region];
        const headers = { 'X-Riot-Token': apiKey };
        this.platform = axios_1.default.create({
            baseURL: `https://${region}.api.riotgames.com`,
            headers,
            timeout: 15000,
        });
        this.regional = axios_1.default.create({
            baseURL: `https://${this.cluster}.api.riotgames.com`,
            headers,
            timeout: 15000,
        });
    }
    // ─── Account ───────────────────────────────────────────────────────────────
    async getAccountByPuuid(puuid) {
        return (0, cache_1.withCache)(`account_puuid_${puuid}`, async () => {
            try {
                const res = await this.regional.get(`/riot/account/v1/accounts/by-puuid/${puuid}`);
                return res.data;
            }
            catch (e) {
                handleAxiosError(e);
            }
        });
    }
    async getAccountByRiotId(gameName, tagLine) {
        return (0, cache_1.withCache)(`account_${gameName}_${tagLine}`, async () => {
            try {
                const res = await this.regional.get(`/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`);
                return res.data;
            }
            catch (e) {
                handleAxiosError(e);
            }
        });
    }
    async getSummonerById(summonerId) {
        return (0, cache_1.withCache)(`summoner_id_${summonerId}_${this.region}`, async () => {
            try {
                const res = await this.platform.get(`/lol/summoner/v4/summoners/${summonerId}`);
                return res.data;
            }
            catch (e) {
                handleAxiosError(e);
            }
        });
    }
    async getSummonerByPuuid(puuid) {
        return (0, cache_1.withCache)(`summoner_${puuid}_${this.region}`, async () => {
            try {
                const res = await this.platform.get(`/lol/summoner/v4/summoners/by-puuid/${puuid}`);
                return res.data;
            }
            catch (e) {
                handleAxiosError(e);
            }
        });
    }
    // ─── Masteries ─────────────────────────────────────────────────────────────
    async getTopMasteries(puuid, count = 5) {
        return (0, cache_1.withCache)(`masteries_${puuid}_${this.region}_${count}`, async () => {
            try {
                const res = await this.platform.get(`/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/top`, { params: { count } });
                return res.data;
            }
            catch (e) {
                handleAxiosError(e);
            }
        });
    }
    // ─── Matches ───────────────────────────────────────────────────────────────
    async getMatchIds(puuid, count, filter, start = 0) {
        const queueIds = types_1.QUEUE_FILTER_IDS[filter];
        const params = { count, start };
        // Riot API only accepts a single queue param at a time; for multi-queue we fetch each separately
        if (queueIds && queueIds.length === 1) {
            params.queue = queueIds[0];
        }
        const cacheKey = `matchids_${puuid}_${this.cluster}_${count}_${filter}_${start}`;
        return (0, cache_1.withCache)(cacheKey, async () => {
            try {
                if (queueIds && queueIds.length > 1) {
                    // fetch each queue type and merge
                    const results = await Promise.all(queueIds.map(q => this.regional
                        .get(`/lol/match/v5/matches/by-puuid/${puuid}/ids`, {
                        params: { count, start, queue: q },
                    })
                        .then(r => r.data)
                        .catch(() => [])));
                    // merge, dedupe, keep at most `count` most recent
                    const merged = [...new Set(results.flat())].slice(0, count);
                    return merged;
                }
                const res = await this.regional.get(`/lol/match/v5/matches/by-puuid/${puuid}/ids`, { params });
                return res.data;
            }
            catch (e) {
                handleAxiosError(e);
            }
        }, 3 * 60 * 1000); // 3 min TTL for match IDs
    }
    async getMatch(matchId) {
        return (0, cache_1.withCache)(`match_${matchId}`, async () => {
            try {
                const res = await this.regional.get(`/lol/match/v5/matches/${matchId}`);
                return res.data;
            }
            catch (e) {
                handleAxiosError(e);
            }
        }, 60 * 60 * 1000); // 1h TTL – completed matches never change
    }
    async getMatches(puuid, count, filter, start = 0) {
        const ids = await this.getMatchIds(puuid, count, filter, start);
        const results = await Promise.allSettled(ids.map(id => this.getMatch(id)));
        return results
            .filter((r) => r.status === 'fulfilled')
            .map(r => r.value);
    }
    // ─── Leaderboard ───────────────────────────────────────────────────────────
    async getLeaderboard(tier, queue = 'RANKED_SOLO_5x5') {
        const cacheKey = `leaderboard_${tier}_${queue}_${this.region}`;
        return (0, cache_1.withCache)(cacheKey, async () => {
            try {
                const endpoint = tier === 'CHALLENGER' ? 'challengerleagues' :
                    tier === 'GRANDMASTER' ? 'grandmasterleagues' : 'masterleagues';
                const res = await this.platform.get(`/lol/league/v4/${endpoint}/by-queue/${queue}`);
                return res.data;
            }
            catch (e) {
                handleAxiosError(e);
            }
        }, 10 * 60 * 1000); // 10 min TTL
    }
}
exports.RiotClient = RiotClient;
// appended below existing methods — will be accessible on the class via prototype merge
