import { fetchTopPosts, type RedditPost } from './reddit-client';
import { fetchMultipleFeeds, type RssPost } from './rss-client';
import { getSupabase } from './supabase';

export interface FetchedPost {
  source: 'reddit' | 'twitter';
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
}

function redditToFetchedPost(post: RedditPost): FetchedPost {
  return {
    source: 'reddit',
    external_id: post.id,
    title: post.title,
    body: post.selftext?.slice(0, 2000) || '',
    url: `https://reddit.com${post.permalink}`,
    author: post.author,
    subreddit: post.subreddit,
    score: post.score,
    num_comments: post.num_comments,
    thumbnail_url:
      post.thumbnail && post.thumbnail.startsWith('http')
        ? post.thumbnail
        : null,
    published_at: new Date(post.created_utc * 1000).toISOString(),
  };
}

function rssToFetchedPost(post: RssPost): FetchedPost {
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
  };
}

export async function fetchPostsForTopic(
  subreddits: string[],
  rssFeeds: string[],
  limit = 10
): Promise<FetchedPost[]> {
  // Fetch from both sources in parallel
  const [redditResults, rssResults] = await Promise.all([
    Promise.all(subreddits.map((sub) => fetchTopPosts(sub, 'day', 5))),
    fetchMultipleFeeds(rssFeeds),
  ]);

  const redditPosts = redditResults
    .flat()
    .map(redditToFetchedPost);

  const rssPosts = rssResults.map(rssToFetchedPost);

  // Combine and deduplicate by external_id
  const seen = new Set<string>();
  const allPosts: FetchedPost[] = [];

  for (const post of [...redditPosts, ...rssPosts]) {
    const key = `${post.source}:${post.external_id}`;
    if (!seen.has(key)) {
      seen.add(key);
      allPosts.push(post);
    }
  }

  // Sort by score (Reddit) then recency, take top N
  allPosts.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const dateA = a.published_at ? new Date(a.published_at).getTime() : 0;
    const dateB = b.published_at ? new Date(b.published_at).getTime() : 0;
    return dateB - dateA;
  });

  return allPosts.slice(0, limit);
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
