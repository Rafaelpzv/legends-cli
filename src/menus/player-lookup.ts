import inquirer from "inquirer";
import ora from "ora";
import { RiotClient, RiotApiError } from "../riot-client";
import {
  printSummonerCard,
  printMatches,
  printMasteries,
  printMatchSummary,
  c,
  clrscr,
} from "../display";
import { QueueFilter } from "../types";
import { loadChampions } from "../champions";

// ─── Parse "GameName#TAG" or just "GameName" ──────────────────────────────────

function parseRiotId(input: string): { gameName: string; tagLine: string } {
  const trimmed = input.trim();
  if (trimmed.includes("#")) {
    const [gameName, ...rest] = trimmed.split("#");
    return { gameName: gameName.trim(), tagLine: rest.join("#").trim() };
  }
  // Default tag for BR1
  return { gameName: trimmed, tagLine: "BR1" };
}

// ─── Matches sub-menu ─────────────────────────────────────────────────────────

async function fetchMatches(
  client: RiotClient,
  puuid: string,
  summonerName: string,
): Promise<void> {
  const { count, filter } = await inquirer.prompt([
    {
      type: "list",
      name: "count",
      message: "Quantas partidas buscar?",
      choices: [
        { name: "20 partidas", value: 20 },
        { name: "30 partidas", value: 30 },
        { name: "50 partidas", value: 50 },
        { name: "100 partidas", value: 100 },
      ],
    },
    {
      type: "list",
      name: "filter",
      message: "Filtrar por tipo de fila:",
      choices: [
        { name: "🌐  Todas", value: "all" },
        { name: "🏆  Ranked (S/D + Flex)", value: "ranked" },
        { name: "⚔️   Normal", value: "normal" },
        { name: "❄️   ARAM", value: "aram" },
      ],
    },
  ]);

  let page = 0;
  const PAGE_SIZE = count <= 20 ? count : 20;

  while (true) {
    const spinner = ora({
      text: `Buscando partidas de ${summonerName} (${page * PAGE_SIZE + 1}–${(page + 1) * PAGE_SIZE})…`,
      color: "cyan",
    }).start();

    try {
      const matches = await client.getMatches(
        puuid,
        PAGE_SIZE,
        filter as QueueFilter,
        page * PAGE_SIZE,
      );

      if (!matches.length) {
        spinner.warn("Nenhuma partida encontrada com este filtro.");
        break;
      }

      spinner.succeed(
        `${matches.length} partidas carregadas (página ${page + 1})`,
      );
      printMatches(matches, puuid);

      if (page === 0) printMatchSummary(matches, puuid);

      if (count <= PAGE_SIZE) break;

      const { action } = await inquirer.prompt([
        {
          type: "list",
          name: "action",
          message: "O que deseja fazer?",
          choices: [
            { name: "▶  Próxima página", value: "next" },
            { name: "◀  Voltar ao menu", value: "back" },
          ],
        },
      ]);

      if (action === "back") {
        clrscr();
        break;
      }

      page++;
    } catch (err) {
      spinner.fail("Erro ao buscar partidas");
      if (err instanceof RiotApiError) {
        console.error(c.red(`\n  ✖  ${err.message}\n`));
      }
      break;
    }
  }
}

// ─── Masteries sub-menu ───────────────────────────────────────────────────────

async function fetchMasteries(
  client: RiotClient,
  puuid: string,
  summonerName: string,
): Promise<void> {
  const spinner = ora({
    text: `Buscando maestrias de ${summonerName}…`,
    color: "cyan",
  }).start();
  try {
    await loadChampions();
    const masteries = await client.getTopMasteries(puuid, 5);
    clrscr();
    spinner.succeed("Maestrias carregadas!");
    printMasteries(masteries);
  } catch (err) {
    spinner.fail("Erro ao buscar maestrias");
    if (err instanceof RiotApiError) {
      console.error(c.red(`\n  ✖  ${err.message}\n`));
    }
  }
}

// ─── Main menu ────────────────────────────────────────────────────────────────

export async function menuPlayerLookup(client: RiotClient): Promise<void> {
  const { riotId } = await inquirer.prompt([
    {
      type: "input",
      name: "riotId",
      message: "Digite o Riot ID do jogador (ex: PlayerName#BR1):",
      validate: (v: string) =>
        v.trim().length > 0 ? true : "O nome não pode ser vazio.",
    },
  ]);

  const { gameName, tagLine } = parseRiotId(riotId);

  // ── Lookup account ──
  const spinner = ora({
    text: `Buscando conta ${gameName}#${tagLine}…`,
    color: "cyan",
  }).start();
  let puuid: string;
  let summoner: Awaited<ReturnType<RiotClient["getSummonerByPuuid"]>>;

  let account: Awaited<ReturnType<RiotClient["getAccountByRiotId"]>>;

  try {
    account = await client.getAccountByRiotId(gameName, tagLine);
    puuid = account.puuid;
    summoner = await client.getSummonerByPuuid(puuid);
    clrscr();
    spinner.succeed(
      `Jogador encontrado: ${c.bold(account.gameName)}#${account.tagLine}`,
    );
  } catch (err) {
    spinner.fail("Jogador não encontrado");
    if (err instanceof RiotApiError) {
      console.error(c.red(`\n  ✖  ${err.message}\n`));
    } else {
      console.error(c.red(`\n  ✖  ${(err as Error).message}\n`));
    }
    return;
  }

  // Exibe card fora do try/catch da API para não mascarar erros de display
  try {
    printSummonerCard(summoner, account.gameName, account.tagLine);
  } catch {
    // tabela falhou — segue sem ela
  }

  // ── Sub-menu ──
  while (true) {
    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: `O que deseja ver de ${c.bold(gameName)}?`,
        choices: [
          { name: "📋  Partidas recentes", value: "matches" },
          { name: "⭐  Top 5 Maestrias", value: "masteries" },
          { name: "🔍  Ambos (Maestrias + Partidas)", value: "both" },
          { name: "↩   Voltar ao menu principal", value: "back" },
        ],
      },
    ]);

    if (action === "back") {
      clrscr();
      break;
    }

    if (action === "masteries" || action === "both") {
      await fetchMasteries(client, puuid, gameName);
    }
    if (action === "matches" || action === "both") {
      await fetchMatches(client, puuid, gameName);
    }
  }
}
