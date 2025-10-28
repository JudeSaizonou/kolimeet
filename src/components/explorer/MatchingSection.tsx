import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface MatchingSectionProps {
  type: "trip" | "parcel";
  item: any;
}

const getSizeVolume = (size: string): number => {
  const volumes: Record<string, number> = { S: 10, M: 25, L: 45 };
  return volumes[size] || 0;
};

const calculateScore = (
  match: any,
  referenceItem: any,
  type: "trip" | "parcel"
): number => {
  let score = 0;

  const fromCityMatch = match.from_city.toLowerCase().trim() === referenceItem.from_city.toLowerCase().trim();
  const toCityMatch = match.to_city.toLowerCase().trim() === referenceItem.to_city.toLowerCase().trim();
  
  if (fromCityMatch && toCityMatch) score += 50;

  if (type === "trip") {
    const tripDate = new Date(referenceItem.date_departure);
    const parcelDeadline = new Date(match.deadline);
    const daysDiff = Math.abs((tripDate.getTime() - parcelDeadline.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff <= 3) score += 20;

    const parcelVolume = getSizeVolume(match.size);
    if (referenceItem.capacity_available_liters >= parcelVolume) score += 15;
  } else {
    const parcelDeadline = new Date(referenceItem.deadline);
    const tripDate = new Date(match.date_departure);
    const daysDiff = Math.abs((tripDate.getTime() - parcelDeadline.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff <= 3) score += 20;

    const parcelVolume = getSizeVolume(referenceItem.size);
    if (match.capacity_available_liters >= parcelVolume) score += 15;
  }

  return score;
};

export const MatchingSection = ({ type, item }: MatchingSectionProps) => {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true);
      try {
        const oppositeType = type === "trip" ? "parcels" : "trips";
        
        let query = supabase
          .from(oppositeType)
          .select("*, profiles!*_user_id_fkey(full_name, avatar_url, rating_avg)")
          .eq("status", "open")
          .ilike("from_country", item.from_country)
          .ilike("from_city", item.from_city)
          .ilike("to_country", item.to_country)
          .ilike("to_city", item.to_city);

        if (type === "trip") {
          query = query.gte("deadline", item.date_departure);
        } else {
          query = query.lte("date_departure", item.deadline);
        }

        const { data, error } = await query.limit(20);

        if (error) throw error;

        const scoredMatches = ((data as any[]) || [])
          .map(match => ({
            ...match,
            score: calculateScore(match, item, type),
          }))
          .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            const dateA = type === "trip" ? new Date(a.deadline) : new Date(a.date_departure);
            const dateB = type === "trip" ? new Date(b.deadline) : new Date(b.date_departure);
            return dateA.getTime() - dateB.getTime();
          })
          .slice(0, 6);

        setMatches(scoredMatches);
      } catch (error) {
        console.error("Error fetching matches:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [type, item]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Correspondances</CardTitle>
          <CardDescription>Recherche de {type === "trip" ? "colis" : "trajets"} compatibles...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (matches.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Correspondances</CardTitle>
          <CardDescription>Aucune correspondance trouvée pour le moment</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Correspondances</CardTitle>
        <CardDescription>
          {matches.length} {type === "trip" ? "colis" : "trajets"} compatibles trouvés
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {matches.map((match) => (
            <Card key={match.id} className="border">
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{match.from_city}</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">{match.to_city}</span>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    {type === "trip" 
                      ? `Deadline : ${format(new Date(match.deadline), "d MMM yyyy", { locale: fr })}`
                      : `Départ : ${format(new Date(match.date_departure), "d MMM yyyy", { locale: fr })}`
                    }
                  </p>

                  {type === "trip" ? (
                    <div className="flex gap-2 text-xs">
                      <Badge variant="outline">{match.size}</Badge>
                      <span>{match.weight_kg}kg</span>
                    </div>
                  ) : (
                    <div className="text-xs">
                      <span className="text-muted-foreground">Capacité :</span>
                      <span className="ml-1 font-medium">{match.capacity_available_liters}L</span>
                    </div>
                  )}

                  {match.score >= 50 && (
                    <Badge variant="default" className="text-xs">Match parfait</Badge>
                  )}

                  <Button 
                    size="sm" 
                    variant="outline"
                    className="w-full mt-2"
                    onClick={() => navigate(type === "trip" ? `/colis/${match.id}` : `/trajets/${match.id}`)}
                  >
                    Voir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
