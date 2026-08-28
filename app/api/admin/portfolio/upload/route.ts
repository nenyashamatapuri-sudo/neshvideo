import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/** Supabase's default object size cap on the free tier. */
const MAX_BYTES = 50 * 1024 * 1024;

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];

function safeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/**
 * Takes one or many stills and returns their public URLs.
 *
 * Video never comes through here — the files are far past the bucket's size
 * cap, so film lives on Vimeo and the CMS stores only the link.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('file').filter((f): f is File => f instanceof File);

    if (files.length === 0) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const uploaded: { url: string; storage_path: string }[] = [];

    for (const file of files) {
      if (!ALLOWED.includes(file.type)) {
        return NextResponse.json(
          { error: `${file.name}: ${file.type || 'unknown type'} is not an image the bucket accepts.` },
          { status: 400 }
        );
      }

      if (file.size > MAX_BYTES) {
        return NextResponse.json(
          {
            error: `${file.name} is ${(file.size / 1024 / 1024).toFixed(1)}MB, over the ${
              MAX_BYTES / 1024 / 1024
            }MB limit.`,
          },
          { status: 413 }
        );
      }

      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      const path = `portfolio/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName(
        file.name
      )}.${ext}`;

      const { error } = await supabase.storage
        .from('portfolio')
        .upload(path, new Uint8Array(await file.arrayBuffer()), {
          contentType: file.type,
          cacheControl: '31536000',
          upsert: false,
        });

      if (error) {
        // The overwhelmingly common cause is a missing storage policy, and the
        // raw message ("new row violates row-level security policy") does not
        // say what to do about it.
        const hint = /row-level security/i.test(error.message)
          ? ' — the portfolio bucket is missing its INSERT policy. Run scripts/migrate-portfolio.sql.'
          : '';
        throw new Error(`${error.message}${hint}`);
      }

      const { data } = supabase.storage.from('portfolio').getPublicUrl(path);
      uploaded.push({ url: data.publicUrl, storage_path: path });
    }

    // The first upload is spread at the top level so single-file callers can
    // keep reading `url`; `files` carries the whole batch.
    return NextResponse.json({ ...uploaded[0], files: uploaded });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Upload error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
