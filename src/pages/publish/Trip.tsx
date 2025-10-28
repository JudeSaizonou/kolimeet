import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createTripSchema, CreateTripInput } from "@/lib/validations/trips";
import { useTrips } from "@/hooks/useTrips";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const PublishTrip = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { createTrip, updateTrip, loading } = useTrips();
  const [date, setDate] = useState<Date>();
  const [isLoading, setIsLoading] = useState(!!id);

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
    },
  });

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
        });
        setDate(new Date(data.date_departure));
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {id ? "Modifier le trajet" : "Publier un trajet"}
            </CardTitle>
            <CardDescription>
              {id ? "Mettez à jour votre annonce" : "Partagez votre itinéraire et transportez des colis"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="from_country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pays de départ</FormLabel>
                        <FormControl>
                          <Input placeholder="France" {...field} />
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
                        <FormLabel>Ville de départ</FormLabel>
                        <FormControl>
                          <Input placeholder="Paris" {...field} />
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
                        <FormLabel>Pays d'arrivée</FormLabel>
                        <FormControl>
                          <Input placeholder="Bénin" {...field} />
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
                        <FormLabel>Ville d'arrivée</FormLabel>
                        <FormControl>
                          <Input placeholder="Cotonou" {...field} />
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
                      <FormLabel>Date de départ</FormLabel>
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
                        <FormLabel>Capacité totale (kg)</FormLabel>
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
                        <FormLabel>Capacité disponible (kg)</FormLabel>
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
                      <FormLabel>Prix souhaité (€) - Optionnel</FormLabel>
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
                      <FormLabel>Notes (optionnel)</FormLabel>
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

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (id ? "Mise à jour..." : "Publication...") : (id ? "Mettre à jour" : "Publier le trajet")}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PublishTrip;
