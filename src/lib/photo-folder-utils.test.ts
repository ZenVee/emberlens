import { describe, expect, it } from "vitest";

import {
  PROJECT_FOLDER_PREFIX,
  isManualFolderFilter,
  isProjectFolderFilter,
  projectFolderFilter,
  projectIdFromFolderFilter,
} from "./photo-folder-utils";

describe("photo-folder-utils", () => {
  it("builds and parses project folder filters", () => {
    const filter = projectFolderFilter("abc-123");
    expect(filter).toBe(`${PROJECT_FOLDER_PREFIX}abc-123`);
    expect(isProjectFolderFilter(filter)).toBe(true);
    expect(projectIdFromFolderFilter(filter)).toBe("abc-123");
  });

  it("treats all and unfiled as non-project filters", () => {
    expect(isProjectFolderFilter("all")).toBe(false);
    expect(isProjectFolderFilter("unfiled")).toBe(false);
  });

  it("identifies manual folder UUID filters", () => {
    const folderId = "550e8400-e29b-41d4-a716-446655440000";
    expect(isManualFolderFilter(folderId)).toBe(true);
    expect(isManualFolderFilter("all")).toBe(false);
    expect(isManualFolderFilter("unfiled")).toBe(false);
    expect(isManualFolderFilter(projectFolderFilter("abc"))).toBe(false);
  });
});
