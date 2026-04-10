const FRIENDLY_GATEWAY =
  "Could not reach the database (the server returned an error page instead of data). " +
  "This is often temporary—try refreshing in a moment. If it persists, check " +
  "https://status.supabase.com and your project plan / pausing.";

/**
 * Detect Cloudflare / proxy HTML bodies and other non-JSON error payloads.
 */
function looksLikeHtmlOrGatewayPage(m: string): boolean {
  const lower = m.toLowerCase();
  if (lower.includes("<!doctype")) return true;
  if (lower.includes("<html")) return true;
  if (lower.includes("cf-error-details")) return true;
  if (lower.includes("bad gateway")) return true;
  if (lower.includes("error code 502")) return true;
  if (lower.includes("cloudflare") && lower.includes("</html>")) return true;
  // Huge messages are almost never useful PostgREST text
  if (m.length > 6000) return true;
  return false;
}

/**
 * Supabase / PostgREST sometimes surfaces Cloudflare HTML (e.g. 502) in `error.message`.
 * Never show that raw HTML in the UI.
 */
export function safeSupabaseErrorMessage(
  message: string | undefined | null
): string {
  if (message == null || message.trim() === "") {
    return "Request failed with no details from the server.";
  }
  const m = message.trim();
  if (looksLikeHtmlOrGatewayPage(m)) {
    return FRIENDLY_GATEWAY;
  }
  if (m.length > 320) {
    return `${m.slice(0, 300)}…`;
  }
  return m;
}

/** True when a quick retry might help (gateway, overload, HTML error body). */
export function isTransientSupabaseError(
  message: string | undefined | null
): boolean {
  if (message == null || message.trim() === "") return true;
  if (looksLikeHtmlOrGatewayPage(message)) return true;
  return /502|503|504|5\d\d|ECONNRESET|ETIMEDOUT|fetch failed|network|timeout/i.test(
    message
  );
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type SupabaseLikeResult<T> = {
  data: T;
  error: { message?: string } | null;
};

/** Retry a few times when the gateway returns 502/HTML or similar. */
export async function withSupabaseRetry<T>(
  fn: () => PromiseLike<SupabaseLikeResult<T>>
): Promise<SupabaseLikeResult<T>> {
  const maxAttempts = 4;
  let last: SupabaseLikeResult<T> | undefined;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    last = await fn();
    if (!last.error) return last;
    if (
      !isTransientSupabaseError(last.error.message) ||
      attempt === maxAttempts - 1
    ) {
      return last;
    }
    await sleep(450 * (attempt + 1));
  }
  return last!;
}
