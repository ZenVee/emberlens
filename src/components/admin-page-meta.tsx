import { useCallback, useMemo, useState, type ReactNode } from "react";

import {
  AdminPageMetaContext,
  type AdminPageMeta,
  type AdminPageMetaContextValue,
} from "./admin-page-meta-context";

function metaEqual(a: AdminPageMeta, b: AdminPageMeta) {
  return a.title === b.title && a.subtitle === b.subtitle;
}

export function AdminPageMetaProvider({ children }: { children: ReactNode }) {
  const [meta, setMetaState] = useState<AdminPageMeta>({ title: "Studio" });

  const setMeta = useCallback((next: AdminPageMeta) => {
    setMetaState((prev) => (metaEqual(prev, next) ? prev : next));
  }, []);

  const value = useMemo<AdminPageMetaContextValue>(() => ({ meta, setMeta }), [meta, setMeta]);

  return <AdminPageMetaContext.Provider value={value}>{children}</AdminPageMetaContext.Provider>;
}

export type { AdminPageMeta } from "./admin-page-meta-context";
