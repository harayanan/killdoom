import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { fetchPostsForTopic, storePostsInDb } from '@/lib/content-fetcher';
import { generateDigest } from '@/lib/ai-summarizer';

export const maxDuration = 300;

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabase();
  const startTime = Date.now();
  const today = new Date().toISOString().split('T')[0];
  const errors: string[] = [];
  let totalPostsFetched = 0;
  let digestsCreated = 0;

  // Track job metadata
  const { data: jobMeta } = await supabase
    .from('data_metadata')
    .insert({
      job_name: 'daily-digest',
      status: 'running',
    })
    .select('id')
    .single();

  try {
    // Fetch all active topics
    const { data: topics, error: topicsError } = await supabase
      .from('topics')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (topicsError || !topics) {
      throw new Error(`Failed to fetch topics: ${topicsError?.message}`);
    }

    for (const topic of topics) {
      try {
        console.log(`Processing topic: ${topic.name}`);

        // Fetch posts from Reddit + RSS
        const posts = await fetchPostsForTopic(
          topic.subreddits || [],
          topic.rss_feeds || [],
          10
        );

        if (posts.length === 0) {
          console.warn(`No posts found for topic: ${topic.name}`);
          continue;
        }

        totalPostsFetched += posts.length;

        // Store posts in DB
        const storedPosts = await storePostsInDb(posts);

        // Generate AI digest
        const digest = await generateDigest(topic.name, posts);

        // Store daily digest
        const { data: digestRow, error: digestError } = await supabase
          .from('daily_digests')
          .upsert(
            {
              topic_id: topic.id,
              digest_date: today,
              summary: digest.overall_summary,
              key_takeaways: digest.key_takeaways,
              post_count: storedPosts.length,
            },
            { onConflict: 'topic_id,digest_date' }
          )
          .select('id')
          .single();

        if (digestError || !digestRow) {
          errors.push(
            `Failed to store digest for ${topic.name}: ${digestError?.message}`
          );
          continue;
        }

        // Store digest-post links with AI summaries
        for (let i = 0; i < storedPosts.length; i++) {
          const postSummary = digest.post_summaries.find(
            (ps) => ps.post_index === i + 1
          );

          await supabase.from('digest_posts').upsert(
            {
              digest_id: digestRow.id,
              post_id: storedPosts[i].id,
              ai_summary: postSummary?.summary || '',
              relevance_score: postSummary?.relevance_score || 0,
              sort_order: i,
            },
            { onConflict: 'digest_id,post_id' }
          );
        }

        digestsCreated++;
        console.log(
          `Completed digest for ${topic.name}: ${storedPosts.length} posts`
        );
      } catch (topicError) {
        const msg =
          topicError instanceof Error ? topicError.message : String(topicError);
        errors.push(`Topic ${topic.name}: ${msg}`);
        console.error(`Error processing topic ${topic.name}:`, msg);
      }
    }

    const duration = Date.now() - startTime;

    // Update job metadata
    if (jobMeta) {
      await supabase
        .from('data_metadata')
        .update({
          status: errors.length > 0 ? 'completed' : 'completed',
          completed_at: new Date().toISOString(),
          posts_fetched: totalPostsFetched,
          digests_created: digestsCreated,
          errors,
          duration_ms: duration,
        })
        .eq('id', jobMeta.id);
    }

    return NextResponse.json({
      success: true,
      date: today,
      topics_processed: digestsCreated,
      posts_fetched: totalPostsFetched,
      errors: errors.length > 0 ? errors : undefined,
      duration_ms: duration,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);

    if (jobMeta) {
      await supabase
        .from('data_metadata')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          errors: [msg],
          duration_ms: Date.now() - startTime,
        })
        .eq('id', jobMeta.id);
    }

    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
