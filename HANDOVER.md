# HANDOVER — killdoom

> AI-curated daily digests from Reddit, HN, Twitter/X — summarized with Gemini, emailed daily

## Status: MVP + EMAIL DIGEST + TWITTER

**Version:** 0.1.0 | **Started:** January 2026

## Tech Stack

- **Framework:** Next.js 16.1.4 (App Router)
- **UI:** React 19.2.3 + Tailwind CSS 4 + shadcn-style components
- **Database:** Supabase (PostgreSQL)
- **AI:** Google Gemini 2.0 Flash (with exponential backoff retry)
- **Data Sources:** Reddit OAuth2 API + RSS feeds + Hacker News Algolia + Twitter/X via Nitter RSS
- **Email:** Resend SDK for daily digest delivery

## Key Features

- 10 top posts per topic, AI-summarized daily
- Bookmark posts with Reddit sync
- Pre-defined + custom topic management
- Daily cron job (6 AM UTC) — generates digests AND sends emails
- **Email digest subscription** — `/email-digest` page, daily email with top posts per subscribed topic
- **Twitter/X source** — tweets fetched via Nitter RSS (free, no API key), with multi-instance fallback

## Source Structure

```
src/
├── app/
│   ├── api/
│   │   ├── cron/daily-digest/       # Fetch + AI summarization + email sending
│   │   ├── bookmarks/               # Bookmark CRUD + Reddit sync
│   │   ├── email-subscription/      # Email subscription GET + POST
│   │   └── topics/[id]/             # Topic toggle
│   ├── email-digest/page.tsx        # Email subscription UI
│   └── topic/[slug]/page.tsx        # Topic detail + digest view
├── components/
│   ├── ui/                          # Button, Card, Badge, Input, Switch
│   ├── layout/Header.tsx            # Nav: Dashboard, Topics, Email Digest
│   └── topic/TopicDigestView.tsx
└── lib/
    ├── supabase.ts                  # Singleton client
    ├── gemini.ts                    # Retry with exponential backoff
    ├── reddit-client.ts             # OAuth2 token management
    ├── rss-client.ts                # RSS parsing
    ├── hn-client.ts                 # Hacker News Algolia
    ├── nitter-client.ts             # Twitter/X via Nitter RSS (multi-instance)
    ├── content-fetcher.ts           # Orchestration (Reddit + RSS + HN + Nitter)
    ├── ai-summarizer.ts             # Prompt engineering
    ├── email-client.ts              # Resend SDK wrapper
    └── email-template.ts            # HTML email renderer
```

## Database (7 tables)

1. **topics** — Pre-defined + custom with subreddit/RSS/twitter_queries mappings
2. **subtopics** — Region/subsegment filters with twitter_queries
3. **posts** — Raw fetched posts (reddit, hackernews, twitter sources)
4. **daily_digests** — One per topic per day (AI summary, split news/individual)
5. **digest_posts** — Posts-to-digests junction with section
6. **bookmarks** — User's liked posts + Reddit sync
7. **email_subscriptions** — Email, topic_ids, is_active, last_sent_at
8. **data_metadata** — Cron job status tracking

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL      — Supabase URL
NEXT_PUBLIC_SUPABASE_ANON_KEY — Supabase key
GEMINI_API_KEY                — Gemini API key
REDDIT_CLIENT_ID              — Reddit OAuth2 client ID
REDDIT_CLIENT_SECRET          — Reddit OAuth2 secret
REDDIT_REFRESH_TOKEN          — Reddit refresh token
CRON_SECRET                   — Vercel cron auth
RESEND_API_KEY                — Resend email API key
NITTER_INSTANCES              — Comma-separated Nitter hosts (optional)
```

## What Was Done (2026-02-24 session 2)

- Verified migration 006 already applied (email_subscriptions table + twitter_queries columns live)
- Verified RESEND_API_KEY configured in .env.local and Vercel production
- Tested full email flow: cron ran, 7 topics digested, 100 posts fetched, 1 email sent via Resend
- Tested Nitter: all 3 default instances down (expected), graceful fallback works (returns empty, cron continues)
- Added defensive String()/Number() coercion in content-fetcher.ts and ai-summarizer.ts to prevent "Cannot convert object to primitive value" errors
- Replaced dead IGN RSS feed (404) with The Verge Entertainment RSS in database
- Build passes clean

## What Was Done (2026-02-24 session 1)

- Added Twitter/X as content source via Nitter RSS (`nitter-client.ts`)
- Added email digest subscription page (`/email-digest`)
- Added email subscription API route (`/api/email-subscription`)
- Added email sending with Resend (`email-client.ts`, `email-template.ts`)
- Extended daily cron to send emails after digest generation
- Created DB migration `006_email_and_twitter.sql` (email_subscriptions table + twitter_queries columns)
- Seeded twitter_queries for all 8 topics and their subtopics
- Added "Email Digest" to Header navigation
- Integrated Nitter into both legacy and split fetch paths in content-fetcher.ts
- Added `resend` npm dependency

## Next Steps

- User priority topics: **Tech/AI** and **Investing/Finance**
- Find working Nitter instances or alternative Twitter data source
- Add user auth for multi-user support
- Parallelize topic processing in cron (currently sequential — main perf bottleneck)
- Add unsubscribe link in email digests

## Quick Start

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Session: 2026-02-25

### What was done (VPS storage optimization)
- **Dedicated Supabase instance STOPPED** — the killdoom dedicated instance (port 9100) was stopped to reclaim disk. It had zero tables — migration from shared DB never happened.
- Compose file preserved at `/root/supabase-stacks/killdoom/docker-compose.yml`. Restart with: `cd /root/supabase-stacks/killdoom && docker compose -p supabase-killdoom up -d`
- **All killdoom data is safe** in the shared Supabase (port 8000): 9 tables (bookmarks, channels, daily_digests, data_metadata, digest_posts, posts, source_feedback, subtopics, topics)
- App still points to shared instance — no impact on functionality.

## Session: 2026-03-01

### What was done (ESLint fixes)
- Fixed all ESLint errors across 2 files to achieve 0 errors, 0 warnings on `npm run lint`:
  - `src/components/layout/Header.tsx` — removed unused `Bookmark` import from lucide-react
  - `src/components/topic/TopicDigestView.tsx` — removed unused `topicName` from destructured props

---
*Last reviewed: 2026-03-01*
