import { useEffect, useRef, useState } from "react";

export type AutoSaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

type AutoSaveOptions = {
  delay?: number;
  enabled?: boolean;
};

type SaveResult = { ok: true } | { ok: false; error?: string };

export function useAutoSave<T>(
  value: T,
  onSave: (value: T) => Promise<SaveResult>,
  { delay = 600, enabled = true }: AutoSaveOptions = {},
) {
  const [status, setStatus] = useState<AutoSaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const readyRef = useRef(false);
  const lastSavedRef = useRef("");
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const valueRef = useRef(value);
  const onSaveRef = useRef(onSave);
  valueRef.current = value;
  onSaveRef.current = onSave;

  useEffect(() => {
    if (!enabled) return;

    const snapshot = JSON.stringify(value);
    if (!readyRef.current) {
      readyRef.current = true;
      lastSavedRef.current = snapshot;
      return;
    }
    if (snapshot === lastSavedRef.current) return;

    setStatus("pending");
    const timer = setTimeout(() => {
      void (async () => {
        const current = valueRef.current;
        const currentSnapshot = JSON.stringify(current);
        if (currentSnapshot === lastSavedRef.current) return;

        setStatus("saving");
        setError(null);
        const result = await onSaveRef.current(current);
        if (result.ok) {
          if (JSON.stringify(valueRef.current) === currentSnapshot) {
            lastSavedRef.current = currentSnapshot;
            setStatus("saved");
          } else {
            setStatus("pending");
          }
        } else {
          setError(result.error ?? "Could not save.");
          setStatus("error");
        }
      })();
    }, delay);
    timerRef.current = timer;

    return () => clearTimeout(timer);
  }, [value, delay, enabled]);

  function syncBaseline(next: T) {
    lastSavedRef.current = JSON.stringify(next);
    setStatus("idle");
    setError(null);
  }

  function cancelPending() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
  }

  return { status, error, setError, syncBaseline, cancelPending };
}
