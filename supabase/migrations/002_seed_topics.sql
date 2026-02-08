-- Seed pre-defined topics with subreddits and RSS feeds

INSERT INTO topics (name, slug, description, icon, subreddits, rss_feeds, sort_order) VALUES
(
  'Technology & AI',
  'technology-ai',
  'Latest in tech, AI breakthroughs, and the future of computing',
  'Cpu',
  ARRAY['technology', 'artificial', 'MachineLearning', 'singularity', 'gadgets'],
  ARRAY['https://hnrss.org/frontpage?count=10', 'https://www.theverge.com/rss/index.xml'],
  1
),
(
  'World News',
  'world-news',
  'Global events, politics, and current affairs',
  'Globe',
  ARRAY['worldnews', 'geopolitics', 'news', 'InternationalNews'],
  ARRAY['https://feeds.bbci.co.uk/news/world/rss.xml', 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml'],
  2
),
(
  'Finance & Markets',
  'finance-markets',
  'Stock markets, investing, crypto, and personal finance',
  'TrendingUp',
  ARRAY['investing', 'stocks', 'personalfinance', 'CryptoCurrency', 'IndiaInvestments'],
  ARRAY['https://feeds.bloomberg.com/markets/news.rss', 'https://www.coindesk.com/arc/outboundfeeds/rss/'],
  3
),
(
  'Science',
  'science',
  'Scientific discoveries, space exploration, and research breakthroughs',
  'Atom',
  ARRAY['science', 'space', 'Physics', 'biology', 'EverythingScience'],
  ARRAY['https://www.nasa.gov/feed/', 'https://www.nature.com/nature.rss'],
  4
),
(
  'Programming & Dev',
  'programming-dev',
  'Software development, programming languages, and dev culture',
  'Code',
  ARRAY['programming', 'webdev', 'javascript', 'rust', 'golang', 'devops'],
  ARRAY['https://hnrss.org/newest?points=100&count=10', 'https://dev.to/feed'],
  5
),
(
  'Sports',
  'sports',
  'Sports highlights, scores, and analysis across all major leagues',
  'Trophy',
  ARRAY['sports', 'nba', 'soccer', 'Cricket', 'formula1'],
  ARRAY['https://www.espn.com/espn/rss/news', 'https://feeds.bbci.co.uk/sport/rss.xml'],
  6
),
(
  'Entertainment',
  'entertainment',
  'Movies, TV shows, music, gaming, and pop culture',
  'Clapperboard',
  ARRAY['movies', 'television', 'gaming', 'Music', 'entertainment'],
  ARRAY['https://www.ign.com/articles.rss', 'https://kotaku.com/rss'],
  7
),
(
  'Health & Wellness',
  'health-wellness',
  'Fitness, nutrition, mental health, and medical breakthroughs',
  'Heart',
  ARRAY['health', 'Fitness', 'nutrition', 'meditation', 'mentalhealth'],
  ARRAY['https://www.who.int/rss-feeds/news-english.xml', 'https://rss.nytimes.com/services/xml/rss/nyt/Health.xml'],
  8
);
