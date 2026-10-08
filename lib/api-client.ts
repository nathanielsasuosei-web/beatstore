/**
 * Client-side response parsing that never throws.
 *
 * `res.json()` blows up with "Failed to execute 'json' on 'Response':
 * Unexpected end of JSON input" whenever the reply is not JSON — an empty
 * body from a crashed route, an HTML error page from a proxy or gateway, a
 * paused deployment. Instead of crashing the UI with that developer-facing
 * message, we turn any non-JSON reply into a normal `{ ok: false, error }`
 * payload with a human-readable explanation.
 */
export type ApiJson = {
  ok?: boolean;
  error?: string;
  redirect?: string;
  message?: string;
  [key: string]: unknown;
};

export async function safeJson(res: Response): Promise<ApiJson> {
  let text = "";
  try {
    text = await res.text();
  } catch {
    /* body unreadable — treat as empty */
  }

  if (text.trim()) {
    try {
      return JSON.parse(text) as ApiJson;
    } catch {
      /* fall through to the friendly error below */
    }
  }

  const reason =
    res.status >= 500
      ? "The server hit a problem"
      : res.status === 429
        ? "Too many requests — wait a moment and try again"
        : res.status === 404
          ? "That resource was not found"
          : res.status === 401 || res.status === 403
            ? "You don't have access to that"
            : "The request could not be completed";

  return { ok: false, error: `${reason} (HTTP ${res.status}). Please try again.` };
}
