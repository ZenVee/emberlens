import { z } from "zod";

import { BOOKING_STATUSES } from "../bookings-types";

export const createBookingSchema = z.object({
  client_name: z.string().trim().min(1).max(120),
  session_type: z.string().trim().min(1).max(80),
  shoot_at: z.string().trim().min(1).max(40),
  phone_number: z.string().trim().max(40).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const createAdminBookingSchema = createBookingSchema.extend({
  status: z.enum(BOOKING_STATUSES).optional(),
});

export const bookingIdSchema = z.object({
  id: z.string().min(1),
});

export const updateBookingStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(BOOKING_STATUSES),
});

export const updateBookingSchema = z.object({
  id: z.string().min(1),
  client_name: z.string(),
  session_type: z.string(),
  shoot_at: z.string(),
  phone_number: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(BOOKING_STATUSES),
  project_id: z.string().nullable().optional(),
  client_paid_at: z.string().nullable().optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type CreateAdminBookingInput = z.infer<typeof createAdminBookingSchema>;
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;
