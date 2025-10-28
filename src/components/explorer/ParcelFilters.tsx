import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ParcelFilters } from "@/hooks/useExplorer";

interface ParcelFiltersProps {
  filters: ParcelFilters;
  onChange: (filters: ParcelFilters) => void;
  onReset: () => void;
}

export const ParcelFiltersComponent = ({ filters, onChange, onReset }: ParcelFiltersProps) => {
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
          <Label htmlFor="deadline">Deadline (date limite)</Label>
          <Input
            id="deadline"
            type="date"
            value={filters.deadline || ""}
            onChange={(e) => onChange({ ...filters, deadline: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <Select
            value={filters.type || "all"}
            onValueChange={(value) => onChange({ ...filters, type: value === "all" ? undefined : value })}
          >
            <SelectTrigger id="type">
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

        <div className="space-y-2">
          <Label htmlFor="maxWeight">Poids max (kg)</Label>
          <Input
            id="maxWeight"
            type="number"
            placeholder="Ex: 5"
            value={filters.maxWeight || ""}
            onChange={(e) => onChange({ ...filters, maxWeight: e.target.value ? Number(e.target.value) : undefined })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sortBy">Trier par</Label>
          <Select
            value={filters.sortBy || "deadline"}
            onValueChange={(value) => onChange({ ...filters, sortBy: value as "deadline" | "weight" })}
          >
            <SelectTrigger id="sortBy">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="deadline">Deadline</SelectItem>
              <SelectItem value="weight">Poids</SelectItem>
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
