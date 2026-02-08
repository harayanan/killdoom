interface RedditToken {
  access_token: string;
  expires_at: number;
}

let cachedToken: RedditToken | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expires_at - 60_000) {
    return cachedToken.access_token;
  }

  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;
  const refreshToken = process.env.REDDIT_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Missing Reddit OAuth2 environment variables');
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const res = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'KillDoom/0.1.0',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    throw new Error(`Reddit token refresh failed: ${res.status}`);
  }

  const data = await res.json();
  cachedToken = {
    access_token: data.access_token,
    expires_at: Date.now() + data.expires_in * 1000,
  };

  return cachedToken.access_token;
}

export interface RedditPost {
  id: string;
  title: string;
  selftext: string;
  url: string;
  permalink: string;
  author: string;
  subreddit: string;
  score: number;
  num_comments: number;
  thumbnail: string;
  created_utc: number;
}

export async function fetchTopPosts(
  subreddit: string,
  timeframe: 'day' | 'week' = 'day',
  limit = 10
): Promise<RedditPost[]> {
  const token = await getAccessToken();

  const res = await fetch(
    `https://oauth.reddit.com/r/${subreddit}/top?t=${timeframe}&limit=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'KillDoom/0.1.0',
      },
    }
  );

  if (!res.ok) {
    console.error(`Failed to fetch r/${subreddit}: ${res.status}`);
    return [];
  }

  const data = await res.json();
  return (data.data?.children || []).map(
    (child: { data: RedditPost }) => child.data
  );
}

export async function savePost(postId: string): Promise<boolean> {
  const token = await getAccessToken();

  const res = await fetch('https://oauth.reddit.com/api/save', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'KillDoom/0.1.0',
    },
    body: new URLSearchParams({ id: `t3_${postId}` }),
  });

  return res.ok;
}

export async function unsavePost(postId: string): Promise<boolean> {
  const token = await getAccessToken();

  const res = await fetch('https://oauth.reddit.com/api/unsave', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'KillDoom/0.1.0',
    },
    body: new URLSearchParams({ id: `t3_${postId}` }),
  });

  return res.ok;
}
