import { useEffect, useState } from 'react';
import { useReservations, Reservation } from '@/hooks/useReservations';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  Package, 
  Calendar, 
  MapPin, 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  Clock,
  Plane,
  Euro
} from 'lucide-react';

const statusLabels = {
  pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: 'Confirmé', color: 'bg-blue-100 text-blue-800' },
  paid: { label: 'Payé', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Annulé', color: 'bg-red-100 text-red-800' },
  completed: { label: 'Terminé', color: 'bg-gray-100 text-gray-800' },
};

const paymentStatusLabels = {
  pending: { label: 'En attente', color: 'bg-gray-100 text-gray-800' },
  processing: { label: 'En cours', color: 'bg-blue-100 text-blue-800' },
  paid: { label: 'Payé', color: 'bg-green-100 text-green-800' },
  failed: { label: 'Échoué', color: 'bg-red-100 text-red-800' },
  refunded: { label: 'Remboursé', color: 'bg-violet-100 text-violet-800' },
};

interface ReservationCardProps {
  reservation: Reservation;
  type: 'customer' | 'traveler';
  onStatusUpdate?: (id: string, status: Reservation['status']) => void;
}

const ReservationCard: React.FC<ReservationCardProps> = ({ 
  reservation, 
  type,
  onStatusUpdate 
}) => {
  const statusInfo = statusLabels[reservation.status];
  const paymentInfo = paymentStatusLabels[reservation.payment_status];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Plane className="h-5 w-5 text-primary" />
              {reservation.trips?.from_city}, {reservation.trips?.from_country} →{' '}
              {reservation.trips?.to_city}, {reservation.trips?.to_country}
            </CardTitle>
            <CardDescription className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {reservation.trips?.date_departure 
                  ? format(new Date(reservation.trips.date_departure), 'PPP', { locale: fr })
                  : 'Date non définie'
                }
              </span>
              <span className="flex items-center gap-1">
                <Package className="h-4 w-4" />
                {reservation.weight_kg} kg
              </span>
            </CardDescription>
          </div>
          <div className="text-right space-y-2">
            <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
            <div>
              <Badge variant="outline" className={paymentInfo.color}>
                {paymentInfo.label}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                {type === 'customer' ? 'Voyageur' : 'Client'}
              </p>
              <p className="font-medium">
                {type === 'customer' 
                  ? reservation.trips?.profiles?.full_name 
                  : reservation.profiles?.full_name
                }
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-lg font-semibold">
                <Euro className="h-4 w-4" />
                {reservation.total_amount}€
              </div>
              <p className="text-xs text-muted-foreground">
                {reservation.price_per_kg}€/kg
              </p>
            </div>
          </div>

          {reservation.message && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Message</p>
              <p className="text-sm">{reservation.message}</p>
            </div>
          )}

          {reservation.notes && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Notes du voyageur</p>
              <p className="text-sm">{reservation.notes}</p>
            </div>
          )}

          {/* Actions pour le voyageur */}
          {type === 'traveler' && reservation.status === 'pending' && onStatusUpdate && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onStatusUpdate(reservation.id, 'cancelled')}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Refuser
              </Button>
              <Button
                size="sm"
                onClick={() => onStatusUpdate(reservation.id, 'confirmed')}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Accepter
              </Button>
            </div>
          )}

          {/* Actions pour marquer comme terminé */}
          {type === 'traveler' && reservation.status === 'paid' && onStatusUpdate && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onStatusUpdate(reservation.id, 'completed')}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Marquer comme terminé
            </Button>
          )}

          <div className="text-xs text-muted-foreground">
            Créé le {format(new Date(reservation.created_at), 'PPp', { locale: fr })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const MyReservations = () => {
  const { user } = useAuth();
  const { getUserReservations, getTripReservations, updateReservationStatus, loading } = useReservations();
  const { toast } = useToast();
  
  const [myReservations, setMyReservations] = useState<Reservation[]>([]);
  const [tripReservations, setTripReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadReservations();
    }
  }, [user]);

  const loadReservations = async () => {
    setIsLoading(true);
    try {
      // Pour l'instant, simuler des données vides car la table n'existe pas encore
      setMyReservations([]);
      setTripReservations([]);
      
      // Code réel (à utiliser après migration):
      // const [customerRes, travelerRes] = await Promise.all([
      //   getUserReservations(),
      //   getTripReservations(''), // Il faudrait récupérer les IDs des trips de l'utilisateur
      // ]);
      // setMyReservations(customerRes);
      // setTripReservations(travelerRes);
    } catch (error) {
      console.error('Erreur lors du chargement des réservations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (reservationId: string, status: Reservation['status']) => {
    try {
      await updateReservationStatus(reservationId, status);
      loadReservations(); // Recharger les données
    } catch (error) {
      // L'erreur est gérée dans le hook
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-background py-8 px-4">
        <div className="container mx-auto max-w-4xl space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Mes réservations
          </h1>
          <p className="text-muted-foreground">
            Gérez vos réservations en tant que client et voyageur
          </p>
        </div>

        <Tabs defaultValue="customer" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="customer" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Mes réservations ({myReservations.length})
            </TabsTrigger>
            <TabsTrigger value="traveler" className="flex items-center gap-2">
              <Plane className="h-4 w-4" />
              Demandes reçues ({tripReservations.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="customer" className="space-y-4">
            {myReservations.length === 0 ? (
              <EmptyState
                icon={Package}
                title="Aucune réservation"
                description="Vous n'avez encore fait aucune réservation. Explorez les trajets disponibles pour réserver de la capacité."
                action={
                  <Button asChild>
                    <a href="/explorer">Explorer les trajets</a>
                  </Button>
                }
              />
            ) : (
              myReservations.map((reservation) => (
                <ReservationCard
                  key={reservation.id}
                  reservation={reservation}
                  type="customer"
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="traveler" className="space-y-4">
            {tripReservations.length === 0 ? (
              <EmptyState
                icon={Clock}
                title="Aucune demande de réservation"
                description="Vous n'avez reçu aucune demande de réservation pour vos trajets. Assurez-vous que vos trajets sont bien configurés."
                action={
                  <Button asChild>
                    <a href="/mes-annonces">Voir mes trajets</a>
                  </Button>
                }
              />
            ) : (
              tripReservations.map((reservation) => (
                <ReservationCard
                  key={reservation.id}
                  reservation={reservation}
                  type="traveler"
                  onStatusUpdate={handleStatusUpdate}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MyReservations;