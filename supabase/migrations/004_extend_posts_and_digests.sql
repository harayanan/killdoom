-- Extend posts table: add hackernews source, source_type, feed_url
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_source_check;
ALTER TABLE posts ADD CONSTRAINT posts_source_check CHECK (source IN ('reddit', 'twitter', 'hackernews'));
ALTER TABLE posts ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'news';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS feed_url TEXT;

-- Extend digest_posts: add section column (news vs individual)
ALTER TABLE digest_posts ADD COLUMN IF NOT EXISTS section TEXT DEFAULT 'news';

-- Extend daily_digests: add dual-section summaries
ALTER TABLE daily_digests ADD COLUMN IF NOT EXISTS news_summary TEXT;
ALTER TABLE daily_digests ADD COLUMN IF NOT EXISTS individual_summary TEXT;
ALTER TABLE daily_digests ADD COLUMN IF NOT EXISTS news_takeaways JSONB DEFAULT '[]';
ALTER TABLE daily_digests ADD COLUMN IF NOT EXISTS individual_takeaways JSONB DEFAULT '[]';
