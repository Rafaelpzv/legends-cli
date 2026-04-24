"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.menuTopPlayers = menuTopPlayers;
const inquirer_1 = __importDefault(require("inquirer"));
const ora_1 = __importDefault(require("ora"));
const riot_client_1 = require("../riot-client");
const display_1 = require("../display");
// Resolve gameName#tagLine via puuid (campo que a API retorna no leaderboard hoje)
async function resolveNames(client, entries, spinner) {
    const BATCH = 10;
    const result = [...entries];
    for (let i = 0; i < entries.length; i += BATCH) {
        spinner.text = `Resolvendo nomes (${Math.min(i + BATCH, entries.length)}/${entries.length})…`;
        const batch = entries.slice(i, i + BATCH);
        const settled = await Promise.allSettled(batch.map((e) => client.getAccountByPuuid(e.puuid)));
        settled.forEach((res, j) => {
            if (res.status === "fulfilled") {
                const { gameName, tagLine } = res.value;
                result[i + j] = {
                    ...result[i + j],
                    displayName: `${gameName}#${tagLine}`,
                };
            }
        });
        // Pausa entre batches para respeitar rate limit
        if (i + BATCH < entries.length) {
            await new Promise((r) => setTimeout(r, 600));
        }
    }
    return result;
}
async function menuTopPlayers(client) {
    (0, display_1.clrscr)();
    const { tier, topN } = await inquirer_1.default.prompt([
        {
            type: "list",
            name: "tier",
            message: "Selecione o tier:",
            choices: [
                { name: "👑  Challenger", value: "CHALLENGER" },
                { name: "💎  Grandmaster", value: "GRANDMASTER" },
                { name: "🔮  Master", value: "MASTER" },
            ],
        },
        {
            type: "list",
            name: "topN",
            message: "Quantos jogadores exibir?",
            choices: [
                { name: "Top 10", value: 10 },
                { name: "Top 20", value: 20 },
                { name: "Top 50", value: 50 },
                { name: "Top 100", value: 100 },
            ],
            default: 1,
        },
    ]);
    const spinner = (0, ora_1.default)({
        text: `Buscando ${tier} leaderboard…`,
        color: "yellow",
    }).start();
    try {
        const league = await client.getLeaderboard(tier);
        const topEntries = [...league.entries]
            .sort((a, b) => b.leaguePoints - a.leaguePoints)
            .slice(0, topN);
        spinner.text = `Resolvendo Riot IDs de ${topEntries.length} jogadores…`;
        const resolved = await resolveNames(client, topEntries, spinner);
        spinner.succeed(`${league.tier} — ${league.name}  (${league.entries.length} jogadores no total)`);
        (0, display_1.printLeaderboard)(resolved, league.tier, topN);
    }
    catch (err) {
        spinner.fail("Erro ao buscar leaderboard");
        if (err instanceof riot_client_1.RiotApiError) {
            console.error(display_1.c.red(`\n  ✖  ${err.message}\n`));
        }
        else {
            throw err;
        }
    }
}
