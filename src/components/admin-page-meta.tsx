import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type AdminPageMeta = { title: string; subtitle?: string };

type AdminPageMetaContextValue = {
  meta: AdminPageMeta;
  setMeta: (meta: AdminPageMeta) => void;
};

const AdminPageMetaContext = createContext<AdminPageMetaContextValue | null>(null);

function metaEqual(a: AdminPageMeta, b: AdminPageMeta) {
  return a.title === b.title && a.subtitle === b.subtitle;
}

export function AdminPageMetaProvider({ children }: { children: ReactNode }) {
  const [meta, setMetaState] = useState<AdminPageMeta>({ title: "Studio" });

  const setMeta = useCallback((next: AdminPageMeta) => {
    setMetaState((prev) => (metaEqual(prev, next) ? prev : next));
  }, []);

  const value = useMemo(() => ({ meta, setMeta }), [meta, setMeta]);

  return <AdminPageMetaContext.Provider value={value}>{children}</AdminPageMetaContext.Provider>;
}

export function useAdminPageMetaState() {
  const ctx = useContext(AdminPageMetaContext);
  if (!ctx) throw new Error("useAdminPageMetaState must be used within AdminPageMetaProvider");
  return ctx.meta;
}

export function useAdminPageMeta(meta: AdminPageMeta) {
  const ctx = useContext(AdminPageMetaContext);
  if (!ctx) throw new Error("useAdminPageMeta must be used within AdminPageMetaProvider");

  const { title, subtitle } = meta;

  const { setMeta } = ctx;

  useEffect(() => {
    setMeta({ title, subtitle });
  }, [setMeta, title, subtitle]);
}
