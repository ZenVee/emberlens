import type { z } from "zod";

export function zodValidator<T extends z.ZodType>(schema: T) {
  return (data: unknown) => schema.parse(data);
}
