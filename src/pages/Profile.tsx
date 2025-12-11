import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Upload, User, Star, LogOut, EyeOff } from "lucide-react";
import { PhoneVerification } from "@/components/profile/PhoneVerification";
import { useNavigate } from "react-router-dom";
import { countries, citiesByCountry } from "@/lib/data/countries";

const Profile = () => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: "",
    country: "",
    city: "",
    phone_e164: "",
  });
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [rating, setRating] = useState({ avg: 0, count: 0 });
  const [selectedCountry, setSelectedCountry] = useState("");
  const [defaultAnonymous, setDefaultAnonymous] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

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
        setSelectedCountry(profile.country || "");
        setAvatarUrl(profile.avatar_url || "");
        setPhoneVerified(profile.phone_verified || false);
        setRating({
          avg: profile.rating_avg || 0,
          count: profile.rating_count || 0,
        });
        setDefaultAnonymous(profile.default_anonymous_posting || false);
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
          default_anonymous_posting: defaultAnonymous,
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
      <div className="bg-secondary min-h-screen py-6 px-3 sm:py-12 sm:px-4">
        <div className="max-w-md mx-auto space-y-4">
          {/* Profile Header */}
          <Card className="p-4 sm:p-6 border shadow-sm">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="relative">
                <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
                  <AvatarImage src={avatarUrl} alt="Avatar" />
                  <AvatarFallback className="bg-primary/10">
                    <User className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />
                  </AvatarFallback>
                </Avatar>
                <Label
                  htmlFor="avatar-upload"
                  className="absolute -bottom-1 -right-1 cursor-pointer inline-flex items-center justify-center h-8 w-8 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors shadow-md"
                >
                  <Upload className="h-4 w-4" />
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

              <div>
                <h1 className="text-lg sm:text-xl font-bold text-foreground">
                  {formData.full_name || "Votre profil"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {formData.city && formData.country
                    ? `${formData.city}, ${formData.country}`
                    : "Aucune localisation"}
                </p>

                {rating.count > 0 && (
                  <div className="flex items-center justify-center gap-1.5 mt-2">
                    <Star className="h-4 w-4 text-warning fill-warning" />
                    <span className="font-medium text-sm text-foreground">
                      {rating.avg.toFixed(1)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({rating.count} avis)
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Profile Form */}
          <Card className="p-4 sm:p-6 border shadow-sm">
            <h2 className="text-base sm:text-lg font-bold text-foreground mb-4">
              Informations personnelles
            </h2>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="full_name" className="text-xs text-muted-foreground font-medium">
                  Nom complet <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  className="h-10"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="country" className="text-xs text-muted-foreground font-medium">
                    Pays <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.country}
                    onValueChange={(value) => {
                      setFormData({ ...formData, country: value, city: "" });
                      setSelectedCountry(value);
                    }}
                    required
                  >
                    <SelectTrigger id="country" className="h-10">
                      <SelectValue placeholder="Pays" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="city" className="text-xs text-muted-foreground font-medium">
                    Ville <span className="text-destructive">*</span>
                  </Label>
                  {selectedCountry && citiesByCountry[selectedCountry] ? (
                    <Select
                      value={formData.city}
                      onValueChange={(value) =>
                        setFormData({ ...formData, city: value })
                      }
                      required
                    >
                      <SelectTrigger id="city" className="h-10">
                        <SelectValue placeholder="Ville" />
                      </SelectTrigger>
                      <SelectContent>
                        {citiesByCountry[selectedCountry].map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id="city"
                      type="text"
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                      placeholder="Ville"
                      disabled={!selectedCountry}
                      className="h-10"
                      required
                    />
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone_e164" className="text-xs text-muted-foreground font-medium">
                  Téléphone
                </Label>
                <Input
                  id="phone_e164"
                  type="tel"
                  placeholder="+33612345678"
                  value={formData.phone_e164}
                  onChange={(e) =>
                    setFormData({ ...formData, phone_e164: e.target.value })
                  }
                  className="h-10"
                />
                <p className="text-[11px] text-muted-foreground">
                  Avec indicatif pays (ex: +33)
                </p>
              </div>

              {/* Paramètre publication anonyme */}
              <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/30">
                <div className="space-y-0.5 flex-1 mr-3">
                  <Label className="text-sm flex items-center gap-1.5 font-medium">
                    <EyeOff className="h-3.5 w-3.5" />
                    Publier anonymement
                  </Label>
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    Vos annonces seront anonymes par défaut
                  </p>
                </div>
                <Switch
                  checked={defaultAnonymous}
                  onCheckedChange={setDefaultAnonymous}
                />
              </div>

              <div className="pt-2 space-y-2">
                <Button
                  type="submit"
                  className="w-full h-10 font-medium text-sm"
                  disabled={loading}
                >
                  {loading ? "Enregistrement..." : "Enregistrer"}
                </Button>

                {/* Bouton Déconnexion */}
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full h-10 font-medium text-sm text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Déconnexion
                </Button>
              </div>
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
      </div>
    </ProtectedRoute>
  );
};

export default Profile;
