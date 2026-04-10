"use client";

import { useCallback, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type GoogleSignInCardProps = {
  heading: string;
  subtitle?: string;
  description: string;
  error?: string | null;
};

export default function GoogleSignInCard({
  heading,
  subtitle,
  description,
  error,
}: GoogleSignInCardProps) {
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSignIn = useCallback(async () => {
    setLoading(true);
    setLocalError(null);

    try {
      const supabase = createClient();
      const base =
        typeof window !== "undefined"
          ? window.location.origin
          : process.env.NODE_ENV === "development"
            ? "http://localhost:3000"
            : "https://www.almostcrackd.ai";
      const redirectTo = `${base}/auth/callback`;

      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });

      if (oauthError) {
        setLocalError(oauthError.message);
        setLoading(false);
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      setLocalError("No redirect URL from Supabase. Check Auth settings.");
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  const showAuthError = error === "auth";
  const displayError = localError;

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="card w-full max-w-md space-y-6 p-8">
        <div className="space-y-1 text-center">
          <h2 className="border-b-[3px] border-[#5b21b6] pb-1.5 text-2xl font-semibold tracking-tight text-brand-800">
            {heading}
          </h2>
          {subtitle ? (
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4c1d95]">
              {subtitle}
            </p>
          ) : null}
          <p className="mt-2 text-sm text-[rgba(93,48,23,0.72)]">{description}</p>
        </div>

        {showAuthError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            Sign-in failed. Please try again.
          </p>
        )}
        {displayError && !showAuthError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {displayError}
          </p>
        )}

        <button
          type="button"
          onClick={handleSignIn}
          disabled={loading}
          className="btn-primary flex w-full items-center justify-center gap-2 text-sm"
        >
          {loading ? "Redirecting…" : "Sign in with Google"}
        </button>
      </div>
    </div>
  );
}
