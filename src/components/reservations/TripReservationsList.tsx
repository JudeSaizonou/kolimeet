import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Package,
  Euro,
  MessageCircle,
  User,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  ArrowRight,
  Loader2,
} from 'lucide-react';

interface Reservation {
  id: string;
  requester_id: string;
  kilos_requested: number;
  price_offered: number;
  price_per_kg: number | null;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled' | 'counter_offered';
  thread_id: string;
  created_at: string;
  requester?: {
    full_name: string;
    avatar_url: string;
  };
}

interface TripReservationsListProps {
  tripId: string;
  driverId: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  accepted: { label: 'Acceptée', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  declined: { label: 'Refusée', color: 'bg-red-100 text-red-800', icon: XCircle },
  cancelled: { label: 'Annulée', color: 'bg-gray-100 text-gray-800', icon: XCircle },
  counter_offered: { label: 'Contre-offre', color: 'bg-blue-100 text-blue-800', icon: Clock },
};

export const TripReservationsList = ({ tripId, driverId }: TripReservationsListProps) => {
  const { toast } = useToast();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchReservations = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('reservation_requests')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Enrichir avec les profils des demandeurs
      const enrichedData = await Promise.all(
        (data || []).map(async (req) => {
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

      setReservations(enrichedData);
    } catch (error) {
      console.error('Error fetching reservations:', error);
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    fetchReservations();

    // Écouter les changements en temps réel
    const channel = supabase
      .channel(`trip-reservations-${tripId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservation_requests',
          filter: `trip_id=eq.${tripId}`,
        },
        () => {
          fetchReservations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId, fetchReservations]);

  const handleAccept = async (reservationId: string) => {
    setProcessingId(reservationId);
    try {
      const { error } = await supabase.rpc('accept_reservation_request', {
        p_request_id: reservationId,
      });

      if (error) throw error;

      toast({
        title: 'Réservation acceptée',
        description: 'Le demandeur sera notifié.',
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'accepter la réservation',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (reservationId: string) => {
    setProcessingId(reservationId);
    try {
      const { error } = await supabase.rpc('decline_reservation_request', {
        p_request_id: reservationId,
      });

      if (error) throw error;

      toast({
        title: 'Réservation refusée',
        description: 'Le demandeur sera notifié.',
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de refuser la réservation',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </CardContent>
      </Card>
    );
  }

  const pendingCount = reservations.filter((r) => r.status === 'pending').length;
  const acceptedCount = reservations.filter((r) => r.status === 'accepted').length;

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-primary" />
            Réservations
          </CardTitle>
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <Badge className="bg-amber-100 text-amber-700 border-0">
                {pendingCount} en attente
              </Badge>
            )}
            {acceptedCount > 0 && (
              <Badge className="bg-emerald-100 text-emerald-700 border-0">
                {acceptedCount} acceptée{acceptedCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {reservations.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Package className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p className="font-medium">Aucune réservation</p>
            <p className="text-sm text-slate-400 mt-1">
              Les demandes apparaîtront ici
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {reservations.map((reservation) => {
              const status = statusConfig[reservation.status] || statusConfig.pending;
              const StatusIcon = status.icon;
              const isPending = reservation.status === 'pending';
              const isCounterOffered = reservation.status === 'counter_offered';
              const isProcessing = processingId === reservation.id;
              const canAct = isPending || isCounterOffered;

              return (
                <div
                  key={reservation.id}
                  className={`rounded-2xl border overflow-hidden transition-all ${
                    isPending
                      ? 'border-amber-200 bg-white'
                      : reservation.status === 'accepted'
                      ? 'border-emerald-200 bg-emerald-50/50'
                      : 'border-slate-100 bg-slate-50/50'
                  }`}
                >
                  {/* Header avec avatar et statut */}
                  <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100/50">
                    <Link 
                      to={`/u/${reservation.requester_id}`}
                      className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={reservation.requester?.avatar_url} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {reservation.requester?.full_name?.[0] || <User className="h-4 w-4" />}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-slate-900">
                        {reservation.requester?.full_name || 'Utilisateur'}
                      </span>
                    </Link>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${status.color}`}>
                      {status.label}
                    </span>
                  </div>

                  {/* Contenu principal */}
                  <div className="px-4 py-3">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-2xl font-bold text-slate-900">
                          {reservation.kilos_requested}
                          <span className="text-base font-medium text-slate-400 ml-0.5">kg</span>
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-300" />
                      <div>
                        <p className="text-2xl font-bold text-slate-900">
                          {reservation.price_offered}
                          <span className="text-base font-medium text-slate-400 ml-0.5">€</span>
                        </p>
                        {reservation.price_per_kg && (
                          <p className="text-xs text-slate-400">{reservation.price_per_kg.toFixed(2)}€/kg</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-4 pb-3 flex items-center gap-2">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="flex-1 h-9 rounded-xl border-slate-200"
                    >
                      <Link to={`/messages/${reservation.thread_id}`}>
                        <MessageCircle className="h-4 w-4 mr-1.5" />
                        Conversation
                      </Link>
                    </Button>

                    {canAct && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-9 px-3 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                          onClick={() => handleDecline(reservation.id)}
                          disabled={isProcessing}
                        >
                          {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                        </Button>
                        <Button
                          size="sm"
                          className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => handleAccept(reservation.id)}
                          disabled={isProcessing}
                        >
                          {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1.5" />}
                          Accepter
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
