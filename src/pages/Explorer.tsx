import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { TripCard } from "@/components/explorer/TripCard";
import { ParcelCard } from "@/components/explorer/ParcelCard";
import { TripFiltersComponent } from "@/components/explorer/TripFilters";
import { ParcelFiltersComponent } from "@/components/explorer/ParcelFilters";
import { useTrips, useParcels, TripFilters, ParcelFilters } from "@/hooks/useExplorer";
import { Plane, Package, Search } from "lucide-react";
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
    <section className="min-h-screen bg-background pt-20 md:pt-28">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary rounded-lg">
              <Search className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold text-foreground tracking-tight">
              Explorer les annonces
            </h1>
          </div>
          <p className="text-slate-600 text-base md:text-lg font-medium">
            Trouvez le voyageur ou l'expéditeur qui correspond à vos besoins.
          </p>
        </div>

      <Tabs defaultValue="trips" className="w-full">
        <TabsList className="mb-6 bg-white/80 backdrop-blur-md border border-border/50 p-1 h-auto">
          <TabsTrigger 
            value="trips" 
            className="data-[state=active]:bg-primary data-[state=active]:text-white transition-all px-6 py-3 rounded-md"
          >
            <Plane className="h-4 w-4 mr-2" />
            Kilo à vendre
            {tripsTotalCount > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-white/20 rounded-full">
                {tripsTotalCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="parcels"
            className="data-[state=active]:bg-primary data-[state=active]:text-white transition-all px-6 py-3 rounded-md"
          >
            <Package className="h-4 w-4 mr-2" />
            Koli à transporter
            {parcelsTotalCount > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-white/20 rounded-full">
                {parcelsTotalCount}
              </span>
            )}
          </TabsTrigger>
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
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-48 md:h-64 rounded-xl" />
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
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                {trips.map((trip) => (
                  <TripCard key={trip.id} trip={trip} />
                ))}
              </div>

              {tripsTotalPages > 1 && (
                <Pagination className="mt-8">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setTripPage(Math.max(1, tripPage - 1))}
                        className={tripPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-primary/10"}
                      />
                    </PaginationItem>
                    
                    {[...Array(Math.min(5, tripsTotalPages))].map((_, i) => {
                      const page = i + 1;
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setTripPage(page)}
                            isActive={tripPage === page}
                            className={`cursor-pointer ${tripPage === page ? 'bg-primary text-white' : 'hover:bg-primary/10'}`}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}

                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setTripPage(Math.min(tripsTotalPages, tripPage + 1))}
                        className={tripPage === tripsTotalPages ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-primary/10"}
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
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-48 md:h-64 rounded-xl" />
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
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                {parcels.map((parcel) => (
                  <ParcelCard key={parcel.id} parcel={parcel} />
                ))}
              </div>

              {parcelsTotalPages > 1 && (
                <Pagination className="mt-8">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setParcelPage(Math.max(1, parcelPage - 1))}
                        className={parcelPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-primary/10"}
                      />
                    </PaginationItem>
                    
                    {[...Array(Math.min(5, parcelsTotalPages))].map((_, i) => {
                      const page = i + 1;
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setParcelPage(page)}
                            isActive={parcelPage === page}
                            className={`cursor-pointer ${parcelPage === page ? 'bg-primary text-white' : 'hover:bg-primary/10'}`}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}

                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setParcelPage(Math.min(parcelsTotalPages, parcelPage + 1))}
                        className={parcelPage === parcelsTotalPages ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-primary/10"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
      </div>
    </section>
  );
};

export default Explorer;
