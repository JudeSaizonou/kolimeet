import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Heart, Calendar } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { useFavorite } from "@/hooks/useFavorite";

interface TripCardProps {
  trip: any;
}

export const TripCard = ({ trip }: TripCardProps) => {
  const navigate = useNavigate();
  const profile = trip.profiles;
  const { isFavorited, toggleFavorite } = useFavorite("trip", trip.id);

  return (
    <Card 
      className="group relative overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer border-gray-200/60 dark:border-white/10"
      onClick={() => navigate(`/trajets/${trip.id}`)}
    >
      {/* Header Image / Map Placeholder */}
      <div className="h-24 md:h-32 bg-gradient-to-br from-primary/5 to-primary/10 relative">
        <div className="absolute top-2 right-2 z-10">
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite();
            }}
          >
            <Heart className={`h-4 w-4 ${isFavorited ? "fill-red-500 text-red-500" : "text-slate-600"}`} />
          </Button>
        </div>
        
        <div className="absolute bottom-2 left-3">
          <Badge variant={trip.status === "open" ? "default" : "secondary"} className="text-[10px] px-2 h-5">
            {trip.status === "open" ? "Ouvert" : "Fermé"}
          </Badge>
        </div>
      </div>

      <CardContent className="p-3 md:p-4">
        {/* Route */}
        <div className="flex items-center gap-1.5 mb-2 text-sm md:text-base font-bold text-foreground">
          <span className="truncate max-w-[45%]">{trip.from_city}</span>
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="truncate max-w-[45%]">{trip.to_city}</span>
        </div>

        {/* Date & Price Row */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              {format(new Date(trip.date_departure), "d MMM", { locale: fr })}
            </span>
          </div>
          
          {trip.price_expect && (
            <div className="font-extrabold text-primary text-sm md:text-base">
              {trip.price_expect}€<span className="text-[10px] font-normal text-muted-foreground">/kg</span>
            </div>
          )}
        </div>

        {/* User Info (Compact) */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
          <Avatar className="h-5 w-5 md:h-6 md:w-6">
            <AvatarImage src={profile?.avatar_url} />
            <AvatarFallback className="text-[10px]">{profile?.full_name?.[0] || "U"}</AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground truncate max-w-[100px]">
            {profile?.full_name || "Utilisateur"}
          </span>
          <span className="ml-auto text-xs font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
            {trip.capacity_available_kg}kg
          </span>
        </div>
      </CardContent>
    </Card>
  );
};