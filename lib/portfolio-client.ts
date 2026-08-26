'use server';

import { supabase, type PortfolioCategory } from '@/lib/supabase';
import { PortfolioPiece } from '@/lib/supabase';

export async function getPortfolioPiecesByCategory(slug: string): Promise<PortfolioPiece[]> {
  const categoryMap: Record<string, PortfolioCategory> = {
    directing: 'directing',
    photography: 'photography',
    videography: 'videography',
    production: 'production',
  };

  const category = categoryMap[slug];
  if (!category) return [];

  try {
    const { data, error } = await supabase
      .from('portfolio_pieces')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Failed to fetch portfolio pieces:', err);
    return [];
  }
}
