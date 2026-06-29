import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { BookingField } from "@/components/admin/bookings/booking-edit-primitives";
import { AdminFormDialog } from "@/components/admin/admin-form-dialog";
import { AppSelect } from "@/components/app-select";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createProjectFormSchema, type CreateProjectFormValues } from "@/lib/schemas/project-form";

type CreateProjectDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCategory: string;
  projectCategoryOptions: { value: string; label: string }[];
  submitting: boolean;
  error: string | null;
  onSubmit: (values: CreateProjectFormValues) => Promise<void>;
};

export function CreateProjectDialog({
  open,
  onOpenChange,
  defaultCategory,
  projectCategoryOptions,
  submitting,
  error,
  onSubmit,
}: CreateProjectDialogProps) {
  const form = useForm<CreateProjectFormValues>({
    resolver: zodResolver(createProjectFormSchema),
    defaultValues: {
      title: "",
      client: "",
      description: "",
      category: defaultCategory,
      shoot_date: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        title: "",
        client: "",
        description: "",
        category: defaultCategory,
        shoot_date: "",
      });
    }
  }, [open, defaultCategory, form]);

  return (
    <AdminFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="New project"
      submitLabel="Create"
      submitting={submitting}
      error={error}
      onSubmit={form.handleSubmit((values) => onSubmit(values))}
    >
      <Form {...form}>
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <BookingField label="Title">
              <FormItem className="space-y-0">
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            </BookingField>
          )}
        />
        <FormField
          control={form.control}
          name="client"
          render={({ field }) => (
            <BookingField label="Client">
              <FormItem className="space-y-0">
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            </BookingField>
          )}
        />
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <BookingField label="Category">
              <FormItem className="space-y-0">
                <FormControl>
                  <AppSelect
                    value={field.value}
                    onValueChange={field.onChange}
                    options={projectCategoryOptions}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </BookingField>
          )}
        />
        <FormField
          control={form.control}
          name="shoot_date"
          render={({ field }) => (
            <BookingField label="Shoot date">
              <FormItem className="space-y-0">
                <FormControl>
                  <Input {...field} type="date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </BookingField>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <BookingField label="Description">
              <FormItem className="space-y-0">
                <FormControl>
                  <Textarea {...field} rows={3} />
                </FormControl>
                <FormMessage />
              </FormItem>
            </BookingField>
          )}
        />
      </Form>
    </AdminFormDialog>
  );
}
