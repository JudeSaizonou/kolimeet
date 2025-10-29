import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export default function Feedback() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [category, setCategory] = useState<"bug" | "suggestion" | "autre">("suggestion");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      toast.error("Veuillez écrire votre message");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("feedbacks")
        .insert({
          user_id: user?.id || null,
          message: message.trim(),
          category
        });

      if (error) throw error;

      toast.success("Merci pour votre retour ! 💚");
      navigate(-1);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Erreur lors de l'envoi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary">
      <header className="bg-background border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            aria-label="Retour"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold">Votre avis</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label className="text-base font-semibold mb-3 block">
                Type de retour
              </Label>
              <RadioGroup value={category} onValueChange={(v) => setCategory(v as any)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="bug" id="bug" />
                  <Label htmlFor="bug" className="font-normal cursor-pointer">
                    🐛 Signaler un bug
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="suggestion" id="suggestion" />
                  <Label htmlFor="suggestion" className="font-normal cursor-pointer">
                    💡 Suggérer une amélioration
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="autre" id="autre" />
                  <Label htmlFor="autre" className="font-normal cursor-pointer">
                    💬 Autre
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="message" className="text-base font-semibold">
                Votre message
              </Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Décrivez votre retour en détail..."
                className="mt-2 min-h-[150px]"
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {message.length}/1000 caractères
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Envoi..." : "Envoyer"}
            </Button>
          </form>
        </Card>

        <p className="text-sm text-muted-foreground text-center mt-6">
          Merci de contribuer à l'amélioration de kilomeet ! ✈️📦
        </p>
      </main>
    </div>
  );
}
