-- Subtopics: region + subsegment filters within each topic
CREATE TABLE subtopics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  region TEXT,                              -- e.g., 'india', 'us', 'global'
  subreddits TEXT[] NOT NULL DEFAULT '{}',
  rss_feeds_news TEXT[] NOT NULL DEFAULT '{}',
  rss_feeds_individual TEXT[] NOT NULL DEFAULT '{}',
  hn_tags TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (topic_id, slug)
);

CREATE INDEX idx_subtopics_topic ON subtopics (topic_id, sort_order);
CREATE INDEX idx_subtopics_active ON subtopics (topic_id, is_active);

-- Source feedback: per-source like/dislike preferences
CREATE TABLE source_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_identifier TEXT NOT NULL,          -- 'r/MachineLearning', 'bloomberg.com', 'author:paulgraham'
  source_type TEXT NOT NULL CHECK (source_type IN ('subreddit', 'rss_feed', 'author', 'hn')),
  feedback TEXT NOT NULL CHECK (feedback IN ('like', 'dislike')),
  topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source_identifier, topic_id)
);

CREATE INDEX idx_source_feedback_topic ON source_feedback (topic_id);

-- Auto-update updated_at trigger for source_feedback
CREATE TRIGGER source_feedback_updated_at
  BEFORE UPDATE ON source_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
