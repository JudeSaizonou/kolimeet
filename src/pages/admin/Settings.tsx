import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Settings as SettingsIcon, Save, RefreshCw } from "lucide-react";
import { useAdmin } from "@/hooks/useAdmin";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PlatformSettings {
  general: {
    platform_name: string;
    support_email: string;
    enable_registrations: boolean;
    maintenance_mode: boolean;
  };
  limits: {
    max_trips_per_user: number;
    max_parcels_per_user: number;
    min_trip_price: number;
    max_trip_price: number;
    max_file_upload_size_mb: number;
  };
  moderation: {
    auto_flag_threshold: number;
    require_id_verification: boolean;
    manual_approval_required: boolean;
  };
  trust_score: {
    initial_score: number;
    verified_id_bonus: number;
    completed_trip_bonus: number;
    positive_review_bonus: number;
    negative_review_penalty: number;
    flag_penalty: number;
  };
}

export default function Settings() {
  const { toast } = useToast();
  const { hasRole } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<PlatformSettings>({
    general: {
      platform_name: "KoliMeet",
      support_email: "support@kolimeet.com",
      enable_registrations: true,
      maintenance_mode: false,
    },
    limits: {
      max_trips_per_user: 10,
      max_parcels_per_user: 10,
      min_trip_price: 5,
      max_trip_price: 5000,
      max_file_upload_size_mb: 10,
    },
    moderation: {
      auto_flag_threshold: 3,
      require_id_verification: false,
      manual_approval_required: false,
    },
    trust_score: {
      initial_score: 50,
      verified_id_bonus: 10,
      completed_trip_bonus: 5,
      positive_review_bonus: 2,
      negative_review_penalty: -5,
      flag_penalty: -10,
    },
  });

  // Only super_admin can access settings
  const canEditSettings = hasRole("super_admin");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("platform_settings")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;

      // Merge database settings with defaults
      if (data && data.length > 0) {
        const dbSettings: any = {};
        data.forEach((item: any) => {
          dbSettings[item.key] = item.value;
        });

        // Parse nested settings
        const parsedSettings: Partial<PlatformSettings> = {};
        Object.keys(dbSettings).forEach((key) => {
          const [category, settingKey] = key.split(".");
          if (!parsedSettings[category as keyof PlatformSettings]) {
            parsedSettings[category as keyof PlatformSettings] = {} as any;
          }
          (parsedSettings[category as keyof PlatformSettings] as any)[
            settingKey
          ] = dbSettings[key];
        });

        setSettings((prev) => ({ ...prev, ...parsedSettings }));
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les paramètres",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!canEditSettings) {
      toast({
        title: "Accès refusé",
        description: "Seuls les super administrateurs peuvent modifier les paramètres",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      // Flatten settings for database storage
      const flatSettings: Record<string, any> = {};
      Object.keys(settings).forEach((category) => {
        const categorySettings = settings[category as keyof PlatformSettings];
        Object.keys(categorySettings).forEach((key) => {
          flatSettings[`${category}.${key}`] = (categorySettings as any)[key];
        });
      });

      // Update settings using RPC function
      const { error } = await supabase.rpc("admin_update_settings" as any, {
        p_settings: flatSettings,
      });

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Paramètres enregistrés",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'enregistrer les paramètres",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (
    category: keyof PlatformSettings,
    key: string,
    value: any
  ) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!canEditSettings) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Paramètres de la Plateforme</h1>
        <Alert variant="destructive">
          <AlertDescription>
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
            Seuls les super administrateurs peuvent modifier les paramètres.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Paramètres de la Plateforme</h1>
          <p className="text-muted-foreground mt-1">
            Configuration globale de l'application
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchSettings} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button onClick={handleSaveSettings} size="sm" disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="limits">Limites</TabsTrigger>
          <TabsTrigger value="moderation">Modération</TabsTrigger>
          <TabsTrigger value="trust_score">Score de Confiance</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres Généraux</CardTitle>
              <CardDescription>
                Configuration de base de la plateforme
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="platform_name">Nom de la Plateforme</Label>
                <Input
                  id="platform_name"
                  value={settings.general.platform_name}
                  onChange={(e) =>
                    updateSetting("general", "platform_name", e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="support_email">Email Support</Label>
                <Input
                  id="support_email"
                  type="email"
                  value={settings.general.support_email}
                  onChange={(e) =>
                    updateSetting("general", "support_email", e.target.value)
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Autoriser les Inscriptions</Label>
                  <p className="text-sm text-muted-foreground">
                    Les nouveaux utilisateurs peuvent créer un compte
                  </p>
                </div>
                <Switch
                  checked={settings.general.enable_registrations}
                  onCheckedChange={(checked) =>
                    updateSetting("general", "enable_registrations", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-destructive">Mode Maintenance</Label>
                  <p className="text-sm text-muted-foreground">
                    Désactive l'accès à la plateforme pour les non-admins
                  </p>
                </div>
                <Switch
                  checked={settings.general.maintenance_mode}
                  onCheckedChange={(checked) =>
                    updateSetting("general", "maintenance_mode", checked)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Limits Settings */}
        <TabsContent value="limits">
          <Card>
            <CardHeader>
              <CardTitle>Limites</CardTitle>
              <CardDescription>
                Limites d'utilisation et de contenu
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="max_trips">Trajets Max par Utilisateur</Label>
                  <Input
                    id="max_trips"
                    type="number"
                    value={settings.limits.max_trips_per_user}
                    onChange={(e) =>
                      updateSetting(
                        "limits",
                        "max_trips_per_user",
                        parseInt(e.target.value)
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_parcels">
                    Colis Max par Utilisateur
                  </Label>
                  <Input
                    id="max_parcels"
                    type="number"
                    value={settings.limits.max_parcels_per_user}
                    onChange={(e) =>
                      updateSetting(
                        "limits",
                        "max_parcels_per_user",
                        parseInt(e.target.value)
                      )
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_price">Prix Minimum (€)</Label>
                  <Input
                    id="min_price"
                    type="number"
                    value={settings.limits.min_trip_price}
                    onChange={(e) =>
                      updateSetting(
                        "limits",
                        "min_trip_price",
                        parseFloat(e.target.value)
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_price">Prix Maximum (€)</Label>
                  <Input
                    id="max_price"
                    type="number"
                    value={settings.limits.max_trip_price}
                    onChange={(e) =>
                      updateSetting(
                        "limits",
                        "max_trip_price",
                        parseFloat(e.target.value)
                      )
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="max_upload">
                  Taille Max Upload Fichier (MB)
                </Label>
                <Input
                  id="max_upload"
                  type="number"
                  value={settings.limits.max_file_upload_size_mb}
                  onChange={(e) =>
                    updateSetting(
                      "limits",
                      "max_file_upload_size_mb",
                      parseInt(e.target.value)
                    )
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Moderation Settings */}
        <TabsContent value="moderation">
          <Card>
            <CardHeader>
              <CardTitle>Modération</CardTitle>
              <CardDescription>
                Configuration des règles de modération
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="auto_flag">
                  Seuil Auto-Signalement
                </Label>
                <Input
                  id="auto_flag"
                  type="number"
                  value={settings.moderation.auto_flag_threshold}
                  onChange={(e) =>
                    updateSetting(
                      "moderation",
                      "auto_flag_threshold",
                      parseInt(e.target.value)
                    )
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Nombre de signalements avant action automatique
                </p>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Vérification d'Identité Requise</Label>
                  <p className="text-sm text-muted-foreground">
                    Les utilisateurs doivent vérifier leur identité pour publier
                  </p>
                </div>
                <Switch
                  checked={settings.moderation.require_id_verification}
                  onCheckedChange={(checked) =>
                    updateSetting("moderation", "require_id_verification", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Approbation Manuelle Requise</Label>
                  <p className="text-sm text-muted-foreground">
                    Toutes les annonces nécessitent une validation admin
                  </p>
                </div>
                <Switch
                  checked={settings.moderation.manual_approval_required}
                  onCheckedChange={(checked) =>
                    updateSetting("moderation", "manual_approval_required", checked)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trust Score Settings */}
        <TabsContent value="trust_score">
          <Card>
            <CardHeader>
              <CardTitle>Score de Confiance</CardTitle>
              <CardDescription>
                Configuration du système de scoring
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="initial_score">Score Initial</Label>
                <Input
                  id="initial_score"
                  type="number"
                  value={settings.trust_score.initial_score}
                  onChange={(e) =>
                    updateSetting(
                      "trust_score",
                      "initial_score",
                      parseInt(e.target.value)
                    )
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Score attribué aux nouveaux utilisateurs
                </p>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="verified_bonus">Bonus Vérification ID</Label>
                  <Input
                    id="verified_bonus"
                    type="number"
                    value={settings.trust_score.verified_id_bonus}
                    onChange={(e) =>
                      updateSetting(
                        "trust_score",
                        "verified_id_bonus",
                        parseInt(e.target.value)
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trip_bonus">Bonus Trajet Complété</Label>
                  <Input
                    id="trip_bonus"
                    type="number"
                    value={settings.trust_score.completed_trip_bonus}
                    onChange={(e) =>
                      updateSetting(
                        "trust_score",
                        "completed_trip_bonus",
                        parseInt(e.target.value)
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="review_bonus">Bonus Avis Positif</Label>
                  <Input
                    id="review_bonus"
                    type="number"
                    value={settings.trust_score.positive_review_bonus}
                    onChange={(e) =>
                      updateSetting(
                        "trust_score",
                        "positive_review_bonus",
                        parseInt(e.target.value)
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="review_penalty">Pénalité Avis Négatif</Label>
                  <Input
                    id="review_penalty"
                    type="number"
                    value={settings.trust_score.negative_review_penalty}
                    onChange={(e) =>
                      updateSetting(
                        "trust_score",
                        "negative_review_penalty",
                        parseInt(e.target.value)
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="flag_penalty">Pénalité Signalement</Label>
                  <Input
                    id="flag_penalty"
                    type="number"
                    value={settings.trust_score.flag_penalty}
                    onChange={(e) =>
                      updateSetting(
                        "trust_score",
                        "flag_penalty",
                        parseInt(e.target.value)
                      )
                    }
                  />
                </div>
              </div>

              <Alert>
                <AlertDescription>
                  Le score de confiance varie de 0 à 100. Les utilisateurs avec un
                  score faible peuvent avoir des restrictions d'accès.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
