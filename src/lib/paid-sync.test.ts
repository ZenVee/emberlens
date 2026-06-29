import { describe, expect, it, vi } from "vitest";

import { mergePaidOnLink, syncBookingPaidToProject, syncProjectPaidToBookings } from "./paid-sync";

describe("mergePaidOnLink", () => {
  it("prefers project paid date when both are set", () => {
    expect(mergePaidOnLink("2025-01-01T00:00:00.000Z", "2025-02-01T00:00:00.000Z")).toBe(
      "2025-02-01T00:00:00.000Z",
    );
  });

  it("returns booking date when project is null", () => {
    expect(mergePaidOnLink("2025-01-01T00:00:00.000Z", null)).toBe("2025-01-01T00:00:00.000Z");
  });

  it("returns project date when booking is null", () => {
    expect(mergePaidOnLink(null, "2025-02-01T00:00:00.000Z")).toBe("2025-02-01T00:00:00.000Z");
  });

  it("returns null when both are null", () => {
    expect(mergePaidOnLink(null, null)).toBeNull();
  });
});

describe("syncBookingPaidToProject", () => {
  it("updates project paid status and clears watermark when unpaid", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ update });
    const supabase = { from } as never;

    const result = await syncBookingPaidToProject(supabase, "project-1", null);

    expect(result).toEqual({ error: null });

    expect(from).toHaveBeenCalledWith("projects");
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        client_paid_at: null,
        public_watermarked: false,
      }),
    );
    expect(eq).toHaveBeenCalledWith("id", "project-1");
  });

  it("returns error when update fails", async () => {
    const eq = vi.fn().mockResolvedValue({ error: { message: "DB error" } });
    const update = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ update });
    const supabase = { from } as never;

    const result = await syncBookingPaidToProject(supabase, "project-1", null);

    expect(result).toEqual({ error: "DB error" });
  });

  it("does not clear watermark when client is paid", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ update });
    const supabase = { from } as never;
    const paidAt = "2025-03-01T12:00:00.000Z";

    const result = await syncBookingPaidToProject(supabase, "project-1", paidAt);

    expect(result).toEqual({ error: null });

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        client_paid_at: paidAt,
      }),
    );
    expect(update).not.toHaveBeenCalledWith(expect.objectContaining({ public_watermarked: false }));
  });
});

describe("syncProjectPaidToBookings", () => {
  it("updates linked bookings for the project", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ update });
    const supabase = { from } as never;
    const paidAt = "2025-03-01T12:00:00.000Z";

    const result = await syncProjectPaidToBookings(supabase, "project-1", paidAt);

    expect(result).toEqual({ error: null });

    expect(from).toHaveBeenCalledWith("bookings");
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        client_paid_at: paidAt,
      }),
    );
    expect(eq).toHaveBeenCalledWith("project_id", "project-1");
  });
});
