import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader } from "@/components/ui/loader";
import { EmptyState } from "@/components/EmptyState";
import { MessageSquare, Bug, Lightbulb, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Feedback {
  id: string;
  user_id: string | null;
  message: string;
  category: "bug" | "suggestion" | "autre";
  created_at: string;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

const categoryConfig = {
  bug: { label: "Bug", icon: Bug, color: "destructive" as const },
  suggestion: { label: "Suggestion", icon: Lightbulb, color: "default" as const },
  autre: { label: "Autre", icon: MessageCircle, color: "secondary" as const },
};

export default function AdminFeedbacks() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("feedbacks")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch user profiles separately
      const feedbacksWithProfiles: Feedback[] = await Promise.all(
        (data || []).map(async (feedback) => {
          if (feedback.user_id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name, avatar_url")
              .eq("user_id", feedback.user_id)
              .single();
            
            return { 
              ...feedback, 
              category: feedback.category as "bug" | "suggestion" | "autre",
              profiles: profile || undefined
            };
          }
          return { 
            ...feedback, 
            category: feedback.category as "bug" | "suggestion" | "autre",
            profiles: undefined
          };
        })
      );

      setFeedbacks(feedbacksWithProfiles);
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  if (feedbacks.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="Aucun retour utilisateur"
        description="Les retours des utilisateurs apparaîtront ici."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Retours utilisateurs</h2>
        <Badge variant="secondary">{feedbacks.length} retours</Badge>
      </div>

      <div className="space-y-3">
        {feedbacks.map((feedback) => {
          const config = categoryConfig[feedback.category];
          const Icon = config.icon;

          return (
            <Card key={feedback.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={config.color}>{config.label}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(feedback.created_at), "PPP 'à' HH:mm", { locale: fr })}
                    </span>
                  </div>

                  {feedback.profiles && (
                    <p className="text-sm font-medium mb-2">
                      {feedback.profiles.full_name || "Utilisateur anonyme"}
                    </p>
                  )}

                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {feedback.message}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
