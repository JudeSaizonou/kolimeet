import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface TripFilters {
  fromCountry?: string;
  fromCity?: string;
  toCountry?: string;
  toCity?: string;
  dateFrom?: string;
  minCapacity?: number;
  sortBy?: "date" | "price";
}

export interface ParcelFilters {
  fromCountry?: string;
  fromCity?: string;
  toCountry?: string;
  toCity?: string;
  deadline?: string;
  type?: string;
  maxWeight?: number;
  sortBy?: "deadline" | "weight";
}

export const useTrips = (filters: TripFilters, page: number = 1, pageSize: number = 10) => {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const { toast } = useToast();

  const fetchTrips = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("trips")
        .select("*, profiles!trips_user_id_fkey(full_name, avatar_url, rating_avg)", { count: "exact" })
        .eq("status", "open");

      if (filters.fromCountry) {
        query = query.ilike("from_country", `%${filters.fromCountry}%`);
      }
      if (filters.fromCity) {
        query = query.ilike("from_city", `%${filters.fromCity}%`);
      }
      if (filters.toCountry) {
        query = query.ilike("to_country", `%${filters.toCountry}%`);
      }
      if (filters.toCity) {
        query = query.ilike("to_city", `%${filters.toCity}%`);
      }
      if (filters.dateFrom) {
        query = query.gte("date_departure", filters.dateFrom);
      }
      if (filters.minCapacity) {
        query = query.gte("capacity_available_kg", filters.minCapacity);
      }

      const sortField = filters.sortBy === "price" ? "price_expect" : "date_departure";
      query = query.order(sortField, { ascending: true });

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      setTrips(data || []);
      setTotalCount(count || 0);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize, toast]);

  useEffect(() => {
    fetchTrips();

    // Temps réel : écouter les changements sur la table trips
    const channel = supabase
      .channel('trips-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trips' },
        () => {
          console.log('[useTrips] 🔄 Trip changed, refetching...');
          fetchTrips();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTrips]);

  return { trips, loading, totalCount, refetch: fetchTrips };
};

export const useParcels = (filters: ParcelFilters, page: number = 1, pageSize: number = 10) => {
  const [parcels, setParcels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const { toast } = useToast();

  const fetchParcels = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("parcels")
        .select("*, profiles!parcels_user_id_fkey(full_name, avatar_url, rating_avg)", { count: "exact" })
        .eq("status", "open");

      if (filters.fromCountry) {
        query = query.ilike("from_country", `%${filters.fromCountry}%`);
      }
      if (filters.fromCity) {
        query = query.ilike("from_city", `%${filters.fromCity}%`);
      }
      if (filters.toCountry) {
        query = query.ilike("to_country", `%${filters.toCountry}%`);
      }
      if (filters.toCity) {
        query = query.ilike("to_city", `%${filters.toCity}%`);
      }
      if (filters.deadline) {
        query = query.lte("deadline", filters.deadline);
      }
      if (filters.type) {
        query = query.eq("type", filters.type);
      }
      if (filters.maxWeight) {
        query = query.lte("weight_kg", filters.maxWeight);
      }

      const sortField = filters.sortBy === "weight" ? "weight_kg" : "deadline";
      query = query.order(sortField, { ascending: true });

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      setParcels(data || []);
      setTotalCount(count || 0);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize, toast]);

  useEffect(() => {
    fetchParcels();

    // Temps réel : écouter les changements sur la table parcels
    const channel = supabase
      .channel('parcels-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'parcels' },
        () => {
          console.log('[useParcels] 🔄 Parcel changed, refetching...');
          fetchParcels();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchParcels]);

  return { parcels, loading, totalCount, refetch: fetchParcels };
};
