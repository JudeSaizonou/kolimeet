import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

async function generateSitemap() {
  const baseUrl = 'https://kolimeet.fr';
  const urls: SitemapUrl[] = [];

  // Pages statiques
  const staticPages = [
    { path: '/', changefreq: 'daily' as const, priority: 1.0 },
    { path: '/explorer', changefreq: 'hourly' as const, priority: 0.9 },
    { path: '/auth/login', changefreq: 'monthly' as const, priority: 0.6 },
    { path: '/auth/register', changefreq: 'monthly' as const, priority: 0.6 },
    { path: '/cgu', changefreq: 'yearly' as const, priority: 0.3 },
    { path: '/confidentialite', changefreq: 'yearly' as const, priority: 0.3 },
    { path: '/articles-interdits', changefreq: 'yearly' as const, priority: 0.3 },
    { path: '/faq', changefreq: 'monthly' as const, priority: 0.5 },
    { path: '/contact', changefreq: 'monthly' as const, priority: 0.4 },
  ];

  staticPages.forEach(({ path, changefreq, priority }) => {
    urls.push({
      loc: `${baseUrl}${path}`,
      changefreq,
      priority,
    });
  });

  // Annonces de colis actives
  const { data: parcels } = await supabase
    .from('parcels')
    .select('id, updated_at')
    .eq('status', 'active')
    .limit(1000);

  parcels?.forEach((parcel) => {
    urls.push({
      loc: `${baseUrl}/colis/${parcel.id}`,
      lastmod: new Date(parcel.updated_at).toISOString().split('T')[0],
      changefreq: 'weekly',
      priority: 0.7,
    });
  });

  // Annonces de trajets actifs
  const { data: trips } = await supabase
    .from('trips')
    .select('id, updated_at')
    .eq('status', 'active')
    .limit(1000);

  trips?.forEach((trip) => {
    urls.push({
      loc: `${baseUrl}/trajet/${trip.id}`,
      lastmod: new Date(trip.updated_at).toISOString().split('T')[0],
      changefreq: 'weekly',
      priority: 0.7,
    });
  });

  // Profils publics (avec au moins 1 avis)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, updated_at')
    .gte('rating', 1)
    .limit(500);

  profiles?.forEach((profile) => {
    urls.push({
      loc: `${baseUrl}/u/${profile.user_id}`,
      lastmod: new Date(profile.updated_at).toISOString().split('T')[0],
      changefreq: 'monthly',
      priority: 0.5,
    });
  });

  // Générer le XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ''}
    ${url.priority !== undefined ? `<priority>${url.priority}</priority>` : ''}
  </url>`
  )
  .join('\n')}
</urlset>`;

  // Écrire le fichier
  const outputPath = join(process.cwd(), 'public', 'sitemap.xml');
  writeFileSync(outputPath, xml, 'utf-8');

  console.log(`✅ Sitemap generated with ${urls.length} URLs`);
  console.log(`   - Static pages: ${staticPages.length}`);
  console.log(`   - Parcels: ${parcels?.length || 0}`);
  console.log(`   - Trips: ${trips?.length || 0}`);
  console.log(`   - Profiles: ${profiles?.length || 0}`);
}

generateSitemap().catch(console.error);
