"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { votingTheme as vt } from "@/lib/votingTheme";
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
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 500,
    textDecoration: "none" as const,
    color: pathname === href ? vt.navActiveFg : vt.navInactiveFg,
    backgroundColor: pathname === href ? vt.navActiveBg : "transparent",
  });

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Profile";

  // Hide on marketing / auth pages and when not authenticated
  if (loading || !user || pathname === "/" || pathname === "/login") {
    return null;
  }

  return (
    <nav
      className="flex items-center justify-between gap-2 bg-white px-5 py-3"
      style={{
        borderBottom:
          pathname === "/home" ||
          pathname === "/voting" ||
          pathname.startsWith("/upload")
            ? `2px solid ${vt.purple}`
            : `1px solid ${vt.borderBrownLight}`,
        boxShadow:
          pathname === "/home" ||
          pathname === "/voting" ||
          pathname.startsWith("/upload")
            ? `0 3px 12px ${vt.purpleMuted}`
            : undefined,
      }}
    >
      <div className="flex gap-1">
        <Link href="/home" style={linkStyle("/home")}>
          Home
        </Link>
        <Link href="/voting" style={linkStyle("/voting")}>
          Voting
        </Link>
        <Link href="/upload" style={linkStyle("/upload")}>
          Upload
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
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 500,
              color: vt.brown700,
              cursor: "pointer",
              backgroundColor: menuOpen ? vt.navActiveBg : "transparent",
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
                    borderRadius: 12,
                    backgroundColor: vt.cardWhite,
                    boxShadow: vt.cardShadow,
                    border: `1px solid ${vt.borderBrown}`,
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
                      color: vt.brown800,
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
            className="btn-primary rounded-xl px-3.5 py-1.5 text-sm"
          >
            Sign in
          </button>
        )}
      </div>
    </nav>
  );
}
