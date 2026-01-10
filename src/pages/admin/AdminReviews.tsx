import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Trash2, ExternalLink, Star } from "lucide-react";
import { Link } from "react-router-dom";

interface Review {
  id: string;
  reviewer_id: string;
  target_user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer?: {
    full_name: string;
    avatar_url: string | null;
  };
  target?: {
    full_name: string;
  };
}

export function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select(`
          *,
          reviewer:profiles!reviews_reviewer_id_fkey(full_name, avatar_url),
          target:profiles!reviews_target_user_id_fkey(full_name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const deleteReview = async (reviewId: string) => {
    try {
      const { error } = await supabase.from("reviews").delete().eq("id", reviewId);

      if (error) throw error;

      toast({
        title: "Avis supprimé",
        description: "L'avis a été supprimé",
      });

      fetchReviews();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card key={review.id} className="p-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={review.reviewer?.avatar_url || ""} />
              <AvatarFallback>
                {review.reviewer?.full_name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-foreground">
                  {review.reviewer?.full_name || "Utilisateur"}
                </span>
                <span className="text-sm text-muted-foreground">→</span>
                <span className="text-sm text-muted-foreground">
                  {review.target?.full_name || "Utilisateur"}
                </span>
              </div>

              <div className="flex items-center gap-1 mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < review.rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
                <span className="text-sm text-muted-foreground ml-2">
                  {new Date(review.created_at).toLocaleDateString("fr-FR")}
                </span>
              </div>

              {review.comment && (
                <p className="text-sm text-foreground mb-3 line-clamp-3">
                  {review.comment}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/u/${review.reviewer_id}`} target="_blank">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Voir auteur
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/u/${review.target_user_id}`} target="_blank">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Voir cible
                  </Link>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteReview(review.id)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Supprimer
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
