import 'dotenv/config';
import axios from 'axios';

const API_KEY = process.env.RIOT_API_KEY!;
const REGION  = 'br1';

async function main() {
  // 1) Raw leaderboard entry
  console.log('\n=== RAW LEADERBOARD (primeiro entry) ===\n');
  const leagueRes = await axios.get(
    `https://${REGION}.api.riotgames.com/lol/league/v4/challengerleagues/by-queue/RANKED_SOLO_5x5`,
    { headers: { 'X-Riot-Token': API_KEY } }
  );
  const firstEntry = leagueRes.data.entries[0];
  console.log(JSON.stringify(firstEntry, null, 2));

  // 2) Summoner by summonerId
  console.log('\n=== SUMMONER BY ID ===\n');
  const sumRes = await axios.get(
    `https://${REGION}.api.riotgames.com/lol/summoner/v4/summoners/${firstEntry.summonerId}`,
    { headers: { 'X-Riot-Token': API_KEY } }
  );
  console.log(JSON.stringify(sumRes.data, null, 2));

  // 3) Riot Account (gameName + tagLine) via PUUID
  console.log('\n=== RIOT ACCOUNT (gameName#tagLine) ===\n');
  const puuid = sumRes.data.puuid;
  const acctRes = await axios.get(
    `https://americas.api.riotgames.com/riot/account/v1/accounts/by-puuid/${puuid}`,
    { headers: { 'X-Riot-Token': API_KEY } }
  );
  console.log(JSON.stringify(acctRes.data, null, 2));
}

main().catch(console.error);
