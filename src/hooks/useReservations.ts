import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface Reservation {
  id: string;
  trip_id: string;
  requester_id: string;
  driver_id: string;
  kilos_requested: number;
  price_offered: number;
  price_per_kg: number | null;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled' | 'counter_offered';
  thread_id: string;
  created_at: string;
  updated_at: string;
  // Relations
  trips?: {
    id: string;
    from_city: string;
    from_country: string;
    to_city: string;
    to_country: string;
    date_departure: string;
    price_per_kg: number;
    capacity_available_kg: number;
    profiles?: {
      full_name: string;
      avatar_url: string;
    };
  };
  requester?: {
    full_name: string;
    avatar_url: string;
  };
  driver?: {
    full_name: string;
    avatar_url: string;
  };
}

export const useReservations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [myRequests, setMyRequests] = useState<Reservation[]>([]); // Demandes que j'ai faites
  const [receivedRequests, setReceivedRequests] = useState<Reservation[]>([]); // Demandes reçues sur mes trajets

  const fetchReservations = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Récupérer les demandes que j'ai faites (je suis requester)
      const { data: myData, error: myError } = await supabase
        .from('reservation_requests')
        .select('*, trips(*)')
        .eq('requester_id', user.id)
        .order('created_at', { ascending: false });

      if (myError) {
        console.error('Error fetching my requests:', myError);
        throw myError;
      }

      // Enrichir avec les profils des conducteurs
      const enrichedMyData = await Promise.all(
        (myData || []).map(async (req: any) => {
          if (req.trips?.user_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, avatar_url')
              .eq('user_id', req.trips.user_id)
              .single();
            return {
              ...req,
              trips: {
                ...req.trips,
                profiles: profile
              }
            };
          }
          return req;
        })
      );

      // Récupérer les demandes reçues sur mes trajets (je suis driver)
      const { data: receivedData, error: receivedError } = await supabase
        .from('reservation_requests')
        .select('*, trips(*)')
        .eq('driver_id', user.id)
        .order('created_at', { ascending: false });

      if (receivedError) {
        console.error('Error fetching received requests:', receivedError);
        throw receivedError;
      }

      // Enrichir avec les profils des demandeurs
      const enrichedReceivedData = await Promise.all(
        (receivedData || []).map(async (req: any) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('user_id', req.requester_id)
            .single();
          return {
            ...req,
            requester: profile
          };
        })
      );

      setMyRequests(enrichedMyData);
      setReceivedRequests(enrichedReceivedData);
    } catch (error: any) {
      console.error('Error fetching reservations:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les réservations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  // Écouter les changements en temps réel
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('my-reservations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservation_requests',
        },
        (payload) => {
          const record = payload.new as any;
          const oldRecord = payload.old as any;
          
          // Vérifier si ça nous concerne
          if (
            record?.requester_id === user.id ||
            record?.driver_id === user.id ||
            oldRecord?.requester_id === user.id ||
            oldRecord?.driver_id === user.id
          ) {
            fetchReservations();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchReservations]);

  return {
    loading,
    myRequests,        // Mes demandes envoyées
    receivedRequests,  // Demandes reçues sur mes trajets
    refetch: fetchReservations,
  };
};