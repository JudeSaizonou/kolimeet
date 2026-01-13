import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { TripCard } from "@/components/explorer/TripCard";
import { ParcelCard } from "@/components/explorer/ParcelCard";
import { TripFiltersComponent } from "@/components/explorer/TripFilters";
import { ParcelFiltersComponent } from "@/components/explorer/ParcelFilters";
import { useTrips, useParcels, TripFilters, ParcelFilters } from "@/hooks/useExplorer";
import { Plane, Package, Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
  const [tripFiltersOpen, setTripFiltersOpen] = useState(false);
  const [parcelFiltersOpen, setParcelFiltersOpen] = useState(false);

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

  // Compter les filtres actifs
  const countActiveFilters = (filters: TripFilters | ParcelFilters) => {
    return Object.entries(filters).filter(([key, value]) => 
      value && key !== 'sortBy' && value !== 'date' && value !== 'deadline'
    ).length;
  };

  const activeTripFiltersCount = countActiveFilters(tripFilters);
  const activeParcelFiltersCount = countActiveFilters(parcelFilters);

  // Générer les chips de filtres actifs
  const getFilterChips = (filters: TripFilters | ParcelFilters, type: 'trip' | 'parcel') => {
    const chips: { key: string; label: string; value: string }[] = [];
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value && key !== 'sortBy') {
        const labels: Record<string, string> = {
          fromCountry: 'De',
          toCountry: 'Vers',
          fromCity: 'Ville départ',
          toCity: 'Ville arrivée',
          dateFrom: 'Dès le',
          deadline: 'Avant le',
          minCapacity: 'Min',
          type: 'Type',
          minWeight: 'Poids min',
          maxWeight: 'Poids max',
        };
        
        chips.push({
          key,
          label: labels[key] || key,
          value: String(value)
        });
      }
    });
    
    return chips;
  };

  return (
    <section className="min-h-screen bg-background pt-20 md:pt-32">
      <div className="container mx-auto px-3 md:px-4 py-6 md:py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 md:p-2 bg-primary rounded-lg">
              <Search className="h-4 w-4 md:h-6 md:w-6 text-white" />
            </div>
            <h1 className="text-xl md:text-4xl font-extrabold text-foreground tracking-tight">
              Explorer les annonces
            </h1>
          </div>
          <p className="text-slate-600 text-sm md:text-lg font-medium">
            Trouvez le voyageur ou l'expéditeur qui correspond à vos besoins.
          </p>
        </div>

      <Tabs defaultValue="trips" className="w-full">
        <TabsList className="mb-4 md:mb-6 bg-white/80 backdrop-blur-md border border-border/50 p-1 h-auto">
          <TabsTrigger 
            value="trips" 
            className="data-[state=active]:bg-primary data-[state=active]:text-white transition-all px-3 md:px-6 py-2 md:py-3 rounded-md text-sm md:text-base"
          >
            <Plane className="h-4 w-4 mr-2" />
            Kilos à vendre
            {tripsTotalCount > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-white/20 rounded-full">
                {tripsTotalCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="parcels"
            className="data-[state=active]:bg-primary data-[state=active]:text-white transition-all px-3 md:px-6 py-2 md:py-3 rounded-md text-sm md:text-base"
          >
            <Package className="h-4 w-4 mr-2" />
            Colis à transporter
            {parcelsTotalCount > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-white/20 rounded-full">
                {parcelsTotalCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trips" className="space-y-4">
          {/* Mobile: Bouton Filtres avec Sheet + Chips */}
          <div className="md:hidden flex items-center gap-2 flex-wrap">
            <Sheet open={tripFiltersOpen} onOpenChange={setTripFiltersOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="h-10 gap-2 bg-white border-slate-200 hover:bg-slate-50"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filtres
                  {activeTripFiltersCount > 0 && (
                    <Badge variant="default" className="ml-1 h-5 min-w-5 px-1.5 text-xs">
                      {activeTripFiltersCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
                <SheetHeader className="mb-4">
                  <SheetTitle className="text-lg flex items-center gap-2">
                    <SlidersHorizontal className="h-5 w-5 text-primary" />
                    Filtrer les trajets
                  </SheetTitle>
                </SheetHeader>
                <TripFiltersComponent 
                  filters={tripFilters}
                  onChange={(newFilters) => {
                    setTripFilters(newFilters);
                    setTripPage(1);
                  }}
                  onReset={handleResetTripFilters}
                />
                <div className="mt-4 sticky bottom-0 bg-white pt-4 pb-2 border-t">
                  <Button 
                    onClick={() => setTripFiltersOpen(false)}
                    className="w-full"
                  >
                    Voir {tripsTotalCount} résultat{tripsTotalCount > 1 ? 's' : ''}
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            {/* Chips des filtres actifs - Mobile */}
            {getFilterChips(tripFilters, 'trip').map((chip) => (
              <Badge
                key={chip.key}
                variant="secondary"
                className="h-10 px-3 gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                <span className="text-xs font-medium">{chip.label}:</span>
                <span className="text-xs">{chip.value}</span>
                <button
                  onClick={() => {
                    setTripFilters({ ...tripFilters, [chip.key]: undefined });
                    setTripPage(1);
                  }}
                  className="ml-1 hover:text-slate-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>

          {/* Desktop: Filtres classiques toujours visibles */}
          <div className="hidden md:block">
            <TripFiltersComponent 
              filters={tripFilters}
              onChange={(newFilters) => {
                setTripFilters(newFilters);
                setTripPage(1);
              }}
              onReset={handleResetTripFilters}
            />
          </div>

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

        <TabsContent value="parcels" className="space-y-4">
          {/* Mobile: Bouton Filtres avec Sheet + Chips */}
          <div className="md:hidden flex items-center gap-2 flex-wrap">
            <Sheet open={parcelFiltersOpen} onOpenChange={setParcelFiltersOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="h-10 gap-2 bg-white border-slate-200 hover:bg-slate-50"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filtres
                  {activeParcelFiltersCount > 0 && (
                    <Badge variant="default" className="ml-1 h-5 min-w-5 px-1.5 text-xs">
                      {activeParcelFiltersCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
                <SheetHeader className="mb-4">
                  <SheetTitle className="text-lg flex items-center gap-2">
                    <SlidersHorizontal className="h-5 w-5 text-primary" />
                    Filtrer les colis
                  </SheetTitle>
                </SheetHeader>
                <ParcelFiltersComponent 
                  filters={parcelFilters}
                  onChange={(newFilters) => {
                    setParcelFilters(newFilters);
                    setParcelPage(1);
                  }}
                  onReset={handleResetParcelFilters}
                />
                <div className="mt-4 sticky bottom-0 bg-white pt-4 pb-2 border-t">
                  <Button 
                    onClick={() => setParcelFiltersOpen(false)}
                    className="w-full"
                  >
                    Voir {parcelsTotalCount} résultat{parcelsTotalCount > 1 ? 's' : ''}
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            {/* Chips des filtres actifs - Mobile */}
            {getFilterChips(parcelFilters, 'parcel').map((chip) => (
              <Badge
                key={chip.key}
                variant="secondary"
                className="h-10 px-3 gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                <span className="text-xs font-medium">{chip.label}:</span>
                <span className="text-xs">{chip.value}</span>
                <button
                  onClick={() => {
                    setParcelFilters({ ...parcelFilters, [chip.key]: undefined });
                    setParcelPage(1);
                  }}
                  className="ml-1 hover:text-slate-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>

          {/* Desktop: Filtres classiques toujours visibles */}
          <div className="hidden md:block">
            <ParcelFiltersComponent 
              filters={parcelFilters}
              onChange={(newFilters) => {
                setParcelFilters(newFilters);
                setParcelPage(1);
              }}
              onReset={handleResetParcelFilters}
            />
          </div>

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
