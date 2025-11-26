import { ImageResponse } from '@vercel/og';

export default async function handler(req) {
  const { searchParams } = new URL(req.url);

  const fromCity = searchParams.get('from') || 'Paris';
  const toCity = searchParams.get('to') || 'Cotonou';
  const fromCountry = searchParams.get('fromCountry') || 'France';
  const toCountry = searchParams.get('toCountry') || 'Bénin';
  const weight = searchParams.get('weight') || '10';
  const type = searchParams.get('type') || 'Documents';
  const deadline = searchParams.get('deadline') || '1 janvier 2026';
  const reward = searchParams.get('reward') || '50';

  // Emoji basé sur le type
  const typeEmojis = {
    'documents': '📄',
    'Documents': '📄',
    'vetements': '👕',
    'Vêtements': '👕',
    'electronique': '💻',
    'Électronique': '💻',
    'autre': '📦',
    'Autre': '📦',
  };

  const emoji = typeEmojis[type] || '📦';

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
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {/* Logo Kolimeet */}
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
            📦 Kolimeet
          </div>

          {/* Badge Colis */}
          <div
            style={{
              position: 'absolute',
              top: 50,
              right: 60,
              background: 'white',
              color: '#10b981',
              fontSize: 24,
              fontWeight: 'bold',
              padding: '12px 24px',
              borderRadius: 20,
            }}
          >
            COLIS
          </div>

          {/* Carte principale */}
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
            {/* Header avec villes */}
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
                  color: '#10b981',
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

            {/* Séparateur */}
            <div
              style={{
                height: 2,
                background: 'linear-gradient(90deg, transparent, #e0e0e0, transparent)',
                marginBottom: 40,
              }}
            />

            {/* Informations du colis */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 40,
              }}
            >
              {/* Type */}
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
                <div style={{ fontSize: 40, marginBottom: 8 }}>{emoji}</div>
                <div style={{ fontSize: 20, color: '#666', marginBottom: 4 }}>
                  Type
                </div>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1a1a1a' }}>
                  {type}
                </div>
              </div>

              {/* Poids */}
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
                <div style={{ fontSize: 40, marginBottom: 8 }}>⚖️</div>
                <div style={{ fontSize: 20, color: '#666', marginBottom: 4 }}>
                  Poids
                </div>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1a1a1a' }}>
                  {weight} kg
                </div>
              </div>

              {/* Deadline */}
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
                <div style={{ fontSize: 40, marginBottom: 8 }}>⏰</div>
                <div style={{ fontSize: 20, color: '#666', marginBottom: 4 }}>
                  Deadline
                </div>
                <div style={{ fontSize: 22, fontWeight: 'bold', color: '#1a1a1a' }}>
                  {deadline}
                </div>
              </div>

              {/* Récompense */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  borderRadius: 16,
                  padding: 24,
                  flex: 1,
                }}
              >
                <div style={{ fontSize: 40, marginBottom: 8 }}>💰</div>
                <div style={{ fontSize: 20, color: 'rgba(255,255,255,0.9)', marginBottom: 4 }}>
                  Récompense
                </div>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>
                  {reward}€
                </div>
              </div>
            </div>

            {/* Footer avec CTA */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 40,
                padding: 20,
                background: '#f0fdf4',
                borderRadius: 12,
              }}
            >
              <div style={{ fontSize: 24, color: '#10b981', fontWeight: 600 }}>
                🚀 Transportez ce colis sur Kolimeet
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
}
