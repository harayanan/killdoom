-- Email subscriptions table
CREATE TABLE email_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  topic_ids UUID[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_email_subscriptions_email ON email_subscriptions(email);

-- Auto-update updated_at
CREATE TRIGGER set_email_subscriptions_updated_at
  BEFORE UPDATE ON email_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Twitter/X search queries for topics and subtopics
ALTER TABLE topics ADD COLUMN twitter_queries TEXT[] DEFAULT '{}';
ALTER TABLE subtopics ADD COLUMN twitter_queries TEXT[] DEFAULT '{}';

-- Seed sample twitter_queries for existing topics
UPDATE topics SET twitter_queries = ARRAY['#AI', '#MachineLearning', '#LLM'] WHERE slug = 'technology-ai';
UPDATE topics SET twitter_queries = ARRAY['#breakingnews', '#worldnews'] WHERE slug = 'world-news';
UPDATE topics SET twitter_queries = ARRAY['#stocks', '#investing', '#crypto'] WHERE slug = 'finance-markets';
UPDATE topics SET twitter_queries = ARRAY['#science', '#space', '#physics'] WHERE slug = 'science';
UPDATE topics SET twitter_queries = ARRAY['#programming', '#webdev', '#rust'] WHERE slug = 'programming-dev';
UPDATE topics SET twitter_queries = ARRAY['#cricket', '#NBA', '#F1'] WHERE slug = 'sports';
UPDATE topics SET twitter_queries = ARRAY['#gaming', '#movies', '#music'] WHERE slug = 'entertainment';
UPDATE topics SET twitter_queries = ARRAY['#fitness', '#health', '#mentalhealth'] WHERE slug = 'health-wellness';

-- Seed twitter_queries for subtopics
UPDATE subtopics SET twitter_queries = ARRAY['#AI', '#LLM', '#GPT', '#MachineLearning'] WHERE slug = 'ai-ml';
UPDATE subtopics SET twitter_queries = ARRAY['#kubernetes', '#AWS', '#devops'] WHERE slug = 'cloud-infra';
UPDATE subtopics SET twitter_queries = ARRAY['#Android', '#iOS', '#mobile'] WHERE slug = 'mobile-apps';
UPDATE subtopics SET twitter_queries = ARRAY['#IndianTech', '#startupindia'] WHERE slug = 'india-tech';
UPDATE subtopics SET twitter_queries = ARRAY['#SiliconValley', '#BigTech'] WHERE slug = 'us-tech';
UPDATE subtopics SET twitter_queries = ARRAY['#cricket', '#IPL'] WHERE slug = 'cricket';
UPDATE subtopics SET twitter_queries = ARRAY['#PremierLeague', '#football'] WHERE slug = 'football-soccer';
UPDATE subtopics SET twitter_queries = ARRAY['#NBA', '#basketball'] WHERE slug = 'nba-basketball';
UPDATE subtopics SET twitter_queries = ARRAY['#F1', '#Formula1'] WHERE slug = 'formula-1';
UPDATE subtopics SET twitter_queries = ARRAY['#react', '#nextjs', '#typescript'] WHERE slug = 'web-dev';
UPDATE subtopics SET twitter_queries = ARRAY['#rust', '#golang'] WHERE slug = 'systems-programming';
UPDATE subtopics SET twitter_queries = ARRAY['#CICD', '#docker', '#devops'] WHERE slug = 'devops-tools';
