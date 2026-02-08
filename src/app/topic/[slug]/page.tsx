import { getSupabase } from '@/lib/supabase';
import { TopicDigestView } from '@/components/topic/TopicDigestView';
import { ArrowLeft, Skull } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatDate } from '@/lib/utils';
import { RELEVANCE_THRESHOLD } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function TopicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = getSupabase();
  const today = new Date().toISOString().split('T')[0];

  // Fetch the topic
  const { data: topic } = await supabase
    .from('topics')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!topic) notFound();

  // Fetch today's digest for this topic
  const { data: digest } = await supabase
    .from('daily_digests')
    .select('*')
    .eq('topic_id', topic.id)
    .eq('digest_date', today)
    .single();

  // Fetch digest posts with their linked posts, filtered by relevance
  interface DigestPostRow {
    id: string;
    ai_summary: string;
    relevance_score: number;
    sort_order: number;
    section: string | null;
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
      source_type: string | null;
    };
  }

  let digestPosts: DigestPostRow[] = [];

  if (digest) {
    const { data } = await supabase
      .from('digest_posts')
      .select(
        `
        id,
        ai_summary,
        relevance_score,
        sort_order,
        section,
        post:posts (
          id,
          source,
          title,
          url,
          author,
          subreddit,
          score,
          num_comments,
          published_at,
          source_type
        )
      `
      )
      .eq('digest_id', digest.id)
      .gte('relevance_score', RELEVANCE_THRESHOLD)
      .order('sort_order');

    // Supabase returns the FK join as an array type but it's actually a single object.
    // Cast through unknown to align types.
    digestPosts = ((data || []) as unknown as DigestPostRow[]).filter(
      (dp) => dp.post !== null
    );
  }

  // Split posts by section
  const newsPosts = digestPosts.filter((dp) => dp.section === 'news');
  const individualPosts = digestPosts.filter((dp) => dp.section === 'individual');
  const hasSections = digest?.news_summary != null;

  // Fetch bookmarked post IDs
  const postIds = digestPosts.map((dp) => dp.post.id);
  let bookmarkedIds: string[] = [];
  if (postIds.length > 0) {
    const { data: bookmarks } = await supabase
      .from('bookmarks')
      .select('post_id')
      .in('post_id', postIds);

    bookmarkedIds = (bookmarks || []).map((b: Record<string, unknown>) => b.post_id as string);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{topic.name}</h1>
        {topic.description && (
          <p className="mt-1 text-muted-foreground">{topic.description}</p>
        )}
        <p className="mt-2 text-sm text-muted-foreground">
          {formatDate(today)}
        </p>
      </div>

      {digest ? (
        <TopicDigestView
          topicName={topic.name}
          topicId={topic.id}
          digest={{
            summary: digest.summary,
            key_takeaways: digest.key_takeaways as string[],
            post_count: digest.post_count,
            digest_date: digest.digest_date,
            posts: digestPosts,
            news_summary: digest.news_summary ?? null,
            individual_summary: digest.individual_summary ?? null,
            news_takeaways: (digest.news_takeaways ?? []) as string[],
            individual_takeaways: (digest.individual_takeaways ?? []) as string[],
            news_posts: newsPosts,
            individual_posts: individualPosts,
          }}
          hasSections={hasSections}
          initialBookmarks={bookmarkedIds}
        />
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <Skull className="mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-1 text-lg font-medium">No digest for today</h2>
          <p className="text-sm text-muted-foreground">
            The daily digest hasn&apos;t run yet. Check back after 6 AM UTC.
          </p>
        </div>
      )}
    </div>
  );
}
