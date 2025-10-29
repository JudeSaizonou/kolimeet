import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TripFilters } from "@/hooks/useExplorer";

interface TripFiltersProps {
  filters: TripFilters;
  onChange: (filters: TripFilters) => void;
  onReset: () => void;
}

export const TripFiltersComponent = ({ filters, onChange, onReset }: TripFiltersProps) => {
  return (
    <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fromCountry">Pays de départ</Label>
          <Input
            id="fromCountry"
            placeholder="Ex: France"
            value={filters.fromCountry || ""}
            onChange={(e) => onChange({ ...filters, fromCountry: e.target.value })}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="fromCity">Ville de départ</Label>
          <Input
            id="fromCity"
            placeholder="Ex: Paris"
            value={filters.fromCity || ""}
            onChange={(e) => onChange({ ...filters, fromCity: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="toCountry">Pays d'arrivée</Label>
          <Input
            id="toCountry"
            placeholder="Ex: Bénin"
            value={filters.toCountry || ""}
            onChange={(e) => onChange({ ...filters, toCountry: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="toCity">Ville d'arrivée</Label>
          <Input
            id="toCity"
            placeholder="Ex: Cotonou"
            value={filters.toCity || ""}
            onChange={(e) => onChange({ ...filters, toCity: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dateFrom">Date de départ à partir de</Label>
          <Input
            id="dateFrom"
            type="date"
            value={filters.dateFrom || ""}
            onChange={(e) => onChange({ ...filters, dateFrom: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="minCapacity">Capacité min (kg)</Label>
          <Input
            id="minCapacity"
            type="number"
            placeholder="Ex: 10"
            value={filters.minCapacity || ""}
            onChange={(e) => onChange({ ...filters, minCapacity: e.target.value ? Number(e.target.value) : undefined })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sortBy">Trier par</Label>
          <Select
            value={filters.sortBy || "date"}
            onValueChange={(value) => onChange({ ...filters, sortBy: value as "date" | "price" })}
          >
            <SelectTrigger id="sortBy">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date de départ</SelectItem>
              <SelectItem value="price">Prix souhaité</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button variant="outline" onClick={onReset} className="w-full">
        Réinitialiser les filtres
      </Button>
    </div>
  );
};
