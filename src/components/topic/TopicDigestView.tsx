'use client';

import { useState } from 'react';
import {
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  ArrowUp,
  MessageSquare,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { relativeTime } from '@/lib/utils';

interface DigestPost {
  id: string;
  ai_summary: string;
  relevance_score: number;
  sort_order: number;
  post: {
    id: string;
    source: string;
    title: string;
    url: string;
    author: string;
    subreddit: string | null;
    score: number;
    num_comments: number;
    published_at: string | null;
  };
}

interface DigestData {
  summary: string;
  key_takeaways: string[];
  post_count: number;
  digest_date: string;
  posts: DigestPost[];
}

interface BookmarkState {
  [postId: string]: boolean;
}

export function TopicDigestView({
  topicName,
  digest,
  initialBookmarks,
}: {
  topicName: string;
  digest: DigestData;
  initialBookmarks: string[];
}) {
  const [bookmarks, setBookmarks] = useState<BookmarkState>(() => {
    const state: BookmarkState = {};
    initialBookmarks.forEach((id) => (state[id] = true));
    return state;
  });
  const [loading, setLoading] = useState<string | null>(null);

  async function toggleBookmark(postId: string) {
    setLoading(postId);
    const isBookmarked = bookmarks[postId];

    try {
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: postId,
          action: isBookmarked ? 'remove' : 'add',
        }),
      });

      if (res.ok) {
        setBookmarks((prev) => ({ ...prev, [postId]: !isBookmarked }));
      }
    } catch (err) {
      console.error('Bookmark toggle failed:', err);
    } finally {
      setLoading(null);
    }
  }

  function relevanceColor(score: number): string {
    if (score >= 0.8) return 'text-green-400';
    if (score >= 0.5) return 'text-yellow-400';
    return 'text-muted-foreground';
  }

  return (
    <div className="space-y-8">
      {/* AI Summary */}
      <section>
        <h2 className="mb-3 text-xl font-semibold">Today&apos;s Summary</h2>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm leading-relaxed text-foreground/90">
              {digest.summary}
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Key Takeaways */}
      <section>
        <h2 className="mb-3 text-xl font-semibold">Key Takeaways</h2>
        <div className="space-y-2">
          {digest.key_takeaways.map((takeaway, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-lg border border-border bg-card p-3"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {i + 1}
              </span>
              <p className="text-sm leading-relaxed">{takeaway}</p>
            </div>
          ))}
        </div>
      </section>

      <Separator />

      {/* Posts */}
      <section>
        <h2 className="mb-3 text-xl font-semibold">
          Top {digest.posts.length} Posts
        </h2>
        <div className="space-y-3">
          {digest.posts
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((dp) => (
              <Card key={dp.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {dp.post.source === 'reddit'
                            ? `r/${dp.post.subreddit}`
                            : 'Twitter'}
                        </Badge>
                        <span
                          className={`text-xs font-medium ${relevanceColor(dp.relevance_score)}`}
                        >
                          {Math.round(dp.relevance_score * 100)}% relevant
                        </span>
                      </div>

                      <h3 className="text-sm font-medium leading-snug">
                        {dp.post.title}
                      </h3>

                      {dp.ai_summary && (
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          {dp.ai_summary}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>u/{dp.post.author}</span>
                        {dp.post.score > 0 && (
                          <span className="flex items-center gap-0.5">
                            <ArrowUp className="h-3 w-3" />
                            {dp.post.score.toLocaleString()}
                          </span>
                        )}
                        {dp.post.num_comments > 0 && (
                          <span className="flex items-center gap-0.5">
                            <MessageSquare className="h-3 w-3" />
                            {dp.post.num_comments.toLocaleString()}
                          </span>
                        )}
                        {dp.post.published_at && (
                          <span>{relativeTime(dp.post.published_at)}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleBookmark(dp.post.id)}
                        disabled={loading === dp.post.id}
                        className="h-8 w-8"
                      >
                        {bookmarks[dp.post.id] ? (
                          <BookmarkCheck className="h-4 w-4 text-primary" />
                        ) : (
                          <Bookmark className="h-4 w-4" />
                        )}
                      </Button>
                      <a
                        href={dp.post.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </section>
    </div>
  );
}
