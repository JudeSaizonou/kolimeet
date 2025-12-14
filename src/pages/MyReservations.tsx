import { useReservations, Reservation } from '@/hooks/useReservations';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { 
  Package, 
  Calendar, 
  Plane,
  Euro,
  MessageCircle,
  User
} from 'lucide-react';

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
  accepted: { label: 'Accepté', color: 'bg-green-100 text-green-800' },
  declined: { label: 'Refusé', color: 'bg-red-100 text-red-800' },
  cancelled: { label: 'Annulé', color: 'bg-gray-100 text-gray-800' },
  counter_offered: { label: 'Contre-offre', color: 'bg-blue-100 text-blue-800' },
};

interface ReservationCardProps {
  reservation: Reservation;
  type: 'requester' | 'driver';
}

const ReservationCard: React.FC<ReservationCardProps> = ({ 
  reservation, 
  type,
}) => {
  const statusInfo = statusLabels[reservation.status] || statusLabels.pending;
  const trip = reservation.trips;

  // Détermine l'autre personne dans la transaction
  const otherPerson = type === 'requester' 
    ? trip?.profiles // Le conducteur du trajet
    : reservation.requester; // Le demandeur

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Plane className="h-5 w-5 text-primary" />
              {trip?.from_city}, {trip?.from_country} →{' '}
              {trip?.to_city}, {trip?.to_country}
            </CardTitle>
            {/* Numéro de réservation lisible (préférer reservation_number si dispo) */}
            <div className="text-xs text-muted-foreground font-mono">
              N° réservation : <span className="font-semibold">
                {reservation.reservation_number
                  ? reservation.reservation_number
                  : `#RZV-${reservation.id?.slice(-6)?.toUpperCase() || '------'}`}
              </span>
            </div>
            <CardDescription className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {trip?.date_departure 
                  ? format(new Date(trip.date_departure), 'PPP', { locale: fr })
                  : 'Date non définie'
                }
              </span>
              <span className="flex items-center gap-1">
                <Package className="h-4 w-4" />
                {reservation.kilos_requested} kg
              </span>
            </CardDescription>
          </div>
          <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                {otherPerson?.avatar_url ? (
                  <img 
                    src={otherPerson.avatar_url} 
                    alt="" 
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {type === 'requester' ? 'Voyageur' : 'Demandeur'}
                </p>
                <p className="font-medium">
                  {otherPerson?.full_name || 'Utilisateur inconnu'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-lg font-semibold">
                <Euro className="h-4 w-4" />
                {reservation.price_offered}€
              </div>
              {reservation.price_per_kg && (
                <p className="text-xs text-muted-foreground">
                  {reservation.price_per_kg}€/kg
                </p>
              )}
            </div>
          </div>

          {/* Bouton pour voir la conversation */}
          <div className="flex gap-2 pt-2">
            <Button 
              asChild 
              variant="outline" 
              size="sm"
              className="flex-1"
            >
              <Link to={`/messages/${reservation.thread_id}`}>
                <MessageCircle className="h-4 w-4 mr-2" />
                Voir la conversation
              </Link>
            </Button>
            <Button 
              asChild 
              variant="ghost" 
              size="sm"
            >
              <Link to={`/trajets/${reservation.trip_id}`}>
                Voir le trajet
              </Link>
            </Button>
          </div>

          <div className="text-xs text-muted-foreground border-t pt-3">
            Créé le {format(new Date(reservation.created_at), 'PPp', { locale: fr })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const MyReservations = () => {
  const { user } = useAuth();
  const { myRequests, loading } = useReservations();

  if (loading) {
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
            Suivez vos demandes de réservation envoyées aux voyageurs
          </p>
        </div>

        {/* Info pour gérer les demandes reçues */}
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Plane className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Vous êtes voyageur ?</p>
                <p className="text-sm text-muted-foreground">
                  Gérez les demandes reçues depuis vos annonces
                </p>
              </div>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/mes-annonces">Mes annonces</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Liste des demandes envoyées */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Demandes envoyées ({myRequests.length})
          </h2>

          {myRequests.length === 0 ? (
            <EmptyState
              icon={Package}
              title="Aucune demande envoyée"
              description="Vous n'avez pas encore fait de demande de réservation. Explorez les trajets disponibles pour réserver des kilos."
              action={
                <Button asChild>
                  <Link to="/explorer">Explorer les trajets</Link>
                </Button>
              }
            />
          ) : (
            myRequests.map((reservation) => (
              <ReservationCard
                key={reservation.id}
                reservation={reservation}
                type="requester"
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MyReservations;