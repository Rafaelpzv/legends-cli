# ⚔ Legends CLI Stats

Ferramenta de linha de comando para consultar estatísticas do **League of Legends** via Riot Games API.

---

## Funcionalidades

| Feature | Descrição |
|---|---|
| 🔍 Busca por Riot ID | `PlayerName#TAG` ou só o nome (assume `#BR1`) |
| 📋 Partidas recentes | 20, 30, 50 ou 100 últimas partidas com KDA, duração, resultado |
| ⭐ Top 5 Maestrias | Campeões com maior maestria, nível e pontos |
| 🏆 Leaderboard | Challenger / Grandmaster / Master por região |
| 🌍 Multi-região | BR1, NA1, EUW1, KR, JP1, etc. |
| 🎯 Filtro de fila | Todas / Ranked / Normal / ARAM |
| 📑 Paginação | Navega pelas partidas página a página |
| 💾 Cache | Respostas cacheadas por 5 min (partidas: 1h) |
| 🎨 UI colorida | Tabelas formatadas com chalk + cli-table3 |
| ⚠️ Tratamento de erros | Rate limit, 404, 401, etc. com mensagens claras |

---

## Instalação

### Via npm (recomendado)

```bash
npm install -g legends-cli
```

### Manual (desenvolvimento)

```bash
# Clone / extraia o projeto
cd legends-cli

# Instale dependências
npm install
```

---

## Configuração da API Key

### 1. Obtenha sua chave

1. Acesse [developer.riotgames.com](https://developer.riotgames.com)
2. Faça login com sua conta Riot
3. Copie a **Development API Key** no painel (válida por 24h)

> 💡 Se você rodar `legends-cli` sem ter configurado a chave, o terminal vai exibir as instruções e abrir o site da Riot automaticamente no navegador.

### 2. Configure com um comando

```bash
legends-cli RGAPI-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

A chave é salva em `~/.legends-cli/.env` e vale para qualquer diretório. Nenhum arquivo `.env` manual necessário.

---

## Uso

```bash
legends-cli
# ou, em desenvolvimento local:
npm start
```

### Fluxo de uso

```
Selecione região → Menu Principal
  ├── 🔍 Buscar jogador
  │     ├── Digite: PlayerName#BR1
  │     ├── Ver Partidas Recentes
  │     │     ├── Escolha quantidade (20/30/50/100)
  │     │     ├── Escolha filtro (Todas/Ranked/Normal/ARAM)
  │     │     └── Paginação navegável
  │     └── Ver Top 5 Maestrias
  ├── 🏆 Top Players
  │     ├── Tier: Challenger / Grandmaster / Master
  │     └── Top 10 / 20 / 50 / 100
  ├── 🌍 Trocar região
  ├── 🗑  Limpar cache
  └── ❌ Sair
```

---

## Estrutura do Projeto

```
legends-cli/
├── src/
│   ├── index.ts           # Entry point + menu principal + setup da API key
│   ├── types.ts           # Tipos, regiões, filas
│   ├── riot-client.ts     # Cliente da API com cache + erros
│   ├── champions.ts       # Dados de campeões (Data Dragon)
│   ├── cache.ts           # Cache em arquivo (~/.tmp/legends-cli-cache)
│   ├── display.ts         # Tabelas e formatação colorida
│   └── menus/
│       ├── player-lookup.ts  # Menu de busca por jogador
│       └── top-players.ts    # Menu de leaderboard
├── .env.example
├── package.json
└── tsconfig.json
```

---

## Notas técnicas

- **API Key**: salva em `~/.legends-cli/.env`, configurada com `legends-cli <KEY>`
- **Cache**: arquivos JSON em `$TMPDIR/legends-cli-cache/` com TTL configurável
- **Rate Limit**: se atingido (HTTP 429), exibe mensagem clara e para
- **DDragon**: nomes dos campeões carregados uma vez com cache de 24h
- **Routing**: regiões de plataforma (`br1`, `na1`…) e cluster regional (`americas`, `europe`…) são tratados separadamente conforme a Riot API exige
