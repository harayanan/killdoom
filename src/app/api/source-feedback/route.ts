import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const topicId = searchParams.get('topic_id');

  const supabase = getSupabase();
  let query = supabase.from('source_feedback').select('*');

  if (topicId) {
    query = query.eq('topic_id', topicId);
  }

  const { data, error } = await query.order('updated_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ feedback: data });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { source_identifier, source_type, feedback, topic_id } = body;

  if (!source_identifier || !source_type || !feedback) {
    return NextResponse.json(
      { error: 'source_identifier, source_type, and feedback are required' },
      { status: 400 }
    );
  }

  if (!['subreddit', 'rss_feed', 'author', 'hn'].includes(source_type)) {
    return NextResponse.json(
      { error: 'source_type must be one of: subreddit, rss_feed, author, hn' },
      { status: 400 }
    );
  }

  if (!['like', 'dislike'].includes(feedback)) {
    return NextResponse.json(
      { error: 'feedback must be "like" or "dislike"' },
      { status: 400 }
    );
  }

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('source_feedback')
    .upsert(
      {
        source_identifier,
        source_type,
        feedback,
        topic_id: topic_id || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'source_identifier,topic_id' }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ feedback: data });
}
