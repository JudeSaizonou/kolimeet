import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

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

export default async function handler(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    
    const fromCity = searchParams.get('from') || 'Cotonou';
    const toCity = searchParams.get('to') || 'Paris';
    const fromCountry = searchParams.get('fromCountry') || 'Bénin';
    const toCountry = searchParams.get('toCountry') || 'France';
    const weight = searchParams.get('weight') || '5';
    const type = searchParams.get('type') || 'colis';
    const deadline = searchParams.get('deadline') || new Date().toISOString().split('T')[0];
    const reward = searchParams.get('reward') || '50';

    const emoji = getParcelEmoji(type);

    const response = new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
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
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  borderRadius: '12px',
                  padding: '12px 24px',
                  marginRight: '16px',
                }}
              >
                <span style={{ fontSize: '32px', fontWeight: 'bold', color: 'white' }}>📦 COLIS</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '20px', color: '#6b7280' }}>Kolimeet</span>
                <span style={{ fontSize: '16px', color: '#9ca3af' }}>Transport de colis</span>
              </div>
            </div>

            {/* Type Badge */}
            <div style={{ marginBottom: '24px' }}>
              <div
                style={{
                  background: '#dcfce7',
                  borderRadius: '999px',
                  padding: '12px 32px',
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: '28px', marginRight: '12px' }}>{emoji}</span>
                <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#059669' }}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </span>
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
                <span style={{ fontSize: '18px', color: '#6b7280', marginBottom: '8px' }}>⚖️ Poids</span>
                <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>{weight} kg</span>
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
                <span style={{ fontSize: '18px', color: '#6b7280', marginBottom: '8px' }}>📅 Avant le</span>
                <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>{deadline}</span>
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
                <span style={{ fontSize: '18px', color: '#6b7280', marginBottom: '8px' }}>💰 Récompense</span>
                <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>{reward}€</span>
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
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    
    return response;
  } catch (e) {
    console.error(e);
    return new Response(`Failed to generate image`, {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
