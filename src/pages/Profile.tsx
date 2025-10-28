import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Upload, User, Star } from "lucide-react";
import { PhoneVerification } from "@/components/profile/PhoneVerification";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";

const Profile = () => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [formData, setFormData] = useState({
    full_name: "",
    country: "",
    city: "",
    phone_e164: "",
  });
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [rating, setRating] = useState({ avg: 0, count: 0 });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        setFormData({
          full_name: profile.full_name || "",
          country: profile.country || "",
          city: profile.city || "",
          phone_e164: profile.phone_e164 || "",
        });
        setAvatarUrl(profile.avatar_url || "");
        setPhoneVerified(profile.phone_verified || false);
        setRating({
          avg: profile.rating_avg || 0,
          count: profile.rating_count || 0,
        });
      }
    } catch (error: any) {
      console.error("Error loading profile:", error);
    }
  };

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Fichier trop volumineux",
        description: "La taille maximale est de 2 MB",
        variant: "destructive",
      });
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Format invalide",
        description: "Veuillez sélectionner une image",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);

      setAvatarUrl(data.publicUrl);

      // Update profile with new avatar URL
      await supabase
        .from("profiles")
        .update({ avatar_url: data.publicUrl })
        .eq("user_id", user.id);

      toast({
        title: "Photo mise à jour",
        description: "Votre photo de profil a été téléchargée",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.full_name || !formData.country || !formData.city) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          country: formData.country,
          city: formData.city,
          phone_e164: formData.phone_e164 || null,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Profil mis à jour",
        description: "Vos modifications ont été enregistrées",
      });
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
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col">
        <Navigation />

        <main className="flex-1 bg-secondary py-12 px-4">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Profile Header */}
            <Card className="p-6 border-2">
              <div className="flex items-start gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatarUrl} alt="Avatar" />
                  <AvatarFallback className="bg-primary/10">
                    <User className="h-12 w-12 text-primary" />
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-foreground mb-2">
                    {formData.full_name || "Votre profil"}
                  </h1>
                  <p className="text-muted-foreground mb-3">
                    {formData.city && formData.country
                      ? `${formData.city}, ${formData.country}`
                      : "Aucune localisation"}
                  </p>

                  {rating.count > 0 && (
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-warning fill-warning" />
                      <span className="font-medium text-foreground">
                        {rating.avg.toFixed(1)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        ({rating.count} avis)
                      </span>
                    </div>
                  )}
                </div>

                <Label
                  htmlFor="avatar-upload"
                  className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  {uploading ? "..." : "Modifier"}
                </Label>
                <Input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={uploadAvatar}
                  disabled={uploading}
                  className="hidden"
                />
              </div>
            </Card>

            {/* Profile Form */}
            <Card className="p-6 border-2">
              <h2 className="text-xl font-bold text-foreground mb-6">
                Informations personnelles
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">
                    Nom complet <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="full_name"
                    type="text"
                    value={formData.full_name}
                    onChange={(e) =>
                      setFormData({ ...formData, full_name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">
                    Pays <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="country"
                    type="text"
                    value={formData.country}
                    onChange={(e) =>
                      setFormData({ ...formData, country: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">
                    Ville <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="city"
                    type="text"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone_e164">Téléphone</Label>
                  <Input
                    id="phone_e164"
                    type="tel"
                    placeholder="+33612345678"
                    value={formData.phone_e164}
                    onChange={(e) =>
                      setFormData({ ...formData, phone_e164: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Format : +33612345678 (avec indicatif pays)
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full font-semibold"
                  disabled={loading}
                >
                  {loading ? "Enregistrement..." : "Enregistrer les modifications"}
                </Button>
              </form>
            </Card>

            {/* Phone Verification */}
            {formData.phone_e164 && (
              <PhoneVerification
                phoneNumber={formData.phone_e164}
                isVerified={phoneVerified}
                onVerified={() => {
                  setPhoneVerified(true);
                  loadProfile();
                }}
              />
            )}
          </div>
        </main>

        <Footer />
      </div>
    </ProtectedRoute>
  );
};

export default Profile;
