import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { ParcelFilters } from "@/hooks/useExplorer";
import { GlassCard } from "@/components/LiquidGlass";
import { MapPin, Calendar, Package, Scale, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { countries, citiesByCountry } from "@/lib/data/countries";

interface ParcelFiltersProps {
  filters: ParcelFilters;
  onChange: (filters: ParcelFilters) => void;
  onReset: () => void;
}

export const ParcelFiltersComponent = ({ filters, onChange, onReset }: ParcelFiltersProps) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const activeFiltersCount = Object.values(filters).filter(v => v && v !== "deadline").length;

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

        <div className="space-y-2">
          <Label htmlFor="toCountry" className="flex items-center gap-2 text-sm font-medium">
            <MapPin className="h-4 w-4 text-primary" />
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

        <div className="space-y-2">
          <Label htmlFor="deadline" className="flex items-center gap-2 text-sm font-medium">
            <Calendar className="h-4 w-4 text-primary" />
            Deadline
          </Label>
          <Input
            id="deadline"
            type="date"
            value={filters.deadline || ""}
            onChange={(e) => onChange({ ...filters, deadline: e.target.value })}
            className="h-10 border-border/50 focus:ring-2 focus:ring-primary transition-all"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type" className="flex items-center gap-2 text-sm font-medium">
            <Package className="h-4 w-4 text-primary" />
            Type
          </Label>
          <Select
            value={filters.type || "all"}
            onValueChange={(value) => onChange({ ...filters, type: value === "all" ? undefined : value })}
          >
            <SelectTrigger id="type" className="h-10 border-border/50 focus:ring-2 focus:ring-primary">
              <SelectValue placeholder="Tous" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="documents">Documents</SelectItem>
              <SelectItem value="vetements">Vêtements</SelectItem>
              <SelectItem value="electronique">Électronique</SelectItem>
              <SelectItem value="autre">Autre</SelectItem>
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
            <Label htmlFor="maxWeight" className="flex items-center gap-2 text-sm font-medium">
              <Scale className="h-4 w-4 text-primary" />
              Poids max (kg)
            </Label>
            <Input
              id="maxWeight"
              type="number"
              placeholder="Ex: 5"
              value={filters.maxWeight || ""}
              onChange={(e) => onChange({ ...filters, maxWeight: e.target.value ? Number(e.target.value) : undefined })}
              className="h-10 border-border/50 focus:ring-2 focus:ring-primary transition-all"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sortBy" className="text-sm font-medium">Trier par</Label>
            <Select
              value={filters.sortBy || "deadline"}
              onValueChange={(value) => onChange({ ...filters, sortBy: value as "deadline" | "weight" })}
            >
              <SelectTrigger id="sortBy" className="h-10 border-border/50 focus:ring-2 focus:ring-primary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="deadline">Deadline</SelectItem>
                <SelectItem value="weight">Poids</SelectItem>
              </SelectContent>
            </Select>
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
