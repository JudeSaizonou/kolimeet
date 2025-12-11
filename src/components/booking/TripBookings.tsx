import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Package, 
  Check, 
  X, 
  Clock, 
  User, 
  Weight,
  MessageCircle,
  ChevronRight,
  Inbox
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Booking {
  id: string;
  trip_id: string;
  user_id: string;
  weight_kg: number;
  price_per_kg: number;
  total_price: number;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled' | 'completed';
  message: string | null;
  created_at: string;
  profiles?: {
    full_name: string;
    avatar_url: string;
    rating_avg: number;
  };
}

interface TripBookingsProps {
  tripId: string;
  onCapacityUpdate?: () => void;
}

const statusConfig = {
  pending: { 
    label: 'En attente', 
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: Clock
  },
  accepted: { 
    label: 'Acceptée', 
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: Check
  },
  declined: { 
    label: 'Refusée', 
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: X
  },
  cancelled: { 
    label: 'Annulée', 
    color: 'bg-slate-100 text-slate-800 border-slate-200',
    icon: X
  },
  completed: { 
    label: 'Terminée', 
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Check
  },
};

export const TripBookings: React.FC<TripBookingsProps> = ({ tripId, onCapacityUpdate }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    bookingId: string;
    action: 'accept' | 'decline';
  }>({ open: false, bookingId: '', action: 'accept' });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchBookings();
    
    // Écouter les nouvelles réservations en temps réel
    const channel = supabase
      .channel(`bookings-${tripId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `trip_id=eq.${tripId}`,
        },
        () => {
          fetchBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId]);

  const fetchBookings = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('bookings')
        .select(`
          *,
          profiles!bookings_user_id_fkey(full_name, avatar_url, rating_avg)
        `)
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error: any) {
      console.error('Erreur chargement réservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (bookingId: string, newStatus: 'accepted' | 'declined') => {
    setActionLoading(bookingId);
    try {
      const { error } = await (supabase as any)
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: newStatus === 'accepted' ? '✅ Réservation acceptée' : '❌ Réservation refusée',
        description: newStatus === 'accepted' 
          ? 'L\'expéditeur a été notifié' 
          : 'La demande a été refusée',
      });

      fetchBookings();
      onCapacityUpdate?.();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de mettre à jour la réservation',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
      setConfirmDialog({ open: false, bookingId: '', action: 'accept' });
    }
  };

  const handleContact = async (userId: string) => {
    // Chercher ou créer un thread avec cet utilisateur
    const { data: existingThread } = await supabase
      .from('threads')
      .select('id')
      .eq('related_id', tripId)
      .eq('related_type', 'trip')
      .or(`and(created_by.eq.${userId}),and(other_user_id.eq.${userId})`)
      .single();

    if (existingThread) {
      navigate(`/messages/${existingThread.id}`);
    }
  };

  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const acceptedCount = bookings.filter(b => b.status === 'accepted').length;
  const totalReservedKg = bookings
    .filter(b => b.status === 'accepted')
    .reduce((sum, b) => sum + b.weight_kg, 0);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Réservations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Réservations
            </div>
            <div className="flex gap-2">
              {pendingCount > 0 && (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                  {pendingCount} en attente
                </Badge>
              )}
              {acceptedCount > 0 && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {totalReservedKg} kg réservés
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Inbox className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Aucune réservation pour le moment</p>
              <p className="text-sm mt-1">Les demandes apparaîtront ici</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((booking) => {
                const StatusIcon = statusConfig[booking.status].icon;
                return (
                  <div
                    key={booking.id}
                    className="border rounded-xl p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <Link to={`/u/${booking.user_id}`}>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={booking.profiles?.avatar_url} />
                          <AvatarFallback>
                            {booking.profiles?.full_name?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      </Link>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link 
                            to={`/u/${booking.user_id}`}
                            className="font-medium text-sm hover:underline"
                          >
                            {booking.profiles?.full_name || 'Utilisateur'}
                          </Link>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${statusConfig[booking.status].color}`}
                          >
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig[booking.status].label}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Weight className="h-3.5 w-3.5" />
                            {booking.weight_kg} kg
                          </span>
                          {booking.total_price > 0 && (
                            <span className="font-medium text-slate-900">
                              {booking.total_price.toFixed(2)} €
                            </span>
                          )}
                          <span className="text-xs">
                            {format(new Date(booking.created_at), "d MMM à HH:mm", { locale: fr })}
                          </span>
                        </div>
                        
                        {booking.message && (
                          <p className="mt-2 text-sm text-slate-600 bg-slate-50 rounded-lg p-2">
                            "{booking.message}"
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {booking.status === 'pending' && (
                      <div className="flex gap-2 mt-3 pt-3 border-t">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => setConfirmDialog({ 
                            open: true, 
                            bookingId: booking.id, 
                            action: 'decline' 
                          })}
                          disabled={actionLoading === booking.id}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Refuser
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => setConfirmDialog({ 
                            open: true, 
                            bookingId: booking.id, 
                            action: 'accept' 
                          })}
                          disabled={actionLoading === booking.id}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Accepter
                        </Button>
                      </div>
                    )}
                    
                    {booking.status === 'accepted' && (
                      <div className="flex gap-2 mt-3 pt-3 border-t">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleContact(booking.user_id)}
                        >
                          <MessageCircle className="h-4 w-4 mr-1" />
                          Contacter
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog 
        open={confirmDialog.open} 
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.action === 'accept' 
                ? 'Accepter cette réservation ?' 
                : 'Refuser cette réservation ?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.action === 'accept'
                ? 'La capacité disponible de votre trajet sera automatiquement réduite.'
                : 'L\'expéditeur sera notifié du refus de sa demande.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleUpdateStatus(
                confirmDialog.bookingId, 
                confirmDialog.action === 'accept' ? 'accepted' : 'declined'
              )}
              className={confirmDialog.action === 'decline' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {confirmDialog.action === 'accept' ? 'Accepter' : 'Refuser'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
