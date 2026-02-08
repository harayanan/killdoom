import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { savePost, unsavePost } from '@/lib/reddit-client';

export async function GET() {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('bookmarks')
    .select(
      `
      id,
      reddit_synced,
      created_at,
      post:posts (
        id,
        source,
        external_id,
        title,
        url,
        author,
        subreddit,
        score,
        published_at
      )
    `
    )
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ bookmarks: data });
}

export async function POST(request: Request) {
  const supabase = getSupabase();
  const body = await request.json();
  const { post_id, action } = body as { post_id: string; action: 'add' | 'remove' };

  if (!post_id || !action) {
    return NextResponse.json(
      { error: 'post_id and action are required' },
      { status: 400 }
    );
  }

  if (action === 'add') {
    // Add bookmark
    const { error: bookmarkError } = await supabase
      .from('bookmarks')
      .upsert({ post_id }, { onConflict: 'post_id' });

    if (bookmarkError) {
      return NextResponse.json(
        { error: bookmarkError.message },
        { status: 500 }
      );
    }

    // Try to sync to Reddit (non-blocking)
    try {
      const { data: post } = await supabase
        .from('posts')
        .select('source, external_id')
        .eq('id', post_id)
        .single();

      if (post?.source === 'reddit') {
        const synced = await savePost(post.external_id);
        if (synced) {
          await supabase
            .from('bookmarks')
            .update({
              reddit_synced: true,
              reddit_synced_at: new Date().toISOString(),
            })
            .eq('post_id', post_id);
        }
      }
    } catch (err) {
      console.error('Reddit sync failed:', err);
    }

    return NextResponse.json({ success: true, action: 'added' });
  }

  if (action === 'remove') {
    // Try to unsave from Reddit first
    try {
      const { data: post } = await supabase
        .from('posts')
        .select('source, external_id')
        .eq('id', post_id)
        .single();

      if (post?.source === 'reddit') {
        await unsavePost(post.external_id);
      }
    } catch (err) {
      console.error('Reddit unsave failed:', err);
    }

    const { error: deleteError } = await supabase
      .from('bookmarks')
      .delete()
      .eq('post_id', post_id);

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, action: 'removed' });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
