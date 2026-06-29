import { describe, expect, it } from "vitest";

import { bulkDeletePhotosSchema, createProjectServerSchema, uploadPhotoSchema } from "./media";

describe("uploadPhotoSchema", () => {
  it("accepts valid upload payload", () => {
    expect(
      uploadPhotoSchema.parse({
        fileBase64: "abc",
        mimeType: "image/jpeg",
        filename: "photo.jpg",
        title: "Sunset",
        category: "Portrait",
      }),
    ).toMatchObject({ title: "Sunset" });
  });

  it("rejects empty title", () => {
    expect(() =>
      uploadPhotoSchema.parse({
        fileBase64: "abc",
        mimeType: "image/jpeg",
        filename: "photo.jpg",
        title: "  ",
        category: "Portrait",
      }),
    ).toThrow();
  });
});

describe("bulkDeletePhotosSchema", () => {
  it("requires at least one id", () => {
    expect(() => bulkDeletePhotosSchema.parse({ ids: [] })).toThrow();
  });
});

describe("createProjectServerSchema", () => {
  it("trims title", () => {
    expect(createProjectServerSchema.parse({ title: "  Wedding  " })).toMatchObject({
      title: "Wedding",
    });
  });
});
