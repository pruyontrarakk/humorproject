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

  if (loading || !user || pathname === "/login") {
    return null;
  }

  return (
    <header className="flex items-center justify-between border-b-4 border-black bg-white px-6 py-4">
      <div className="flex w-1/4 justify-start">
        <button
          onClick={() => setMenuOpen(true)}
          className="flex h-10 w-10 items-center justify-center border-2 border-black bg-white transition hover:bg-black hover:text-white"
          aria-label="Open menu"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={3} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center text-center">
        <Link href="/home" className="text-2xl font-black uppercase tracking-tighter text-black sm:text-3xl">
          Humor Project
        </Link>
        <div className="mt-1 bg-black px-2 py-0.5 text-[0.55rem] font-bold tracking-[0.3em] text-white">
          OPERATIONAL INTERFACE
        </div>
      </div>

      <div className="flex w-1/4 justify-end">
        <div className="flex items-center gap-3">
          <span className="hidden text-[0.6rem] font-bold uppercase tracking-widest text-black sm:block">
            {displayName}
          </span>
          <button
            onClick={handleSignOut}
            className="border-2 border-black bg-black px-3 py-1 text-[0.6rem] font-black uppercase tracking-[0.2em] text-white transition hover:bg-white hover:text-black"
          >
            Sign out
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white p-6">
          <button
            onClick={() => setMenuOpen(false)}
            className="absolute right-6 top-6 flex h-10 w-20 items-center justify-center border-2 border-black text-xs font-black uppercase tracking-widest transition hover:bg-brand-primary hover:text-white"
          >
            CLOSE
          </button>

          <nav className="flex flex-col items-center gap-1">
            {[
              { id: "home", label: "Home", href: "/home" },
              { id: "voting", label: "Voting", href: "/voting" },
              { id: "upload", label: "Upload", href: "/upload" }
            ].map(tab => {
              const isActive = pathname === tab.href;
              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  className={[
                    "text-4xl font-black uppercase tracking-tighter transition-all sm:text-6xl",
                    isActive
                      ? "bg-brand-primary px-3 text-white"
                      : "text-black hover:bg-black hover:text-white"
                  ].join(" ")}
                  onClick={() => setMenuOpen(false)}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
