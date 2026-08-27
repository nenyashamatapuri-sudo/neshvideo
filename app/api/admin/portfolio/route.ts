import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('portfolio_pieces')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch pieces' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Convert empty strings to null for optional fields
    const cleanedBody = {
      ...body,
      description: body.description || null,
      vimeo_url: body.vimeo_url || null,
      image_url: body.image_url || null,
      storage_path: body.storage_path || null,
    };

    const { data, error } = await supabase
      .from('portfolio_pieces')
      .insert([cleanedBody])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('Portfolio create error:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
