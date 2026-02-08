-- KillDoom Database Schema

-- Topics: pre-defined + custom topics with subreddit/RSS mappings
CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT, -- Lucide icon name
  subreddits TEXT[] NOT NULL DEFAULT '{}',
  rss_feeds TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_custom BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_topics_slug ON topics (slug);
CREATE INDEX idx_topics_active ON topics (is_active);

-- Posts: raw fetched posts from Reddit + Twitter/RSS
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL CHECK (source IN ('reddit', 'twitter')),
  external_id TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  url TEXT NOT NULL,
  author TEXT,
  subreddit TEXT,
  score INTEGER DEFAULT 0,
  num_comments INTEGER DEFAULT 0,
  thumbnail_url TEXT,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source, external_id)
);

CREATE INDEX idx_posts_source ON posts (source);
CREATE INDEX idx_posts_fetched ON posts (fetched_at DESC);
CREATE INDEX idx_posts_external ON posts (source, external_id);

-- Daily Digests: one per topic per day — AI summary + key takeaways
CREATE TABLE daily_digests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  digest_date DATE NOT NULL,
  summary TEXT NOT NULL,
  key_takeaways JSONB NOT NULL DEFAULT '[]', -- array of strings
  post_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (topic_id, digest_date)
);

CREATE INDEX idx_digests_topic_date ON daily_digests (topic_id, digest_date DESC);
CREATE INDEX idx_digests_date ON daily_digests (digest_date DESC);

-- Digest Posts: junction table linking posts to digests with per-post AI summary
CREATE TABLE digest_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  digest_id UUID NOT NULL REFERENCES daily_digests(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  ai_summary TEXT,
  relevance_score REAL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (digest_id, post_id)
);

CREATE INDEX idx_digest_posts_digest ON digest_posts (digest_id, sort_order);

-- Bookmarks: user's liked posts, with Reddit sync status
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  reddit_synced BOOLEAN NOT NULL DEFAULT false,
  reddit_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id)
);

CREATE INDEX idx_bookmarks_created ON bookmarks (created_at DESC);

-- Data Metadata: cron job status tracking
CREATE TABLE data_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
  posts_fetched INTEGER DEFAULT 0,
  digests_created INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]',
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_metadata_job ON data_metadata (job_name, created_at DESC);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER topics_updated_at
  BEFORE UPDATE ON topics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
