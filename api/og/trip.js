import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default function handler(req) {
  try {
    const { searchParams } = new URL(req.url);

    const fromCity = searchParams.get('from') || 'Paris';
    const toCity = searchParams.get('to') || 'Cotonou';
    const fromCountry = searchParams.get('fromCountry') || 'France';
    const toCountry = searchParams.get('toCountry') || 'Bénin';
    const date = searchParams.get('date') || '1 janvier 2026';
    const capacity = searchParams.get('capacity') || '20';
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
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 40,
              left: 60,
              fontSize: 32,
              fontWeight: 'bold',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            ✈️ Kolimeet
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              background: 'white',
              borderRadius: 24,
              padding: 60,
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              width: 900,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 40,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div
                  style={{
                    fontSize: 48,
                    fontWeight: 'bold',
                    color: '#1a1a1a',
                  }}
                >
                  {fromCity}
                </div>
                <div style={{ fontSize: 24, color: '#666', marginTop: 8 }}>
                  {fromCountry}
                </div>
              </div>

              <div
                style={{
                  fontSize: 60,
                  color: '#667eea',
                  marginLeft: 40,
                  marginRight: 40,
                }}
              >
                →
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div
                  style={{
                    fontSize: 48,
                    fontWeight: 'bold',
                    color: '#1a1a1a',
                  }}
                >
                  {toCity}
                </div>
                <div style={{ fontSize: 24, color: '#666', marginTop: 8 }}>
                  {toCountry}
                </div>
              </div>
            </div>

            <div
              style={{
                height: 2,
                background: 'linear-gradient(90deg, transparent, #e0e0e0, transparent)',
                marginBottom: 40,
              }}
            />

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 40,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  background: '#f8f9fa',
                  borderRadius: 16,
                  padding: 24,
                  flex: 1,
                }}
              >
                <div style={{ fontSize: 40, marginBottom: 8 }}>📅</div>
                <div style={{ fontSize: 20, color: '#666', marginBottom: 4 }}>
                  Départ
                </div>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1a1a1a' }}>
                  {date}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  background: '#f8f9fa',
                  borderRadius: 16,
                  padding: 24,
                  flex: 1,
                }}
              >
                <div style={{ fontSize: 40, marginBottom: 8 }}>📦</div>
                <div style={{ fontSize: 20, color: '#666', marginBottom: 4 }}>
                  Capacité
                </div>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1a1a1a' }}>
                  {capacity} kg
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: 16,
                  padding: 24,
                  flex: 1,
                }}
              >
                <div style={{ fontSize: 40, marginBottom: 8 }}>💰</div>
                <div style={{ fontSize: 20, color: 'rgba(255,255,255,0.9)', marginBottom: 4 }}>
                  Prix
                </div>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>
                  {price}€/kg
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 40,
                padding: 20,
                background: '#f0f4ff',
                borderRadius: 12,
              }}
            >
              <div style={{ fontSize: 24, color: '#667eea', fontWeight: 600 }}>
                🚀 Réservez maintenant sur Kolimeet
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      },
    );
  } catch (error) {
    return new Response(`Failed to generate image`, {
      status: 500,
    });
  }
}
