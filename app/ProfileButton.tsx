"use client";

import { useCallback, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ProfileButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!url || !key) {
        setError(
          "Missing Supabase env. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local and restart the dev server."
        );
        return;
      }

      const supabase = createClient();

      const base =
        typeof window !== "undefined"
          ? window.location.origin
          : process.env.NODE_ENV === "development"
            ? "http://localhost:3000"
            : "https://www.almostcrackd.ai";
      const redirectTo = `${base}/auth/callback`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });

      if (error) {
        setError(error.message);
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      setError(
        "No redirect URL from Supabase. Check Auth and Google provider in the dashboard."
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      console.error("ProfileButton sign-in error:", e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <>
      <button
        type="button"
        aria-label="Sign in with Google"
        onClick={handleClick}
        disabled={loading}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          fontSize: 16,
          fontWeight: 500,
          color: "#000000",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        Sign in
      </button>

      {loading && (
        <p
          style={{
            position: "fixed",
            top: 64,
            left: "50%",
            transform: "translateX(-50%)",
            margin: 0,
            fontSize: 14,
            color: "#666",
            zIndex: 20,
          }}
        >
          Opening Google sign-in…
        </p>
      )}

      {error && (
        <p
          role="alert"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            margin: 0,
            padding: 12,
            fontSize: 14,
            color: "#b91c1c",
            backgroundColor: "#fef2f2",
            borderBottom: "1px solid #fecaca",
            zIndex: 30,
          }}
        >
          {error}
        </p>
      )}
    </>
  );
}
