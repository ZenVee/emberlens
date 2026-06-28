import { createFileRoute, Link, notFound, useNavigate, useParams } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  CalendarDays,
  Camera,
  Check,
  CircleCheck,
  Clock,
  ExternalLink,
  FolderOpen,
  Loader2,
  Download,
  Phone,
  Plus,
  StickyNote,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { useAdminPageMeta } from "@/components/admin-page-meta";
import { AdminLoading } from "@/components/admin-loading";
import { AppSelect } from "@/components/app-select";
import { BookingDateTimePicker } from "@/components/booking-datetime-picker";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { SaveStatus } from "@/components/save-status";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAdminBooking, useAdminProjects, useAdminSiteSettings } from "@/lib/admin-queries";
import { deleteBooking, updateBooking, updateBookingStatus } from "@/lib/bookings";
import {
  bookingDateKey,
  formatBookingDateTime,
  parseDatetimeLocalValue,
  toDatetimeLocalValue,
  type BookingStatus,
  type DbBooking,
} from "@/lib/bookings-types";
import { categorySelectOptions, DEFAULT_SESSION_TYPES } from "@/lib/categories";
import { createProject } from "@/lib/media";
import type { PhotoCategory } from "@/lib/media-types";
import { mergePaidOnLink } from "@/lib/paid-sync";
import { patchBookingInCache, setBookingInCache } from "@/lib/booking-cache";
import { adminBookingsQueryKey, adminBookingQueryKey, adminProjectQueryKey, adminProjectsQueryKey } from "@/lib/query-keys";
import { useAutoSave } from "@/hooks/use-auto-save";
import { cn } from "@/lib/utils";

const NO_PROJECT = "__none__";

type CreateProjectForm = {
  title: string;
  client: string;
  description: string;
  category: string;
  shoot_date: string;
};

type BookingForm = {
  client_name: string;
  phone_number: string;
  session_type: string;
  shoot_at: string;
  notes: string;
  status: BookingStatus;
  project_id: string | null;
  client_paid_at: string | null;
};

function toBookingForm(booking: DbBooking): BookingForm {
  return {
    client_name: booking.client_name,
    phone_number: booking.phone_number ?? "",
    session_type: booking.session_type,
    shoot_at: toDatetimeLocalValue(booking.shoot_at),
    notes: booking.notes ?? "",
    status: booking.status,
    project_id: booking.project_id,
    client_paid_at: booking.client_paid_at,
  };
}

export const Route = createFileRoute("/admin/bookings/$bookingId")({
  head: () => ({ meta: [{ title: "Edit Booking — Ember Lens Studio" }] }),
  component: AdminBookingEdit,
  notFoundComponent: BookingNotFound,
});

function BookingNotFound() {
  useAdminPageMeta({ title: "Booking not found" });
  return (
    <Link to="/admin/bookings" className="text-sm text-ember hover:underline">
      Back to bookings
    </Link>
  );
}

function AdminBookingEdit() {
  const { bookingId } = useParams({ from: "/admin/bookings/$bookingId" });
  const { data: booking, isPending, isError } = useAdminBooking(bookingId);

  useAdminPageMeta({
    title: booking?.client_name ?? "Edit booking",
    subtitle: booking ? formatBookingDateTime(booking.shoot_at) : "Booking details",
  });

  if (!isPending && (isError || booking === null)) {
    throw notFound();
  }

  if (isPending || !booking || booking.id !== bookingId) {
    return (
      <>
        <Link
          to="/admin/bookings"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to bookings
        </Link>
        <AdminLoading variant="form" />
      </>
    );
  }

  return <BookingEditForm key={bookingId} initial={booking} />;
}

function BookingEditForm({ initial }: { initial: DbBooking }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: settings } = useAdminSiteSettings();
  const { data: projects = [] } = useAdminProjects();
  const updateFn = useServerFn(updateBooking);
  const updateStatusFn = useServerFn(updateBookingStatus);
  const deleteFn = useServerFn(deleteBooking);
  const createProjectFn = useServerFn(createProject);

  const [form, setForm] = useState(() => toBookingForm(initial));
  const [bookingStatus, setBookingStatus] = useState<BookingStatus>(initial.status);
  const saveGenerationRef = useRef(0);
  const [meta, setMeta] = useState({
    created_at: initial.created_at,
    updated_at: initial.updated_at,
  });
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [projectForm, setProjectForm] = useState<CreateProjectForm>(() =>
    buildProjectDraftFromBooking(toBookingForm(initial), settings?.project_categories[0]),
  );
  const [error, setError] = useState<string | null>(null);

  const projectCategoryOptions = useMemo(
    () => categorySelectOptions(settings?.project_categories ?? [], projectForm.category),
    [settings?.project_categories, projectForm.category],
  );

  const sessionTypes = settings?.session_types ?? [...DEFAULT_SESSION_TYPES];
  const sessionTypeOptions = useMemo(
    () => categorySelectOptions(sessionTypes, form.session_type),
    [sessionTypes, form.session_type],
  );
  const projectOptions = useMemo(() => {
    const options = [{ value: NO_PROJECT, label: "No project linked" }];
    for (const project of projects) {
      options.push({ value: project.id, label: project.title });
    }
    if (form.project_id && !projects.some((project) => project.id === form.project_id)) {
      options.push({ value: form.project_id, label: "Linked project (unavailable)" });
    }
    return options;
  }, [projects, form.project_id]);
  const linkedProject = projects.find((project) => project.id === form.project_id);

  useEffect(() => {
    if (!linkedProject) return;
    const merged = mergePaidOnLink(form.client_paid_at, linkedProject.client_paid_at);
    if (merged !== form.client_paid_at) {
      setForm((prev) => ({ ...prev, client_paid_at: merged }));
    }
  }, [linkedProject?.id, linkedProject?.client_paid_at]);

  const shootParts = useMemo(() => {
    const parsed = parseDatetimeLocalValue(form.shoot_at);
    if (!parsed) return null;
    return {
      weekday: parsed.date.toLocaleDateString("en-US", { weekday: "long" }),
      month: parsed.date.toLocaleDateString("en-US", { month: "short" }),
      day: parsed.date.getDate(),
      year: parsed.date.getFullYear(),
      time: new Date(
        parsed.date.getFullYear(),
        parsed.date.getMonth(),
        parsed.date.getDate(),
        parsed.hours,
        parsed.minutes,
      ).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    };
  }, [form.shoot_at]);

  function syncCaches(updated: DbBooking) {
    setBookingInCache(queryClient, updated);

    if (updated.project_id) {
      queryClient.setQueryData(adminProjectsQueryKey, (prev) =>
        prev?.map((project) =>
          project.id === updated.project_id
            ? { ...project, client_paid_at: updated.client_paid_at }
            : project,
        ),
      );
      queryClient.setQueryData(adminProjectQueryKey(updated.project_id), (prev) =>
        prev
          ? { ...prev, project: { ...prev.project, client_paid_at: updated.client_paid_at } }
          : prev,
      );
    }
  }

  const saveState = useMemo<BookingForm>(
    () => ({ ...form, status: bookingStatus }),
    [form, bookingStatus],
  );

  const persistBooking = useCallback(
    async (next: BookingForm) => {
      const generation = saveGenerationRef.current;
      const result = await updateFn({
        data: {
          id: initial.id,
          ...next,
          status: next.status,
        },
      });

      if (generation !== saveGenerationRef.current) {
        return { ok: true as const };
      }

      if (result.error || !result.booking) {
        return { ok: false as const, error: result.error ?? "Could not save booking." };
      }

      syncCaches(result.booking);
      setBookingStatus(result.booking.status);
      setMeta({
        created_at: result.booking.created_at,
        updated_at: result.booking.updated_at,
      });
      return { ok: true as const };
    },
    [initial.id, updateFn, queryClient],
  );

  const { status: saveStatus, error: saveError, syncBaseline, cancelPending } =
    useAutoSave(saveState, persistBooking);

  async function handleStatusChange(status: BookingStatus) {
    const previous = bookingStatus;
    saveGenerationRef.current += 1;
    cancelPending();
    setBookingStatus(status);
    setForm((prev) => ({ ...prev, status }));

    const result = await updateStatusFn({ data: { id: initial.id, status } });
    if (result.error) {
      saveGenerationRef.current += 1;
      setBookingStatus(previous);
      setForm((prev) => ({ ...prev, status: previous }));
      setError(result.error);
      return;
    }

    patchBookingInCache(queryClient, initial.id, { status });
    syncBaseline({ ...form, status });
  }

  function openCreateProject() {
    setProjectForm(buildProjectDraftFromBooking(form, settings?.project_categories[0]));
    setCreateError(null);
    setCreateOpen(true);
  }

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);

    const result = await createProjectFn({
      data: {
        title: projectForm.title,
        client: projectForm.client,
        description: projectForm.description,
        category: projectForm.category as PhotoCategory,
        shoot_date: projectForm.shoot_date,
      },
    });

    setCreating(false);
    if (result.error || !result.project) {
      setCreateError(result.error ?? "Could not create project.");
      return;
    }

    queryClient.setQueryData(adminProjectsQueryKey, (prev) => [
      { ...result.project!, photoCount: 0, coverUrl: null },
      ...(prev ?? []),
    ]);
    setForm((prev) => ({ ...prev, project_id: result.project!.id }));
    setCreateOpen(false);
  }

  async function confirmDelete() {
    setDeleting(true);
    setError(null);

    const result = await deleteFn({ data: { id: initial.id } });
    setDeleting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    queryClient.setQueryData(adminBookingsQueryKey, (prev: DbBooking[] | undefined) =>
      (prev ?? []).filter((item) => item.id !== initial.id),
    );
    queryClient.removeQueries({ queryKey: adminBookingQueryKey(initial.id) });
    void navigate({ to: "/admin/bookings" });
  }

  return (
    <div>
      <Link
        to="/admin/bookings"
        className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> All bookings
      </Link>

      {(error || saveError) && (
        <div className="mb-5 space-y-2">
          {(error || saveError) && (
            <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error ?? saveError}
            </p>
          )}
        </div>
      )}

      {/* Hero */}
      <header className="relative overflow-hidden rounded-3xl border border-ember/25 bg-gradient-night shadow-card">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-ember/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/4 h-40 w-40 rounded-full bg-blush/10 blur-3xl" />

        <div className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="space-y-4">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-ember">Session booking</p>
            <Input
              value={form.client_name}
              onChange={(e) => setForm((prev) => ({ ...prev, client_name: e.target.value }))}
              placeholder="Client name"
              className="h-auto border-0 bg-transparent p-0 font-display text-3xl font-medium shadow-none placeholder:text-muted-foreground/50 focus-visible:ring-0 sm:text-4xl"
            />
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/40 px-3 py-1">
                <Camera className="h-3.5 w-3.5 text-ember" />
                {form.session_type || "Session type"}
              </span>
              {form.phone_number && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/40 px-3 py-1">
                  <Phone className="h-3.5 w-3.5 text-ember" />
                  {form.phone_number}
                </span>
              )}
            </div>
          </div>

          {shootParts ? (
            <div className="flex items-stretch gap-3 sm:gap-4">
              <div className="flex min-w-[5.5rem] flex-col items-center justify-center rounded-2xl border border-ember/30 bg-card/60 px-4 py-3 text-center shadow-glow">
                <span className="text-xs font-medium uppercase tracking-wider text-ember">
                  {shootParts.month}
                </span>
                <span className="font-display text-4xl leading-none">{shootParts.day}</span>
                <span className="mt-1 text-xs text-muted-foreground">{shootParts.year}</span>
              </div>
              <div className="flex flex-col justify-center gap-1">
                <p className="font-medium">{shootParts.weekday}</p>
                <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 text-ember" />
                  {shootParts.time}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-2xl border border-dashed border-ember/30 bg-card/30 px-5 py-4 text-sm text-muted-foreground">
              <CalendarDays className="h-5 w-5 text-ember" />
              Pick a shoot date below
            </div>
          )}
        </div>

        <div className="relative border-t border-ember/15 px-6 py-4 sm:px-8">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Booking status
          </p>
          <StatusPicker value={bookingStatus} onChange={handleStatusChange} />
        </div>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        {/* Main column */}
        <div className="space-y-6">
          <Panel icon={User} title="Client & session">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Client name">
                <Input
                  value={form.client_name}
                  onChange={(e) => setForm((prev) => ({ ...prev, client_name: e.target.value }))}
                />
              </Field>
              <Field label="Phone number">
                <Input
                  type="tel"
                  value={form.phone_number}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone_number: e.target.value }))}
                  placeholder="(555) 123-4567"
                />
              </Field>
              <Field label="Session type" className="sm:col-span-2">
                <AppSelect
                  value={form.session_type}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, session_type: value }))}
                  options={sessionTypeOptions}
                />
              </Field>
            </div>
          </Panel>

          <Panel icon={CalendarDays} title="Shoot schedule">
            <BookingDateTimePicker
              id="edit-datetime"
              value={form.shoot_at}
              onChange={(shoot_at) => setForm((prev) => ({ ...prev, shoot_at }))}
            />
          </Panel>

          <Panel icon={StickyNote} title="Session notes" description="Brief, wardrobe, location ideas, follow-ups">
            <Textarea
              rows={10}
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Tell the story of this shoot — vibe, references, special requests…"
              className="min-h-[12rem] resize-y border-amber-950/20 bg-background/40 leading-relaxed focus-visible:border-ember/50"
            />
          </Panel>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Panel icon={FolderOpen} title="Linked project">
            {linkedProject ? (
              <Link
                to="/admin/projects/$projectId"
                params={{ projectId: linkedProject.id }}
                className="group mb-4 block overflow-hidden rounded-xl border border-ember/20 bg-ember/5 transition-colors hover:border-ember/40 hover:bg-ember/10"
              >
                {linkedProject.coverUrl ? (
                  <img
                    src={linkedProject.coverUrl}
                    alt=""
                    className="aspect-[16/9] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="flex aspect-[16/9] items-center justify-center bg-secondary/40">
                    <FolderOpen className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                )}
                <div className="flex items-center justify-between gap-2 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{linkedProject.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {linkedProject.client ?? "No client"} · Open project
                      {form.client_paid_at ? " · Paid" : ""}
                    </p>
                  </div>
                  <ExternalLink className="h-4 w-4 shrink-0 text-ember opacity-70 group-hover:opacity-100" />
                </div>
              </Link>
            ) : (
              <div className="mb-4 rounded-xl border border-dashed border-border/70 bg-background/30 px-4 py-8 text-center">
                <FolderOpen className="mx-auto h-8 w-8 text-muted-foreground/40" />
                <p className="mt-2 text-sm text-muted-foreground">No project linked yet</p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  Link an existing project or create one from this booking
                </p>
                <Button
                  type="button"
                  size="sm"
                  onClick={openCreateProject}
                  className="mt-4 rounded-full bg-gradient-ember shadow-glow hover:opacity-90"
                >
                  <Plus className="h-4 w-4" /> Create project
                </Button>
              </div>
            )}
            {linkedProject?.download_link && (
              <a
                href={linkedProject.download_link}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-4 flex items-center gap-3 rounded-xl border border-border/60 bg-background/50 px-4 py-3 text-sm transition-colors hover:border-ember/40 hover:bg-ember/5"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-ember/15 text-ember">
                  <Download className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">Download deliverables</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {linkedProject.download_link}
                  </span>
                </span>
                <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
              </a>
            )}
            <Field label="Project">
              <AppSelect
                value={form.project_id ?? NO_PROJECT}
                onValueChange={(value) => {
                  const projectId = value === NO_PROJECT ? null : value;
                  const linked = projects.find((project) => project.id === projectId);
                  setForm((prev) => ({
                    ...prev,
                    project_id: projectId,
                    client_paid_at: projectId
                      ? mergePaidOnLink(prev.client_paid_at, linked?.client_paid_at ?? null)
                      : prev.client_paid_at,
                  }));
                }}
                options={projectOptions}
              />
            </Field>
          </Panel>

          <Panel icon={Check} title="Payment">
            <PaidToggle
              checked={Boolean(form.client_paid_at)}
              onChange={(paid) =>
                setForm((prev) => ({
                  ...prev,
                  client_paid_at: paid ? new Date().toISOString() : null,
                }))
              }
            />
            <p className="mt-3 text-xs text-muted-foreground">
              {form.project_id
                ? "Synced with the linked project gallery."
                : "Link a project to sync payment with the client gallery."}
            </p>
          </Panel>

          <aside className="rounded-2xl border border-border/60 bg-card/50 p-5 text-xs text-muted-foreground">
            <div className="mb-4 flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-foreground">Auto-save</span>
              <SaveStatus status={saveStatus} error={saveError} />
            </div>
            <p>
              <span className="font-medium text-foreground">Created</span>
              <br />
              {new Date(meta.created_at).toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
            <p className="mt-4">
              <span className="font-medium text-foreground">Last updated</span>
              <br />
              {new Date(meta.updated_at).toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          </aside>

          <Button
            type="button"
            variant="outline"
            onClick={() => setDeleteOpen(true)}
            className="w-full rounded-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" /> Delete booking
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteOpen(false);
        }}
        title="Delete booking"
        description={`Delete the booking for ${form.client_name} on ${formatBookingDateTime(form.shoot_at || initial.shoot_at)}?`}
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={confirmDelete}
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="rounded-2xl border-border bg-card sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Create project</DialogTitle>
            <DialogDescription>
              Start a deliverable gallery from this booking. It will be linked automatically.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={(e) => void handleCreateProject(e)} className="space-y-4">
            {createError && (
              <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {createError}
              </p>
            )}

            <Field label="Title">
              <Input
                required
                value={projectForm.title}
                onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
              />
            </Field>
            <Field label="Client">
              <Input
                value={projectForm.client}
                onChange={(e) => setProjectForm({ ...projectForm, client: e.target.value })}
              />
            </Field>
            <Field label="Category">
              <AppSelect
                value={projectForm.category}
                onValueChange={(value) => setProjectForm({ ...projectForm, category: value })}
                options={projectCategoryOptions}
              />
            </Field>
            <Field label="Shoot date">
              <Input
                type="date"
                value={projectForm.shoot_date}
                onChange={(e) => setProjectForm({ ...projectForm, shoot_date: e.target.value })}
              />
            </Field>
            <Field label="Description">
              <Textarea
                rows={3}
                value={projectForm.description}
                onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
              />
            </Field>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={creating}
                className="bg-gradient-ember shadow-glow hover:opacity-90"
              >
                {creating ? (
                  <>
                    <Loader2 className="animate-spin" /> Creating…
                  </>
                ) : (
                  "Create & link"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PaidToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-border/60 bg-background/50 px-4 py-3">
      <div>
        <p className="text-sm font-medium">Client paid</p>
        <p className="text-xs text-muted-foreground">
          Remove watermarks from the client gallery link
        </p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs",
          checked ? "bg-emerald-500/15 text-emerald-400" : "bg-secondary text-muted-foreground",
        )}
      >
        <Check className="h-3.5 w-3.5" />
        {checked ? "Paid" : "Unpaid"}
      </button>
    </label>
  );
}

function buildProjectDraftFromBooking(
  booking: BookingForm,
  defaultCategory?: string,
): CreateProjectForm {
  const parsed = parseDatetimeLocalValue(booking.shoot_at);
  const title = [booking.client_name, booking.session_type].filter(Boolean).join(" — ");

  return {
    title,
    client: booking.client_name,
    description: booking.notes,
    category: defaultCategory ?? "Portrait",
    shoot_date: parsed ? bookingDateKey(parsed.date) : "",
  };
}

function StatusPicker({
  value,
  onChange,
}: {
  value: BookingStatus;
  onChange: (status: BookingStatus) => void;
}) {
  const options: {
    status: BookingStatus;
    label: string;
    icon: typeof Check;
    active: string;
    idle: string;
  }[] = [
    {
      status: "Pending",
      label: "Pending",
      icon: Clock,
      active: "border-blush/60 bg-blush/20 text-blush shadow-[0_0_20px_oklch(0.82_0.08_20/0.2)]",
      idle: "border-border/60 bg-card/40 text-muted-foreground hover:border-blush/40 hover:bg-blush/10 hover:text-blush",
    },
    {
      status: "Confirmed",
      label: "Confirmed",
      icon: Check,
      active: "border-ember/60 bg-ember/20 text-ember shadow-glow",
      idle: "border-border/60 bg-card/40 text-muted-foreground hover:border-ember/40 hover:bg-ember/10 hover:text-ember",
    },
    {
      status: "Completed",
      label: "Completed",
      icon: CircleCheck,
      active: "border-emerald-500/50 bg-emerald-500/15 text-emerald-400 shadow-[0_0_20px_oklch(0.72_0.17_155/0.2)]",
      idle: "border-border/60 bg-card/40 text-muted-foreground hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-400",
    },
    {
      status: "Declined",
      label: "Declined",
      icon: X,
      active: "border-destructive/50 bg-destructive/15 text-destructive",
      idle: "border-border/60 bg-card/40 text-muted-foreground hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:max-w-lg">
      {options.map(({ status, label, icon: Icon, active, idle }) => {
        const selected = value === status;
        return (
          <button
            key={status}
            type="button"
            onClick={() => onChange(status)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-sm font-medium transition-all",
              selected ? active : idle,
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        );
      })}
    </div>
  );
}

function Panel({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof User;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-card sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-ember/15 text-ember">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <h2 className="font-display text-lg">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
