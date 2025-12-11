import { z } from "zod";

export const createParcelSchema = z.object({
  type: z.enum(["documents", "vetements", "electronique", "autre"], {
    errorMap: () => ({ message: "Type de colis invalide" }),
  }),
  weight_kg: z.number().min(0.1, "Le poids doit être au moins 0.1 kg").max(100, "Poids maximum : 100 kg"),
  size: z.enum(["S", "M", "L"], {
    errorMap: () => ({ message: "Taille invalide (S, M ou L)" }),
  }),
  from_country: z.string().min(1, "Pays de départ requis").max(100),
  from_city: z.string().min(1, "Ville de départ requise").max(100),
  to_country: z.string().min(1, "Pays d'arrivée requis").max(100),
  to_city: z.string().min(1, "Ville d'arrivée requise").max(100),
  deadline: z.string().refine((date) => {
    const deadlineDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return deadlineDate >= today;
  }, "La date limite doit être dans le futur"),
  description: z.string().max(2000, "Description limitée à 2000 caractères").optional(),
  photos: z.array(z.string().url()).max(5, "Maximum 5 photos").optional(),
  is_anonymous: z.boolean().optional().default(false),
});

export const updateParcelSchema = createParcelSchema.partial().extend({
  status: z.enum(["open", "closed"]).optional(),
});

export type CreateParcelInput = z.infer<typeof createParcelSchema>;
export type UpdateParcelInput = z.infer<typeof updateParcelSchema>;
