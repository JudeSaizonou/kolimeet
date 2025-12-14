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
  ChevronDown,
  ChevronUp,
  Users,
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

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
  const [isOpen, setIsOpen] = useState(true);
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
    <Card className="border-slate-200 overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer hover:bg-slate-50 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-primary" />
                Réservations ({reservations.length})
              </CardTitle>
              <div className="flex items-center gap-2">
                {pendingCount > 0 && (
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    {pendingCount} en attente
                  </Badge>
                )}
                {acceptedCount > 0 && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {acceptedCount} acceptée{acceptedCount > 1 ? 's' : ''}
                  </Badge>
                )}
                {isOpen ? (
                  <ChevronUp className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            {reservations.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Package className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p>Aucune réservation pour le moment</p>
                <p className="text-sm text-slate-400 mt-1">
                  Les demandes de réservation apparaîtront ici
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {reservations.map((reservation) => {
                  const status = statusConfig[reservation.status] || statusConfig.pending;
                  const StatusIcon = status.icon;
                  const isPending = reservation.status === 'pending';
                  const isProcessing = processingId === reservation.id;

                  return (
                    <div
                      key={reservation.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isPending
                          ? 'border-yellow-200 bg-yellow-50/50'
                          : 'border-slate-100 bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        {/* Info demandeur */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Link to={`/u/${reservation.requester_id}`}>
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={reservation.requester?.avatar_url} />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {reservation.requester?.full_name?.[0] || <User className="h-4 w-4" />}
                              </AvatarFallback>
                            </Avatar>
                          </Link>
                          <div className="flex-1 min-w-0">
                            <Link
                              to={`/u/${reservation.requester_id}`}
                              className="font-medium text-slate-900 hover:text-primary truncate block"
                            >
                              {reservation.requester?.full_name || 'Utilisateur'}
                            </Link>
                            <div className="flex items-center gap-3 text-sm text-slate-500">
                              <span className="flex items-center gap-1">
                                <Package className="h-3.5 w-3.5" />
                                {reservation.kilos_requested} kg
                              </span>
                              <span className="flex items-center gap-1">
                                <Euro className="h-3.5 w-3.5" />
                                {reservation.price_offered}€
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Status */}
                        <Badge className={`${status.color} shrink-0`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status.label}
                        </Badge>
                      </div>

                      {/* Actions */}
                      <div className="mt-3 flex items-center gap-2">
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          <Link to={`/messages/${reservation.thread_id}`}>
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Conversation
                          </Link>
                        </Button>

                        {isPending && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-200 text-red-600 hover:bg-red-50"
                              onClick={() => handleDecline(reservation.id)}
                              disabled={isProcessing}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Refuser
                            </Button>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleAccept(reservation.id)}
                              disabled={isProcessing}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Accepter
                            </Button>
                          </>
                        )}
                      </div>

                      {/* Date */}
                      <p className="text-xs text-slate-400 mt-2">
                        Demandé le {format(new Date(reservation.created_at), 'PPp', { locale: fr })}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
