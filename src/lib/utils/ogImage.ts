/**
 * Utilitaire pour générer des URLs d'images Open Graph dynamiques
 * Utilise un service comme Vercel OG Image ou une API locale
 */

interface TripOGParams {
  fromCity: string;
  toCity: string;
  date: string;
  capacity: number;
  price: number;
  travelerName: string;
}

interface ParcelOGParams {
  fromCity: string;
  toCity: string;
  deadline: string;
  weight: number;
  type: string;
  senderName: string;
}

/**
 * Génère une URL d'image OG pour un trajet
 * Cette URL pointe vers une API qui génère l'image à la volée
 */
export function generateTripOGImage(params: TripOGParams): string {
  // Pour l'instant, on utilise une API de génération d'image
  // Vous pouvez utiliser Vercel OG, Cloudinary ou votre propre API
  
  // Vérifications de sécurité pour éviter les erreurs
  const fromCity = params.fromCity || 'Ville départ';
  const toCity = params.toCity || 'Ville arrivée';
  const date = params.date || '';
  const capacity = params.capacity ?? 0;
  const price = params.price ?? 0;
  const travelerName = params.travelerName || 'Voyageur';

  // Option 1: Utiliser une API locale (à créer)
  // return `/api/og?${searchParams.toString()}`;

  // Option 2: Utiliser un placeholder avec les données
  return `https://placehold.co/1200x630/4F46E5/white?text=${encodeURIComponent(
    `${fromCity} → ${toCity}\n${capacity}kg - ${price}€/kg\n${date}`
  )}`;
}

/**
 * Génère une URL d'image OG pour un colis
 */
export function generateParcelOGImage(params: ParcelOGParams): string {
  // Vérifications de sécurité pour éviter les erreurs
  const fromCity = params.fromCity || 'Ville départ';
  const toCity = params.toCity || 'Ville arrivée';
  const deadline = params.deadline || '';
  const weight = params.weight ?? 0;
  const type = params.type || 'Colis';
  const senderName = params.senderName || 'Expéditeur';

  // Option 1: API locale
  // return `/api/og?${searchParams.toString()}`;

  // Option 2: Placeholder
  return `https://placehold.co/1200x630/10B981/white?text=${encodeURIComponent(
    `${fromCity} → ${toCity}\n${weight}kg - ${type}\nAvant le ${deadline}`
  )}`;
}

/**
 * Template HTML pour générer une image avec Canvas ou html2canvas
 * Peut être utilisé côté serveur avec Puppeteer ou côté client
 */
export function getTripOGTemplate(params: TripOGParams): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            margin: 0;
            padding: 0;
            width: 1200px;
            height: 630px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .card {
            background: white;
            border-radius: 24px;
            padding: 60px;
            width: 1000px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          }
          .route {
            display: flex;
            align-items: center;
            gap: 30px;
            margin-bottom: 40px;
          }
          .city {
            font-size: 72px;
            font-weight: 800;
            color: #1f2937;
          }
          .arrow {
            font-size: 60px;
            color: #667eea;
          }
          .details {
            display: flex;
            gap: 40px;
            margin-bottom: 30px;
          }
          .detail {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .label {
            font-size: 24px;
            color: #6b7280;
            text-transform: uppercase;
            font-weight: 600;
          }
          .value {
            font-size: 36px;
            color: #1f2937;
            font-weight: 700;
          }
          .footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-top: 30px;
            border-top: 3px solid #e5e7eb;
          }
          .traveler {
            font-size: 28px;
            color: #4b5563;
          }
          .logo {
            font-size: 48px;
            font-weight: 800;
            color: #667eea;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="route">
            <div class="city">${params.fromCity}</div>
            <div class="arrow">→</div>
            <div class="city">${params.toCity}</div>
          </div>
          <div class="details">
            <div class="detail">
              <div class="label">Date</div>
              <div class="value">${params.date}</div>
            </div>
            <div class="detail">
              <div class="label">Capacité</div>
              <div class="value">${params.capacity} kg</div>
            </div>
            <div class="detail">
              <div class="label">Prix</div>
              <div class="value">${params.price}€/kg</div>
            </div>
          </div>
          <div class="footer">
            <div class="traveler">👤 ${params.travelerName}</div>
            <div class="logo">KOLIMEET</div>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function getParcelOGTemplate(params: ParcelOGParams): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            margin: 0;
            padding: 0;
            width: 1200px;
            height: 630px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .card {
            background: white;
            border-radius: 24px;
            padding: 60px;
            width: 1000px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          }
          .route {
            display: flex;
            align-items: center;
            gap: 30px;
            margin-bottom: 40px;
          }
          .city {
            font-size: 72px;
            font-weight: 800;
            color: #1f2937;
          }
          .arrow {
            font-size: 60px;
            color: #10b981;
          }
          .details {
            display: flex;
            gap: 40px;
            margin-bottom: 30px;
          }
          .detail {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .label {
            font-size: 24px;
            color: #6b7280;
            text-transform: uppercase;
            font-weight: 600;
          }
          .value {
            font-size: 36px;
            color: #1f2937;
            font-weight: 700;
          }
          .footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-top: 30px;
            border-top: 3px solid #e5e7eb;
          }
          .sender {
            font-size: 28px;
            color: #4b5563;
          }
          .logo {
            font-size: 48px;
            font-weight: 800;
            color: #10b981;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="route">
            <div class="city">${params.fromCity}</div>
            <div class="arrow">→</div>
            <div class="city">${params.toCity}</div>
          </div>
          <div class="details">
            <div class="detail">
              <div class="label">Deadline</div>
              <div class="value">${params.deadline}</div>
            </div>
            <div class="detail">
              <div class="label">Poids</div>
              <div class="value">${params.weight} kg</div>
            </div>
            <div class="detail">
              <div class="label">Type</div>
              <div class="value">${params.type}</div>
            </div>
          </div>
          <div class="footer">
            <div class="sender">📦 ${params.senderName}</div>
            <div class="logo">KOLIMEET</div>
          </div>
        </div>
      </body>
    </html>
  `;
}
