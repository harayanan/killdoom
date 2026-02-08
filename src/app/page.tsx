import { getSupabase } from '@/lib/supabase';
import { TopicCard } from '@/components/dashboard/TopicCard';
import { Skull } from 'lucide-react';
import { RELEVANCE_THRESHOLD } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = getSupabase();
  const today = new Date().toISOString().split('T')[0];

  // Fetch active topics
  const { data: topics } = await supabase
    .from('topics')
    .select('*')
    .eq('is_active', true)
    .order('sort_order') as { data: Record<string, unknown>[] | null };

  // Fetch today's digests
  const { data: digests } = await supabase
    .from('daily_digests')
    .select('*')
    .eq('digest_date', today) as { data: Record<string, unknown>[] | null };

  // Map digests by topic_id
  const digestByTopic = new Map(
    (digests || []).map((d: Record<string, unknown>) => [d.topic_id, d])
  );

  // Fetch post counts per digest, split by section
  const digestIds = (digests || []).map((d: Record<string, unknown>) => d.id as string);
  const postCountsByDigest = new Map<string, { news: number; individual: number }>();

  if (digestIds.length > 0) {
    const { data: digestPosts } = await supabase
      .from('digest_posts')
      .select('digest_id, section, relevance_score')
      .in('digest_id', digestIds)
      .gte('relevance_score', RELEVANCE_THRESHOLD);

    for (const dp of (digestPosts || []) as { digest_id: string; section: string | null; relevance_score: number }[]) {
      const counts = postCountsByDigest.get(dp.digest_id) || { news: 0, individual: 0 };
      if (dp.section === 'individual') {
        counts.individual++;
      } else {
        counts.news++;
      }
      postCountsByDigest.set(dp.digest_id, counts);
    }
  }

  // Map post counts by topic_id
  const postCountsByTopic = new Map<string, { news: number; individual: number }>();
  for (const d of (digests || [])) {
    const counts = postCountsByDigest.get(d.id as string);
    if (counts) {
      postCountsByTopic.set(d.topic_id as string, counts);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Skull className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">
            Today&apos;s Digest
          </h1>
        </div>
        <p className="text-muted-foreground">
          AI-curated summaries from Reddit, Hacker News, and RSS. No doomscrolling needed.
        </p>
      </div>

      {!topics || (topics as Record<string, unknown>[]).length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <Skull className="mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-1 text-lg font-medium">No topics configured</h2>
          <p className="text-sm text-muted-foreground">
            Run the database migrations and seed topics to get started.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(topics as Record<string, unknown>[]).map((topic: Record<string, unknown>) => (
            <TopicCard
              key={topic.id as string}
              topic={topic as { slug: string; name: string; description: string | null; icon: string | null }}
              digest={digestByTopic.get(topic.id) as { summary: string; key_takeaways: string[]; post_count: number; digest_date: string; news_summary?: string | null; individual_summary?: string | null } | null}
              postCounts={postCountsByTopic.get(topic.id as string) || null}
            />
          ))}
        </div>
      )}
    </div>
  );
}
