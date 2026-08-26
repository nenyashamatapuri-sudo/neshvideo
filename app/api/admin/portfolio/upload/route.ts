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
    const filename = `${timestamp}-${file.name}`;
    const path = `portfolio/${filename}`;

    const buffer = await file.arrayBuffer();
    const { error } = await supabase.storage
      .from('portfolio')
      .upload(path, buffer, {
        contentType: file.type,
      });

    if (error) throw error;

    const { data } = supabase.storage.from('portfolio').getPublicUrl(path);

    return NextResponse.json({ url: data.publicUrl });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
