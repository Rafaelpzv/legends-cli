#!/usr/bin/env node
"use strict";
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (
          !desc ||
          ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)
        ) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
      }
    : function (o, v) {
        o["default"] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  (function () {
    var ownKeys = function (o) {
      ownKeys =
        Object.getOwnPropertyNames ||
        function (o) {
          var ar = [];
          for (var k in o)
            if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
          return ar;
        };
      return ownKeys(o);
    };
    return function (mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null)
        for (var k = ownKeys(mod), i = 0; i < k.length; i++)
          if (k[i] !== "default") __createBinding(result, mod, k[i]);
      __setModuleDefault(result, mod);
      return result;
    };
  })();
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
// ─── Config stored in ~/.legends-cli/.env (works from any directory) ─────────────
const CONFIG_DIR = path.join(os.homedir(), ".legends-cli");
const CONFIG_FILE = path.join(CONFIG_DIR, ".env");
// Load from home dir config before dotenv defaults
require("dotenv").config({ path: CONFIG_FILE });
const inquirer_1 = __importDefault(require("inquirer"));
const riot_client_1 = require("./riot-client");
const display_1 = require("./display");
const cache_1 = require("./cache");
const top_players_1 = require("./menus/top-players");
const player_lookup_1 = require("./menus/player-lookup");
const types_1 = require("./types");
// ─── Setup command: legends-cli <API_KEY> ────────────────────────────────────────
const cliArg = process.argv[2]?.trim();
if (cliArg) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, `RIOT_API_KEY=${cliArg}\n`, "utf-8");
  console.log(display_1.c.green("\n  ✓  API Key salva com sucesso!"));
  console.log(display_1.c.dim(`     Arquivo: ${CONFIG_FILE}`));
  console.log(
    display_1.c.dim("     Agora rode: ") + display_1.c.white("legends-cli\n"),
  );
  process.exit(0);
}
// ─── Open browser helper ──────────────────────────────────────────────────────
function openBrowser(url) {
  const cmd =
    process.platform === "win32"
      ? `start "" "${url}"`
      : process.platform === "darwin"
        ? `open "${url}"`
        : `xdg-open "${url}"`;
  (0, child_process_1.exec)(cmd);
}
// ─── Validate environment ─────────────────────────────────────────────────────
function getApiKey() {
  const key = process.env.RIOT_API_KEY?.trim();
  if (!key) {
    console.log(
      display_1.c.orange("\n  ⚠  Nenhuma API Key da Riot encontrada!\n"),
    );
    console.log(
      "  " + display_1.c.white("Para obter sua chave, siga os passos:"),
    );
    console.log(
      display_1.c.dim("  1. Acesse:  ") +
        display_1.c.accent("https://developer.riotgames.com"),
    );
    console.log(display_1.c.dim("  2. Faça login com sua conta Riot"));
    console.log(
      display_1.c.dim("  3. Copie sua") +
        display_1.c.white(" Development API Key") +
        display_1.c.dim(" no painel"),
    );
    console.log(display_1.c.dim("  4. Configure rodando o comando:\n"));
    console.log(
      "     " +
        display_1.c.green("lol-cli") +
        display_1.c.white(" RGAPI-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx") +
        "\n",
    );
    console.log(
      display_1.c.dim("  ↗  Abrindo o portal da Riot no navegador...\n"),
    );
    openBrowser("https://developer.riotgames.com");
    process.exit(1);
  }
  return key;
}
// ─── Region picker ────────────────────────────────────────────────────────────
async function pickRegion() {
  const { region } = await inquirer_1.default.prompt([
    {
      type: "list",
      name: "region",
      message: "Selecione a região:",
      choices: Object.entries(types_1.REGION_LABELS).map(([value, name]) => ({
        name,
        value,
      })),
      default: "br1",
    },
  ]);
  return region;
}
// ─── Main loop ────────────────────────────────────────────────────────────────
async function main() {
  (0, display_1.printBanner)();
  const apiKey = getApiKey();
  const region = await pickRegion();
  const client = new riot_client_1.RiotClient(apiKey, region);
  console.log(
    display_1.c.dim(
      `\n  Conectado à região: ${display_1.c.accent(types_1.REGION_LABELS[region])}\n`,
    ),
  );
  while (true) {
    const { menu } = await inquirer_1.default.prompt([
      {
        type: "list",
        name: "menu",
        message: "Menu principal — o que deseja fazer?",
        choices: [
          {
            name: "🔍  Buscar jogador (Partidas + Maestrias)",
            value: "player",
          },
          { name: "🏆  Ver top players da região", value: "top" },
          { name: "🌍  Trocar região", value: "region" },
          { name: "🗑   Limpar cache", value: "cache" },
          { name: "❌  Sair", value: "exit" },
        ],
      },
    ]);
    switch (menu) {
      case "player":
        await (0, player_lookup_1.menuPlayerLookup)(client);
        break;
      case "top":
        await (0, top_players_1.menuTopPlayers)(client);
        break;
      case "region": {
        const newRegion = await pickRegion();
        const newClient = new riot_client_1.RiotClient(apiKey, newRegion);
        console.log(
          display_1.c.dim(
            `\n  Região alterada para: ${display_1.c.accent(types_1.REGION_LABELS[newRegion])}\n`,
          ),
        );
        await runLoop(apiKey, newRegion);
        return;
      }
      case "cache":
        (0, cache_1.cacheClear)();
        console.log(display_1.c.green("\n  ✓  Cache limpo com sucesso!\n"));
        break;
      case "exit":
        console.log(display_1.c.dim("\n  Até a próxima, invocador! ⚔\n"));
        process.exit(0);
    }
  }
}
async function runLoop(apiKey, region) {
  const client = new riot_client_1.RiotClient(apiKey, region);
  while (true) {
    const { menu } = await inquirer_1.default.prompt([
      {
        type: "list",
        name: "menu",
        message: `Menu principal [${types_1.REGION_LABELS[region]}] — o que deseja fazer?`,
        choices: [
          {
            name: "🔍  Buscar jogador (Partidas + Maestrias)",
            value: "player",
          },
          { name: "🏆  Ver top players da região", value: "top" },
          { name: "🌍  Trocar região", value: "region" },
          { name: "🗑   Limpar cache", value: "cache" },
          { name: "❌  Sair", value: "exit" },
        ],
      },
    ]);
    switch (menu) {
      case "player":
        await (0, player_lookup_1.menuPlayerLookup)(client);
        break;
      case "top":
        await (0, top_players_1.menuTopPlayers)(client);
        break;
      case "cache":
        (0, cache_1.cacheClear)();
        console.log(display_1.c.green("\n  ✓  Cache limpo com sucesso!\n"));
        break;
      case "region": {
        const newRegion = await pickRegion();
        console.log(
          display_1.c.dim(
            `\n  Região alterada para: ${display_1.c.accent(types_1.REGION_LABELS[newRegion])}\n`,
          ),
        );
        await runLoop(apiKey, newRegion);
        return;
      }
      case "exit":
        console.log(display_1.c.dim("\n  Até a próxima, invocador! ⚔\n"));
        process.exit(0);
    }
  }
}
main().catch((err) => {
  console.error(display_1.c.red("\n  Erro fatal:"), err.message);
  process.exit(1);
});
