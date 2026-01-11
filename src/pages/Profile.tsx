import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Camera, Star, LogOut, EyeOff, ChevronRight, Shield, Settings, HelpCircle, Phone, MapPin, Bell, User, Users, Package, Plane, ClipboardList, Download, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { OneSignalNotificationToggle } from "@/components/notifications/OneSignalNotificationToggle";
import { useNavigate } from "react-router-dom";
import { countries, citiesByCountry } from "@/lib/data/countries";
import { TrustBadge, MyReferralsSection } from "@/components/trust";

const Profile = () => {
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [exportingData, setExportingData] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
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
  const [userEmail, setUserEmail] = useState<string>("");

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const loadProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Stocker l'email de l'utilisateur
      setUserEmail(user.email || "");

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
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();

    // Temps réel : écouter les changements du profil
    const setupRealtimeProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase
        .channel(`profile-${user.id}`)
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'profiles',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            console.log('[Profile] 🔔 Profile changed, reloading...');
            loadProfile();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupRealtimeProfile();
  }, [loadProfile]);

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

  // Export des données personnelles (RGPD - Droit d'accès)
  const handleExportData = async () => {
    setExportingData(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Récupérer toutes les données de l'utilisateur
      const [profileRes, tripsRes, parcelsRes, reviewsRes, messagesRes, threadsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).single(),
        supabase.from("trips").select("*").eq("user_id", user.id),
        supabase.from("parcels").select("*").eq("user_id", user.id),
        supabase.from("reviews").select("*").or(`reviewer_id.eq.${user.id},reviewed_user_id.eq.${user.id}`),
        supabase.from("messages").select("*").eq("sender_id", user.id),
        supabase.from("threads").select("*").or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`),
      ]);

      const exportData = {
        exportDate: new Date().toISOString(),
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.created_at,
        },
        profile: profileRes.data,
        trips: tripsRes.data || [],
        parcels: parcelsRes.data || [],
        reviews: reviewsRes.data || [],
        messages: messagesRes.data || [],
        conversations: threadsRes.data || [],
      };

      // Télécharger en JSON
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kolimeet-mes-donnees-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export réussi",
        description: "Vos données ont été téléchargées",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setExportingData(false);
    }
  };

  // Suppression du compte (RGPD - Droit à l'effacement)
  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Appeler la fonction RPC pour supprimer le compte
      const { data, error } = await supabase.rpc("delete_user_account" as any, { 
        p_target_user_id: user.id 
      });

      if (error) {
        console.error("Delete account RPC error:", error);
        throw error;
      }

      // Vérifier que la suppression a réussi
      if (!data || (data as any).success !== true) {
        console.error("Delete account failed:", data);
        throw new Error((data as any)?.error || "La suppression du compte a échoué");
      }

      console.log("Account deleted successfully:", data);

      // Déconnexion
      await supabase.auth.signOut();

      toast({
        title: "Compte supprimé",
        description: "Votre compte et toutes vos données ont été supprimés",
      });

      navigate("/");
    } catch (error: any) {
      console.error("Delete account error:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer le compte. Contactez le support.",
        variant: "destructive",
      });
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50/50 pt-20 md:pt-28">
        {/* Header profil avec fond dégradé - largeur max */}
        <div className="bg-primary/5 px-4 pt-6 pb-8">
          <div className="max-w-4xl mx-auto">
          {/* Avatar centré */}
          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              {initialLoading ? (
                <Skeleton className="h-24 w-24 rounded-full ring-4 ring-white shadow-lg" />
              ) : (
                <>
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
                </>
              )}
            </div>

            {/* Nom et localisation */}
            {initialLoading ? (
              <>
                <Skeleton className="h-7 w-40 mt-1" />
                <Skeleton className="h-4 w-32 mt-2" />
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-slate-900 text-center">
                  {formData.full_name || "Votre nom"}
                </h1>
                {formData.city && formData.country && (
                  <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                    <MapPin className="h-4 w-4" />
                    {formData.city}, {formData.country}
                  </p>
                )}
              </>
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
        </div>

        {/* Raccourcis rapides */}
        <div className="px-4 -mt-4 mb-6">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 gap-3">
            <Link 
              to="/mes-annonces"
              className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-slate-100 hover:border-primary/30 hover:shadow-md transition-all"
            >
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Plane className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm text-slate-900">Mes annonces</p>
                <p className="text-xs text-slate-500">Gérer</p>
              </div>
            </Link>
            <Link 
              to="/mes-reservations"
              className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-slate-100 hover:border-primary/30 hover:shadow-md transition-all"
            >
              <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                <ClipboardList className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="font-medium text-sm text-slate-900">Réservations</p>
                <p className="text-xs text-slate-500">Suivre</p>
              </div>
            </Link>
          </div>
          </div>
        </div>

        {/* Conteneur principal avec largeur max */}
        <div className="max-w-4xl mx-auto px-4 pb-8">
          {/* Tabs pour Mes infos / Mon réseau */}
          <Tabs defaultValue="infos" className="-mt-2">
            <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1 rounded-xl h-12 max-w-md mx-auto">
              <TabsTrigger 
              value="infos" 
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-2 h-10"
            >
              <User className="h-4 w-4" />
              Mes infos
            </TabsTrigger>
            <TabsTrigger 
              value="network" 
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-2 h-10"
            >
              <Users className="h-4 w-4" />
              Mon réseau
            </TabsTrigger>
          </TabsList>

          {/* Tab: Mes infos */}
          <TabsContent value="infos" className="mt-6 space-y-5">
            {/* Formulaire */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Informations personnelles
                </p>
              </div>

              {/* Nom */}
              <div className="px-4 py-4 border-b border-slate-100">
                <Label className="text-xs text-slate-600 font-medium">Nom complet</Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Votre nom"
                  className="border-0 p-0 h-7 text-base text-slate-900 focus-visible:ring-0 placeholder:text-slate-500"
                />
              </div>

              {/* Pays */}
              <div className="px-4 py-4 border-b border-slate-100">
                <Label className="text-xs text-slate-600 font-medium">Pays</Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) => {
                    setFormData({ ...formData, country: value, city: "" });
                    setSelectedCountry(value);
                  }}
                >
                  <SelectTrigger className="border-0 p-0 h-7 text-base text-slate-900 focus:ring-0 [&>svg]:text-slate-600">
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
                <Label className="text-xs text-slate-600 font-medium">Ville</Label>
                {selectedCountry && citiesByCountry[selectedCountry] ? (
                  <Select
                    value={formData.city}
                    onValueChange={(value) => setFormData({ ...formData, city: value })}
                  >
                    <SelectTrigger className="border-0 p-0 h-7 text-base text-slate-900 focus:ring-0 [&>svg]:text-slate-600">
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
                    className="border-0 p-0 h-7 text-base text-slate-900 focus-visible:ring-0 placeholder:text-slate-500"
                  />
                )}
              </div>

              {/* Téléphone */}
              <div className="px-4 py-4 flex items-center justify-between">
                <div className="flex-1">
                  <Label className="text-xs text-slate-600 font-medium">Téléphone</Label>
                  <Input
                    type="tel"
                    value={formData.phone_e164}
                    onChange={(e) => setFormData({ ...formData, phone_e164: e.target.value })}
                    placeholder="+33 6 12 34 56 78"
                    className="border-0 p-0 h-7 text-base text-slate-900 focus-visible:ring-0 placeholder:text-slate-500"
                  />
                </div>
                {phoneVerified && (
                  <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2.5 py-1 rounded-full">
                    ✓ Vérifié
                  </span>
                )}
              </div>
            </div>

            {/* Préférences */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
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

            {/* Confidentialité et données (RGPD) */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Confidentialité et données
                </p>
              </div>

              {/* Télécharger mes données */}
              <div className="px-4 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Download className="h-4.5 w-4.5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Télécharger mes données</p>
                    <p className="text-xs text-slate-500">Export JSON complet</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportData}
                  disabled={exportingData}
                  className="h-8 text-xs"
                >
                  {exportingData ? "Export..." : "Exporter"}
                </Button>
              </div>

              {/* Supprimer mon compte */}
              <div className="px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center">
                    <Trash2 className="h-4.5 w-4.5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Supprimer mon compte</p>
                    <p className="text-xs text-slate-500">Action irréversible</p>
                  </div>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                    >
                      Supprimer
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Supprimer votre compte ?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action est irréversible. Toutes vos données seront définitivement supprimées :
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>Votre profil et photo</li>
                          <li>Vos trajets et colis publiés</li>
                          <li>Vos messages et conversations</li>
                          <li>Vos avis donnés et reçus</li>
                        </ul>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        disabled={deletingAccount}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {deletingAccount ? "Suppression..." : "Supprimer définitivement"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            {/* Bouton enregistrer */}
            <Button
              onClick={handleSubmit}
              className="w-full max-w-sm mx-auto block h-12 text-base font-semibold rounded-xl shadow-md shadow-primary/20"
              disabled={loading}
            >
              {loading ? "Enregistrement..." : "Enregistrer les modifications"}
            </Button>
          </TabsContent>

          {/* Tab: Mon réseau */}
          <TabsContent value="network" className="mt-6">
            <MyReferralsSection />
          </TabsContent>
        </Tabs>
        </div>

        {/* Bouton déconnexion (toujours visible) - largeur max */}
        <div className="mt-8 px-4 pb-10">
          <div className="max-w-4xl mx-auto">
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="w-full max-w-sm mx-auto flex items-center justify-center h-12 text-base font-medium text-red-600 hover:text-white hover:bg-red-600 border-red-200 hover:border-red-600 rounded-xl transition-all"
            >
              <LogOut className="h-4 w-4 mr-2.5" />
              Se déconnecter
            </Button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Profile;
