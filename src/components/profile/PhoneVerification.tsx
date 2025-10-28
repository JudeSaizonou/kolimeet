import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Check, Phone } from "lucide-react";

interface PhoneVerificationProps {
  phoneNumber: string;
  isVerified: boolean;
  onVerified: () => void;
}

export const PhoneVerification = ({
  phoneNumber,
  isVerified,
  onVerified,
}: PhoneVerificationProps) => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  const sendVerificationCode = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Generate mock code (in production, this would call an SMS service)
      const mockCode = Math.floor(100000 + Math.random() * 900000).toString();

      // Store code in database
      const { error } = await supabase
        .from("phone_verification_codes")
        .insert({
          user_id: user.id,
          phone_e164: phoneNumber,
          code: mockCode,
        });

      if (error) throw error;

      // In production, send SMS here
      // For demo, show the code in toast
      toast({
        title: "Code envoyé (DEMO)",
        description: `Code de vérification : ${mockCode}`,
      });

      setCodeSent(true);
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

  const verifyCode = async () => {
    if (!code || code.length !== 6) {
      toast({
        title: "Code invalide",
        description: "Veuillez entrer un code à 6 chiffres",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Verify code
      const { data: verification, error } = await supabase
        .from("phone_verification_codes")
        .select("*")
        .eq("user_id", user.id)
        .eq("phone_e164", phoneNumber)
        .eq("code", code)
        .eq("verified", false)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error || !verification) {
        throw new Error("Code invalide ou expiré");
      }

      // Mark code as verified
      await supabase
        .from("phone_verification_codes")
        .update({ verified: true })
        .eq("id", verification.id);

      // Update profile
      await supabase
        .from("profiles")
        .update({ phone_verified: true })
        .eq("user_id", user.id);

      toast({
        title: "Téléphone vérifié",
        description: "Votre numéro a été vérifié avec succès",
      });

      onVerified();
    } catch (error: any) {
      toast({
        title: "Erreur de vérification",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (isVerified) {
    return (
      <Card className="p-4 border-2 border-success bg-success/5">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-success p-2">
            <Check className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-medium text-foreground">Téléphone vérifié</p>
            <p className="text-sm text-muted-foreground">{phoneNumber}</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 border-2">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-2">
            <Phone className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">
              Vérification du téléphone
            </p>
            <p className="text-sm text-muted-foreground">{phoneNumber}</p>
          </div>
        </div>

        {!codeSent ? (
          <Button
            onClick={sendVerificationCode}
            disabled={loading}
            className="w-full"
          >
            {loading ? "Envoi..." : "Envoyer le code"}
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="code">Code de vérification</Label>
              <Input
                id="code"
                type="text"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={verifyCode}
                disabled={loading || code.length !== 6}
                className="flex-1"
              >
                {loading ? "Vérification..." : "Vérifier"}
              </Button>
              <Button
                onClick={sendVerificationCode}
                disabled={loading}
                variant="outline"
              >
                Renvoyer
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
