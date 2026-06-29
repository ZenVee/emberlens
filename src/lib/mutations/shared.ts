export class ServerMutationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ServerMutationError";
  }
}

export function assertNoServerError(
  result: { error: string | null },
  fallback = "Request failed.",
): void {
  if (result.error) throw new ServerMutationError(result.error || fallback);
}

export function mutationErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ServerMutationError) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}
