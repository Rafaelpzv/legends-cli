import axios from 'axios';
import { withCache } from './cache';

let championMap: Record<number, string> = {};
let loaded = false;

export async function loadChampions(): Promise<void> {
  if (loaded) return;

  championMap = await withCache('ddragon_champions', async () => {
    const versRes = await axios.get<string[]>(
      'https://ddragon.leagueoflegends.com/api/versions.json',
      { timeout: 10_000 }
    );
    const version = versRes.data[0];
    const champRes = await axios.get(
      `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`,
      { timeout: 10_000 }
    );
    const data = champRes.data.data as Record<string, { key: string; name: string }>;
    const map: Record<number, string> = {};
    for (const champ of Object.values(data)) {
      map[parseInt(champ.key)] = champ.name;
    }
    return map;
  }, 24 * 60 * 60 * 1000); // 24h TTL

  loaded = true;
}

export function getChampionName(id: number): string {
  return championMap[id] ?? `#${id}`;
}
