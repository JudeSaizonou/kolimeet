import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Heart, Calendar, Package } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { useFavorite } from "@/hooks/useFavorite";

interface ParcelCardProps {
  parcel: any;
}

export const ParcelCard = ({ parcel }: ParcelCardProps) => {
  const navigate = useNavigate();
  const profile = parcel.profiles;
  const { isFavorited, toggleFavorite } = useFavorite("parcel", parcel.id);

  const typeLabels: Record<string, string> = {
    documents: "Documents",
    vetements: "Vêtements",
    electronique: "Électronique",
    autre: "Autre",
  };

  return (
    <Card 
      className="group relative overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer border-gray-200/60 dark:border-white/10"
      onClick={() => navigate(`/colis/${parcel.id}`)}
    >
      {/* Header Image / Map Placeholder */}
      <div className="h-24 md:h-32 bg-gradient-to-br from-orange-500/5 to-orange-500/10 relative">
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
          <Badge variant={parcel.status === "open" ? "default" : "secondary"} className="text-[10px] px-2 h-5">
            {parcel.status === "open" ? "Ouvert" : "Fermé"}
          </Badge>
        </div>
      </div>

      <CardContent className="p-3 md:p-4">
        {/* Route */}
        <div className="flex items-center gap-1.5 mb-2 text-sm md:text-base font-bold text-foreground">
          <span className="truncate max-w-[45%]">{parcel.from_city}</span>
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="truncate max-w-[45%]">{parcel.to_city}</span>
        </div>

        {/* Date & Type Row */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              {format(new Date(parcel.deadline), "d MMM", { locale: fr })}
            </span>
          </div>
          
          <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-white/50">
            {typeLabels[parcel.type] || parcel.type}
          </Badge>
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
          <span className="ml-auto text-xs font-medium text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
            {parcel.weight_kg}kg
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
