import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface ParcelCardProps {
  parcel: any;
}

export const ParcelCard = ({ parcel }: ParcelCardProps) => {
  const navigate = useNavigate();
  const profile = parcel.profiles;

  const typeLabels: Record<string, string> = {
    documents: "Documents",
    vetements: "Vêtements",
    electronique: "Électronique",
    autre: "Autre",
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback>{profile?.full_name?.[0] || "U"}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-foreground">{profile?.full_name || "Utilisateur"}</p>
              {profile?.rating_avg > 0 && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span>{profile.rating_avg.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>
          <Badge variant={parcel.status === "open" ? "default" : "secondary"}>
            {parcel.status === "open" ? "Ouvert" : "Fermé"}
          </Badge>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">{parcel.from_city}, {parcel.from_country}</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{parcel.to_city}, {parcel.to_country}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Deadline : {format(new Date(parcel.deadline), "d MMMM yyyy", { locale: fr })}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-sm">
          <Badge variant="outline">{typeLabels[parcel.type]}</Badge>
          <div>
            <span className="text-muted-foreground">Poids :</span>
            <span className="ml-1 font-medium">{parcel.weight_kg}kg</span>
          </div>
          <div>
            <span className="text-muted-foreground">Taille :</span>
            <span className="ml-1 font-medium">{parcel.size}</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={() => navigate(`/colis/${parcel.id}`)}
        >
          Voir le colis
        </Button>
      </CardFooter>
    </Card>
  );
};
