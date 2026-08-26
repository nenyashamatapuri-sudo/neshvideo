import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name.replace(/\s+/g, '-')}`;
    const path = `portfolio/${filename}`;

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const uint8Array = new Uint8Array(bytes);

    // Upload to Supabase Storage
    const { error, data } = await supabase.storage
      .from('portfolio')
      .upload(path, uint8Array, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: publicUrl } = supabase.storage
      .from('portfolio')
      .getPublicUrl(path);

    return NextResponse.json({ url: publicUrl.publicUrl }, { status: 200 });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json(
      { error: `Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
