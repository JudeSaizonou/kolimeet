import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface FlagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: "trip" | "parcel" | "message" | "profile" | "review";
  entityId: string;
}

export function FlagDialog({
  open,
  onOpenChange,
  entityType,
  entityId,
}: FlagDialogProps) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!user) {
      // Fermer le dialog et rediriger vers login
      onOpenChange(false);
      const returnTo = window.location.pathname + window.location.search;
      localStorage.setItem("returnTo", returnTo);
      navigate("/auth/login");
      return;
    }

    if (!reason.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez indiquer la raison du signalement",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from("flags").insert({
        entity_type: entityType,
        entity_id: entityId,
        reason: reason.trim(),
        reporter_id: user.id,
      });

      if (error) throw error;

      toast({
        title: "Signalement envoyé",
        description: "Merci, nous examinerons ce contenu rapidement",
      });

      setReason("");
      onOpenChange(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Signaler ce contenu</DialogTitle>
          <DialogDescription>
            Indiquez la raison de votre signalement. Notre équipe examinera le contenu.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="reason">Motif du signalement</Label>
            <Textarea
              id="reason"
              placeholder="Décrivez le problème..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-2"
              rows={4}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Envoi..." : "Envoyer"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
