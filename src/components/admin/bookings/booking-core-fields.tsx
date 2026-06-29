import type { Control, FieldPath, FieldValues } from "react-hook-form";

import { AppSelect } from "@/components/app-select";
import { BookingDateTimePicker } from "@/components/booking-datetime-picker";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type SelectOption = { value: string; label: string };

type BookingCoreFieldsProps<T extends FieldValues> = {
  control: Control<T>;
  sessionTypeOptions: SelectOption[];
  datetimeId?: string;
  fullWidthFields?: boolean;
};

export function BookingCoreFields<T extends FieldValues>({
  control,
  sessionTypeOptions,
  datetimeId = "booking-datetime",
  fullWidthFields = false,
}: BookingCoreFieldsProps<T>) {
  const spanClass = fullWidthFields ? "sm:col-span-2" : undefined;
  return (
    <>
      <FormField
        control={control}
        name={"client_name" as FieldPath<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Client name</FormLabel>
            <FormControl>
              <Input {...field} autoComplete="name" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={"phone_number" as FieldPath<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Phone number</FormLabel>
            <FormControl>
              <Input {...field} type="tel" placeholder="(555) 123-4567" autoComplete="tel" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={"session_type" as FieldPath<T>}
        render={({ field }) => (
          <FormItem className={spanClass}>
            <FormLabel>Session type</FormLabel>
            <FormControl>
              <AppSelect
                value={field.value}
                onValueChange={field.onChange}
                options={sessionTypeOptions}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={"shoot_at" as FieldPath<T>}
        render={({ field }) => (
          <FormItem className={spanClass}>
            <FormLabel>Date & time</FormLabel>
            <FormControl>
              <BookingDateTimePicker
                id={datetimeId}
                value={field.value}
                onChange={field.onChange}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={"notes" as FieldPath<T>}
        render={({ field }) => (
          <FormItem className={spanClass}>
            <FormLabel>Notes</FormLabel>
            <FormControl>
              <Textarea {...field} rows={3} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
