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
      <div className="w-full max-w-md space-y-8 border-4 border-black bg-white p-10">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-black uppercase tracking-tighter text-black">
            {heading.toUpperCase()}
          </h2>
          <div className="mx-auto h-1 w-12 bg-brand-primary" />
          {subtitle && (
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.3em] text-slate-400">
              {subtitle.toUpperCase()}
            </p>
          )}
        </div>

        <div className="space-y-4 text-xs font-bold leading-relaxed text-black">
          <p>{description}</p>
          <div className="border-l-4 border-black bg-slate-50 p-3">
            Use your authenticated Google account to gain system access.
          </div>
        </div>

        {(showAuthError || displayError) && (
          <div className="border-4 border-brand-primary bg-brand-primary p-3 text-white">
            <p className="text-[0.6rem] font-black uppercase tracking-widest">ERROR: AUTH_FAILURE</p>
            <p className="text-xs opacity-90 mt-1">{displayError || "Please try again or contact support."}</p>
          </div>
        )}

        <button
          type="button"
          onClick={handleSignIn}
          disabled={loading}
          className="btn-primary w-full py-4 text-sm font-black uppercase tracking-[0.2em]"
        >
          {loading ? "ESTABLISHING SESSION..." : "INITIATE GOOGLE AUTH"}
        </button>
      </div>
    </div>
  );
}
