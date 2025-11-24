import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
import { EmptyState } from "@/components/EmptyState";
import { Edit, Trash2, Lock, LockOpen, MapPin, Calendar, Package, Plus, Minus, DollarSign, Plane } from "lucide-react";
import { useTrips } from "@/hooks/useTrips";
import { useParcels } from "@/hooks/useParcels";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

interface Trip {
  id: string;
  from_country: string;
  from_city: string;
  to_country: string;
  to_city: string;
  date_departure: string;
  capacity_kg: number;
  capacity_available_kg: number;
  price_expect?: number;
  notes?: string;
  status: string;
}

interface Parcel {
  id: string;
  type: string;
  weight_kg: number;
  size: string;
  from_country: string;
  from_city: string;
  to_country: string;
  to_city: string;
  deadline: string;
  description?: string;
  photos?: string[];
  status: string;
}

const MyListings = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [loading, setLoading] = useState(true);
  const { deleteTrip, toggleTripStatus, updateTrip } = useTrips();
  const { deleteParcel, toggleParcelStatus } = useParcels();
  const navigate = useNavigate();

  const fetchMyListings = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [tripsData, parcelsData] = await Promise.all([
        supabase.from("trips").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("parcels").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);

      if (tripsData.data) setTrips(tripsData.data);
      if (parcelsData.data) setParcels(parcelsData.data);
    } catch (error) {
      console.error("Error fetching listings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyListings();
  }, []);

  const handleDeleteTrip = async (id: string) => {
    await deleteTrip(id);
    fetchMyListings();
  };

  const handleToggleTripStatus = async (id: string, status: string) => {
    await toggleTripStatus(id, status);
    fetchMyListings();
  };

  const handleDeleteParcel = async (id: string) => {
    await deleteParcel(id);
    fetchMyListings();
  };

  const handleToggleParcelStatus = async (id: string, status: string) => {
    await toggleParcelStatus(id, status);
    fetchMyListings();
  };

  const handleUpdateCapacity = async (tripId: string, newCapacity: number, maxCapacity: number) => {
    if (newCapacity < 0) {
      toast({
        title: "Erreur",
        description: "La capacité ne peut pas être négative",
        variant: "destructive",
      });
      return;
    }
    if (newCapacity > maxCapacity) {
      toast({
        title: "Erreur",
        description: "La capacité disponible ne peut pas dépasser la capacité totale",
        variant: "destructive",
      });
      return;
    }
    await updateTrip(tripId, { capacity_available_kg: newCapacity });
    fetchMyListings();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-4 md:py-8 px-3 md:px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">Mes annonces</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Gérez vos trajets et vos colis
          </p>
        </div>

        <Tabs defaultValue="trips" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-5 md:mb-6 h-11 md:h-12">
            <TabsTrigger value="trips" className="text-sm md:text-base font-medium">Trajets ({trips.length})</TabsTrigger>
            <TabsTrigger value="parcels" className="text-sm md:text-base font-medium">Colis ({parcels.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="trips" className="space-y-4">
            {trips.length === 0 ? (
              <EmptyState
                icon={Plane}
                title="Aucun trajet publié"
                description="Vous n'avez encore rien publié. Proposez votre prochain voyage !"
                action={
                  <Button asChild>
                    <a href="/publier/trajet">Publier un trajet</a>
                  </Button>
                }
              />
            ) : (
              trips.map((trip) => (
                <Card key={trip.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <div className="bg-gradient-to-r from-primary/5 to-background p-3 md:p-4 border-b">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-sm md:text-base font-semibold">
                          <MapPin className="h-4 w-4 text-primary shrink-0" />
                          <span className="truncate">{trip.from_city} → {trip.to_city}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs md:text-sm text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{format(new Date(trip.date_departure), "d MMM yyyy", { locale: fr })}</span>
                        </div>
                      </div>
                      <Badge variant={trip.status === "open" ? "default" : "secondary"} className="text-xs shrink-0">
                        {trip.status === "open" ? "Ouvert" : "Fermé"}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-3 md:p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2 text-xs md:text-sm">
                            <div className="p-1 rounded bg-primary/10">
                              <Package className="h-3.5 w-3.5 text-primary" />
                            </div>
                            <span className="font-semibold">{trip.capacity_available_kg}kg</span>
                            <span className="text-muted-foreground">/ {trip.capacity_kg}kg</span>
                          </div>
                          {trip.price_expect && (
                            <div className="flex items-center gap-1.5 text-xs md:text-sm text-muted-foreground">
                              <DollarSign className="h-3.5 w-3.5" />
                              <span className="font-medium">{trip.price_expect}€</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 md:h-9 md:w-9"
                            onClick={() => handleUpdateCapacity(trip.id, trip.capacity_available_kg - 5, trip.capacity_kg)}
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 md:h-9 md:w-9"
                            onClick={() => handleUpdateCapacity(trip.id, trip.capacity_available_kg + 5, trip.capacity_kg)}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex gap-1.5 md:gap-2 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 md:h-9 text-xs md:text-sm"
                          onClick={() => handleToggleTripStatus(trip.id, trip.status)}
                        >
                          {trip.status === "open" ? (
                            <>
                              <Lock className="h-3.5 w-3.5 mr-1" />
                              Fermer
                            </>
                          ) : (
                            <>
                              <LockOpen className="h-3.5 w-3.5 mr-1" />
                              Ouvrir
                            </>
                          )}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="h-8 md:h-9 text-xs md:text-sm" 
                          onClick={() => navigate(`/publier/trajet/${trip.id}`)}
                        >
                          <Edit className="h-3.5 w-3.5 mr-1" />
                          Modifier
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" className="h-8 md:h-9 text-xs md:text-sm">
                              <Trash2 className="h-3.5 w-3.5 mr-1" />
                              Supprimer
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                              <AlertDialogDescription>
                                Cette action est irréversible. Le trajet sera définitivement supprimé.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteTrip(trip.id)}>
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="parcels" className="space-y-4">
            {parcels.length === 0 ? (
              <EmptyState
                icon={Package}
                title="Aucun colis publié"
                description="Vous n'avez encore rien publié. Créez votre première annonce de colis !"
                action={
                  <Button asChild>
                    <a href="/publier/colis">Publier un colis</a>
                  </Button>
                }
              />
            ) : (
              parcels.map((parcel) => (
                <Card key={parcel.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <div className="bg-gradient-to-r from-primary/5 to-background p-3 md:p-4 border-b">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-sm md:text-base font-semibold">
                          <Package className="h-4 w-4 text-primary shrink-0" />
                          <span className="truncate">{parcel.from_city} → {parcel.to_city}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs md:text-sm text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>Avant le {format(new Date(parcel.deadline), "d MMM yyyy", { locale: fr })}</span>
                        </div>
                      </div>
                      <Badge variant={parcel.status === "open" ? "default" : "secondary"} className="text-xs shrink-0">
                        {parcel.status === "open" ? "Ouvert" : "Fermé"}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-3 md:p-4">
                    <div className="space-y-3">
                      <div className="flex gap-2 md:gap-3 text-xs md:text-sm">
                        <span className="px-2 py-1 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-300 font-medium capitalize">
                          {parcel.type}
                        </span>
                        <span className="px-2 py-1 rounded-md bg-purple-500/10 text-purple-700 dark:text-purple-300 font-medium">
                          {parcel.weight_kg}kg
                        </span>
                        <span className="px-2 py-1 rounded-md bg-orange-500/10 text-orange-700 dark:text-orange-300 font-medium">
                          {parcel.size}
                        </span>
                      </div>
                      <div className="flex gap-1.5 md:gap-2 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 md:h-9 text-xs md:text-sm"
                          onClick={() => handleToggleParcelStatus(parcel.id, parcel.status)}
                        >
                          {parcel.status === "open" ? (
                            <>
                              <Lock className="h-3.5 w-3.5 mr-1" />
                              Fermer
                            </>
                          ) : (
                            <>
                              <LockOpen className="h-3.5 w-3.5 mr-1" />
                              Ouvrir
                            </>
                          )}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="h-8 md:h-9 text-xs md:text-sm"
                          onClick={() => navigate(`/publier/colis/${parcel.id}`)}
                        >
                          <Edit className="h-3.5 w-3.5 mr-1" />
                          Modifier
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" className="h-8 md:h-9 text-xs md:text-sm">
                              <Trash2 className="h-3.5 w-3.5 mr-1" />
                              Supprimer
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                              <AlertDialogDescription>
                                Cette action est irréversible. Le colis sera définitivement supprimé.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteParcel(parcel.id)}>
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MyListings;
