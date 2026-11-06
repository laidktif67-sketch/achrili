import { z } from "zod";

export const productRequestInputSchema = z.object({
  productName: z.string().trim().min(2).max(160),
  quantity: z.number().int().positive().max(10000),
  notes: z.string().trim().max(2000).optional()
});

export type ProductRequestInput = z.infer<typeof productRequestInputSchema>;
