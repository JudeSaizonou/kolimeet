import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Camera, Star, LogOut, EyeOff, ChevronRight, Shield, Settings, HelpCircle, Phone, MapPin, Bell } from "lucide-react";
import { PhoneVerification } from "@/components/profile/PhoneVerification";
import { OneSignalNotificationToggle } from "@/components/notifications/OneSignalNotificationToggle";
import { useNavigate } from "react-router-dom";
import { countries, citiesByCountry } from "@/lib/data/countries";
import { TrustBadge, MyReferralsSection } from "@/components/trust";

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
  const [trustScore, setTrustScore] = useState(50);
  const [referredByCount, setReferredByCount] = useState(0);
  const [isVerified, setIsVerified] = useState(false);

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
        setTrustScore(profile.trust_score || 50);
        setReferredByCount(profile.referred_by_count || 0);
        setIsVerified(profile.is_verified || false);
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
      <div className="min-h-screen bg-slate-50/50">
        {/* Header profil avec fond dégradé */}
        <div className="bg-gradient-to-b from-primary/5 to-white px-4 pt-6 pb-8">
          {/* Avatar centré */}
          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              <Avatar className="h-24 w-24 ring-4 ring-white shadow-lg">
                <AvatarImage src={avatarUrl} alt="Avatar" />
                <AvatarFallback className="bg-primary/10 text-primary text-3xl font-semibold">
                  {formData.full_name?.charAt(0)?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 cursor-pointer w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform border-2 border-white"
              >
                <Camera className="h-4 w-4" />
              </label>
              <Input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={uploadAvatar}
                disabled={uploading}
                className="hidden"
              />
            </div>

            {/* Nom et localisation */}
            <h1 className="text-2xl font-bold text-slate-900 text-center">
              {formData.full_name || "Votre nom"}
            </h1>
            {formData.city && formData.country && (
              <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                <MapPin className="h-4 w-4" />
                {formData.city}, {formData.country}
              </p>
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 mt-4">
              {rating.count > 0 && (
                <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-full">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  <span className="text-sm font-semibold text-amber-700">{rating.avg.toFixed(1)}</span>
                  <span className="text-xs text-amber-600">({rating.count})</span>
                </div>
              )}
              <TrustBadge
                trustScore={trustScore}
                referredByCount={referredByCount}
                isVerified={isVerified}
                size="sm"
              />
            </div>
          </div>
        </div>

        {/* Section Parrainage */}
        <div className="px-4 -mt-2">
          <MyReferralsSection />
        </div>

        {/* Formulaire */}
        <div className="mt-4 mx-4 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Informations personnelles
            </p>
          </div>

          {/* Nom */}
          <div className="px-4 py-4 border-b border-slate-100">
            <Label className="text-xs text-slate-400 font-medium">Nom complet</Label>
            <Input
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="Votre nom"
              className="border-0 p-0 h-7 text-base text-slate-900 focus-visible:ring-0 placeholder:text-slate-300"
            />
          </div>

          {/* Pays */}
          <div className="px-4 py-4 border-b border-slate-100">
            <Label className="text-xs text-slate-400 font-medium">Pays</Label>
            <Select
              value={formData.country}
              onValueChange={(value) => {
                setFormData({ ...formData, country: value, city: "" });
                setSelectedCountry(value);
              }}
            >
              <SelectTrigger className="border-0 p-0 h-7 text-base text-slate-900 focus:ring-0 [&>svg]:text-slate-400">
                <SelectValue placeholder="Choisir un pays" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country} value={country}>{country}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Ville */}
          <div className="px-4 py-4 border-b border-slate-100">
            <Label className="text-xs text-slate-400 font-medium">Ville</Label>
            {selectedCountry && citiesByCountry[selectedCountry] ? (
              <Select
                value={formData.city}
                onValueChange={(value) => setFormData({ ...formData, city: value })}
              >
                <SelectTrigger className="border-0 p-0 h-7 text-base text-slate-900 focus:ring-0 [&>svg]:text-slate-400">
                  <SelectValue placeholder="Choisir une ville" />
                </SelectTrigger>
                <SelectContent>
                  {citiesByCountry[selectedCountry].map((city) => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Votre ville"
                disabled={!selectedCountry}
                className="border-0 p-0 h-7 text-base text-slate-900 focus-visible:ring-0 placeholder:text-slate-300"
              />
            )}
          </div>

          {/* Téléphone */}
          <div className="px-4 py-4 flex items-center justify-between">
            <div className="flex-1">
              <Label className="text-xs text-slate-400 font-medium">Téléphone</Label>
              <Input
                type="tel"
                value={formData.phone_e164}
                onChange={(e) => setFormData({ ...formData, phone_e164: e.target.value })}
                placeholder="+33 6 12 34 56 78"
                className="border-0 p-0 h-7 text-base text-slate-900 focus-visible:ring-0 placeholder:text-slate-300"
              />
            </div>
            {phoneVerified && (
              <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2.5 py-1 rounded-full">
                ✓ Vérifié
              </span>
            )}
          </div>
        </div>

        {/* Vérification téléphone */}
        {formData.phone_e164 && !phoneVerified && (
          <div className="mt-4 px-4">
            <PhoneVerification
              phoneNumber={formData.phone_e164}
              isVerified={phoneVerified}
              onVerified={() => {
                setPhoneVerified(true);
                loadProfile();
              }}
            />
          </div>
        )}

        {/* Préférences */}
        <div className="mt-4 mx-4 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Préférences
            </p>
          </div>

          {/* Publication anonyme */}
          <div className="px-4 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center">
                <EyeOff className="h-4.5 w-4.5 text-violet-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Publication anonyme</p>
                <p className="text-xs text-slate-500">Cacher votre identité</p>
              </div>
            </div>
            <Switch
              checked={defaultAnonymous}
              onCheckedChange={setDefaultAnonymous}
            />
          </div>

          {/* Notifications intégré */}
          <OneSignalNotificationToggle />
        </div>

        {/* Boutons d'action */}
        <div className="mt-6 px-4 space-y-3 pb-8">
          <Button
            onClick={handleSubmit}
            className="w-full h-12 text-base font-semibold rounded-xl shadow-md shadow-primary/20"
            disabled={loading}
          >
            {loading ? "Enregistrement..." : "Enregistrer les modifications"}
          </Button>

          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="w-full h-11 text-sm font-medium text-slate-500 hover:text-red-500 hover:bg-red-50/50 rounded-xl"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Se déconnecter
          </Button>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Profile;
