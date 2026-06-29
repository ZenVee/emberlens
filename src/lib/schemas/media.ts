import { z } from "zod";

export const idSchema = z.object({
  id: z.string().min(1),
});

export const slugSchema = z.object({
  slug: z.string().min(1),
});

export const projectIdSchema = z.object({
  id: z.string().min(1),
});

export const uploadPhotoSchema = z.object({
  fileBase64: z.string().min(1),
  mimeType: z.string().min(1),
  filename: z.string().min(1),
  title: z.string().trim().min(1).max(200),
  category: z.string().trim().min(1).max(80),
  projectId: z.string().min(1).optional(),
  folderId: z.string().nullable().optional(),
});

export const updatePhotoSchema = z.object({
  id: z.string().min(1),
  title: z.string().optional(),
  category: z.string().optional(),
  published: z.boolean().optional(),
  featured: z.boolean().optional(),
  public_watermarked: z.boolean().optional(),
  folder_id: z.string().nullable().optional(),
  sort_order: z.number().optional(),
});

export const bulkUpdatePhotosSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(200),
  category: z.string().optional(),
  published: z.boolean().optional(),
  featured: z.boolean().optional(),
  public_watermarked: z.boolean().optional(),
  folder_id: z.string().nullable().optional(),
});

export const bulkDeletePhotosSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(200),
});

export const regeneratePhotoWatermarksSchema = bulkDeletePhotosSchema;

export const createPhotoFolderSchema = z.object({
  name: z.string().trim().min(1).max(120),
});

export const updatePhotoFolderSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(120).optional(),
  sort_order: z.number().optional(),
});

export const createProjectServerSchema = z.object({
  title: z.string().trim().min(1).max(200),
  client: z.string().optional(),
  description: z.string().optional(),
  category: z.string().trim().min(1).max(80).optional(),
  shoot_date: z.string().optional(),
});

export const updateProjectSchema = z.object({
  id: z.string().min(1),
  title: z.string().optional(),
  client: z.string().optional(),
  description: z.string().optional(),
  category: z.string().nullable().optional(),
  shoot_date: z.string().nullable().optional(),
  cover_photo_id: z.string().nullable().optional(),
  published: z.boolean().optional(),
  client_paid: z.boolean().optional(),
  public_watermarked: z.boolean().optional(),
  sort_order: z.number().optional(),
  download_link: z.string().nullable().optional(),
});

export const setProjectPhotosSchema = z.object({
  projectId: z.string().min(1),
  photoIds: z.array(z.string().min(1)),
});
