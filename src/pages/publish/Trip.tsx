import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, EyeOff, Pencil, Users } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Combobox } from "@/components/ui/combobox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createTripSchema, CreateTripInput } from "@/lib/validations/trips";
import { useTrips } from "@/hooks/useTrips";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { countries, citiesByCountry } from "@/lib/data/countries";
import { AcceptTermsCheckbox } from "@/components/AcceptTermsCheckbox";
import { TripReservationsList } from "@/components/reservations/TripReservationsList";

const PublishTrip = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { createTrip, updateTrip, loading } = useTrips();
  const [date, setDate] = useState<Date>();
  const [isLoading, setIsLoading] = useState(!!id);
  const [defaultAnonymous, setDefaultAnonymous] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsError, setTermsError] = useState<string>();
  const [activeTab, setActiveTab] = useState<string>("edit");
  const [tripUserId, setTripUserId] = useState<string | null>(null);

  const form = useForm<CreateTripInput>({
    resolver: zodResolver(createTripSchema),
    defaultValues: {
      from_country: "",
      from_city: "",
      to_country: "",
      to_city: "",
      date_departure: "",
      capacity_kg: 20,
      capacity_available_kg: 20,
      price_expect: undefined,
      notes: "",
      is_anonymous: false,
    },
  });

  // Charger les préférences utilisateur
  useEffect(() => {
    const loadUserPreferences = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("default_anonymous_posting")
          .eq("user_id", user.id)
          .single();
        
        if (profile?.default_anonymous_posting) {
          setDefaultAnonymous(true);
          form.setValue("is_anonymous", true);
        }
      }
    };
    loadUserPreferences();
  }, []);

  useEffect(() => {
    if (id) {
      loadTrip(id);
    }
  }, [id]);

  const loadTrip = async (tripId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .eq("id", tripId)
        .single();

      if (error) throw error;

      if (data) {
        form.reset({
          from_country: data.from_country,
          from_city: data.from_city,
          to_country: data.to_country,
          to_city: data.to_city,
          date_departure: data.date_departure,
          capacity_kg: data.capacity_kg,
          capacity_available_kg: data.capacity_available_kg,
          price_expect: data.price_expect || undefined,
          notes: data.notes || "",
          is_anonymous: data.is_anonymous || false,
        });
        setDate(new Date(data.date_departure));
        setTripUserId(data.user_id);
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de charger le trajet",
        variant: "destructive",
      });
      navigate("/mes-annonces");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: CreateTripInput) => {
    if (id) {
      await updateTrip(id, data);
      navigate("/mes-annonces");
    } else {
      await createTrip(data);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20 md:pt-28">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20 md:pt-28 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Mode création - pas de tabs */}
        {!id ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Publier un trajet</CardTitle>
              <CardDescription>
                Partagez votre itinéraire et transportez des colis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {renderFormFields()}
                  
                  <AcceptTermsCheckbox
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => {
                      setAcceptedTerms(checked);
                      if (checked) setTermsError(undefined);
                    }}
                    type="trip"
                    error={termsError}
                  />

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading}
                    onClick={(e) => {
                      if (!acceptedTerms) {
                        e.preventDefault();
                        setTermsError("Vous devez accepter les conditions pour publier");
                      }
                    }}
                  >
                    {loading ? "Publication..." : "Publier le trajet"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        ) : (
          /* Mode édition - avec tabs */
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-2 mb-6">
              <TabsTrigger value="edit" className="flex items-center gap-2">
                <Pencil className="h-4 w-4" />
                Modifier
              </TabsTrigger>
              <TabsTrigger value="reservations" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Réservations
              </TabsTrigger>
            </TabsList>

            <TabsContent value="edit">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Modifier le trajet</CardTitle>
                  <CardDescription>
                    Mettez à jour votre annonce
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      {renderFormFields()}

                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Mise à jour..." : "Mettre à jour"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reservations">
              {tripUserId && (
                <TripReservationsList tripId={id} driverId={tripUserId} />
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );

  function renderFormFields() {
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
                    control={form.control}
                    name="from_country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">Pays de départ</FormLabel>
                        <FormControl>
                          <Combobox
                            options={countries}
                            value={field.value}
                            onValueChange={(value) => {
                              field.onChange(value);
                              form.setValue("from_city", "");
                            }}
                            placeholder="Sélectionner un pays"
                            searchPlaceholder="Rechercher un pays..."
                            emptyText="Aucun pays trouvé."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="from_city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">Ville de départ</FormLabel>
                        <FormControl>
                          {form.watch("from_country") && citiesByCountry[form.watch("from_country")] ? (
                            <Combobox
                              options={citiesByCountry[form.watch("from_country")]}
                              value={field.value}
                              onValueChange={field.onChange}
                              placeholder="Sélectionner une ville"
                              searchPlaceholder="Rechercher une ville..."
                              emptyText="Aucune ville trouvée."
                            />
                          ) : (
                            <Input placeholder="Entrez la ville de départ" {...field} />
                          )}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="to_country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">Pays d'arrivée</FormLabel>
                        <FormControl>
                          <Combobox
                            options={countries}
                            value={field.value}
                            onValueChange={(value) => {
                              field.onChange(value);
                              form.setValue("to_city", "");
                            }}
                            placeholder="Sélectionner un pays"
                            searchPlaceholder="Rechercher un pays..."
                            emptyText="Aucun pays trouvé."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="to_city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">Ville d'arrivée</FormLabel>
                        <FormControl>
                          {form.watch("to_country") && citiesByCountry[form.watch("to_country")] ? (
                            <Combobox
                              options={citiesByCountry[form.watch("to_country")]}
                              value={field.value}
                              onValueChange={field.onChange}
                              placeholder="Sélectionner une ville"
                              searchPlaceholder="Rechercher une ville..."
                              emptyText="Aucune ville trouvée."
                            />
                          ) : (
                            <Input placeholder="Entrez la ville d'arrivée" {...field} />
                          )}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="date_departure"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">Date de départ</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !date && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {date ? format(date, "PPP", { locale: fr }) : "Sélectionner une date"}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={date}
                            onSelect={(newDate) => {
                              setDate(newDate);
                              field.onChange(newDate ? format(newDate, "yyyy-MM-dd") : "");
                            }}
                            disabled={(date) => date < new Date()}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="capacity_kg"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">Capacité totale (kg)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="capacity_available_kg"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">Capacité disponible (kg)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="price_expect"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">Prix souhaité (€) - Optionnel</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">Notes (optionnel)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Ex: J'accepte uniquement les petits colis..."
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Option Annonce Anonyme */}
                <FormField
                  control={form.control}
                  name="is_anonymous"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-muted/50">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base flex items-center gap-2">
                          <EyeOff className="h-4 w-4" />
                          Publier anonymement
                        </FormLabel>
                        <FormDescription>
                          Votre nom et photo de profil seront masqués sur l'annonce
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
      </>
    );
  }
};

export default PublishTrip;
