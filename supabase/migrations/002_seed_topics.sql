-- Seed pre-defined topics with subreddits and Twitter RSS feeds

INSERT INTO topics (name, slug, description, icon, subreddits, rss_feeds, sort_order) VALUES
(
  'Technology & AI',
  'technology-ai',
  'Latest in tech, AI breakthroughs, and the future of computing',
  'Cpu',
  ARRAY['technology', 'artificial', 'MachineLearning', 'singularity', 'gadgets'],
  ARRAY['https://rsshub.app/twitter/user/elaboratequit', 'https://rsshub.app/twitter/user/ylecun'],
  1
),
(
  'World News',
  'world-news',
  'Global events, politics, and current affairs',
  'Globe',
  ARRAY['worldnews', 'geopolitics', 'news', 'InternationalNews'],
  ARRAY['https://rsshub.app/twitter/user/Reuters', 'https://rsshub.app/twitter/user/AP'],
  2
),
(
  'Finance & Markets',
  'finance-markets',
  'Stock markets, investing, crypto, and personal finance',
  'TrendingUp',
  ARRAY['investing', 'stocks', 'personalfinance', 'CryptoCurrency', 'IndiaInvestments'],
  ARRAY['https://rsshub.app/twitter/user/markets', 'https://rsshub.app/twitter/user/unusual_whales'],
  3
),
(
  'Science',
  'science',
  'Scientific discoveries, space exploration, and research breakthroughs',
  'Atom',
  ARRAY['science', 'space', 'Physics', 'biology', 'EverythingScience'],
  ARRAY['https://rsshub.app/twitter/user/NASAWebb', 'https://rsshub.app/twitter/user/nature'],
  4
),
(
  'Programming & Dev',
  'programming-dev',
  'Software development, programming languages, and dev culture',
  'Code',
  ARRAY['programming', 'webdev', 'javascript', 'rust', 'golang', 'devops'],
  ARRAY['https://rsshub.app/twitter/user/ThePrimeagen', 'https://rsshub.app/twitter/user/firaborrego'],
  5
),
(
  'Sports',
  'sports',
  'Sports highlights, scores, and analysis across all major leagues',
  'Trophy',
  ARRAY['sports', 'nba', 'soccer', 'Cricket', 'formula1'],
  ARRAY['https://rsshub.app/twitter/user/espaborrego', 'https://rsshub.app/twitter/user/SkySports'],
  6
),
(
  'Entertainment',
  'entertainment',
  'Movies, TV shows, music, gaming, and pop culture',
  'Clapperboard',
  ARRAY['movies', 'television', 'gaming', 'Music', 'entertainment'],
  ARRAY['https://rsshub.app/twitter/user/DiscussingFilm', 'https://rsshub.app/twitter/user/IGN'],
  7
),
(
  'Health & Wellness',
  'health-wellness',
  'Fitness, nutrition, mental health, and medical breakthroughs',
  'Heart',
  ARRAY['health', 'Fitness', 'nutrition', 'meditation', 'mentalhealth'],
  ARRAY['https://rsshub.app/twitter/user/WHO', 'https://rsshub.app/twitter/user/hubaborrego'],
  8
);
