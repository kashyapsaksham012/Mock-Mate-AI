import { ResumeUploadResponse } from "@/types/resume";

export async function uploadResume(file: File, token: string | null): Promise<ResumeUploadResponse> {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  if (!backendUrl) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL is not configured");
  }

  if (!token) {
    throw new Error("You must be signed in to upload a resume");
  }

  const response = await fetch(`${backendUrl}/api/resume/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": file.type || "application/octet-stream",
      "x-file-name": file.name,
      "x-file-type": file.type || "application/octet-stream",
    },
    body: await file.arrayBuffer(),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const errorMessage = payload?.error || payload?.message || `Resume upload failed (${response.status})`;
    throw new Error(errorMessage);
  }

  return (await response.json()) as ResumeUploadResponse;
}

export async function fetchResumeProfile(token: string | null): Promise<ResumeUploadResponse | null> {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  if (!backendUrl) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL is not configured");
  }

  if (!token) {
    return null;
  }

  const response = await fetch(`${backendUrl}/api/resume/profile`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Resume profile request failed (${response.status})`);
  }

  const payload = (await response.json()) as { data: ResumeUploadResponse["data"] | null; meta?: ResumeUploadResponse["meta"] };
  if (!payload.data) {
    return null;
  }

  return {
    data: payload.data,
    meta: {
      source: payload.meta?.source ?? 'fallback',
      filePath: payload.meta?.filePath ?? payload.meta?.fileUrl ?? '',
      extractedTextLength: payload.meta?.extractedTextLength ?? 0,
    },
  };
}