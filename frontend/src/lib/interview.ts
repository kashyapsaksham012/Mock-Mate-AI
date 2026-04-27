import { InterviewEvaluateResponse, InterviewGenerateRequest, InterviewGenerateResponse } from "@/types/interview";

export async function generateInterview(payload: InterviewGenerateRequest, token: string | null): Promise<InterviewGenerateResponse> {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  if (!backendUrl) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL is not configured");
  }

  if (!token) {
    throw new Error("You must be signed in to generate an interview");
  }

  const response = await fetch(`${backendUrl}/api/interview/generate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => null);
    throw new Error(errorPayload?.error || `Interview generation failed (${response.status})`);
  }

  const body = (await response.json()) as { data: InterviewGenerateResponse };
  return body.data;
}

export async function evaluateInterview(sessionId: string, token: string | null): Promise<InterviewEvaluateResponse> {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  if (!backendUrl) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL is not configured");
  }

  if (!token) {
    throw new Error("You must be signed in to evaluate an interview");
  }

  const response = await fetch(`${backendUrl}/api/interview/evaluate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sessionId }),
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => null);
    throw new Error(errorPayload?.error || errorPayload?.message || `Interview evaluation failed (${response.status})`);
  }

  const body = (await response.json()) as { data: InterviewEvaluateResponse };
  return body.data;
}