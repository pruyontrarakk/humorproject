"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { votingTheme as vt } from "@/lib/votingTheme";

type VotingCardProps = {
  captionId: string;
  userId: string | null;
  nextPageUrl: string | null;
  /** When set, successful vote calls this instead of navigating (parent runs transition + navigation). */
  onVoteRecorded?: (info: {
    nextPageUrl: string | null;
    side: "left" | "right";
  }) => void;
  children: React.ReactNode;
};

export default function VotingCard({
  captionId,
  userId,
  nextPageUrl,
  onVoteRecorded,
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
        if (onVoteRecorded) {
          onVoteRecorded({ nextPageUrl, side: hoverSide });
        } else {
          router.push(nextPageUrl ?? "/voting");
        }
      } catch (err) {
        console.error("Error voting:", err);
        setLoading(false);
      }
    },
    [userId, hoverSide, loading, captionId, nextPageUrl, router, onVoteRecorded]
  );

  if (!userId) {
    return <>{children}</>;
  }

  const tilt = hoverSide === "left" ? -10 : hoverSide === "right" ? 10 : 0;

  return (
    <div
      ref={cardRef}
      aria-busy={loading}
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
            background: vt.overlayNotFunny,
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
            background: vt.overlayFunny,
            borderRadius: "0 14px 14px 0",
            pointerEvents: "none",
          }}
          aria-hidden
        />
      )}
    </div>
  );
}
