import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'Email parameter required' }, { status: 400 });
  }

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('email_subscriptions')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ subscription: data });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { email, topic_ids, is_active } = body;

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Basic email format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
  }

  const supabase = getSupabase();

  const upsertData: Record<string, unknown> = {
    email: normalizedEmail,
    updated_at: new Date().toISOString(),
  };

  if (Array.isArray(topic_ids)) {
    upsertData.topic_ids = topic_ids;
  }

  if (typeof is_active === 'boolean') {
    upsertData.is_active = is_active;
  }

  const { data, error } = await supabase
    .from('email_subscriptions')
    .upsert(upsertData, { onConflict: 'email' })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ subscription: data });
}
