import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CreateReservationInput {
  trip_id: string;
  weight_kg: number;
  price_per_kg: number;
  total_amount: number;
  message?: string;
}

export interface Reservation {
  id: string;
  trip_id: string;
  user_id: string;
  weight_kg: number;
  price_per_kg: number;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'paid' | 'cancelled' | 'completed';
  payment_status: 'pending' | 'processing' | 'paid' | 'failed' | 'refunded';
  stripe_payment_intent_id?: string;
  message?: string;
  notes?: string;
  created_at: string;
  confirmed_at?: string;
  paid_at?: string;
  completed_at?: string;
  trips?: any;
  profiles?: any;
}

// Hook temporaire - nécessite l'application de la migration de base de données
export const useReservations = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createReservation = async (data: CreateReservationInput) => {
    setLoading(true);
    try {
      // Pour l'instant, retourner une erreur explicative
      toast({
        title: 'Migration requise',
        description: 'Veuillez d\'abord appliquer la migration de base de données pour activer les réservations',
        variant: 'destructive',
      });
      throw new Error('Migration de base de données requise');
    } catch (error: any) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateReservationStatus = async (
    reservationId: string,
    status: Reservation['status'],
    notes?: string
  ) => {
    setLoading(true);
    try {
      toast({
        title: 'Migration requise',
        description: 'Veuillez d\'abord appliquer la migration de base de données',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getUserReservations = async () => {
    return [];
  };

  const getTripReservations = async (tripId: string) => {
    return [];
  };

  return {
    loading,
    createReservation,
    updateReservationStatus,
    getUserReservations,
    getTripReservations,
  };
};