import { z } from "zod";

import { parseShootAt } from "../booking-validation";

function shootAtField() {
  return z.string().superRefine((value, ctx) => {
    const result = parseShootAt(value);
    if ("error" in result) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: result.error });
    }
  });
}

export const bookingCoreFormSchema = z.object({
  client_name: z.string().trim().min(1, "Name is required."),
  session_type: z.string().trim().min(1, "Session type is required."),
  shoot_at: shootAtField(),
  phone_number: z.string(),
  notes: z.string(),
});

export const bookingEditorFieldsSchema = bookingCoreFormSchema.extend({
  project_id: z.string().nullable(),
  client_paid_at: z.string().nullable(),
});

export type BookingCoreFormValues = z.infer<typeof bookingCoreFormSchema>;
export type BookingEditorFieldsValues = z.infer<typeof bookingEditorFieldsSchema>;

export function emptyBookingCoreForm(defaultSessionType: string): BookingCoreFormValues {
  return {
    client_name: "",
    phone_number: "",
    session_type: defaultSessionType,
    shoot_at: "",
    notes: "",
  };
}
