export interface HNHit {
  objectID: string;
  title: string;
  url: string | null;
  author: string;
  points: number;
  num_comments: number;
  story_text: string | null;
  created_at: string;
}

interface HNSearchResponse {
  hits: HNHit[];
}

const HN_API_BASE = 'https://hn.algolia.com/api/v1';

export async function fetchHNByTags(
  tags: string[],
  count = 10
): Promise<HNHit[]> {
  if (tags.length === 0) return [];

  // Search for each tag and combine results
  const allHits = new Map<string, HNHit>();

  for (const tag of tags) {
    try {
      const url = `${HN_API_BASE}/search?query=${encodeURIComponent(tag)}&tags=story&hitsPerPage=${count}&numericFilters=created_at_i>${Math.floor(Date.now() / 1000) - 86400}`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'KillDoom/0.1.0' },
        signal: AbortSignal.timeout(10_000),
      });

      if (!res.ok) {
        console.error(`HN API error for tag "${tag}": ${res.status}`);
        continue;
      }

      const data: HNSearchResponse = await res.json();
      for (const hit of data.hits) {
        if (!allHits.has(hit.objectID)) {
          allHits.set(hit.objectID, hit);
        }
      }
    } catch (error) {
      console.error(`Failed to fetch HN for tag "${tag}":`, error);
    }
  }

  // Sort by points descending, then take top N
  return Array.from(allHits.values())
    .sort((a, b) => (b.points || 0) - (a.points || 0))
    .slice(0, count);
}
