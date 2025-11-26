import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    
    const fromCity = searchParams.get('from') || 'Paris';
    const toCity = searchParams.get('to') || 'Cotonou';
    const fromCountry = searchParams.get('fromCountry') || 'France';
    const toCountry = searchParams.get('toCountry') || 'Bénin';
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const capacity = searchParams.get('capacity') || '10';
    const price = searchParams.get('price') || '5';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '60px',
          }}
        >
          <div
            style={{
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
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
              <div
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '12px',
                  padding: '12px 24px',
                  marginRight: '16px',
                }}
              >
                <span style={{ fontSize: '32px', fontWeight: 'bold', color: 'white' }}>✈️ VOYAGE</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '20px', color: '#6b7280' }}>Kolimeet</span>
                <span style={{ fontSize: '16px', color: '#9ca3af' }}>Transport de colis</span>
              </div>
            </div>

            {/* Route */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px', width: '100%' }}>
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <span style={{ fontSize: '48px', fontWeight: 'bold', color: '#1f2937' }}>{fromCity}</span>
                <span style={{ fontSize: '24px', color: '#6b7280' }}>{fromCountry}</span>
              </div>
              <div style={{ margin: '0 32px', fontSize: '56px' }}>→</div>
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, alignItems: 'flex-end' }}>
                <span style={{ fontSize: '48px', fontWeight: 'bold', color: '#1f2937' }}>{toCity}</span>
                <span style={{ fontSize: '24px', color: '#6b7280' }}>{toCountry}</span>
              </div>
            </div>

            {/* Details */}
            <div style={{ display: 'flex', gap: '24px', width: '100%' }}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  background: '#f3f4f6',
                  borderRadius: '12px',
                  padding: '20px',
                  flex: 1,
                }}
              >
                <span style={{ fontSize: '18px', color: '#6b7280', marginBottom: '8px' }}>📅 Date</span>
                <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>{date}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  background: '#f3f4f6',
                  borderRadius: '12px',
                  padding: '20px',
                  flex: 1,
                }}
              >
                <span style={{ fontSize: '18px', color: '#6b7280', marginBottom: '8px' }}>⚖️ Capacité</span>
                <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>{capacity} kg</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  background: '#f3f4f6',
                  borderRadius: '12px',
                  padding: '20px',
                  flex: 1,
                }}
              >
                <span style={{ fontSize: '18px', color: '#6b7280', marginBottom: '8px' }}>💰 Prix</span>
                <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>{price}€/kg</span>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e) {
    console.error(e);
    return new Response(`Failed to generate image`, {
      status: 500,
    });
  }
}
