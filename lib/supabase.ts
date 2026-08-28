import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type PortfolioCategory = 'directing' | 'photography' | 'videography' | 'production';

export const CATEGORIES: { value: PortfolioCategory; label: string }[] = [
  { value: 'directing', label: 'Directing' },
  { value: 'photography', label: 'Photography' },
  { value: 'videography', label: 'Videography' },
  { value: 'production', label: 'Production' },
];

/** One still in a piece's gallery. Ordered by `sort_order`, low to high. */
export interface GalleryImage {
  url: string;
  /** Stored so the CMS can delete the object when the image is removed. */
  storage_path?: string;
  caption?: string;
  sort_order: number;
}

export interface PortfolioPiece {
  id: string;
  /** URL segment under /work/<category>/. Unique within a category. */
  slug: string;
  title: string;
  description: string | null;
  category: PortfolioCategory;
  /** Who the work was for. */
  client: string | null;
  /** The agency it came through, when it came through one. */
  agency: string | null;
  vimeo_url: string | null;
  /** The tile image, on the section page and in the binder. */
  image_url: string | null;
  storage_path: string | null;
  /** Extra stills shown in the piece's lightbox gallery. */
  images: GalleryImage[];
  /** Announced but not yet published — renders as a dead tile. */
  coming_soon: boolean;
  /** Ascending, so the gallery order is the director's, not the database's. */
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/** Pulls the numeric id out of any of Vimeo's URL shapes. */
export function vimeoId(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = url.match(/(?:vimeo\.com\/|video\/)(\d{6,})/);
  return match ? match[1] : null;
}
