/**
 * Utilitaire pour générer des URLs d'images Open Graph dynamiques
 * Utilise Vercel OG Image API
 */

export interface TripOGParams {
  fromCity?: string;
  toCity?: string;
  fromCountry?: string;
  toCountry?: string;
  date?: string;
  capacity?: number;
  price?: number;
}

export interface ParcelOGParams {
  fromCity?: string;
  toCity?: string;
  fromCountry?: string;
  toCountry?: string;
  weight?: number;
  type?: string;
  deadline?: string;
  reward?: number;
}

/**
 * Génère l'URL de l'image Open Graph pour un trajet
 * Utilise l'API Vercel OG Image
 */
export function generateTripOGImage(params: TripOGParams): string {
  const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
  
  const searchParams = new URLSearchParams();
  
  if (params.fromCity) searchParams.set('from', params.fromCity);
  if (params.toCity) searchParams.set('to', params.toCity);
  if (params.fromCountry) searchParams.set('fromCountry', params.fromCountry);
  if (params.toCountry) searchParams.set('toCountry', params.toCountry);
  if (params.date) searchParams.set('date', params.date);
  if (params.capacity !== undefined) searchParams.set('capacity', params.capacity.toString());
  if (params.price !== undefined) searchParams.set('price', params.price.toString());

  return `${baseUrl}/api/og/trip?${searchParams.toString()}`;
}

/**
 * Génère l'URL de l'image Open Graph pour un colis
 * Utilise l'API Vercel OG Image
 */
export function generateParcelOGImage(params: ParcelOGParams): string {
  const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
  
  const searchParams = new URLSearchParams();
  
  if (params.fromCity) searchParams.set('from', params.fromCity);
  if (params.toCity) searchParams.set('to', params.toCity);
  if (params.fromCountry) searchParams.set('fromCountry', params.fromCountry);
  if (params.toCountry) searchParams.set('toCountry', params.toCountry);
  if (params.weight !== undefined) searchParams.set('weight', params.weight.toString());
  if (params.type) searchParams.set('type', params.type);
  if (params.deadline) searchParams.set('deadline', params.deadline);
  if (params.reward !== undefined) searchParams.set('reward', params.reward.toString());

  return `${baseUrl}/api/og/parcel?${searchParams.toString()}`;
}
