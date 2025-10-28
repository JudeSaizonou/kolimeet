import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useNavigate, Link } from "react-router-dom";
interface TripCardProps {
  trip: any;
}
export const TripCard = ({
  trip
}: TripCardProps) => {
  const navigate = useNavigate();
  const profile = trip.profiles;
  return <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <Link to={`/u/${trip.user_id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Avatar>
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback>{profile?.full_name?.[0] || "U"}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-foreground">{profile?.full_name || "Utilisateur"}</p>
              {profile?.rating_avg > 0 && <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Star className="h-3 w-3 fill-[#F59E0B] text-[#F59E0B]" />
                  <span>{Number(profile.rating_avg).toFixed(1)}</span>
                </div>}
            </div>
          </Link>
          <Badge variant={trip.status === "open" ? "default" : "secondary"}>
            {trip.status === "open" ? "Ouvert" : "Fermé"}
          </Badge>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">{trip.from_city}, {trip.from_country}</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{trip.to_city}, {trip.to_country}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Départ : {format(new Date(trip.date_departure), "d MMMM yyyy", {
            locale: fr
          })}
          </p>
        </div>

        <div className="flex gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Capacité dispo :</span>
            <span className="ml-1 font-medium">{trip.capacity_available_kg}kg</span>
          </div>
          {trip.price_expect && <div>
              <span className="text-muted-foreground">Prix du kg :</span>
              <span className="ml-1 font-medium">{trip.price_expect}€</span>
            </div>}
        </div>
      </CardContent>
      
      <CardFooter>
        <Button className="w-full" onClick={() => navigate(`/trajets/${trip.id}`)}>
          Voir le trajet
        </Button>
      </CardFooter>
    </Card>;
};