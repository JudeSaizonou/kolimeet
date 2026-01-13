import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { TripFilters } from "@/hooks/useExplorer";
import { GlassCard } from "@/components/LiquidGlass";
import { MapPin, Calendar, Package, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { countries, citiesByCountry } from "@/lib/data/countries";

interface TripFiltersProps {
  filters: TripFilters;
  onChange: (filters: TripFilters) => void;
  onReset: () => void;
}

export const TripFiltersComponent = ({ filters, onChange, onReset }: TripFiltersProps) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const activeFiltersCount = Object.values(filters).filter(v => v && v !== "date").length;

  return (
    <GlassCard 
      intensity="subtle"
      variant="default"
      padding="sm"
      rounded="xl"
      className="bg-white/80 backdrop-blur-md border border-border/50"
    >
      {/* Filtres principaux toujours visibles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="fromCountry" className="flex items-center gap-1.5 text-xs sm:text-sm font-medium">
            <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-primary hidden sm:inline" />
            Départ
          </Label>
          <Combobox
            options={countries}
            value={filters.fromCountry || ""}
            onValueChange={(value) => onChange({ ...filters, fromCountry: value, fromCity: "" })}
            placeholder="Pays de départ"
            searchPlaceholder="Rechercher un pays..."
            emptyText="Aucun pays trouvé."
            className="h-10"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="toCountry" className="flex items-center gap-1.5 text-xs sm:text-sm font-medium">
            <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-primary hidden sm:inline" />
            Arrivée
          </Label>
          <Combobox
            options={countries}
            value={filters.toCountry || ""}
            onValueChange={(value) => onChange({ ...filters, toCountry: value, toCity: "" })}
            placeholder="Pays d'arrivée"
            searchPlaceholder="Rechercher un pays..."
            emptyText="Aucun pays trouvé."
            className="h-10"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="dateFrom" className="flex items-center gap-1.5 text-xs sm:text-sm font-medium">
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-primary hidden sm:inline" />
            À partir de
          </Label>
          <Input
            id="dateFrom"
            type="date"
            value={filters.dateFrom || ""}
            onChange={(e) => onChange({ ...filters, dateFrom: e.target.value })}
            className="h-10 border-border/50 focus:ring-2 focus:ring-primary transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="sortBy" className="text-xs sm:text-sm font-medium">Trier par</Label>
          <Select
            value={filters.sortBy || "date"}
            onValueChange={(value) => onChange({ ...filters, sortBy: value as "date" | "price" })}
          >
            <SelectTrigger id="sortBy" className="h-10 border-border/50 focus:ring-2 focus:ring-primary">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date de départ</SelectItem>
              <SelectItem value="price">Prix souhaité</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filtres avancés */}
      {showAdvanced && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 mt-3 pt-3 border-t border-border/50">
          <div className="space-y-1.5">
            <Label htmlFor="fromCity" className="flex items-center gap-1.5 text-xs sm:text-sm font-medium">
              <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-accent hidden sm:inline" />
              Ville de départ
            </Label>
            {filters.fromCountry && citiesByCountry[filters.fromCountry] ? (
              <Combobox
                options={citiesByCountry[filters.fromCountry]}
                value={filters.fromCity || ""}
                onValueChange={(value) => onChange({ ...filters, fromCity: value })}
                placeholder="Ville de départ"
                searchPlaceholder="Rechercher une ville..."
                emptyText="Aucune ville trouvée."
                className="h-10"
              />
            ) : (
              <Input
                id="fromCity"
                placeholder="Ex: Paris"
                value={filters.fromCity || ""}
                onChange={(e) => onChange({ ...filters, fromCity: e.target.value })}
                className="h-10 border-border/50 focus:ring-2 focus:ring-primary transition-all"
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="toCity" className="flex items-center gap-2 text-sm font-medium">
              <MapPin className="h-4 w-4 text-accent" />
              Ville d'arrivée
            </Label>
            {filters.toCountry && citiesByCountry[filters.toCountry] ? (
              <Combobox
                options={citiesByCountry[filters.toCountry]}
                value={filters.toCity || ""}
                onValueChange={(value) => onChange({ ...filters, toCity: value })}
                placeholder="Ville d'arrivée"
                searchPlaceholder="Rechercher une ville..."
                emptyText="Aucune ville trouvée."
                className="h-10"
              />
            ) : (
              <Input
                id="toCity"
                placeholder="Ex: Cotonou"
                value={filters.toCity || ""}
                onChange={(e) => onChange({ ...filters, toCity: e.target.value })}
                className="h-10 border-border/50 focus:ring-2 focus:ring-primary transition-all"
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="minCapacity" className="flex items-center gap-2 text-sm font-medium">
              <Package className="h-4 w-4 text-primary" />
              Capacité min (kg)
            </Label>
            <Input
              id="minCapacity"
              type="number"
              placeholder="Ex: 10"
              value={filters.minCapacity || ""}
              onChange={(e) => onChange({ ...filters, minCapacity: e.target.value ? Number(e.target.value) : undefined })}
              className="h-10 border-border/50 focus:ring-2 focus:ring-primary transition-all"
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-muted-foreground hover:text-foreground h-9 text-xs sm:text-sm"
        >
          {showAdvanced ? (
            <>
              <ChevronUp className="h-3.5 w-3.5 mr-1" />
              Moins de filtres
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5 mr-1" />
              Plus de filtres
            </>
          )}
        </Button>

        {activeFiltersCount > 0 && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onReset} 
            className="text-muted-foreground hover:text-destructive transition-all h-9 text-xs sm:text-sm"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Réinitialiser
          </Button>
        )}
      </div>
    </GlassCard>
  );
};
