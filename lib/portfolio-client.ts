'use server';

import { supabase, PortfolioPiece } from '@/lib/supabase';

export async function getPortfolioPiecesByCategory(category: string): Promise<PortfolioPiece[]> {
  const categoryMap: Record<string, 'film' | 'stills'> = {
    directing: 'film',
    videography: 'film',
    photography: 'stills',
    production: 'stills',
  };

  const dbCategory = categoryMap[category];
  if (!dbCategory) return [];

  try {
    const { data, error } = await supabase
      .from('portfolio_pieces')
      .select('*')
      .eq('category', dbCategory)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Failed to fetch portfolio pieces:', err);
    return [];
  }
}
