"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadChampions = loadChampions;
exports.getChampionName = getChampionName;
const axios_1 = __importDefault(require("axios"));
const cache_1 = require("./cache");
let championMap = {};
let loaded = false;
async function loadChampions() {
    if (loaded)
        return;
    championMap = await (0, cache_1.withCache)('ddragon_champions', async () => {
        const versRes = await axios_1.default.get('https://ddragon.leagueoflegends.com/api/versions.json', { timeout: 10000 });
        const version = versRes.data[0];
        const champRes = await axios_1.default.get(`https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`, { timeout: 10000 });
        const data = champRes.data.data;
        const map = {};
        for (const champ of Object.values(data)) {
            map[parseInt(champ.key)] = champ.name;
        }
        return map;
    }, 24 * 60 * 60 * 1000); // 24h TTL
    loaded = true;
}
function getChampionName(id) {
    return championMap[id] ?? `#${id}`;
}
