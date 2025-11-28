import type { Plugin } from 'vite';
import satori from 'satori';
import { createCanvas } from 'canvas';
import { readFileSync } from 'fs';
import { join } from 'path';

export function ogApiPlugin(): Plugin {
  return {
    name: 'og-api',
    enforce: 'pre',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        // Intercepter uniquement les routes /api/og/*
        if (!req.url?.startsWith('/api/og/')) {
          return next();
        }

        try {
          const url = new URL(req.url, `http://${req.headers.host}`);
          const pathname = url.pathname;
          
          console.log('[OG API Plugin] Request pathname:', pathname, 'req.url:', req.url);

          if (pathname === '/api/og/trip') {
            const searchParams = url.searchParams;
            const fromCity = searchParams.get('from') || 'Paris';
            const toCity = searchParams.get('to') || 'Cotonou';
            const fromCountry = searchParams.get('fromCountry') || 'France';
            const toCountry = searchParams.get('toCountry') || 'Bénin';
            const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
            const capacity = searchParams.get('capacity') || '10';
            const price = searchParams.get('price') || '5';

            // Charger la police TTF depuis node_modules ou public
            let fontData;
            const fontPaths = [
              join(process.cwd(), 'node_modules', '@fontsource', 'inter', 'files', 'inter-latin-400-normal.ttf'),
              join(process.cwd(), 'public', 'fonts', 'Inter-Regular.ttf'),
              join(process.cwd(), 'public', 'fonts', 'Inter-Regular.woff'),
            ];
            
            let fontLoaded = false;
            for (const fontPath of fontPaths) {
              try {
                fontData = readFileSync(fontPath);
                fontLoaded = true;
                break;
              } catch (e) {
                // Continuer à essayer
              }
            }
            
            if (!fontLoaded) {
              throw new Error('Font file not found. Please install @fontsource/inter or add a font to public/fonts/');
            }

            const svg = await satori(
              {
                type: 'div',
                props: {
                  style: {
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    padding: '60px',
                  },
                  children: {
                    type: 'div',
                    props: {
                      style: {
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        background: 'white',
                        borderRadius: '24px',
                        padding: '48px',
                        width: '100%',
                        maxWidth: '1080px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                      },
                      children: [
                        {
                          type: 'div',
                          props: {
                            style: { display: 'flex', alignItems: 'center', marginBottom: '32px' },
                            children: [
                              {
                                type: 'div',
                                props: {
                                  style: {
                                    display: 'flex',
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    borderRadius: '12px',
                                    padding: '12px 24px',
                                    marginRight: '16px',
                                  },
                                  children: { type: 'span', props: { style: { fontSize: '32px', fontWeight: 'bold', color: 'white' }, children: '✈️ VOYAGE' } },
                                },
                              },
                              {
                                type: 'div',
                                props: {
                                  style: { display: 'flex', flexDirection: 'column' },
                                  children: [
                                    { type: 'span', props: { style: { fontSize: '20px', color: '#6b7280' }, children: 'Kolimeet' } },
                                    { type: 'span', props: { style: { fontSize: '16px', color: '#9ca3af' }, children: 'Transport de colis' } },
                                  ],
                                },
                              },
                            ],
                          },
                        },
                        {
                          type: 'div',
                          props: {
                            style: { display: 'flex', alignItems: 'center', marginBottom: '32px', width: '100%' },
                            children: [
                              {
                                type: 'div',
                                props: {
                                  style: { display: 'flex', flexDirection: 'column', flex: 1 },
                                  children: [
                                    { type: 'span', props: { style: { fontSize: '48px', fontWeight: 'bold', color: '#1f2937' }, children: fromCity } },
                                    { type: 'span', props: { style: { fontSize: '24px', color: '#6b7280' }, children: fromCountry } },
                                  ],
                                },
                              },
                              { type: 'div', props: { style: { display: 'flex', margin: '0 32px', fontSize: '56px' }, children: '→' } },
                              {
                                type: 'div',
                                props: {
                                  style: { display: 'flex', flexDirection: 'column', flex: 1, alignItems: 'flex-end' },
                                  children: [
                                    { type: 'span', props: { style: { fontSize: '48px', fontWeight: 'bold', color: '#1f2937' }, children: toCity } },
                                    { type: 'span', props: { style: { fontSize: '24px', color: '#6b7280' }, children: toCountry } },
                                  ],
                                },
                              },
                            ],
                          },
                        },
                        {
                          type: 'div',
                          props: {
                            style: { display: 'flex', gap: '24px', width: '100%' },
                            children: [
                              {
                                type: 'div',
                                props: {
                                  style: { display: 'flex', flexDirection: 'column', background: '#f3f4f6', borderRadius: '12px', padding: '20px', flex: 1 },
                                  children: [
                                    { type: 'span', props: { style: { fontSize: '18px', color: '#6b7280', marginBottom: '8px' }, children: '📅 Date' } },
                                    { type: 'span', props: { style: { fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }, children: date } },
                                  ],
                                },
                              },
                              {
                                type: 'div',
                                props: {
                                  style: { display: 'flex', flexDirection: 'column', background: '#f3f4f6', borderRadius: '12px', padding: '20px', flex: 1 },
                                  children: [
                                    { type: 'span', props: { style: { fontSize: '18px', color: '#6b7280', marginBottom: '8px' }, children: '⚖️ Capacité' } },
                                    { type: 'span', props: { style: { fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }, children: `${capacity} kg` } },
                                  ],
                                },
                              },
                              {
                                type: 'div',
                                props: {
                                  style: { display: 'flex', flexDirection: 'column', background: '#f3f4f6', borderRadius: '12px', padding: '20px', flex: 1 },
                                  children: [
                                    { type: 'span', props: { style: { fontSize: '18px', color: '#6b7280', marginBottom: '8px' }, children: '💰 Prix' } },
                                    { type: 'span', props: { style: { fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }, children: `${price}€/kg` } },
                                  ],
                                },
                              },
                            ],
                          },
                        },
                      ],
                    },
                  },
                },
              },
              { 
                width: 1200, 
                height: 630,
                fonts: [
                  {
                    name: 'Inter',
                    data: fontData,
                    style: 'normal',
                    weight: 400,
                  },
                ],
              }
            );

            // Convertir SVG en PNG avec canvas
            const canvas = createCanvas(1200, 630);
            const ctx = canvas.getContext('2d');
            const { loadImage } = await import('canvas');
            const svgDataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
            const img = await loadImage(svgDataUrl);
            ctx.drawImage(img, 0, 0);
            const buffer = canvas.toBuffer('image/png');
            res.setHeader('Content-Type', 'image/png');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
            res.end(Buffer.from(buffer));
            return;
          }

          if (pathname === '/api/og/parcel') {
            const searchParams = url.searchParams;
            const fromCity = searchParams.get('from') || 'Cotonou';
            const toCity = searchParams.get('to') || 'Paris';
            const fromCountry = searchParams.get('fromCountry') || 'Bénin';
            const toCountry = searchParams.get('toCountry') || 'France';
            const weight = searchParams.get('weight') || '5';
            const type = searchParams.get('type') || 'colis';
            const deadline = searchParams.get('deadline') || new Date().toISOString().split('T')[0];
            const reward = searchParams.get('reward') || '50';

            const getParcelEmoji = (type: string) => {
              const emojiMap: { [key: string]: string } = {
                'document': '📄',
                'colis': '📦',
                'vetement': '👕',
                'electronique': '💻',
                'alimentaire': '🍱',
                'autre': '📦'
              };
              return emojiMap[type.toLowerCase()] || '📦';
            };

            const emoji = getParcelEmoji(type);
            const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);

            // Charger la police TTF depuis node_modules ou public
            let fontData;
            const fontPaths = [
              join(process.cwd(), 'node_modules', '@fontsource', 'inter', 'files', 'inter-latin-400-normal.ttf'),
              join(process.cwd(), 'public', 'fonts', 'Inter-Regular.ttf'),
              join(process.cwd(), 'public', 'fonts', 'Inter-Regular.woff'),
            ];
            
            let fontLoaded = false;
            for (const fontPath of fontPaths) {
              try {
                fontData = readFileSync(fontPath);
                fontLoaded = true;
                break;
              } catch (e) {
                // Continuer à essayer
              }
            }
            
            if (!fontLoaded) {
              throw new Error('Font file not found. Please install @fontsource/inter or add a font to public/fonts/');
            }

            const svg = await satori(
              {
                type: 'div',
                props: {
                  style: {
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    padding: '60px',
                  },
                  children: {
                    type: 'div',
                    props: {
                      style: {
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        background: 'white',
                        borderRadius: '24px',
                        padding: '48px',
                        width: '100%',
                        maxWidth: '1080px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                      },
                      children: [
                        {
                          type: 'div',
                          props: {
                            style: { display: 'flex', alignItems: 'center', marginBottom: '32px' },
                            children: [
                              {
                                type: 'div',
                                props: {
                                  style: {
                                    display: 'flex',
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    borderRadius: '12px',
                                    padding: '12px 24px',
                                    marginRight: '16px',
                                  },
                                  children: { type: 'span', props: { style: { fontSize: '32px', fontWeight: 'bold', color: 'white' }, children: '📦 COLIS' } },
                                },
                              },
                              {
                                type: 'div',
                                props: {
                                  style: { display: 'flex', flexDirection: 'column' },
                                  children: [
                                    { type: 'span', props: { style: { fontSize: '20px', color: '#6b7280' }, children: 'Kolimeet' } },
                                    { type: 'span', props: { style: { fontSize: '16px', color: '#9ca3af' }, children: 'Transport de colis' } },
                                  ],
                                },
                              },
                            ],
                          },
                        },
                        {
                          type: 'div',
                          props: {
                            style: { display: 'flex', marginBottom: '24px' },
                            children: {
                              type: 'div',
                              props: {
                                style: {
                                  background: '#dcfce7',
                                  borderRadius: '999px',
                                  padding: '12px 32px',
                                  display: 'flex',
                                  alignItems: 'center',
                                },
                                children: [
                                  { type: 'span', props: { style: { fontSize: '28px', marginRight: '12px' }, children: emoji } },
                                  { type: 'span', props: { style: { fontSize: '20px', fontWeight: 'bold', color: '#059669' }, children: typeLabel } },
                                ],
                              },
                            },
                          },
                        },
                        {
                          type: 'div',
                          props: {
                            style: { display: 'flex', alignItems: 'center', marginBottom: '32px', width: '100%' },
                            children: [
                              {
                                type: 'div',
                                props: {
                                  style: { display: 'flex', flexDirection: 'column', flex: 1 },
                                  children: [
                                    { type: 'span', props: { style: { fontSize: '48px', fontWeight: 'bold', color: '#1f2937' }, children: fromCity } },
                                    { type: 'span', props: { style: { fontSize: '24px', color: '#6b7280' }, children: fromCountry } },
                                  ],
                                },
                              },
                              { type: 'div', props: { style: { display: 'flex', margin: '0 32px', fontSize: '56px' }, children: '→' } },
                              {
                                type: 'div',
                                props: {
                                  style: { display: 'flex', flexDirection: 'column', flex: 1, alignItems: 'flex-end' },
                                  children: [
                                    { type: 'span', props: { style: { fontSize: '48px', fontWeight: 'bold', color: '#1f2937' }, children: toCity } },
                                    { type: 'span', props: { style: { fontSize: '24px', color: '#6b7280' }, children: toCountry } },
                                  ],
                                },
                              },
                            ],
                          },
                        },
                        {
                          type: 'div',
                          props: {
                            style: { display: 'flex', gap: '24px', width: '100%' },
                            children: [
                              {
                                type: 'div',
                                props: {
                                  style: { display: 'flex', flexDirection: 'column', background: '#f3f4f6', borderRadius: '12px', padding: '20px', flex: 1 },
                                  children: [
                                    { type: 'span', props: { style: { fontSize: '18px', color: '#6b7280', marginBottom: '8px' }, children: '⚖️ Poids' } },
                                    { type: 'span', props: { style: { fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }, children: `${weight} kg` } },
                                  ],
                                },
                              },
                              {
                                type: 'div',
                                props: {
                                  style: { display: 'flex', flexDirection: 'column', background: '#f3f4f6', borderRadius: '12px', padding: '20px', flex: 1 },
                                  children: [
                                    { type: 'span', props: { style: { fontSize: '18px', color: '#6b7280', marginBottom: '8px' }, children: '📅 Avant le' } },
                                    { type: 'span', props: { style: { fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }, children: deadline } },
                                  ],
                                },
                              },
                              {
                                type: 'div',
                                props: {
                                  style: { display: 'flex', flexDirection: 'column', background: '#f3f4f6', borderRadius: '12px', padding: '20px', flex: 1 },
                                  children: [
                                    { type: 'span', props: { style: { fontSize: '18px', color: '#6b7280', marginBottom: '8px' }, children: '💰 Récompense' } },
                                    { type: 'span', props: { style: { fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }, children: `${reward}€` } },
                                  ],
                                },
                              },
                            ],
                          },
                        },
                      ],
                    },
                  },
                },
              },
              { 
                width: 1200, 
                height: 630,
                fonts: [
                  {
                    name: 'Inter',
                    data: fontData,
                    style: 'normal',
                    weight: 400,
                  },
                ],
              }
            );

            // Convertir SVG en PNG avec canvas
            const canvas = createCanvas(1200, 630);
            const ctx = canvas.getContext('2d');
            const { loadImage } = await import('canvas');
            const svgDataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
            const img = await loadImage(svgDataUrl);
            ctx.drawImage(img, 0, 0);
            const buffer = canvas.toBuffer('image/png');
            res.setHeader('Content-Type', 'image/png');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
            res.end(Buffer.from(buffer));
            return;
          }

          next();
        } catch (error: any) {
          console.error('Error generating OG image:', error);
          console.error('Error stack:', error?.stack);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'text/plain');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(`Failed to generate image: ${error?.message || String(error)}`);
        }
      });
    },
  };
}

