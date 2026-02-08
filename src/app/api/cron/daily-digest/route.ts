import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { fetchPostsForTopic, fetchPostsForTopicSplit, storePostsInDb } from '@/lib/content-fetcher';
import { generateDigest, generateSplitDigest, type SourceFeedbackEntry } from '@/lib/ai-summarizer';

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

        // Fetch active subtopics for this topic
        const { data: subtopics } = await supabase
          .from('subtopics')
          .select('subreddits, rss_feeds_news, rss_feeds_individual, hn_tags')
          .eq('topic_id', topic.id)
          .eq('is_active', true);

        const hasSubtopics = subtopics && subtopics.length > 0;

        if (hasSubtopics) {
          // ---- Split digest path (with subtopics) ----
          const splitPosts = await fetchPostsForTopicSplit(subtopics);
          const allPosts = [...splitPosts.news, ...splitPosts.individual];

          if (allPosts.length === 0) {
            console.warn(`No posts found for topic: ${topic.name}`);
            continue;
          }

          totalPostsFetched += allPosts.length;

          // Store all posts in DB
          const storedNews = await storePostsInDb(splitPosts.news);
          const storedIndividual = await storePostsInDb(splitPosts.individual);

          // Fetch source feedback for this topic
          const { data: feedbackRows } = await supabase
            .from('source_feedback')
            .select('source_identifier, feedback')
            .eq('topic_id', topic.id);

          const feedback: SourceFeedbackEntry[] = (feedbackRows || []).map((r: Record<string, unknown>) => ({
            source_identifier: r.source_identifier as string,
            feedback: r.feedback as 'like' | 'dislike',
          }));

          // Generate split AI digest
          const digest = await generateSplitDigest(
            topic.name,
            splitPosts.news,
            splitPosts.individual,
            feedback
          );

          // Store daily digest with dual summaries
          const { data: digestRow, error: digestError } = await supabase
            .from('daily_digests')
            .upsert(
              {
                topic_id: topic.id,
                digest_date: today,
                summary: digest.news_summary || digest.individual_summary || '',
                key_takeaways: [...(digest.news_takeaways || []), ...(digest.individual_takeaways || [])],
                post_count: storedNews.length + storedIndividual.length,
                news_summary: digest.news_summary,
                individual_summary: digest.individual_summary,
                news_takeaways: digest.news_takeaways,
                individual_takeaways: digest.individual_takeaways,
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

          // Store news digest-post links
          for (let i = 0; i < storedNews.length; i++) {
            const postSummary = digest.news_post_summaries.find(
              (ps) => ps.post_index === i + 1
            );
            await supabase.from('digest_posts').upsert(
              {
                digest_id: digestRow.id,
                post_id: storedNews[i].id,
                ai_summary: postSummary?.summary || '',
                relevance_score: postSummary?.relevance_score || 0,
                sort_order: i,
                section: 'news',
              },
              { onConflict: 'digest_id,post_id' }
            );
          }

          // Store individual digest-post links
          for (let i = 0; i < storedIndividual.length; i++) {
            const postSummary = digest.individual_post_summaries.find(
              (ps) => ps.post_index === i + 1
            );
            await supabase.from('digest_posts').upsert(
              {
                digest_id: digestRow.id,
                post_id: storedIndividual[i].id,
                ai_summary: postSummary?.summary || '',
                relevance_score: postSummary?.relevance_score || 0,
                sort_order: i,
                section: 'individual',
              },
              { onConflict: 'digest_id,post_id' }
            );
          }
        } else {
          // ---- Legacy path (no subtopics) ----
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
          const storedPosts = await storePostsInDb(posts);
          const digest = await generateDigest(topic.name, posts);

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
        }

        digestsCreated++;
        console.log(`Completed digest for ${topic.name}`);
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
          status: 'completed',
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
