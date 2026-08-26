import { supabase, PortfolioPiece } from '@/lib/supabase';

export async function fetchPortfolioPieces(category?: string): Promise<PortfolioPiece[]> {
  let query = supabase
    .from('portfolio_pieces')
    .select('*')
    .order('created_at', { ascending: false });

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function fetchPortfolioPiece(id: string): Promise<PortfolioPiece> {
  const { data, error } = await supabase
    .from('portfolio_pieces')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createPortfolioPiece(piece: Omit<PortfolioPiece, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('portfolio_pieces')
    .insert([piece])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updatePortfolioPiece(id: string, piece: Partial<Omit<PortfolioPiece, 'id' | 'created_at'>>) {
  const { data, error } = await supabase
    .from('portfolio_pieces')
    .update({
      ...piece,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deletePortfolioPiece(id: string) {
  const { error } = await supabase
    .from('portfolio_pieces')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function uploadImage(file: File, folder: string = 'portfolio'): Promise<string> {
  const timestamp = Date.now();
  const filename = `${timestamp}-${file.name}`;
  const path = `${folder}/${filename}`;

  const { error } = await supabase.storage
    .from('portfolio')
    .upload(path, file);

  if (error) throw error;

  const { data } = supabase.storage.from('portfolio').getPublicUrl(path);
  return data.publicUrl;
}
