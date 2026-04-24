#!/usr/bin/env node
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { exec } from 'child_process';

// ─── Config stored in ~/.legends-cli/.env (works from any directory) ─────────────

const CONFIG_DIR  = path.join(os.homedir(), '.legends-cli');
const CONFIG_FILE = path.join(CONFIG_DIR, '.env');

// Load from home dir config before dotenv defaults
require('dotenv').config({ path: CONFIG_FILE });

import inquirer from 'inquirer';
import { RiotClient } from './riot-client';
import { printBanner, c } from './display';
import { cacheClear } from './cache';
import { menuTopPlayers } from './menus/top-players';
import { menuPlayerLookup } from './menus/player-lookup';
import { REGION_LABELS, Region } from './types';

// ─── Setup command: legends-cli <API_KEY> ────────────────────────────────────────

const cliArg = process.argv[2]?.trim();
if (cliArg) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, `RIOT_API_KEY=${cliArg}\n`, 'utf-8');
  console.log(c.green('\n  ✓  API Key salva com sucesso!'));
  console.log(c.dim(`     Arquivo: ${CONFIG_FILE}`));
  console.log(c.dim('     Agora rode: ') + c.white('legends-cli\n'));
  process.exit(0);
}

// ─── Open browser helper ──────────────────────────────────────────────────────

function openBrowser(url: string): void {
  const cmd =
    process.platform === 'win32' ? `start "" "${url}"` :
    process.platform === 'darwin' ? `open "${url}"` :
    `xdg-open "${url}"`;
  exec(cmd);
}

// ─── Validate environment ─────────────────────────────────────────────────────

function getApiKey(): string {
  const key = process.env.RIOT_API_KEY?.trim();
  if (!key) {
    console.log(c.orange('\n  ⚠  Nenhuma API Key da Riot encontrada!\n'));
    console.log('  ' + c.white('Para obter sua chave, siga os passos:'));
    console.log(c.dim('  1. Acesse:  ') + c.accent('https://developer.riotgames.com'));
    console.log(c.dim('  2. Faça login com sua conta Riot'));
    console.log(c.dim('  3. Copie sua') + c.white(' Development API Key') + c.dim(' no painel'));
    console.log(c.dim('  4. Configure rodando o comando:\n'));
    console.log('     ' + c.green('legends-cli') + c.white(' RGAPI-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx') + '\n');
    console.log(c.dim('  ↗  Abrindo o portal da Riot no navegador...\n'));
    openBrowser('https://developer.riotgames.com');
    process.exit(1);
  }
  return key;
}

// ─── Region picker ────────────────────────────────────────────────────────────

async function pickRegion(): Promise<Region> {
  const { region } = await inquirer.prompt([{
    type:    'list',
    name:    'region',
    message: 'Selecione a região:',
    choices: (Object.entries(REGION_LABELS) as [Region, string][]).map(([value, name]) => ({
      name,
      value,
    })),
    default: 'br1',
  }]);
  return region as Region;
}

// ─── Main loop ────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  printBanner();

  const apiKey = getApiKey();
  const region = await pickRegion();
  const client = new RiotClient(apiKey, region);

  console.log(c.dim(`\n  Conectado à região: ${c.accent(REGION_LABELS[region])}\n`));

  while (true) {
    const { menu } = await inquirer.prompt([{
      type:    'list',
      name:    'menu',
      message: 'Menu principal — o que deseja fazer?',
      choices: [
        { name: '🔍  Buscar jogador (Partidas + Maestrias)', value: 'player'     },
        { name: '🏆  Ver top players da região',             value: 'top'        },
        { name: '🌍  Trocar região',                         value: 'region'     },
        { name: '🗑   Limpar cache',                          value: 'cache'      },
        { name: '❌  Sair',                                   value: 'exit'       },
      ],
    }]);

    switch (menu) {
      case 'player':
        await menuPlayerLookup(client);
        break;

      case 'top':
        await menuTopPlayers(client);
        break;

      case 'region': {
        const newRegion = await pickRegion();
        const newClient = new RiotClient(apiKey, newRegion);
        console.log(c.dim(`\n  Região alterada para: ${c.accent(REGION_LABELS[newRegion])}\n`));
        await runLoop(apiKey, newRegion);
        return;
      }

      case 'cache':
        cacheClear();
        console.log(c.green('\n  ✓  Cache limpo com sucesso!\n'));
        break;

      case 'exit':
        console.log(c.dim('\n  Até a próxima, invocador! ⚔\n'));
        process.exit(0);
    }
  }
}

async function runLoop(apiKey: string, region: Region): Promise<void> {
  const client = new RiotClient(apiKey, region);

  while (true) {
    const { menu } = await inquirer.prompt([{
      type:    'list',
      name:    'menu',
      message: `Menu principal [${REGION_LABELS[region]}] — o que deseja fazer?`,
      choices: [
        { name: '🔍  Buscar jogador (Partidas + Maestrias)', value: 'player' },
        { name: '🏆  Ver top players da região',             value: 'top'    },
        { name: '🌍  Trocar região',                         value: 'region' },
        { name: '🗑   Limpar cache',                          value: 'cache'  },
        { name: '❌  Sair',                                   value: 'exit'   },
      ],
    }]);

    switch (menu) {
      case 'player': await menuPlayerLookup(client); break;
      case 'top':    await menuTopPlayers(client);   break;
      case 'cache':
        cacheClear();
        console.log(c.green('\n  ✓  Cache limpo com sucesso!\n'));
        break;
      case 'region': {
        const newRegion = await pickRegion();
        console.log(c.dim(`\n  Região alterada para: ${c.accent(REGION_LABELS[newRegion])}\n`));
        await runLoop(apiKey, newRegion);
        return;
      }
      case 'exit':
        console.log(c.dim('\n  Até a próxima, invocador! ⚔\n'));
        process.exit(0);
    }
  }
}

main().catch(err => {
  console.error(c.red('\n  Erro fatal:'), err.message);
  process.exit(1);
});
