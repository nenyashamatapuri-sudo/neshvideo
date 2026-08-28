import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { clean } from '../route';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const row = clean(body);

    if (!row.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('portfolio_pieces')
      .update({ ...row, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Portfolio update error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Take the stored objects with the row, so deleting a piece does not leave
    // its stills orphaned in the bucket.
    const { data: piece } = await supabase
      .from('portfolio_pieces')
      .select('storage_path, images')
      .eq('id', id)
      .maybeSingle();

    const paths: string[] = [
      ...(piece?.storage_path ? [piece.storage_path] : []),
      ...(Array.isArray(piece?.images)
        ? piece.images
            .map((i: { storage_path?: string }) => i?.storage_path)
            .filter((p: string | undefined): p is string => Boolean(p))
        : []),
    ];

    if (paths.length) {
      const { error: storageError } = await supabase.storage.from('portfolio').remove(paths);
      // A missing object should not block deleting the row it belonged to.
      if (storageError) console.error('Storage cleanup failed:', storageError.message);
    }

    const { error } = await supabase.from('portfolio_pieces').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Portfolio delete error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
