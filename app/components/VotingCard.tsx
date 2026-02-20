"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type VotingCardProps = {
  captionId: string;
  userId: string | null;
  nextPageUrl: string | null;
  children: React.ReactNode;
};

export default function VotingCard({
  captionId,
  userId,
  nextPageUrl,
  children,
}: VotingCardProps) {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const [hoverSide, setHoverSide] = useState<"left" | "right" | null>(null);
  const [loading, setLoading] = useState(false);

  // Reset loading when we've navigated to a new image (same component instance, new captionId)
  useEffect(() => {
    setLoading(false);
  }, [captionId]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!userId || loading || !cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const mid = rect.width / 2;
      setHoverSide(x < mid ? "left" : "right");
    },
    [userId, loading]
  );

  const handleMouseLeave = useCallback(() => {
    setHoverSide(null);
  }, []);

  const handleClick = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      if (!userId || !hoverSide || loading) return;

      setLoading(true);
      try {
        const {
          data: { session },
        } = await createClient().auth.getSession();
        const token = session?.access_token;
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await fetch("/api/ratings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            caption_id: captionId,
            rating: hoverSide === "right" ? 1 : -1,
          }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          const msg = data.details ?? data.error ?? "Failed to save vote";
          throw new Error(msg);
        }
        router.push(nextPageUrl ?? "/voting");
      } catch (err) {
        console.error("Error voting:", err);
        setLoading(false);
      }
    },
    [userId, hoverSide, loading, captionId, nextPageUrl, router]
  );

  if (!userId) {
    return <>{children}</>;
  }

  const tilt = hoverSide === "left" ? -10 : hoverSide === "right" ? 10 : 0;

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      style={{
        position: "relative",
        cursor: hoverSide ? "pointer" : "default",
        transform: `perspective(800px) rotateY(${tilt}deg)`,
        transition: "transform 0.2s ease-out",
        transformStyle: "preserve-3d",
      }}
    >
      {children}

      {/* Left overlay */}
      {hoverSide === "left" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            left: 0,
            right: "50%",
            background: "rgba(239, 68, 68, 0.25)",
            borderRadius: "14px 0 0 14px",
            pointerEvents: "none",
          }}
          aria-hidden
        />
      )}

      {/* Right overlay */}
      {hoverSide === "right" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            left: "50%",
            right: 0,
            background: "rgba(34, 197, 94, 0.25)",
            borderRadius: "0 14px 14px 0",
            pointerEvents: "none",
          }}
          aria-hidden
        />
      )}

      {/* Loading overlay */}
      {loading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255,255,255,0.9)",
            borderRadius: 14,
            fontSize: 18,
            color: "#1a1a1a",
          }}
        >
          Saving…
        </div>
      )}
    </div>
  );
}
