import { fetchRssFeed, fetchMultipleFeeds, type RssPost } from './rss-client';
import { fetchHNByTags, type HNHit } from './hn-client';
import { getSupabase } from './supabase';
import { MAX_POSTS_PER_SECTION } from './constants';

export interface FetchedPost {
  source: 'reddit' | 'twitter' | 'hackernews';
  external_id: string;
  title: string;
  body: string;
  url: string;
  author: string;
  subreddit: string | null;
  score: number;
  num_comments: number;
  thumbnail_url: string | null;
  published_at: string | null;
  source_type: 'news' | 'individual';
  feed_url: string | null;
}

export interface SplitPosts {
  news: FetchedPost[];
  individual: FetchedPost[];
}

function redditRssToFetchedPost(post: RssPost, subreddit: string, sourceType: 'news' | 'individual' = 'individual'): FetchedPost {
  // Reddit RSS IDs look like "t3_1qyikta"
  const externalId = post.id.replace('t3_', '');
  return {
    source: 'reddit',
    external_id: externalId,
    title: post.title,
    body: post.content?.replace(/<[^>]*>/g, '').slice(0, 2000) || '',
    url: post.url || `https://reddit.com${post.id}`,
    author: post.author?.replace('/u/', '') || '',
    subreddit,
    score: 0, // Not available via RSS
    num_comments: 0,
    thumbnail_url: null,
    published_at: post.publishedAt?.toISOString() || null,
    source_type: sourceType,
    feed_url: null,
  };
}

function rssToFetchedPost(post: RssPost, sourceType: 'news' | 'individual' = 'news', feedUrl: string | null = null): FetchedPost {
  return {
    source: 'twitter',
    external_id: post.id,
    title: post.title,
    body: post.content?.slice(0, 2000) || '',
    url: post.url,
    author: post.author,
    subreddit: null,
    score: 0,
    num_comments: 0,
    thumbnail_url: null,
    published_at: post.publishedAt?.toISOString() || null,
    source_type: sourceType,
    feed_url: feedUrl,
  };
}

function hnToFetchedPost(hit: HNHit): FetchedPost {
  return {
    source: 'hackernews',
    external_id: hit.objectID,
    title: hit.title,
    body: hit.story_text?.slice(0, 2000) || '',
    url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
    author: hit.author,
    subreddit: null,
    score: hit.points || 0,
    num_comments: hit.num_comments || 0,
    thumbnail_url: null,
    published_at: hit.created_at || null,
    source_type: 'news',
    feed_url: null,
  };
}

/**
 * Original fetch function — kept for backward compatibility with topics that have no subtopics.
 */
export async function fetchPostsForTopic(
  subreddits: string[],
  rssFeeds: string[],
  limit = 10
): Promise<FetchedPost[]> {
  // Build Reddit RSS URLs from subreddit names
  const redditRssUrls = subreddits.map(
    (sub) => `https://www.reddit.com/r/${sub}/top/.rss?t=day&limit=5`
  );

  // Fetch Reddit via RSS and other RSS feeds in parallel
  const [redditResults, otherRssResults] = await Promise.all([
    Promise.allSettled(redditRssUrls.map((url, i) =>
      fetchRssFeed(url).then((posts) =>
        posts.map((p) => redditRssToFetchedPost(p, subreddits[i]))
      )
    )),
    fetchMultipleFeeds(rssFeeds),
  ]);

  const redditPosts = redditResults
    .filter(
      (r): r is PromiseFulfilledResult<FetchedPost[]> =>
        r.status === 'fulfilled'
    )
    .flatMap((r) => r.value);

  const rssPosts = otherRssResults.map((p) => rssToFetchedPost(p));

  // Combine and deduplicate by source:external_id
  const seen = new Set<string>();
  const allPosts: FetchedPost[] = [];

  for (const post of [...redditPosts, ...rssPosts]) {
    const key = `${post.source}:${post.external_id}`;
    if (!seen.has(key)) {
      seen.add(key);
      allPosts.push(post);
    }
  }

  // Sort by recency (RSS doesn't give scores)
  allPosts.sort((a, b) => {
    const dateA = a.published_at ? new Date(a.published_at).getTime() : 0;
    const dateB = b.published_at ? new Date(b.published_at).getTime() : 0;
    return dateB - dateA;
  });

  return allPosts.slice(0, limit);
}

/**
 * Subtopic-aware split fetch: returns news and individual posts separately.
 * Aggregates sources from all active subtopics for a topic.
 */
export async function fetchPostsForTopicSplit(
  subtopics: {
    subreddits: string[];
    rss_feeds_news: string[];
    rss_feeds_individual: string[];
    hn_tags: string[];
  }[]
): Promise<SplitPosts> {
  // Aggregate all sources from subtopics
  const allSubreddits = new Set<string>();
  const allNewsFeedUrls = new Set<string>();
  const allIndividualFeedUrls = new Set<string>();
  const allHnTags = new Set<string>();

  for (const st of subtopics) {
    st.subreddits.forEach((s) => allSubreddits.add(s));
    st.rss_feeds_news.forEach((f) => allNewsFeedUrls.add(f));
    st.rss_feeds_individual.forEach((f) => allIndividualFeedUrls.add(f));
    st.hn_tags.forEach((t) => allHnTags.add(t));
  }

  const subreddits = Array.from(allSubreddits);
  const newsFeedUrls = Array.from(allNewsFeedUrls);
  const individualFeedUrls = Array.from(allIndividualFeedUrls);
  const hnTags = Array.from(allHnTags);

  // Build Reddit RSS URLs
  const redditRssUrls = subreddits.map(
    (sub) => `https://www.reddit.com/r/${sub}/top/.rss?t=day&limit=5`
  );

  // Fetch all sources in parallel
  const [redditResults, newsRssResults, individualRssResults, hnResults] = await Promise.all([
    Promise.allSettled(redditRssUrls.map((url, i) =>
      fetchRssFeed(url).then((posts) =>
        posts.map((p) => redditRssToFetchedPost(p, subreddits[i], 'individual'))
      )
    )),
    Promise.all(newsFeedUrls.map((url) =>
      fetchRssFeed(url).then((posts) =>
        posts.map((p) => rssToFetchedPost(p, 'news', url))
      ).catch(() => [] as FetchedPost[])
    )),
    Promise.all(individualFeedUrls.map((url) =>
      fetchRssFeed(url).then((posts) =>
        posts.map((p) => rssToFetchedPost(p, 'individual', url))
      ).catch(() => [] as FetchedPost[])
    )),
    fetchHNByTags(hnTags, MAX_POSTS_PER_SECTION),
  ]);

  const redditPosts = redditResults
    .filter((r): r is PromiseFulfilledResult<FetchedPost[]> => r.status === 'fulfilled')
    .flatMap((r) => r.value);

  const newsPosts = newsRssResults.flat();
  const individualPosts = individualRssResults.flat();
  const hnPosts = hnResults.map(hnToFetchedPost);

  // Deduplicate and split into news/individual
  const seen = new Set<string>();
  const news: FetchedPost[] = [];
  const individual: FetchedPost[] = [];

  // News sources first: HN posts + news RSS
  for (const post of [...hnPosts, ...newsPosts]) {
    const key = `${post.source}:${post.external_id}`;
    if (!seen.has(key)) {
      seen.add(key);
      news.push(post);
    }
  }

  // Individual sources: Reddit + individual RSS
  for (const post of [...redditPosts, ...individualPosts]) {
    const key = `${post.source}:${post.external_id}`;
    if (!seen.has(key)) {
      seen.add(key);
      individual.push(post);
    }
  }

  // Sort each by recency
  const sortByRecency = (a: FetchedPost, b: FetchedPost) => {
    const dateA = a.published_at ? new Date(a.published_at).getTime() : 0;
    const dateB = b.published_at ? new Date(b.published_at).getTime() : 0;
    return dateB - dateA;
  };

  news.sort(sortByRecency);
  individual.sort(sortByRecency);

  return {
    news: news.slice(0, MAX_POSTS_PER_SECTION),
    individual: individual.slice(0, MAX_POSTS_PER_SECTION),
  };
}

export async function storePostsInDb(
  posts: FetchedPost[]
): Promise<{ id: string; external_id: string; source: string }[]> {
  const supabase = getSupabase();
  const storedPosts: { id: string; external_id: string; source: string }[] = [];

  for (const post of posts) {
    const { data, error } = await supabase
      .from('posts')
      .upsert(
        {
          source: post.source,
          external_id: post.external_id,
          title: post.title,
          body: post.body,
          url: post.url,
          author: post.author,
          subreddit: post.subreddit,
          score: post.score,
          num_comments: post.num_comments,
          thumbnail_url: post.thumbnail_url,
          published_at: post.published_at,
          fetched_at: new Date().toISOString(),
          source_type: post.source_type,
          feed_url: post.feed_url,
        },
        { onConflict: 'source,external_id' }
      )
      .select('id, external_id, source')
      .single();

    if (error) {
      console.error('Failed to store post:', error.message);
      continue;
    }

    if (data) storedPosts.push(data);
  }

  return storedPosts;
}
