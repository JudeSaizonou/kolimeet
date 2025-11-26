// Extensions de types pour les nouvelles fonctionnalités
// Ce fichier complète types_generated.ts

export type ReservationRequestStatus = 
  | 'pending' 
  | 'accepted' 
  | 'declined' 
  | 'counter_offered' 
  | 'cancelled';

export interface ReservationRequest {
  id: string;
  thread_id: string;
  message_id: string | null;
  trip_id: string;
  requester_id: string;
  driver_id: string;
  kilos_requested: number;
  price_offered: number;
  price_per_kg: number;
  status: ReservationRequestStatus;
  counter_offer_id: string | null;
  parent_request_id: string | null;
  justification: string | null;
  created_at: string;
  updated_at: string;
}

// Re-export des types générés
export * from './types_generated';
