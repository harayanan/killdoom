import { fetchRssFeed, type RssPost } from './rss-client';
import type { FetchedPost } from './content-fetcher';

const DEFAULT_INSTANCES = [
  'nitter.privacydev.net',
  'nitter.poast.org',
  'nitter.net',
];

function getNitterInstances(): string[] {
  const envInstances = process.env.NITTER_INSTANCES;
  if (envInstances) {
    return envInstances.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return DEFAULT_INSTANCES;
}

function nitterPostToFetchedPost(post: RssPost, query: string): FetchedPost {
  // Extract @handle from URL or author
  const handleMatch = post.url?.match(/\/([^/]+)\/status/);
  const author = handleMatch ? `@${handleMatch[1]}` : post.author || 'unknown';

  return {
    source: 'twitter',
    external_id: post.id || post.url || `nitter-${Date.now()}-${Math.random()}`,
    title: post.title || post.content?.slice(0, 120) || query,
    body: post.content?.slice(0, 2000) || '',
    url: post.url?.replace(/nitter\.[^/]+/, 'x.com') || '',
    author,
    subreddit: null,
    score: 0,
    num_comments: 0,
    thumbnail_url: null,
    published_at: post.publishedAt?.toISOString() || null,
    source_type: 'individual',
    feed_url: null,
  };
}

/**
 * Fetch tweets for a search query via Nitter RSS.
 * Tries multiple Nitter instances with fallback.
 * Returns empty array if all instances fail (graceful degradation).
 */
export async function fetchNitterSearch(
  query: string,
  limit = 10
): Promise<FetchedPost[]> {
  const instances = getNitterInstances();
  const encodedQuery = encodeURIComponent(query);

  for (const instance of instances) {
    try {
      const feedUrl = `https://${instance}/search/rss?f=tweets&q=${encodedQuery}`;
      const posts = await fetchRssFeed(feedUrl);

      if (posts.length > 0) {
        return posts
          .slice(0, limit)
          .map((p) => nitterPostToFetchedPost(p, query));
      }
    } catch (error) {
      console.warn(`Nitter instance ${instance} failed for "${query}":`, error);
    }
  }

  console.warn(`All Nitter instances failed for query "${query}". Returning empty.`);
  return [];
}

/**
 * Fetch tweets for multiple queries and deduplicate results.
 */
export async function fetchNitterMultipleQueries(
  queries: string[],
  limitPerQuery = 5
): Promise<FetchedPost[]> {
  if (queries.length === 0) return [];

  const results = await Promise.allSettled(
    queries.map((q) => fetchNitterSearch(q, limitPerQuery))
  );

  const seen = new Set<string>();
  const posts: FetchedPost[] = [];

  for (const result of results) {
    if (result.status === 'fulfilled') {
      for (const post of result.value) {
        const key = `twitter:${post.external_id}`;
        if (!seen.has(key)) {
          seen.add(key);
          posts.push(post);
        }
      }
    }
  }

  return posts;
}
