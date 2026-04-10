"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import VotingCard from "@/app/components/VotingCard";
import { votingTheme as vt } from "@/lib/votingTheme";

export type VotingQueueItem = {
  captionId: string;
  imageUrl: string;
  captionText: string;
};

type FlipPayload = {
  leaving: VotingQueueItem;
  arriving: VotingQueueItem | null;
  nextPageUrl: string | null;
  side: "left" | "right";
};

type VotingDeckProps = {
  queue: VotingQueueItem[];
  page: number;
  userId: string | null;
};

function VotingFigure({ item }: { item: VotingQueueItem }) {
  const showCaption =
    item.captionText.trim() && item.captionText.trim().toLowerCase() !== "next";

  return (
    <figure
      style={{
        margin: 0,
        width: "100%",
        display: "block",
        overflow: "hidden",
        borderRadius: 14,
        backgroundColor: vt.cardWhite,
        boxShadow: vt.cardShadow,
      }}
    >
      <img
        src={item.imageUrl}
        alt=""
        style={{
          width: "100%",
          height: "52vh",
          display: "block",
          objectFit: "cover",
        }}
      />
      {showCaption ? (
        <figcaption
          style={{
            width: "100%",
            boxSizing: "border-box",
            margin: 0,
            padding: "16px 18px 18px",
            borderTop: `1px solid ${vt.borderBrown}`,
            backgroundColor: "transparent",
            fontSize: 18,
            color: vt.brown800,
            lineHeight: 1.55,
            letterSpacing: "-0.01em",
          }}
        >
          {item.captionText}
        </figcaption>
      ) : null}
    </figure>
  );
}

export default function VotingDeck({ queue, page, userId }: VotingDeckProps) {
  const router = useRouter();
  const offset = page - 1;
  const current = queue[offset] ?? null;
  const [flip, setFlip] = useState<FlipPayload | null>(null);
  const endsRef = useRef(0);
  const flipRef = useRef<FlipPayload | null>(null);
  const navigatedRef = useRef(false);

  useEffect(() => {
    setFlip(null);
    flipRef.current = null;
    navigatedRef.current = false;
  }, [page]);

  const completeFlipNavigation = useCallback(() => {
    const payload = flipRef.current;
    if (!payload || navigatedRef.current) return;
    navigatedRef.current = true;
    const url = payload.nextPageUrl ?? "/voting";
    router.replace(url);
    router.refresh();
  }, [router]);

  useEffect(() => {
    if (!flip) return;
    flipRef.current = flip;
    navigatedRef.current = false;
    const t = window.setTimeout(() => {
      completeFlipNavigation();
    }, 750);
    return () => window.clearTimeout(t);
  }, [flip, completeFlipNavigation]);

  const handleVoteRecorded = useCallback(
    ({
      nextPageUrl,
      side,
    }: {
      nextPageUrl: string | null;
      side: "left" | "right";
    }) => {
      if (!current) return;
      const nextOffset = offset + 1;
      const arriving = queue[nextOffset] ?? null;
      endsRef.current = 0;
      navigatedRef.current = false;
      const payload: FlipPayload = {
        leaving: current,
        arriving,
        nextPageUrl,
        side,
      };
      flipRef.current = payload;
      setFlip(payload);
    },
    [current, offset, queue]
  );

  const handleFlipLayerAnimationEnd = useCallback(
    (e: React.AnimationEvent<HTMLDivElement>) => {
      if (e.target !== e.currentTarget) return;
      const payload = flipRef.current;
      if (!payload) return;
      const needed = payload.arriving ? 2 : 1;
      endsRef.current += 1;
      if (endsRef.current >= needed) {
        completeFlipNavigation();
      }
    },
    [completeFlipNavigation]
  );

  if (!current) {
    return null;
  }

  if (!userId) {
    return <VotingFigure item={current} />;
  }

  const nextPageUrl =
    offset + 1 < queue.length ? `/voting?page=${page + 1}` : null;

  if (flip) {
    const outAnim =
      flip.side === "right"
        ? "voting-flip-out-right"
        : "voting-flip-out-left";
    const inAnim =
      flip.side === "right" ? "voting-flip-in-right" : "voting-flip-in-left";

    return (
      <div
        className="voting-deck-stage"
        style={{
          position: "relative",
          width: "100%",
          minHeight: "min(52vh + 120px, 85vh)",
          overflow: "hidden",
        }}
      >
        {/* New card sits underneath; current card is on top and slides away (no z-fighting). */}
        {flip.arriving ? (
          <div
            className={`voting-flip-layer ${inAnim}`}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              zIndex: 1,
              transformOrigin: "50% 50%",
              pointerEvents: "none",
              borderRadius: 14,
              overflow: "hidden",
              boxShadow: vt.cardShadowLift,
            }}
            onAnimationEnd={handleFlipLayerAnimationEnd}
          >
            <VotingFigure item={flip.arriving} />
          </div>
        ) : null}
        <div
          className={`voting-flip-layer ${outAnim}`}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            zIndex: 2,
            transformOrigin: "50% 50%",
            pointerEvents: "none",
            borderRadius: 14,
            overflow: "hidden",
            boxShadow: vt.cardShadowLift,
          }}
          onAnimationEnd={handleFlipLayerAnimationEnd}
        >
          <VotingFigure item={flip.leaving} />
        </div>
      </div>
    );
  }

  return (
    <VotingCard
      captionId={current.captionId}
      userId={userId}
      nextPageUrl={nextPageUrl}
      onVoteRecorded={handleVoteRecorded}
    >
      <VotingFigure item={current} />
    </VotingCard>
  );
}
