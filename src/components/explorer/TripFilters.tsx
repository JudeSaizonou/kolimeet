import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TripFilters } from "@/hooks/useExplorer";
import { GlassCard } from "@/components/LiquidGlass";
import { MapPin, Calendar, Package, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

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
      padding="lg"
      rounded="xl"
      className="bg-white/80 backdrop-blur-md border border-border/50"
    >
      {/* Filtres principaux toujours visibles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fromCountry" className="flex items-center gap-2 text-sm font-medium">
            <MapPin className="h-4 w-4 text-primary" />
            Départ
          </Label>
          <Input
            id="fromCountry"
            placeholder="Pays de départ"
            value={filters.fromCountry || ""}
            onChange={(e) => onChange({ ...filters, fromCountry: e.target.value })}
            className="h-10 border-border/50 focus:ring-2 focus:ring-primary transition-all"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="toCountry" className="flex items-center gap-2 text-sm font-medium">
            <MapPin className="h-4 w-4 text-primary" />
            Arrivée
          </Label>
          <Input
            id="toCountry"
            placeholder="Pays d'arrivée"
            value={filters.toCountry || ""}
            onChange={(e) => onChange({ ...filters, toCountry: e.target.value })}
            className="h-10 border-border/50 focus:ring-2 focus:ring-primary transition-all"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dateFrom" className="flex items-center gap-2 text-sm font-medium">
            <Calendar className="h-4 w-4 text-primary" />
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

        <div className="space-y-2">
          <Label htmlFor="sortBy" className="text-sm font-medium">Trier par</Label>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50">
          <div className="space-y-2">
            <Label htmlFor="fromCity" className="flex items-center gap-2 text-sm font-medium">
              <MapPin className="h-4 w-4 text-accent" />
              Ville de départ
            </Label>
            <Input
              id="fromCity"
              placeholder="Ex: Paris"
              value={filters.fromCity || ""}
              onChange={(e) => onChange({ ...filters, fromCity: e.target.value })}
              className="h-10 border-border/50 focus:ring-2 focus:ring-primary transition-all"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="toCity" className="flex items-center gap-2 text-sm font-medium">
              <MapPin className="h-4 w-4 text-accent" />
              Ville d'arrivée
            </Label>
            <Input
              id="toCity"
              placeholder="Ex: Cotonou"
              value={filters.toCity || ""}
              onChange={(e) => onChange({ ...filters, toCity: e.target.value })}
              className="h-10 border-border/50 focus:ring-2 focus:ring-primary transition-all"
            />
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
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-muted-foreground hover:text-foreground"
        >
          {showAdvanced ? (
            <>
              <ChevronUp className="h-4 w-4 mr-1" />
              Moins de filtres
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-1" />
              Plus de filtres
            </>
          )}
        </Button>

        {activeFiltersCount > 0 && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onReset} 
            className="text-muted-foreground hover:text-destructive transition-all"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Réinitialiser
          </Button>
        )}
      </div>
    </GlassCard>
  );
};
