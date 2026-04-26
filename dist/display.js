"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.c = void 0;
exports.printBanner = printBanner;
exports.section = section;
exports.printSummonerCard = printSummonerCard;
exports.printMatches = printMatches;
exports.printMasteries = printMasteries;
exports.printLeaderboard = printLeaderboard;
exports.printMatchSummary = printMatchSummary;
exports.clrscr = clrscr;
const chalk_1 = __importDefault(require("chalk"));
const cli_table3_1 = __importDefault(require("cli-table3"));
const types_1 = require("./types");
const champions_1 = require("./champions");
// ─── Color helpers ────────────────────────────────────────────────────────────
exports.c = {
    gold: (s) => chalk_1.default.hex("#C89B3C")(s),
    silver: (s) => chalk_1.default.hex("#C0C0C0")(s),
    bronze: (s) => chalk_1.default.hex("#CD7F32")(s),
    win: (s) => chalk_1.default.hex("#2ECC71").bold(s),
    loss: (s) => chalk_1.default.hex("#E74C3C").bold(s),
    accent: (s) => chalk_1.default.hex("#0BC4E3")(s),
    title: (s) => chalk_1.default.hex("#C89B3C").bold(s),
    dim: (s) => chalk_1.default.hex("#666666")(s),
    white: (s) => chalk_1.default.white(s),
    bold: (s) => chalk_1.default.white.bold(s),
    blue: (s) => chalk_1.default.hex("#3498DB")(s),
    purple: (s) => chalk_1.default.hex("#9B59B6")(s),
    orange: (s) => chalk_1.default.hex("#E67E22")(s),
    green: (s) => chalk_1.default.hex("#27AE60")(s),
    red: (s) => chalk_1.default.hex("#E74C3C")(s),
};
const RANK_COLORS = [exports.c.gold, exports.c.silver, exports.c.bronze, exports.c.blue, exports.c.purple];
// ─── Banner ───────────────────────────────────────────────────────────────────
function printBanner() {
    console.log("\n" +
        exports.c.title("╔══════════════════════════════════════════════════════════╗"));
    console.log(exports.c.title("║") +
        "          " +
        exports.c.accent("⚔  LEAGUE OF LEGENDS  CLI  STATS  ⚔") +
        "             " +
        exports.c.title("║"));
    console.log(exports.c.title("╚══════════════════════════════════════════════════════════╝"));
    console.log(exports.c.dim("  Powered by Riot Games API  •  Use responsibly\n"));
}
// ─── Section header ───────────────────────────────────────────────────────────
function section(title) {
    const line = "─".repeat(60);
    console.log("\n" + exports.c.accent(`  ◆ ${title}`));
    console.log(exports.c.dim(`  ${line}`));
}
// ─── Summoner card ────────────────────────────────────────────────────────────
function printSummonerCard(summoner, gameName, tagLine) {
    section("PERFIL DO JOGADOR");
    const table = new cli_table3_1.default({ style: { head: [], border: [] } });
    table.push([exports.c.dim("Riot ID"), exports.c.bold(`${gameName}`) + exports.c.dim(`#${tagLine}`)], [exports.c.dim("Nível"), exports.c.gold(summoner.summonerLevel)], [exports.c.dim("Summoner ID"), exports.c.dim(summoner.id.slice(0, 20) + "…")]);
    console.log(table.toString());
}
// ─── KDA formatting ───────────────────────────────────────────────────────────
function kdaRatio(k, d, a) {
    const ratio = d === 0 ? Infinity : (k + a) / d;
    const label = ratio === Infinity ? "∞ Perfect" : ratio.toFixed(2);
    const color = ratio >= 5 ? exports.c.gold : ratio >= 3 ? exports.c.green : ratio >= 1.5 ? exports.c.white : exports.c.red;
    return `${chalk_1.default.white(k)}/${exports.c.red(d)}/${exports.c.blue(a)}  ${exports.c.dim("[")}${color(label)}${exports.c.dim("]")}`;
}
// ─── Matches table ────────────────────────────────────────────────────────────
function printMatches(matches, puuid) {
    section(`ÚLTIMAS ${matches.length} PARTIDAS`);
    const head = [
        exports.c.dim("#"),
        exports.c.dim("Data"),
        exports.c.dim("Modo"),
        exports.c.dim("Campeão"),
        exports.c.dim("K / D / A  [Ratio]"),
        exports.c.dim("Resultado"),
        exports.c.dim("Duração"),
        exports.c.dim("CS"),
        exports.c.dim("Ouro"),
    ];
    const table = new cli_table3_1.default({
        head,
        style: { head: [], border: [] },
        colAligns: [
            "right",
            "center",
            "left",
            "left",
            "left",
            "center",
            "center",
            "right",
            "right",
        ],
    });
    matches.forEach((match, idx) => {
        const me = match.info.participants.find((p) => p.puuid === puuid);
        if (!me)
            return;
        const win = me.win;
        const date = new Date(match.info.gameCreation).toLocaleDateString("pt-BR");
        const mode = types_1.QUEUE_MAP[match.info.queueId] ?? match.info.gameMode;
        const champ = me.championName || (0, champions_1.getChampionName)(me.championId);
        const dur = formatDuration(match.info.gameDuration);
        const cs = me.totalMinionsKilled + me.neutralMinionsKilled;
        const gold = formatK(me.goldEarned);
        const result = win ? exports.c.win("VITÓRIA") : exports.c.loss("DERROTA");
        const champStr = win ? exports.c.win(champ) : exports.c.loss(champ);
        const multi = getMultiKill(me);
        table.push([
            exports.c.dim(String(idx + 1)),
            exports.c.dim(date),
            exports.c.dim(shortMode(mode)),
            champStr + (multi ? `\n${exports.c.gold(multi)}` : ""),
            kdaRatio(me.kills, me.deaths, me.assists),
            result,
            exports.c.dim(dur),
            exports.c.dim(String(cs)),
            exports.c.dim(gold),
        ]);
    });
    console.log(table.toString());
}
// ─── Masteries table ──────────────────────────────────────────────────────────
function printMasteries(masteries) {
    section("TOP 5 MAESTRIAS DE CAMPEÕES");
    const table = new cli_table3_1.default({
        head: [
            exports.c.dim("#"),
            exports.c.dim("Campeão"),
            exports.c.dim("Nível"),
            exports.c.dim("Pontos"),
            exports.c.dim("Baú"),
            exports.c.dim("Último Jogo"),
        ],
        style: { head: [], border: [] },
        colAligns: ["right", "left", "center", "right", "center", "center"],
    });
    masteries.slice(0, 5).forEach((m, i) => {
        const colorFn = RANK_COLORS[i];
        const champ = (0, champions_1.getChampionName)(m.championId);
        const pts = formatNumber(m.championPoints);
        const last = new Date(m.lastPlayTime).toLocaleDateString("pt-BR");
        const chest = m.chestGranted ? exports.c.gold("✓") : exports.c.dim("✗");
        const levelBar = masteryBar(m.championLevel);
        table.push([
            colorFn(String(i + 1)),
            colorFn(champ),
            `${colorFn(String(m.championLevel))} ${levelBar}`,
            colorFn(pts),
            chest,
            exports.c.dim(last),
        ]);
    });
    console.log(table.toString());
}
// ─── Leaderboard table ────────────────────────────────────────────────────────
function printLeaderboard(entries, tier, topN = 20) {
    section(`TOP ${topN} — ${tier}`);
    const table = new cli_table3_1.default({
        head: [
            exports.c.dim("#"),
            exports.c.dim("Jogador"),
            exports.c.dim("LP"),
            exports.c.dim("W"),
            exports.c.dim("L"),
            exports.c.dim("Win%"),
            exports.c.dim("Flags"),
        ],
        style: { head: [], border: [] },
        colAligns: ["right", "left", "right", "right", "right", "right", "left"],
    });
    const sorted = [...entries]
        .sort((a, b) => b.leaguePoints - a.leaguePoints)
        .slice(0, topN);
    sorted.forEach((e, i) => {
        const wr = ((e.wins / (e.wins + e.losses)) * 100).toFixed(1);
        const wrStr = parseFloat(wr) >= 55
            ? exports.c.win(wr + "%")
            : parseFloat(wr) < 45
                ? exports.c.red(wr + "%")
                : exports.c.dim(wr + "%");
        const rankFn = i === 0 ? exports.c.gold : i === 1 ? exports.c.silver : i === 2 ? exports.c.bronze : exports.c.dim;
        const flags = [
            e.hotStreak ? exports.c.orange("🔥 Sequência") : "",
            e.veteran ? exports.c.purple("★ Veterano") : "",
            e.freshBlood ? exports.c.green("✦ Novo") : "",
        ]
            .filter(Boolean)
            .join(" ");
        const name = e.displayName ?? e.summonerName ?? e.puuid.slice(0, 16) + "…";
        table.push([
            rankFn(String(i + 1)),
            i < 3 ? rankFn(name) : exports.c.white(name),
            exports.c.gold(formatNumber(e.leaguePoints)),
            exports.c.green(String(e.wins)),
            exports.c.red(String(e.losses)),
            wrStr,
            flags || exports.c.dim("-"),
        ]);
    });
    console.log(table.toString());
}
// ─── Match stats summary ──────────────────────────────────────────────────────
function printMatchSummary(matches, puuid) {
    const participated = matches.filter((m) => m.info.participants.some((p) => p.puuid === puuid));
    if (!participated.length)
        return;
    const wins = participated.filter((m) => m.info.participants.find((p) => p.puuid === puuid)?.win).length;
    const losses = participated.length - wins;
    const wr = ((wins / participated.length) * 100).toFixed(1);
    const totKills = participated.reduce((s, m) => s + (m.info.participants.find((p) => p.puuid === puuid)?.kills ?? 0), 0);
    const totDeaths = participated.reduce((s, m) => s + (m.info.participants.find((p) => p.puuid === puuid)?.deaths ?? 0), 0);
    const totAssist = participated.reduce((s, m) => s + (m.info.participants.find((p) => p.puuid === puuid)?.assists ?? 0), 0);
    const n = participated.length;
    section("RESUMO DAS PARTIDAS");
    const table = new cli_table3_1.default({ style: { head: [], border: [] } });
    table.push([exports.c.dim("Partidas analisadas"), exports.c.white(String(n))], [
        exports.c.dim("Vitórias / Derrotas"),
        `${exports.c.win(String(wins))} / ${exports.c.loss(String(losses))}`,
    ], [
        exports.c.dim("Taxa de vitória"),
        parseFloat(wr) >= 50 ? exports.c.win(wr + "%") : exports.c.loss(wr + "%"),
    ], [
        exports.c.dim("KDA médio"),
        kdaRatio(+(totKills / n).toFixed(1), +(totDeaths / n).toFixed(1), +(totAssist / n).toFixed(1)),
    ]);
    console.log(table.toString());
}
// ─── Private helpers ──────────────────────────────────────────────────────────
function formatDuration(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m${s.toString().padStart(2, "0")}s`;
}
function formatNumber(n) {
    return n.toLocaleString("en-US");
}
function formatK(n) {
    return n >= 1000 ? (n / 1000).toFixed(1) + "k" : String(n);
}
function shortMode(mode) {
    return mode
        .replace("Ranked ", "R.")
        .replace("Normal ", "N.")
        .replace("Solo/Duo", "S/D")
        .replace("/Duo", "")
        .slice(0, 14);
}
function masteryBar(level) {
    const filled = Math.min(level, 7);
    return exports.c.gold("█".repeat(filled)) + exports.c.dim("░".repeat(7 - filled));
}
function getMultiKill(p) {
    if (p.pentaKills > 0)
        return "🏆 PENTA KILL!";
    if (p.quadraKills > 0)
        return "🔥 QUADRA KILL";
    if (p.tripleKills > 0)
        return "⚡ TRIPLE KILL";
    return null;
}
// ─── Clear screen ────────────────────────────────────
function clrscr() {
    process.stdout.write(process.platform === "win32" ? "\x1Bc" : "\x1B[2J\x1B[3J\x1B[H");
}
