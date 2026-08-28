'use server';

import {
  supabase,
  type GalleryImage,
  type PortfolioCategory,
  type PortfolioPiece,
} from '@/lib/supabase';

const CATEGORIES: PortfolioCategory[] = [
  'directing',
  'photography',
  'videography',
  'production',
];

function isCategory(slug: string): slug is PortfolioCategory {
  return (CATEGORIES as string[]).includes(slug);
}

/**
 * Supabase returns `images` as raw JSON. Normalise it into the shape the
 * pages expect, so a hand-edited row can never crash a render.
 */
function normalise(row: Record<string, unknown>): PortfolioPiece {
  const raw = Array.isArray(row.images) ? row.images : [];
  const images: GalleryImage[] = raw
    .filter((i): i is GalleryImage => Boolean(i) && typeof (i as GalleryImage).url === 'string')
    .map((i, n) => ({ ...i, sort_order: i.sort_order ?? n }))
    .sort((a, b) => a.sort_order - b.sort_order);

  return { ...(row as unknown as PortfolioPiece), images };
}

/** Every piece in a section, in the order the CMS says. */
export async function getPortfolioPiecesByCategory(slug: string): Promise<PortfolioPiece[]> {
  if (!isCategory(slug)) return [];

  try {
    const { data, error } = await supabase
      .from('portfolio_pieces')
      .select('*')
      .eq('category', slug)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data ?? []).map(normalise);
  } catch (err) {
    console.error('Failed to fetch portfolio pieces:', err);
    return [];
  }
}

/** One piece, addressed the way the URL addresses it. */
export async function getPortfolioPiece(
  category: string,
  slug: string
): Promise<PortfolioPiece | null> {
  if (!isCategory(category)) return null;

  try {
    const { data, error } = await supabase
      .from('portfolio_pieces')
      .select('*')
      .eq('category', category)
      .eq('slug', slug)
      .maybeSingle();

    if (error) throw error;
    return data ? normalise(data) : null;
  } catch (err) {
    console.error('Failed to fetch portfolio piece:', err);
    return null;
  }
}

/**
 * Everything, for `generateStaticParams` and for the homepage binder — which
 * wants one representative still per section.
 */
export async function getAllPortfolioPieces(): Promise<PortfolioPiece[]> {
  try {
    const { data, error } = await supabase
      .from('portfolio_pieces')
      .select('*')
      .order('category', { ascending: true })
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return (data ?? []).map(normalise);
  } catch (err) {
    console.error('Failed to fetch portfolio pieces:', err);
    return [];
  }
}
