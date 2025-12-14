import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Check, Phone, AlertCircle, RefreshCw, Mail } from "lucide-react";

interface PhoneVerificationProps {
  phoneNumber: string;
  isVerified: boolean;
  onVerified: () => void;
  userEmail?: string; // Email de l'utilisateur pour l'envoi par email
}

export const PhoneVerification = ({
  phoneNumber,
  isVerified,
  onVerified,
  userEmail,
}: PhoneVerificationProps) => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isDevMode, setIsDevMode] = useState(false);
  const [sentViaEmail, setSentViaEmail] = useState(false);

  // Countdown pour le renvoi du code
  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const sendVerificationCode = async (viaEmail = false) => {
    // Si on envoie par email, on a besoin de l'email de l'utilisateur
    if (viaEmail && !userEmail) {
      toast({
        title: "Email requis",
        description: "Impossible de trouver votre adresse email",
        variant: "destructive",
      });
      return;
    }

    // Si on envoie par SMS, on a besoin du numéro de téléphone
    if (!viaEmail && (!phoneNumber || !phoneNumber.startsWith('+'))) {
      toast({
        title: "Numéro invalide",
        description: "Veuillez d'abord enregistrer votre numéro de téléphone au format international (+33...)",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Generate secure verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

      // Store code in database (on utilise phone_e164 pour stocker l'email aussi si besoin)
      const identifier = viaEmail ? userEmail! : phoneNumber;
      
      const { error: dbError } = await supabase
        .from("phone_verification_codes")
        .insert({
          user_id: user.id,
          phone_e164: identifier,
          code: verificationCode,
        });

      if (dbError) {
        console.error("DB error:", dbError);
        throw new Error("Erreur lors de la création du code");
      }

      let response;
      
      if (viaEmail) {
        // Send via email (gratuit avec Resend)
        response = await supabase.functions.invoke("send-email-otp", {
          body: { 
            email: userEmail,
            code: verificationCode,
            userId: user.id 
          },
        });
      } else {
        // Send via SMS (payant avec Twilio)
        response = await supabase.functions.invoke("send-sms-verification", {
          body: { 
            phoneNumber, 
            code: verificationCode,
            userId: user.id 
          },
        });
      }

      const { data: smsData, error: smsError } = response;

      console.log("OTP Response:", smsData, smsError);

      if (smsError) {
        throw new Error(smsError.message || "Erreur lors de l'envoi");
      }

      // Handle rate limiting
      if (smsData?.error === "rate_limit") {
        toast({
          title: "Trop de tentatives",
          description: smsData.message,
          variant: "destructive",
        });
        return;
      }

      // Handle invalid email/phone
      if (smsData?.error === "invalid_email" || smsData?.error === "invalid_phone") {
        toast({
          title: viaEmail ? "Email invalide" : "Numéro invalide",
          description: smsData.message,
          variant: "destructive",
        });
        return;
      }

      // Handle dev mode (show code for testing)
      if (smsData?.error === "dev_mode" || smsData?.error === "trial_limitation") {
        setIsDevMode(true);
        toast({
          title: "🔧 Mode développement",
          description: `Code de vérification : ${smsData.code}`,
          duration: 30000,
        });
        setCodeSent(true);
        setSentViaEmail(viaEmail);
        startCountdown();
        return;
      }

      // Success
      toast({
        title: "Code envoyé ✓",
        description: viaEmail 
          ? `Un email contenant votre code a été envoyé à ${userEmail}`
          : "Un SMS contenant votre code de vérification a été envoyé",
      });

      setIsDevMode(false);
      setCodeSent(true);
      setSentViaEmail(viaEmail);
      startCountdown();
    } catch (error: any) {
      console.error("Send verification error:", error);
      toast({
        title: "Erreur d'envoi",
        description: error.message || "Impossible d'envoyer le code de vérification",
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

      // L'identifiant utilisé (email ou téléphone)
      const identifier = sentViaEmail ? userEmail : phoneNumber;

      // Verify code
      const { data: verification, error } = await supabase
        .from("phone_verification_codes")
        .select("*")
        .eq("user_id", user.id)
        .eq("phone_e164", identifier)
        .eq("code", code)
        .eq("verified", false)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error || !verification) {
        throw new Error("Code invalide ou expiré. Veuillez réessayer.");
      }

      // Mark code as verified
      await supabase
        .from("phone_verification_codes")
        .update({ verified: true })
        .eq("id", verification.id);

      // Update profile - on vérifie le téléphone même si le code a été envoyé par email
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ phone_verified: true })
        .eq("user_id", user.id);

      if (profileError) {
        console.error("Profile update error:", profileError);
      }

      toast({
        title: "Téléphone vérifié ✓",
        description: "Votre numéro a été vérifié avec succès. Votre score de confiance a augmenté !",
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
      <Card className="p-4 border-2 border-green-500 bg-green-50">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-green-500 p-2">
            <Check className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-medium text-green-800">Téléphone vérifié</p>
            <p className="text-sm text-green-600">{phoneNumber}</p>
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

        {isDevMode && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              <p className="font-medium">Mode développement</p>
              <p className="text-xs mt-1">Le code s'affiche dans la notification.</p>
            </div>
          </div>
        )}

        {!codeSent ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Choisissez comment recevoir votre code de vérification.
            </p>
            
            {/* Option Email (gratuit - recommandé) */}
            {userEmail && (
              <Button
                onClick={() => sendVerificationCode(true)}
                disabled={loading}
                className="w-full"
                variant="default"
              >
                <Mail className="h-4 w-4 mr-2" />
                {loading ? "Envoi..." : `Recevoir par email (${userEmail})`}
              </Button>
            )}
            
            {/* Option SMS (payant) */}
            <Button
              onClick={() => sendVerificationCode(false)}
              disabled={loading || !phoneNumber}
              className="w-full"
              variant="outline"
            >
              <Phone className="h-4 w-4 mr-2" />
              {loading ? "Envoi..." : "Recevoir par SMS"}
            </Button>
            
            {userEmail && (
              <p className="text-xs text-center text-muted-foreground">
                💡 L'envoi par email est gratuit et instantané
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-center text-sm text-muted-foreground mb-2">
              Code envoyé par {sentViaEmail ? 'email' : 'SMS'}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="code" className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">
                Code de vérification (6 chiffres)
              </Label>
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="text-center text-2xl tracking-widest font-mono"
                autoComplete="one-time-code"
              />
              <p className="text-xs text-muted-foreground text-center">
                Le code expire dans 10 minutes
              </p>
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
                onClick={() => sendVerificationCode(sentViaEmail)}
                disabled={loading || countdown > 0}
                variant="outline"
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                {countdown > 0 ? `${countdown}s` : "Renvoyer"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
