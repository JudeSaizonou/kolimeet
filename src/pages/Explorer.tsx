import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { TripCard } from "@/components/explorer/TripCard";
import { ParcelCard } from "@/components/explorer/ParcelCard";
import { TripFiltersComponent } from "@/components/explorer/TripFilters";
import { ParcelFiltersComponent } from "@/components/explorer/ParcelFilters";
import { useTrips, useParcels, TripFilters, ParcelFilters } from "@/hooks/useExplorer";
import { useDataSync } from "@/hooks/useDataSync";
import { Plane, Package } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const Explorer = () => {
  const [tripFilters, setTripFilters] = useState<TripFilters>({ sortBy: "date" });
  const [parcelFilters, setParcelFilters] = useState<ParcelFilters>({ sortBy: "deadline" });
  const [tripPage, setTripPage] = useState(1);
  const [parcelPage, setParcelPage] = useState(1);

  // Sync explorer data when updates occur
  useDataSync({ 
    queryKeys: ['trips', 'parcels', 'explorer'],
    onSync: () => {
      if (import.meta.env.DEV) {
        console.log('[Explorer] Data synchronized');
      }
    }
  });

  const { trips, loading: tripsLoading, totalCount: tripsTotalCount } = useTrips(tripFilters, tripPage);
  const { parcels, loading: parcelsLoading, totalCount: parcelsTotalCount } = useParcels(parcelFilters, parcelPage);

  const pageSize = 10;
  const tripsTotalPages = Math.ceil(tripsTotalCount / pageSize);
  const parcelsTotalPages = Math.ceil(parcelsTotalCount / pageSize);

  const handleResetTripFilters = () => {
    setTripFilters({ sortBy: "date" });
    setTripPage(1);
  };

  const handleResetParcelFilters = () => {
    setParcelFilters({ sortBy: "deadline" });
    setParcelPage(1);
  };

  return (
    <section className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Explorer les annonces
        </h1>
        <p className="text-muted-foreground">
          Trouvez le voyageur ou l'expéditeur qui correspond à vos besoins.
        </p>
      </div>

      <Tabs defaultValue="trips" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="trips">Trajets</TabsTrigger>
          <TabsTrigger value="parcels">Colis</TabsTrigger>
        </TabsList>

        <TabsContent value="trips" className="space-y-6">
          <TripFiltersComponent 
            filters={tripFilters}
            onChange={(newFilters) => {
              setTripFilters(newFilters);
              setTripPage(1);
            }}
            onReset={handleResetTripFilters}
          />

          {tripsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          ) : trips.length === 0 ? (
            <EmptyState
              icon={Plane}
              title="Aucun trajet disponible"
              description="Aucune annonce ne correspond à vos filtres. Essayez de modifier vos critères de recherche."
            />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trips.map((trip) => (
                  <TripCard key={trip.id} trip={trip} />
                ))}
              </div>

              {tripsTotalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setTripPage(Math.max(1, tripPage - 1))}
                        className={tripPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    
                    {[...Array(Math.min(5, tripsTotalPages))].map((_, i) => {
                      const page = i + 1;
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setTripPage(page)}
                            isActive={tripPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}

                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setTripPage(Math.min(tripsTotalPages, tripPage + 1))}
                        className={tripPage === tripsTotalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="parcels" className="space-y-6">
          <ParcelFiltersComponent 
            filters={parcelFilters}
            onChange={(newFilters) => {
              setParcelFilters(newFilters);
              setParcelPage(1);
            }}
            onReset={handleResetParcelFilters}
          />

          {parcelsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          ) : parcels.length === 0 ? (
            <EmptyState
              icon={Package}
              title="Aucun colis disponible"
              description="Aucune annonce ne correspond à vos filtres. Essayez de modifier vos critères de recherche."
            />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {parcels.map((parcel) => (
                  <ParcelCard key={parcel.id} parcel={parcel} />
                ))}
              </div>

              {parcelsTotalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setParcelPage(Math.max(1, parcelPage - 1))}
                        className={parcelPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    
                    {[...Array(Math.min(5, parcelsTotalPages))].map((_, i) => {
                      const page = i + 1;
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setParcelPage(page)}
                            isActive={parcelPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}

                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setParcelPage(Math.min(parcelsTotalPages, parcelPage + 1))}
                        className={parcelPage === parcelsTotalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </section>
  );
};

export default Explorer;
