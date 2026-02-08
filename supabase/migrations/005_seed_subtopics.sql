-- Seed subtopics for all 8 topics
-- Uses subqueries to reference topic IDs by slug

-- === Technology & AI ===
INSERT INTO subtopics (topic_id, name, slug, description, region, subreddits, rss_feeds_news, rss_feeds_individual, hn_tags, sort_order) VALUES
(
  (SELECT id FROM topics WHERE slug = 'technology-ai'),
  'AI & Machine Learning', 'ai-ml',
  'Artificial intelligence, LLMs, and machine learning research',
  'global',
  ARRAY['artificial', 'MachineLearning', 'LocalLLaMA', 'ChatGPT'],
  ARRAY['https://www.theverge.com/rss/ai-artificial-intelligence/index.xml'],
  ARRAY['https://simonwillison.net/atom/everything/', 'https://lilianweng.github.io/index.xml'],
  ARRAY['ai', 'llm', 'machine-learning', 'gpt', 'openai'],
  1
),
(
  (SELECT id FROM topics WHERE slug = 'technology-ai'),
  'Cloud & Infrastructure', 'cloud-infra',
  'Cloud computing, DevOps, and infrastructure',
  'global',
  ARRAY['aws', 'devops', 'kubernetes', 'docker'],
  ARRAY['https://aws.amazon.com/blogs/aws/feed/'],
  ARRAY['https://dev.to/feed/tag/cloud', 'https://dev.to/feed/tag/devops'],
  ARRAY['cloud', 'kubernetes', 'aws', 'devops'],
  2
),
(
  (SELECT id FROM topics WHERE slug = 'technology-ai'),
  'Mobile & Apps', 'mobile-apps',
  'Mobile development, app launches, and platform updates',
  'global',
  ARRAY['Android', 'iphone', 'mobiledev'],
  ARRAY['https://9to5google.com/feed/', 'https://9to5mac.com/feed/'],
  ARRAY[],
  ARRAY['ios', 'android', 'mobile'],
  3
),
(
  (SELECT id FROM topics WHERE slug = 'technology-ai'),
  'India Tech', 'india-tech',
  'Indian tech industry, startups, and developer community',
  'india',
  ARRAY['developersIndia', 'india', 'IndianTech'],
  ARRAY['https://inc42.com/feed/'],
  ARRAY[],
  ARRAY[],
  4
),
(
  (SELECT id FROM topics WHERE slug = 'technology-ai'),
  'US Tech', 'us-tech',
  'Silicon Valley, Big Tech, and US tech industry',
  'us',
  ARRAY['technology', 'SiliconValleyHBO'],
  ARRAY['https://www.theverge.com/rss/index.xml', 'https://techcrunch.com/feed/'],
  ARRAY[],
  ARRAY['startup', 'silicon-valley'],
  5
);

-- === World News ===
INSERT INTO subtopics (topic_id, name, slug, description, region, subreddits, rss_feeds_news, rss_feeds_individual, hn_tags, sort_order) VALUES
(
  (SELECT id FROM topics WHERE slug = 'world-news'),
  'Global Affairs', 'global-affairs',
  'International diplomacy, conflicts, and global events',
  'global',
  ARRAY['worldnews', 'geopolitics', 'InternationalNews'],
  ARRAY['https://feeds.bbci.co.uk/news/world/rss.xml', 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml'],
  ARRAY[],
  ARRAY[],
  1
),
(
  (SELECT id FROM topics WHERE slug = 'world-news'),
  'India News', 'india-news',
  'Indian politics, economy, and current affairs',
  'india',
  ARRAY['india', 'IndiaSpeaks', 'indianews'],
  ARRAY['https://timesofindia.indiatimes.com/rssfeedstopstories.cms'],
  ARRAY[],
  ARRAY[],
  2
),
(
  (SELECT id FROM topics WHERE slug = 'world-news'),
  'US Politics', 'us-politics',
  'US government, policy, and political analysis',
  'us',
  ARRAY['politics', 'PoliticalDiscussion', 'neutralnews'],
  ARRAY['https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml'],
  ARRAY[],
  ARRAY[],
  3
);

-- === Finance & Markets ===
INSERT INTO subtopics (topic_id, name, slug, description, region, subreddits, rss_feeds_news, rss_feeds_individual, hn_tags, sort_order) VALUES
(
  (SELECT id FROM topics WHERE slug = 'finance-markets'),
  'Stock Markets', 'stock-markets',
  'Stock market analysis, earnings, and trading',
  'global',
  ARRAY['stocks', 'investing', 'StockMarket'],
  ARRAY['https://feeds.bloomberg.com/markets/news.rss'],
  ARRAY[],
  ARRAY['stocks', 'markets'],
  1
),
(
  (SELECT id FROM topics WHERE slug = 'finance-markets'),
  'Crypto & Web3', 'crypto-web3',
  'Cryptocurrency, blockchain, and decentralized finance',
  'global',
  ARRAY['CryptoCurrency', 'ethereum', 'Bitcoin'],
  ARRAY['https://www.coindesk.com/arc/outboundfeeds/rss/'],
  ARRAY[],
  ARRAY['crypto', 'bitcoin', 'ethereum'],
  2
),
(
  (SELECT id FROM topics WHERE slug = 'finance-markets'),
  'India Investments', 'india-investments',
  'Indian stock market, mutual funds, and personal finance',
  'india',
  ARRAY['IndiaInvestments', 'IndianStreetBets'],
  ARRAY[],
  ARRAY['https://freefincal.com/feed/'],
  ARRAY[],
  3
),
(
  (SELECT id FROM topics WHERE slug = 'finance-markets'),
  'Personal Finance', 'personal-finance',
  'Budgeting, savings, retirement, and financial planning',
  'global',
  ARRAY['personalfinance', 'financialindependence'],
  ARRAY[],
  ARRAY['https://www.mrmoneymustache.com/feed/'],
  ARRAY[],
  4
);

-- === Science ===
INSERT INTO subtopics (topic_id, name, slug, description, region, subreddits, rss_feeds_news, rss_feeds_individual, hn_tags, sort_order) VALUES
(
  (SELECT id FROM topics WHERE slug = 'science'),
  'Space & Astronomy', 'space-astronomy',
  'Space exploration, astronomy, and cosmology',
  'global',
  ARRAY['space', 'Astronomy', 'SpaceXLounge'],
  ARRAY['https://www.nasa.gov/feed/'],
  ARRAY[],
  ARRAY['space', 'nasa', 'spacex'],
  1
),
(
  (SELECT id FROM topics WHERE slug = 'science'),
  'Physics & Math', 'physics-math',
  'Physics research, mathematics, and theoretical science',
  'global',
  ARRAY['Physics', 'math', 'QuantumComputing'],
  ARRAY['https://www.nature.com/nphys.rss'],
  ARRAY[],
  ARRAY['physics', 'quantum'],
  2
),
(
  (SELECT id FROM topics WHERE slug = 'science'),
  'Biology & Medicine', 'biology-medicine',
  'Biology, genetics, neuroscience, and medical research',
  'global',
  ARRAY['biology', 'neuroscience', 'genetics'],
  ARRAY['https://www.nature.com/nature.rss'],
  ARRAY[],
  ARRAY['biology', 'genetics', 'neuroscience'],
  3
);

-- === Programming & Dev ===
INSERT INTO subtopics (topic_id, name, slug, description, region, subreddits, rss_feeds_news, rss_feeds_individual, hn_tags, sort_order) VALUES
(
  (SELECT id FROM topics WHERE slug = 'programming-dev'),
  'Web Development', 'web-dev',
  'Frontend, backend, and full-stack web development',
  'global',
  ARRAY['webdev', 'javascript', 'reactjs', 'nextjs'],
  ARRAY[],
  ARRAY['https://dev.to/feed/tag/webdev', 'https://dev.to/feed/tag/javascript'],
  ARRAY['react', 'nextjs', 'typescript', 'javascript'],
  1
),
(
  (SELECT id FROM topics WHERE slug = 'programming-dev'),
  'Systems Programming', 'systems-programming',
  'Rust, Go, C++, and low-level programming',
  'global',
  ARRAY['rust', 'golang', 'cpp'],
  ARRAY[],
  ARRAY['https://dev.to/feed/tag/rust', 'https://dev.to/feed/tag/go'],
  ARRAY['rust', 'golang', 'systems-programming'],
  2
),
(
  (SELECT id FROM topics WHERE slug = 'programming-dev'),
  'DevOps & Tools', 'devops-tools',
  'Developer tools, CI/CD, and workflow automation',
  'global',
  ARRAY['devops', 'programming', 'commandline'],
  ARRAY[],
  ARRAY['https://dev.to/feed/tag/devops'],
  ARRAY['devops', 'ci-cd', 'docker'],
  3
);

-- === Sports ===
INSERT INTO subtopics (topic_id, name, slug, description, region, subreddits, rss_feeds_news, rss_feeds_individual, hn_tags, sort_order) VALUES
(
  (SELECT id FROM topics WHERE slug = 'sports'),
  'Cricket', 'cricket',
  'International and domestic cricket coverage',
  'global',
  ARRAY['Cricket', 'CricketShitpost'],
  ARRAY['https://feeds.bbci.co.uk/sport/cricket/rss.xml'],
  ARRAY[],
  ARRAY[],
  1
),
(
  (SELECT id FROM topics WHERE slug = 'sports'),
  'Football / Soccer', 'football-soccer',
  'Premier League, Champions League, and global football',
  'global',
  ARRAY['soccer', 'PremierLeague'],
  ARRAY['https://feeds.bbci.co.uk/sport/football/rss.xml'],
  ARRAY[],
  ARRAY[],
  2
),
(
  (SELECT id FROM topics WHERE slug = 'sports'),
  'NBA & Basketball', 'nba-basketball',
  'NBA, basketball analysis, and hoops culture',
  'us',
  ARRAY['nba', 'basketball'],
  ARRAY['https://www.espn.com/espn/rss/nba/news'],
  ARRAY[],
  ARRAY[],
  3
),
(
  (SELECT id FROM topics WHERE slug = 'sports'),
  'Formula 1', 'formula-1',
  'F1 races, teams, drivers, and technical analysis',
  'global',
  ARRAY['formula1', 'F1Technical'],
  ARRAY[],
  ARRAY[],
  ARRAY[],
  4
);

-- === Entertainment ===
INSERT INTO subtopics (topic_id, name, slug, description, region, subreddits, rss_feeds_news, rss_feeds_individual, hn_tags, sort_order) VALUES
(
  (SELECT id FROM topics WHERE slug = 'entertainment'),
  'Movies & TV', 'movies-tv',
  'Film releases, TV shows, and streaming content',
  'global',
  ARRAY['movies', 'television', 'MovieDetails'],
  ARRAY['https://www.ign.com/articles.rss'],
  ARRAY[],
  ARRAY[],
  1
),
(
  (SELECT id FROM topics WHERE slug = 'entertainment'),
  'Gaming', 'gaming',
  'Video games, game development, and gaming culture',
  'global',
  ARRAY['gaming', 'Games', 'pcgaming'],
  ARRAY['https://kotaku.com/rss'],
  ARRAY[],
  ARRAY['gaming'],
  2
),
(
  (SELECT id FROM topics WHERE slug = 'entertainment'),
  'Music', 'music',
  'New releases, concerts, and music industry news',
  'global',
  ARRAY['Music', 'hiphopheads', 'indieheads'],
  ARRAY[],
  ARRAY[],
  ARRAY[],
  3
);

-- === Health & Wellness ===
INSERT INTO subtopics (topic_id, name, slug, description, region, subreddits, rss_feeds_news, rss_feeds_individual, hn_tags, sort_order) VALUES
(
  (SELECT id FROM topics WHERE slug = 'health-wellness'),
  'Fitness & Exercise', 'fitness-exercise',
  'Workout routines, strength training, and physical fitness',
  'global',
  ARRAY['Fitness', 'bodyweightfitness', 'running'],
  ARRAY[],
  ARRAY[],
  ARRAY[],
  1
),
(
  (SELECT id FROM topics WHERE slug = 'health-wellness'),
  'Nutrition & Diet', 'nutrition-diet',
  'Diet science, meal planning, and nutritional research',
  'global',
  ARRAY['nutrition', 'EatCheapAndHealthy'],
  ARRAY[],
  ARRAY[],
  ARRAY[],
  2
),
(
  (SELECT id FROM topics WHERE slug = 'health-wellness'),
  'Mental Health', 'mental-health',
  'Mindfulness, therapy, stress management, and mental wellbeing',
  'global',
  ARRAY['mentalhealth', 'meditation', 'Anxiety'],
  ARRAY['https://www.who.int/rss-feeds/news-english.xml'],
  ARRAY[],
  ARRAY['mental-health'],
  3
),
(
  (SELECT id FROM topics WHERE slug = 'health-wellness'),
  'Medical Research', 'medical-research',
  'Medical breakthroughs, clinical trials, and health science',
  'global',
  ARRAY['health', 'medicine'],
  ARRAY['https://rss.nytimes.com/services/xml/rss/nyt/Health.xml'],
  ARRAY[],
  ARRAY[],
  4
);
