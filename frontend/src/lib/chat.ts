// lib/chat.ts — typed API client for the chat backend
const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

export interface ChatMessage {
  role: "user" | "model";
  content: string;
}

async function req<T>(path: string, token?: string, options?: RequestInit): Promise<T> {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    headers,
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "API error");
  return data as T;
}

export const chatApi = {
  createSession: (token: string) =>
    req<{ sessionId: string }>("/api/chat/sessions", token, { method: "POST" }),

  getHistory: (sessionId: string, token: string) =>
    req<{ messages: ChatMessage[] }>(`/api/chat/sessions/${sessionId}/messages`, token),

  sendMessage: (sessionId: string, message: string, token: string) =>
    req<{ reply: string }>(`/api/chat/sessions/${sessionId}/messages`, token, {
      method: "POST",
      body: JSON.stringify({ message }),
    }),

  clearSession: (sessionId: string, token: string) =>
    req<{ success: boolean }>(`/api/chat/sessions/${sessionId}/messages`, token, {
      method: "DELETE",
    }),
};
