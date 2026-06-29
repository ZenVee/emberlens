import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";

import { useAdminProjects, useAdminSiteSettings } from "@/lib/admin-queries";
import {
  buildProjectDraftFromBooking,
  NO_PROJECT,
  parseShootDisplayParts,
  toBookingEditorFields,
  type BookingForm,
  type CreateProjectForm,
} from "@/lib/booking-form";
import type { BookingStatus, DbBooking } from "@/lib/bookings-types";
import { categorySelectOptions, DEFAULT_SESSION_TYPES } from "@/lib/categories";
import type { PhotoCategory } from "@/lib/media-types";
import { mergePaidOnLink } from "@/lib/paid-sync";
import { useCreateProjectMutation } from "@/lib/mutations/projects";
import {
  useDeleteBookingMutation,
  useUpdateBookingMutation,
  useUpdateBookingStatusMutation,
} from "@/lib/mutations/bookings";
import { mutationErrorMessage } from "@/lib/mutations/shared";
import {
  bookingEditorFieldsSchema,
  type BookingEditorFieldsValues,
} from "@/lib/schemas/booking-form";
import type { CreateProjectFormValues } from "@/lib/schemas/project-form";
import { useAutoSave } from "@/hooks/use-auto-save";

export function useBookingEditor(initial: DbBooking) {
  const navigate = useNavigate();
  const { data: settings } = useAdminSiteSettings();
  const { data: projects = [] } = useAdminProjects();
  const updateMutation = useUpdateBookingMutation();
  const updateStatusMutation = useUpdateBookingStatusMutation();
  const deleteMutation = useDeleteBookingMutation();
  const createProjectMutation = useCreateProjectMutation();

  const fieldsForm = useForm<BookingEditorFieldsValues>({
    resolver: zodResolver(bookingEditorFieldsSchema),
    defaultValues: toBookingEditorFields(initial),
    mode: "onChange",
  });

  const [bookingStatus, setBookingStatus] = useState<BookingStatus>(initial.status);
  const saveGenerationRef = useRef(0);
  const [meta, setMeta] = useState({
    created_at: initial.created_at,
    updated_at: initial.updated_at,
  });
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [projectDraft, setProjectDraft] = useState<CreateProjectForm>(() =>
    buildProjectDraftFromBooking(
      { ...toBookingEditorFields(initial), status: initial.status },
      settings?.project_categories[0],
    ),
  );
  const [error, setError] = useState<string | null>(null);

  const watched = fieldsForm.watch();
  const projectId = watched.project_id;

  const projectCategoryOptions = useMemo(
    () => categorySelectOptions(settings?.project_categories ?? [], projectDraft.category),
    [settings?.project_categories, projectDraft.category],
  );

  const sessionTypes = useMemo(
    () => settings?.session_types ?? [...DEFAULT_SESSION_TYPES],
    [settings?.session_types],
  );
  const sessionTypeOptions = useMemo(
    () => categorySelectOptions(sessionTypes, watched.session_type),
    [sessionTypes, watched.session_type],
  );

  const projectOptions = useMemo(() => {
    const options = [{ value: NO_PROJECT, label: "No project linked" }];
    for (const project of projects) {
      options.push({ value: project.id, label: project.title });
    }
    if (projectId && !projects.some((project) => project.id === projectId)) {
      options.push({ value: projectId, label: "Linked project (unavailable)" });
    }
    return options;
  }, [projects, projectId]);

  const linkedProject = projects.find((project) => project.id === projectId);
  const shootParts = useMemo(() => parseShootDisplayParts(watched.shoot_at), [watched.shoot_at]);

  useEffect(() => {
    if (!linkedProject) return;
    const current = fieldsForm.getValues("client_paid_at");
    const merged = mergePaidOnLink(current, linkedProject.client_paid_at);
    if (merged !== current) {
      fieldsForm.setValue("client_paid_at", merged);
    }
  }, [linkedProject, fieldsForm]);

  const saveState = useMemo<BookingForm>(
    () => ({ ...watched, status: bookingStatus }),
    [watched, bookingStatus],
  );

  const persistBooking = useCallback(
    async (next: BookingForm) => {
      const generation = saveGenerationRef.current;
      try {
        const booking = await updateMutation.mutateAsync({
          id: initial.id,
          ...next,
          status: next.status,
        });

        if (generation !== saveGenerationRef.current) {
          return { ok: true as const };
        }

        setBookingStatus(booking.status);
        setMeta({
          created_at: booking.created_at,
          updated_at: booking.updated_at,
        });
        return { ok: true as const };
      } catch (err) {
        if (generation !== saveGenerationRef.current) {
          return { ok: true as const };
        }
        return {
          ok: false as const,
          error: mutationErrorMessage(err, "Could not save booking."),
        };
      }
    },
    [initial.id, updateMutation],
  );

  const {
    status: saveStatus,
    error: saveError,
    syncBaseline,
    cancelPending,
  } = useAutoSave(saveState, persistBooking);

  async function handleStatusChange(status: BookingStatus) {
    const previous = bookingStatus;
    saveGenerationRef.current += 1;
    cancelPending();
    setBookingStatus(status);

    try {
      await updateStatusMutation.mutateAsync({ id: initial.id, status });
      syncBaseline({ ...fieldsForm.getValues(), status });
    } catch (err) {
      saveGenerationRef.current += 1;
      setBookingStatus(previous);
      setError(mutationErrorMessage(err, "Could not update status."));
    }
  }

  function openCreateProject() {
    setProjectDraft(
      buildProjectDraftFromBooking(
        { ...fieldsForm.getValues(), status: bookingStatus },
        settings?.project_categories[0],
      ),
    );
    setCreateError(null);
    setCreateOpen(true);
  }

  async function handleCreateProject(values: CreateProjectFormValues) {
    setCreateError(null);

    try {
      const project = await createProjectMutation.mutateAsync({
        title: values.title,
        client: values.client,
        description: values.description,
        category: values.category as PhotoCategory,
        shoot_date: values.shoot_date,
      });
      fieldsForm.setValue("project_id", project.id);
      setCreateOpen(false);
    } catch (err) {
      setCreateError(mutationErrorMessage(err, "Could not create project."));
    }
  }

  async function confirmDelete() {
    setError(null);
    try {
      await deleteMutation.mutateAsync(initial.id);
      void navigate({ to: "/admin/bookings" });
    } catch (err) {
      setError(mutationErrorMessage(err, "Could not delete booking."));
    }
  }

  function setProjectId(value: string) {
    const nextProjectId = value === NO_PROJECT ? null : value;
    const linked = projects.find((project) => project.id === nextProjectId);
    fieldsForm.setValue("project_id", nextProjectId);
    if (nextProjectId) {
      fieldsForm.setValue(
        "client_paid_at",
        mergePaidOnLink(fieldsForm.getValues("client_paid_at"), linked?.client_paid_at ?? null),
      );
    }
  }

  return {
    initial,
    fieldsForm,
    bookingStatus,
    meta,
    error,
    saveStatus,
    saveError,
    sessionTypeOptions,
    projectOptions,
    linkedProject,
    shootParts,
    deleteOpen,
    setDeleteOpen,
    deleting: deleteMutation.isPending,
    createOpen,
    setCreateOpen,
    creating: createProjectMutation.isPending,
    createError,
    projectDraft,
    projectCategoryOptions,
    handleStatusChange,
    openCreateProject,
    handleCreateProject,
    confirmDelete,
    setProjectId,
  };
}

export type BookingEditorState = ReturnType<typeof useBookingEditor>;
export type BookingFieldsForm = UseFormReturn<BookingEditorFieldsValues>;
