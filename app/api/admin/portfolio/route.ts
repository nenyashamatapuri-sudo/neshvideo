import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/** Turn a title into a URL segment. Matches what the SQL migration backfills. */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Empty form fields arrive as "". Postgres takes that as a value, not as
 * absence, which trips the checks on optional columns — so blanks become null.
 */
export function clean(body: Record<string, unknown>) {
  return {
    title: String(body.title ?? '').trim(),
    slug: slugify(String(body.slug || body.title || '')),
    category: body.category,
    description: body.description || null,
    client: body.client || null,
    agency: body.agency || null,
    vimeo_url: body.vimeo_url || null,
    image_url: body.image_url || null,
    storage_path: body.storage_path || null,
    images: Array.isArray(body.images) ? body.images : [],
    coming_soon: Boolean(body.coming_soon),
    sort_order: Number.isFinite(Number(body.sort_order)) ? Number(body.sort_order) : 0,
  };
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('portfolio_pieces')
      .select('*')
      .order('category', { ascending: true })
      .order('sort_order', { ascending: true });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Portfolio fetch error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const row = clean(body);

    if (!row.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('portfolio_pieces')
      .insert([row])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Portfolio create error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
