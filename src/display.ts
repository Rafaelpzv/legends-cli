import chalk from "chalk";
import Table from "cli-table3";
import {
  Match,
  MatchParticipant,
  ChampionMastery,
  Summoner,
  LeagueEntry,
  QUEUE_MAP,
} from "./types";
import { getChampionName } from "./champions";

// ─── Color helpers ────────────────────────────────────────────────────────────

export const c = {
  gold: (s: string | number) => chalk.hex("#C89B3C")(s),
  silver: (s: string | number) => chalk.hex("#C0C0C0")(s),
  bronze: (s: string | number) => chalk.hex("#CD7F32")(s),
  win: (s: string | number) => chalk.hex("#2ECC71").bold(s),
  loss: (s: string | number) => chalk.hex("#E74C3C").bold(s),
  accent: (s: string | number) => chalk.hex("#0BC4E3")(s),
  title: (s: string | number) => chalk.hex("#C89B3C").bold(s),
  dim: (s: string | number) => chalk.hex("#666666")(s),
  white: (s: string | number) => chalk.white(s),
  bold: (s: string | number) => chalk.white.bold(s),
  blue: (s: string | number) => chalk.hex("#3498DB")(s),
  purple: (s: string | number) => chalk.hex("#9B59B6")(s),
  orange: (s: string | number) => chalk.hex("#E67E22")(s),
  green: (s: string | number) => chalk.hex("#27AE60")(s),
  red: (s: string | number) => chalk.hex("#E74C3C")(s),
};

const RANK_COLORS = [c.gold, c.silver, c.bronze, c.blue, c.purple];

// ─── Banner ───────────────────────────────────────────────────────────────────

export function printBanner(): void {
  console.log(
    "\n" +
      c.title("╔══════════════════════════════════════════════════════════╗"),
  );
  console.log(
    c.title("║") +
      "          " +
      c.accent("⚔  LEAGUE OF LEGENDS  CLI  STATS  ⚔") +
      "          " +
      c.title("║"),
  );
  console.log(
    c.title("╚══════════════════════════════════════════════════════════╝"),
  );
  console.log(c.dim("  Powered by Riot Games API  •  Use responsibly\n"));
}

// ─── Section header ───────────────────────────────────────────────────────────

export function section(title: string): void {
  const line = "─".repeat(60);
  console.log("\n" + c.accent(`  ◆ ${title}`));
  console.log(c.dim(`  ${line}`));
}

// ─── Summoner card ────────────────────────────────────────────────────────────

export function printSummonerCard(
  summoner: Summoner,
  gameName: string,
  tagLine: string,
): void {
  section("PERFIL DO JOGADOR");
  const table = new Table({ style: { head: [], border: [] } });
  table.push(
    [c.dim("Riot ID"), c.bold(`${gameName}`) + c.dim(`#${tagLine}`)],
    [c.dim("Nível"), c.gold(summoner.summonerLevel)],
    [c.dim("Summoner ID"), c.dim(summoner.id.slice(0, 20) + "…")],
  );
  console.log(table.toString());
}

// ─── KDA formatting ───────────────────────────────────────────────────────────

function kdaRatio(k: number, d: number, a: number): string {
  const ratio = d === 0 ? Infinity : (k + a) / d;
  const label = ratio === Infinity ? "∞ Perfect" : ratio.toFixed(2);
  const color =
    ratio >= 5 ? c.gold : ratio >= 3 ? c.green : ratio >= 1.5 ? c.white : c.red;
  return `${chalk.white(k)}/${c.red(d)}/${c.blue(a)}  ${c.dim("[")}${color(label)}${c.dim("]")}`;
}

// ─── Matches table ────────────────────────────────────────────────────────────

export function printMatches(matches: Match[], puuid: string): void {
  section(`ÚLTIMAS ${matches.length} PARTIDAS`);

  const head = [
    c.dim("#"),
    c.dim("Data"),
    c.dim("Modo"),
    c.dim("Campeão"),
    c.dim("K / D / A  [Ratio]"),
    c.dim("Resultado"),
    c.dim("Duração"),
    c.dim("CS"),
    c.dim("Ouro"),
  ];

  const table = new Table({
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
    if (!me) return;

    const win = me.win;
    const date = new Date(match.info.gameCreation).toLocaleDateString("pt-BR");
    const mode = QUEUE_MAP[match.info.queueId] ?? match.info.gameMode;
    const champ = me.championName || getChampionName(me.championId);
    const dur = formatDuration(match.info.gameDuration);
    const cs = me.totalMinionsKilled + me.neutralMinionsKilled;
    const gold = formatK(me.goldEarned);
    const result = win ? c.win("VITÓRIA") : c.loss("DERROTA");
    const champStr = win ? c.win(champ) : c.loss(champ);
    const multi = getMultiKill(me);

    table.push([
      c.dim(String(idx + 1)),
      c.dim(date),
      c.dim(shortMode(mode)),
      champStr + (multi ? `\n${c.gold(multi)}` : ""),
      kdaRatio(me.kills, me.deaths, me.assists),
      result,
      c.dim(dur),
      c.dim(String(cs)),
      c.dim(gold),
    ]);
  });

  console.log(table.toString());
}

// ─── Masteries table ──────────────────────────────────────────────────────────

export function printMasteries(masteries: ChampionMastery[]): void {
  section("TOP 5 MAESTRIAS DE CAMPEÕES");

  const table = new Table({
    head: [
      c.dim("#"),
      c.dim("Campeão"),
      c.dim("Nível"),
      c.dim("Pontos"),
      c.dim("Baú"),
      c.dim("Último Jogo"),
    ],
    style: { head: [], border: [] },
    colAligns: ["right", "left", "center", "right", "center", "center"],
  });

  masteries.slice(0, 5).forEach((m, i) => {
    const colorFn = RANK_COLORS[i];
    const champ = getChampionName(m.championId);
    const pts = formatNumber(m.championPoints);
    const last = new Date(m.lastPlayTime).toLocaleDateString("pt-BR");
    const chest = m.chestGranted ? c.gold("✓") : c.dim("✗");
    const levelBar = masteryBar(m.championLevel);

    table.push([
      colorFn(String(i + 1)),
      colorFn(champ),
      `${colorFn(String(m.championLevel))} ${levelBar}`,
      colorFn(pts),
      chest,
      c.dim(last),
    ]);
  });

  console.log(table.toString());
}

// ─── Leaderboard table ────────────────────────────────────────────────────────

export function printLeaderboard(
  entries: LeagueEntry[],
  tier: string,
  topN = 20,
): void {
  section(`TOP ${topN} — ${tier}`);

  const table = new Table({
    head: [
      c.dim("#"),
      c.dim("Jogador"),
      c.dim("LP"),
      c.dim("W"),
      c.dim("L"),
      c.dim("Win%"),
      c.dim("Flags"),
    ],
    style: { head: [], border: [] },
    colAligns: ["right", "left", "right", "right", "right", "right", "left"],
  });

  const sorted = [...entries]
    .sort((a, b) => b.leaguePoints - a.leaguePoints)
    .slice(0, topN);

  sorted.forEach((e, i) => {
    const wr = ((e.wins / (e.wins + e.losses)) * 100).toFixed(1);
    const wrStr =
      parseFloat(wr) >= 55
        ? c.win(wr + "%")
        : parseFloat(wr) < 45
          ? c.red(wr + "%")
          : c.dim(wr + "%");
    const rankFn =
      i === 0 ? c.gold : i === 1 ? c.silver : i === 2 ? c.bronze : c.dim;
    const flags = [
      e.hotStreak ? c.orange("🔥 Sequência") : "",
      e.veteran ? c.purple("★ Veterano") : "",
      e.freshBlood ? c.green("✦ Novo") : "",
    ]
      .filter(Boolean)
      .join(" ");

    const name = e.displayName ?? e.summonerName ?? e.puuid.slice(0, 16) + "…";
    table.push([
      rankFn(String(i + 1)),
      i < 3 ? rankFn(name) : c.white(name),
      c.gold(formatNumber(e.leaguePoints)),
      c.green(String(e.wins)),
      c.red(String(e.losses)),
      wrStr,
      flags || c.dim("-"),
    ]);
  });

  console.log(table.toString());
}

// ─── Match stats summary ──────────────────────────────────────────────────────

export function printMatchSummary(matches: Match[], puuid: string): void {
  const participated = matches.filter((m) =>
    m.info.participants.some((p) => p.puuid === puuid),
  );
  if (!participated.length) return;

  const wins = participated.filter(
    (m) => m.info.participants.find((p) => p.puuid === puuid)?.win,
  ).length;
  const losses = participated.length - wins;
  const wr = ((wins / participated.length) * 100).toFixed(1);
  const totKills = participated.reduce(
    (s, m) =>
      s + (m.info.participants.find((p) => p.puuid === puuid)?.kills ?? 0),
    0,
  );
  const totDeaths = participated.reduce(
    (s, m) =>
      s + (m.info.participants.find((p) => p.puuid === puuid)?.deaths ?? 0),
    0,
  );
  const totAssist = participated.reduce(
    (s, m) =>
      s + (m.info.participants.find((p) => p.puuid === puuid)?.assists ?? 0),
    0,
  );
  const n = participated.length;

  section("RESUMO DAS PARTIDAS");
  const table = new Table({ style: { head: [], border: [] } });
  table.push(
    [c.dim("Partidas analisadas"), c.white(String(n))],
    [
      c.dim("Vitórias / Derrotas"),
      `${c.win(String(wins))} / ${c.loss(String(losses))}`,
    ],
    [
      c.dim("Taxa de vitória"),
      parseFloat(wr) >= 50 ? c.win(wr + "%") : c.loss(wr + "%"),
    ],
    [
      c.dim("KDA médio"),
      kdaRatio(
        +(totKills / n).toFixed(1),
        +(totDeaths / n).toFixed(1),
        +(totAssist / n).toFixed(1),
      ),
    ],
  );
  console.log(table.toString());
}

// ─── Private helpers ──────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m${s.toString().padStart(2, "0")}s`;
}

function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

function formatK(n: number): string {
  return n >= 1000 ? (n / 1000).toFixed(1) + "k" : String(n);
}

function shortMode(mode: string): string {
  return mode
    .replace("Ranked ", "R.")
    .replace("Normal ", "N.")
    .replace("Solo/Duo", "S/D")
    .replace("/Duo", "")
    .slice(0, 14);
}

function masteryBar(level: number): string {
  const filled = Math.min(level, 7);
  return c.gold("█".repeat(filled)) + c.dim("░".repeat(7 - filled));
}

function getMultiKill(p: MatchParticipant): string | null {
  if (p.pentaKills > 0) return "🏆 PENTA KILL!";
  if (p.quadraKills > 0) return "🔥 QUADRA KILL";
  if (p.tripleKills > 0) return "⚡ TRIPLE KILL";
  return null;
}

// ─── Clear screen ────────────────────────────────────

export function clrscr(): void {
  process.stdout.write(
    process.platform === "win32" ? "\x1Bc" : "\x1B[2J\x1B[3J\x1B[H",
  );
}
