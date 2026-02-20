"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    const getInitial = async () => {
      const { data: { user: u } } = await supabase.auth.getUser();
      setUser(u);
      setLoading(false);
    };
    getInitial();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.push("/");
  }, [router]);

  const handleSignIn = useCallback(async () => {
    const supabase = createClient();
    const base =
      typeof window !== "undefined"
        ? window.location.origin
        : process.env.NODE_ENV === "development"
          ? "http://localhost:3000"
          : "https://www.almostcrackd.ai";
    const redirectTo = `${base}/auth/callback`;
    const { data } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (data?.url) window.location.href = data.url;
  }, []);

  const linkStyle = (href: string) => ({
    padding: "8px 14px",
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 500,
    textDecoration: "none" as const,
    color: pathname === href ? "#1a1a1a" : "rgba(0, 0, 0, 0.7)",
    backgroundColor: pathname === href ? "rgba(0, 0, 0, 0.08)" : "transparent",
  });

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Profile";

  // Never show nav before sign-in: hide on landing page and when not authenticated
  if (loading || !user || pathname === "/") {
    return null;
  }

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        padding: "12px 20px",
        borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
        backgroundColor: "#ffffff",
      }}
    >
      <div style={{ display: "flex", gap: 8 }}>
        <Link href="/home" style={linkStyle("/home")}>
          Home
        </Link>
        <Link href="/voting" style={linkStyle("/voting")}>
          Voting
        </Link>
      </div>

      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
        }}
      >
        {loading ? (
          <span
            style={{
              fontSize: 14,
              color: "rgba(0,0,0,0.5)",
            }}
          >
            …
          </span>
        ) : user ? (
          <>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-haspopup="true"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                border: "none",
                padding: "6px 11px",
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 500,
                color: "rgba(0, 0, 0, 0.85)",
                cursor: "pointer",
                backgroundColor: menuOpen ? "rgba(0, 0, 0, 0.06)" : "transparent",
              }}
            >
              <span>{displayName}</span>
              <span
                style={{
                  display: "inline-block",
                  transform: menuOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.15s ease",
                }}
              >
                ▼
              </span>
            </button>
            {menuOpen && (
              <>
                <div
                  role="presentation"
                  style={{
                    position: "fixed",
                    inset: 0,
                    zIndex: 10,
                  }}
                  onClick={() => setMenuOpen(false)}
                />
                <div
                  role="menu"
                  style={{
                    position: "absolute",
                    top: "100%",
                    right: 0,
                    marginTop: 4,
                    minWidth: 150,
                    padding: "6px 0",
                    borderRadius: 6,
                    backgroundColor: "#fff",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                    border: "1px solid rgba(0,0,0,0.08)",
                    zIndex: 20,
                  }}
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleSignOut}
                    style={{
                      display: "block",
                      width: "100%",
                    padding: "8px 14px",
                    textAlign: "left",
                    border: "none",
                    backgroundColor: "transparent",
                    fontSize: 14,
                      fontWeight: 500,
                      color: "rgba(0, 0, 0, 0.85)",
                      cursor: "pointer",
                    }}
                  >
                    Sign out
                  </button>
                </div>
              </>
            )}
          </>
        ) : (
          <button
            type="button"
            onClick={handleSignIn}
            style={{
              padding: "6px 14px",
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 500,
              color: "#000",
              backgroundColor: "rgba(0, 0, 0, 0.06)",
              border: "none",
              cursor: "pointer",
            }}
          >
            Sign in
          </button>
        )}
      </div>
    </nav>
  );
}
