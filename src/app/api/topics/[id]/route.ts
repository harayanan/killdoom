import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabase();
  const body = await request.json();

  const updates: Record<string, unknown> = {};

  if (typeof body.is_active === 'boolean') {
    updates.is_active = body.is_active;
  }

  if (typeof body.name === 'string') {
    updates.name = body.name;
  }

  if (Array.isArray(body.subreddits)) {
    updates.subreddits = body.subreddits;
  }

  if (Array.isArray(body.rss_feeds)) {
    updates.rss_feeds = body.rss_feeds;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: 'No valid fields to update' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('topics')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ topic: data });
}
