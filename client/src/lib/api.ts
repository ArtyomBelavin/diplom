export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export type ApiOptions = RequestInit & {
  token?: string | null;
  sessionId?: string | null;
};

export async function apiFetch<T>(
  path: string,
  { token, sessionId, headers, ...init }: ApiOptions = {},
): Promise<T> {
  const isFormData =
    typeof FormData !== "undefined" && init.body instanceof FormData;

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(sessionId ? { "x-session-id": sessionId } : {}),
      ...headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;
    throw new Error(payload?.message || "Ошибка запроса к серверу.");
  }

  return response.json() as Promise<T>;
}
