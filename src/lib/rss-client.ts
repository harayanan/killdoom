import Parser from 'rss-parser';

const parser = new Parser({
  timeout: 10_000,
  headers: {
    'User-Agent': 'KillDoom/0.1.0',
  },
});

export interface RssPost {
  id: string;
  title: string;
  content: string;
  url: string;
  author: string;
  publishedAt: Date | null;
}

export async function fetchRssFeed(feedUrl: string): Promise<RssPost[]> {
  try {
    const feed = await parser.parseURL(feedUrl);

    return (feed.items || []).map((item) => ({
      id: item.guid || item.link || item.title || '',
      title: item.title || '',
      content: item.contentSnippet || item.content || '',
      url: item.link || '',
      author: item.creator || feed.title || '',
      publishedAt: item.pubDate ? new Date(item.pubDate) : null,
    }));
  } catch (error) {
    console.error(`Failed to fetch RSS feed ${feedUrl}:`, error);
    return [];
  }
}

export async function fetchMultipleFeeds(
  feedUrls: string[]
): Promise<RssPost[]> {
  const results = await Promise.allSettled(
    feedUrls.map((url) => fetchRssFeed(url))
  );

  return results
    .filter(
      (r): r is PromiseFulfilledResult<RssPost[]> => r.status === 'fulfilled'
    )
    .flatMap((r) => r.value);
}
