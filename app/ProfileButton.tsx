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
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback`
          : undefined;

      const timeoutMs = 8_000;
      const oauthPromise = supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("Request timed out. Check network and Supabase URL/key.")),
          timeoutMs
        )
      );

      const { data, error } = await Promise.race([oauthPromise, timeoutPromise]);

      if (error) {
        setError(error.message);
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      setError("No redirect URL from Supabase. Check Auth and Google provider in the dashboard.");
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
          position: "absolute",
          top: 16,
          right: 16,
          borderRadius: "9999px",
          width: 40,
          height: 40,
          border: "1px solid #e5e5e5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.7 : 1,
        }}
      >
        <span
          style={{
            width: 20,
            height: 20,
            borderRadius: "9999px",
            backgroundColor: "#cccccc",
          }}
        />
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
