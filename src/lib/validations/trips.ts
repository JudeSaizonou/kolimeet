import { z } from "zod";

const baseTripSchema = z.object({
  from_country: z.string().min(1, "Pays de départ requis").max(100),
  from_city: z.string().min(1, "Ville de départ requise").max(100),
  to_country: z.string().min(1, "Pays d'arrivée requis").max(100),
  to_city: z.string().min(1, "Ville d'arrivée requise").max(100),
  date_departure: z.string().refine((date) => {
    const departureDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return departureDate >= today;
  }, "La date de départ doit être dans le futur"),
  capacity_kg: z.number().int().min(1, "La capacité doit être au moins 1 kg").max(1000, "Capacité maximale : 1000 kg"),
  capacity_available_kg: z.number().int().min(0).max(1000),
  price_expect: z.number().min(0, "Le prix ne peut pas être négatif").optional(),
  notes: z.string().max(1000, "Notes limitées à 1000 caractères").optional(),
  is_anonymous: z.boolean().optional().default(false),
});

export const createTripSchema = baseTripSchema.refine(
  (data) => data.capacity_available_kg <= data.capacity_kg,
  {
    message: "La capacité disponible ne peut pas dépasser la capacité totale",
    path: ["capacity_available_kg"],
  }
);

export const updateTripSchema = baseTripSchema.partial().extend({
  status: z.enum(["open", "closed"]).optional(),
});

export type CreateTripInput = z.infer<typeof createTripSchema>;
export type UpdateTripInput = z.infer<typeof updateTripSchema>;
