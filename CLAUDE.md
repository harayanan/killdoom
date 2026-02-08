# CLAUDE.md - KillDoom

## Project Purpose

Kill your doomscrolling. AI-curated daily digests from Reddit and Twitter — 10 top posts per topic, summarized with Gemini AI. Bookmark posts with Reddit sync.

**Version**: 0.1.0 | **Status**: Initial build

## Tech Stack

- **Framework**: Next.js 16.1.4 (App Router), React 19.2.3, TypeScript 5
- **Styling**: Tailwind CSS 4, Lucide icons, custom shadcn-style components
- **Database**: Supabase (PostgreSQL, local instance) — 6 tables
- **AI**: Google Gemini 2.0 Flash via @google/generative-ai (with retry logic)
- **Data Sources**: Reddit API (OAuth2), RSS feeds (rss-parser)
- **Deployment**: Vercel with daily cron job at 6 AM UTC

## Architecture

```
src/
├── app/
│   ├── api/
│   │   ├── cron/daily-digest/   # Daily content fetch + AI summarization
│   │   ├── bookmarks/           # Bookmark CRUD with Reddit sync
│   │   └── topics/[id]/         # Topic toggle active/inactive
│   ├── topic/[slug]/            # Topic detail page
│   └── topics/                  # Topics management page
├── components/
│   ├── ui/                      # Button, Card, Badge, Input, Switch, Separator
│   ├── layout/Header.tsx
│   ├── dashboard/TopicCard.tsx
│   └── topic/TopicDigestView.tsx
└── lib/
    ├── supabase.ts              # Singleton client
    ├── gemini.ts                # Gemini with exponential backoff retry
    ├── reddit-client.ts         # OAuth2 token management, fetch/save/unsave
    ├── rss-client.ts            # RSS parser for Twitter feeds
    ├── content-fetcher.ts       # Orchestrates fetching + dedup + DB storage
    ├── ai-summarizer.ts         # Prompt engineering for digest generation
    └── utils.ts                 # cn(), date formatting, etc.
```

## Database Tables

| Table | Purpose |
|-------|---------|
| `topics` | Pre-defined + custom topics with subreddit/RSS mappings |
| `posts` | Raw fetched posts from Reddit + Twitter |
| `daily_digests` | One per topic per day — AI summary + key takeaways |
| `digest_posts` | Junction: posts-to-digests with per-post AI summary |
| `bookmarks` | User's liked posts with Reddit sync status |
| `data_metadata` | Cron job status tracking |

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `GEMINI_API_KEY` | Google Gemini API key |
| `REDDIT_CLIENT_ID` | Reddit OAuth2 client ID |
| `REDDIT_CLIENT_SECRET` | Reddit OAuth2 client secret |
| `REDDIT_REFRESH_TOKEN` | Reddit OAuth2 refresh token |
| `CRON_SECRET` | Secret for authenticating cron requests |

## Development

```bash
npm install && npm run dev    # Dev server on localhost:3000
npm run build                 # Production build
npm run lint                  # ESLint
```

`@/*` resolves to `./src/*`
