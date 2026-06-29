const FIVEMANAGE_API_BASE = "https://api.fivemanage.com/api/v3";

export type FivemanageUploadResult = {
  id: string;
  url: string;
  originalUrl?: string;
};

function getFivemanageApiKey() {
  const key = process.env.FIVEMANAGE_API_KEY;
  if (!key) {
    throw new Error("Missing FIVEMANAGE_API_KEY server environment variable.");
  }
  return key;
}

export async function uploadToFivemanage(
  buffer: Uint8Array | Buffer,
  options: {
    filename: string;
    mimeType?: string;
    path?: string;
    metadata?: Record<string, string>;
  },
): Promise<FivemanageUploadResult> {
  const form = new FormData();
  form.append(
    "file",
    new Blob([buffer], { type: options.mimeType ?? "application/octet-stream" }),
    options.filename,
  );
  if (options.path) {
    form.append("path", options.path);
  }
  if (options.metadata) {
    form.append("metadata", JSON.stringify(options.metadata));
  }

  const response = await fetch(`${FIVEMANAGE_API_BASE}/file`, {
    method: "POST",
    headers: { Authorization: getFivemanageApiKey() },
    body: form,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Fivemanage upload failed (${response.status}): ${body}`);
  }

  const json = (await response.json()) as {
    status: string;
    data: { id: string; url: string; originalUrl?: string };
  };

  return {
    id: json.data.id,
    url: json.data.url,
    originalUrl: json.data.originalUrl,
  };
}

export async function deleteFromFivemanage(fileId: string): Promise<void> {
  const response = await fetch(`${FIVEMANAGE_API_BASE}/file/${encodeURIComponent(fileId)}`, {
    method: "DELETE",
    headers: { Authorization: getFivemanageApiKey() },
  });

  if (!response.ok && response.status !== 404) {
    const body = await response.text();
    throw new Error(`Fivemanage delete failed (${response.status}): ${body}`);
  }
}
