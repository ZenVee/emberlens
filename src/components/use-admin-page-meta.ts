import { useContext, useEffect } from "react";

import { AdminPageMetaContext, type AdminPageMeta } from "./admin-page-meta-context";

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
