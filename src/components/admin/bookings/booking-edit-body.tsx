import { Link } from "@tanstack/react-router";
import {
  CalendarDays,
  Check,
  Download,
  ExternalLink,
  FolderOpen,
  Plus,
  StickyNote,
  Trash2,
  User,
} from "lucide-react";

import {
  BookingField,
  BookingPanel,
  PaidToggle,
} from "@/components/admin/bookings/booking-edit-primitives";
import { AppSelect } from "@/components/app-select";
import { BookingDateTimePicker } from "@/components/booking-datetime-picker";
import { SaveStatus } from "@/components/save-status";
import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { BookingEditorState } from "@/hooks/admin/use-booking-editor";
import { NO_PROJECT } from "@/lib/booking-form";

type BookingEditBodyProps = BookingEditorState;

export function BookingEditBody(editor: BookingEditBodyProps) {
  const {
    fieldsForm,
    sessionTypeOptions,
    projectOptions,
    linkedProject,
    saveStatus,
    saveError,
    meta,
    setDeleteOpen,
    setProjectId,
    openCreateProject,
  } = editor;

  const projectId = fieldsForm.watch("project_id");
  const clientPaidAt = fieldsForm.watch("client_paid_at");

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <div className="space-y-6">
        <BookingPanel icon={User} title="Client & session">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={fieldsForm.control}
              name="client_name"
              render={({ field }) => (
                <BookingField label="Client name">
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
              control={fieldsForm.control}
              name="phone_number"
              render={({ field }) => (
                <BookingField label="Phone number">
                  <FormItem className="space-y-0">
                    <FormControl>
                      <Input {...field} type="tel" placeholder="(555) 123-4567" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </BookingField>
              )}
            />
            <FormField
              control={fieldsForm.control}
              name="session_type"
              render={({ field }) => (
                <BookingField label="Session type" className="sm:col-span-2">
                  <FormItem className="space-y-0">
                    <FormControl>
                      <AppSelect
                        value={field.value}
                        onValueChange={field.onChange}
                        options={sessionTypeOptions}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </BookingField>
              )}
            />
          </div>
        </BookingPanel>

        <BookingPanel icon={CalendarDays} title="Shoot schedule">
          <FormField
            control={fieldsForm.control}
            name="shoot_at"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <BookingDateTimePicker
                    id="edit-datetime"
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </BookingPanel>

        <BookingPanel
          icon={StickyNote}
          title="Session notes"
          description="Brief, wardrobe, location ideas, follow-ups"
        >
          <FormField
            control={fieldsForm.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    {...field}
                    rows={10}
                    placeholder="Tell the story of this shoot — vibe, references, special requests…"
                    className="min-h-[12rem] resize-y border-amber-950/20 bg-background/40 leading-relaxed focus-visible:border-ember/50"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </BookingPanel>
      </div>

      <div className="space-y-6">
        <BookingPanel icon={FolderOpen} title="Linked project">
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
                    {clientPaidAt ? " · Paid" : ""}
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
          <BookingField label="Project">
            <AppSelect
              value={projectId ?? NO_PROJECT}
              onValueChange={setProjectId}
              options={projectOptions}
            />
          </BookingField>
        </BookingPanel>

        <BookingPanel icon={Check} title="Payment">
          <PaidToggle
            checked={Boolean(clientPaidAt)}
            onChange={(paid) =>
              fieldsForm.setValue("client_paid_at", paid ? new Date().toISOString() : null)
            }
          />
          <p className="mt-3 text-xs text-muted-foreground">
            {projectId
              ? "Synced with the linked project gallery."
              : "Link a project to sync payment with the client gallery."}
          </p>
        </BookingPanel>

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
  );
}
