import { createContext } from "react";

export type AdminPageMeta = { title: string; subtitle?: string };

export type AdminPageMetaContextValue = {
  meta: AdminPageMeta;
  setMeta: (meta: AdminPageMeta) => void;
};

export const AdminPageMetaContext = createContext<AdminPageMetaContextValue | null>(null);
