import { getSupabase } from '@/lib/supabase';
import { TopicCard } from '@/components/dashboard/TopicCard';
import { Skull } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = getSupabase();
  const today = new Date().toISOString().split('T')[0];

  // Fetch active topics
  const { data: topics } = await supabase
    .from('topics')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  // Fetch today's digests
  const { data: digests } = await supabase
    .from('daily_digests')
    .select('*')
    .eq('digest_date', today);

  // Map digests by topic_id
  const digestByTopic = new Map(
    (digests || []).map((d) => [d.topic_id, d])
  );

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
          AI-curated summaries from Reddit and Twitter. No doomscrolling needed.
        </p>
      </div>

      {!topics || topics.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <Skull className="mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-1 text-lg font-medium">No topics configured</h2>
          <p className="text-sm text-muted-foreground">
            Run the database migrations and seed topics to get started.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map((topic) => (
            <TopicCard
              key={topic.id}
              topic={topic}
              digest={digestByTopic.get(topic.id) || null}
            />
          ))}
        </div>
      )}
    </div>
  );
}
