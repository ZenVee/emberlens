import { describe, expect, it } from "vitest";

import { siteSettingsPatchSchema, uploadHeroImageSchema } from "./site-settings";

describe("siteSettingsPatchSchema", () => {
  it("accepts a partial patch", () => {
    expect(siteSettingsPatchSchema.parse({ studio_name: "Ember Lens" })).toMatchObject({
      studio_name: "Ember Lens",
    });
  });

  it("rejects empty patch", () => {
    expect(() => siteSettingsPatchSchema.parse({})).toThrow(/At least one setting/);
  });
});

describe("uploadHeroImageSchema", () => {
  it("requires file fields", () => {
    expect(() =>
      uploadHeroImageSchema.parse({ mimeType: "image/png", filename: "hero.png" }),
    ).toThrow();
  });
});
