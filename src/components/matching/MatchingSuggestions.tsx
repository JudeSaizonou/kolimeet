import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Calendar, Weight, Star, Package, MapPin, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";
import { GlassCard } from "@/components/LiquidGlass";

interface MatchingSuggestionsProps {
  type: "parcel" | "trip";
  itemId: string;
  maxSuggestions?: number;
}

interface Match {
  match_id: string;
  match_score: number;
  // Pour les correspondances de colis
  trip_id?: string;
  trip_from_city?: string;
  trip_to_city?: string;
  date_departure?: string;
  capacity_available_kg?: number;
  price_expect?: number;
  traveler_name?: string;
  traveler_rating?: number;
  // Pour les correspondances de trajets
  parcel_id?: string;
  parcel_type?: string;
  weight_kg?: number;
  parcel_from_city?: string;
  parcel_to_city?: string;
  deadline?: string;
  sender_name?: string;
  sender_rating?: number;
}

export const MatchingSuggestions = ({ 
  type, 
  itemId, 
  maxSuggestions = 5 
}: MatchingSuggestionsProps) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadMatches();
  }, [itemId, type]);

  const loadMatches = async () => {
    try {
      setLoading(true);
      
      if (type === "parcel") {
        // Récupérer les correspondances pour un colis via la vue détaillée
        const { data, error } = await supabase
          .from('parcel_matches_detailed')
          .select('*')
          .eq('parcel_id', itemId)
          .gte('match_score', 50)
          .order('match_score', { ascending: false })
          .limit(maxSuggestions);

        if (error) throw error;
        
        // Transformer les données pour le format Match
        const formattedMatches = (data || []).map((pm: any) => ({
          match_id: pm.id,
          match_score: pm.match_score,
          trip_id: pm.trip_id,
          trip_from_city: pm.trip_from_city,
          trip_to_city: pm.trip_to_city,
          date_departure: pm.date_departure,
          capacity_available_kg: pm.capacity_available_kg,
          price_expect: pm.price_expect,
        }));
        
        setMatches(formattedMatches);
      } else {
        // Récupérer les correspondances pour un trajet
        const { data, error } = await supabase
          .from('parcel_matches_detailed')
          .select('*')
          .eq('trip_id', itemId)
          .gte('match_score', 50)
          .order('match_score', { ascending: false })
          .limit(maxSuggestions);

        if (error) throw error;
        
        // Transformer les données pour le format Match
        const formattedMatches = (data || []).map((pm: any) => ({
          match_id: pm.id,
          match_score: pm.match_score,
          parcel_id: pm.parcel_id,
          parcel_type: pm.parcel_type,
          weight_kg: pm.weight_kg,
          parcel_from_city: pm.parcel_from_city,
          parcel_to_city: pm.parcel_to_city,
          deadline: pm.deadline,
        }));
        
        setMatches(formattedMatches);
      }
    } catch (error: any) {
      console.error("Error loading matches:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les correspondances.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewMatch = (matchId: string) => {
    if (type === "parcel") {
      navigate(`/trajets/${matchId}`);
    } else {
      navigate(`/colis/${matchId}`);
    }
  };

  const handleContactMatch = async (matchTargetId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth/login");
        return;
      }

      // Créer ou récupérer le thread de conversation
      const { data: existingThread } = await supabase
        .from("threads")
        .select("id")
        .eq("related_id", type === "parcel" ? matchTargetId : itemId)
        .or(`and(created_by.eq.${user.id}),and(other_user_id.eq.${user.id})`)
        .single();

      if (existingThread) {
        navigate(`/messages/${existingThread.id}`);
        return;
      }

      // Récupérer l'ID de l'autre utilisateur
      let otherUserId: string;
      if (type === "parcel") {
        const { data: trip } = await supabase
          .from("trips")
          .select("user_id")
          .eq("id", matchTargetId)
          .single();
        otherUserId = trip?.user_id;
      } else {
        const { data: parcel } = await supabase
          .from("parcels")
          .select("user_id")
          .eq("id", matchTargetId)
          .single();
        otherUserId = parcel?.user_id;
      }

      if (!otherUserId) throw new Error("Utilisateur introuvable");

      // Créer un nouveau thread
      const { data: newThread, error } = await supabase
        .from("threads")
        .insert({
          created_by: user.id,
          other_user_id: otherUserId,
          related_type: type,
          related_id: type === "parcel" ? matchTargetId : itemId,
        })
        .select()
        .single();

      if (error) throw error;

      navigate(`/messages/${newThread.id}`);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de démarrer la conversation.",
      });
    }
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return { label: "Parfait", color: "bg-green-500" };
    if (score >= 70) return { label: "Excellent", color: "bg-blue-500" };
    if (score >= 50) return { label: "Bon", color: "bg-yellow-500" };
    return { label: "Possible", color: "bg-gray-500" };
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <GlassCard className="p-6 text-center" intensity="subtle">
        <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
        <h3 className="font-semibold text-lg mb-2">Aucune correspondance pour le moment</h3>
        <p className="text-sm text-muted-foreground">
          {type === "parcel" 
            ? "Nous vous notifierons dès qu'un trajet compatible sera disponible."
            : "Nous vous notifierons dès qu'un colis compatible sera disponible."}
        </p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold">
          {type === "parcel" ? "Trajets recommandés" : "Colis recommandés"} 
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            ({matches.length})
          </span>
        </h2>
      </div>

      <div className="grid gap-4">
        {matches.map((match) => {
          const scoreInfo = getScoreLabel(match.match_score);
          const isParcelMatch = type === "parcel";
          
          return (
            <GlassCard 
              key={match.match_id}
              className="p-4 hover:shadow-lg transition-all duration-200 cursor-pointer border-2 border-transparent hover:border-primary/20"
              onClick={() => handleViewMatch(isParcelMatch ? match.trip_id! : match.parcel_id!)}
              intensity="subtle"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 space-y-3">
                  {/* Score de correspondance */}
                  <div className="flex items-center gap-2">
                    <Badge className={`${scoreInfo.color} text-white text-xs`}>
                      {match.match_score}% - {scoreInfo.label}
                    </Badge>
                  </div>

                  {/* Route */}
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">
                        {isParcelMatch ? match.trip_from_city : match.parcel_from_city}
                      </span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <span className="font-semibold">
                        {isParcelMatch ? match.trip_to_city : match.parcel_to_city}
                      </span>
                    </div>
                  </div>

                  {/* Détails spécifiques */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {isParcelMatch ? (
                      <>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{format(new Date(match.date_departure!), "d MMM", { locale: fr })}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Weight className="h-3.5 w-3.5" />
                          <span>{match.capacity_available_kg} kg dispo</span>
                        </div>
                        {match.price_expect && (
                          <div className="flex items-center gap-1">
                            <span className="font-semibold text-primary">{match.price_expect}€/kg</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>Avant le {format(new Date(match.deadline!), "d MMM", { locale: fr })}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Weight className="h-3.5 w-3.5" />
                          <span>{match.weight_kg} kg</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {match.parcel_type}
                        </Badge>
                      </>
                    )}
                  </div>

                  {/* Utilisateur */}
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-xs bg-primary/10">
                        {(isParcelMatch ? match.traveler_name : match.sender_name)?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">
                        {isParcelMatch ? match.traveler_name : match.sender_name}
                      </span>
                      {((isParcelMatch ? match.traveler_rating : match.sender_rating) || 0) > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs text-muted-foreground">
                            {(isParcelMatch ? match.traveler_rating : match.sender_rating)?.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bouton d'action */}
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContactMatch(isParcelMatch ? match.trip_id! : match.parcel_id!);
                  }}
                  className="shrink-0"
                >
                  Contacter
                </Button>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
};
