import { z } from "zod";

export const createProjectFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required."),
  client: z.string(),
  description: z.string(),
  category: z.string().trim().min(1, "Category is required."),
  shoot_date: z.string(),
});

export type CreateProjectFormValues = z.infer<typeof createProjectFormSchema>;
