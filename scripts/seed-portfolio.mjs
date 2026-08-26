import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const pieces = [
  { title: 'Nightshift', description: 'Urban nightlife documentary series', category: 'film', vimeo_url: 'https://vimeo.com/example1' },
  { title: 'Terrace Portraits', description: 'Editorial portrait collection', category: 'stills', image_url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800' },
  { title: 'Hold Still', description: 'Cinematic short film', category: 'film', vimeo_url: 'https://vimeo.com/example2' },
  { title: 'Market Days', description: 'Street photography series', category: 'stills', image_url: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800' },
  { title: 'Signal', description: 'Experimental video art', category: 'film', vimeo_url: 'https://vimeo.com/example3' },
  { title: 'Solstice', description: 'Landscape and nature photography', category: 'stills', image_url: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800' },
  { title: 'Breath', description: 'Intimate portrait series', category: 'stills', image_url: 'https://images.unsplash.com/photo-1491684221066-81342ee5ff30?w=800' },
  { title: 'Blue Hour', description: 'Architectural cinematography', category: 'film', vimeo_url: 'https://vimeo.com/example4' },
  { title: 'Silent Streets', description: 'Urban exploration photography', category: 'stills', image_url: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800' },
  { title: 'Moment', description: 'Candid lifestyle shots', category: 'stills', image_url: 'https://images.unsplash.com/photo-1606933248051-5ce98c1b5d4d?w=800' },
  { title: 'Framework', description: 'Documentary series on craft', category: 'film', vimeo_url: 'https://vimeo.com/example5' },
  { title: 'Geometry', description: 'Abstract and minimalist photography', category: 'stills', image_url: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800' },
  { title: 'Wavelength', description: 'Music video production', category: 'film', vimeo_url: 'https://vimeo.com/example6' },
  { title: 'Texture', description: 'Macro and detail photography', category: 'stills', image_url: 'https://images.unsplash.com/photo-1515169067868-e36b8b674e4e?w=800' },
  { title: 'Passage', description: 'Travel documentary series', category: 'film', vimeo_url: 'https://vimeo.com/example7' },
  { title: 'Threshold', description: 'Interior and architectural stills', category: 'stills', image_url: 'https://images.unsplash.com/photo-1540932239986-310128078ceb?w=800' },
  { title: 'Echo', description: 'Experimental short form', category: 'film', vimeo_url: 'https://vimeo.com/example8' },
  { title: 'Spectrum', description: 'Color studies and compositions', category: 'stills', image_url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800' },
  { title: 'Pulse', description: 'Event and performance filming', category: 'film', vimeo_url: 'https://vimeo.com/example9' },
  { title: 'Traces', description: 'Documentary photography', category: 'stills', image_url: 'https://images.unsplash.com/photo-1537604537309-2b5ba3d3bc5d?w=800' },
  { title: 'Motion', description: 'Kinetic typography and animation', category: 'film', vimeo_url: 'https://vimeo.com/example10' },
  { title: 'Refraction', description: 'Still life and product photography', category: 'stills', image_url: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800' },
  { title: 'Drift', description: 'Atmospheric documentary piece', category: 'film', vimeo_url: 'https://vimeo.com/example11' },
  { title: 'Surface', description: 'Close-up and textural work', category: 'stills', image_url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800' },
  { title: 'Resonance', description: 'Multimedia experimental project', category: 'film', vimeo_url: 'https://vimeo.com/example12' },
];

async function seed() {
  console.log('Seeding portfolio pieces...');
  
  try {
    const { data, error } = await supabase
      .from('portfolio_pieces')
      .insert(pieces);

    if (error) throw error;

    console.log(`✅ Successfully seeded ${pieces.length} portfolio pieces`);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seed();
