"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

type CaptionRatingProps = {
  captionId: string;
  initialRating: number | null;
  userId: string | null;
};

export default function CaptionRating({
  captionId,
  initialRating,
  userId,
}: CaptionRatingProps) {
  const [rating, setRating] = useState<number | null>(initialRating);
  const [loading, setLoading] = useState(false);

  const handleRate = useCallback(
    async (newRating: number) => {
      if (!userId) {
        return;
      }

      setLoading(true);
      try {
        const response = await fetch("/api/ratings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            caption_id: captionId,
            rating: newRating,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to save rating");
        }

        const data = await response.json();
        setRating(data.rating);
      } catch (error) {
        console.error("Error rating caption:", error);
      } finally {
        setLoading(false);
      }
    },
    [captionId, userId]
  );

  if (!userId) {
    return null;
  }

  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        alignItems: "center",
        marginTop: 8,
      }}
    >
      <button
        type="button"
        onClick={() => handleRate(1)}
        disabled={loading}
        style={{
          background: "none",
          border: "none",
          cursor: loading ? "not-allowed" : "pointer",
          padding: 4,
          opacity: rating === 1 ? 1 : 0.5,
          display: "flex",
          alignItems: "center",
        }}
        aria-label="Thumbs up"
      >
        <span style={{ fontSize: 18 }}>👍</span>
      </button>
      <button
        type="button"
        onClick={() => handleRate(-1)}
        disabled={loading}
        style={{
          background: "none",
          border: "none",
          cursor: loading ? "not-allowed" : "pointer",
          padding: 4,
          opacity: rating === -1 ? 1 : 0.5,
          display: "flex",
          alignItems: "center",
        }}
        aria-label="Thumbs down"
      >
        <span style={{ fontSize: 18 }}>👎</span>
      </button>
    </div>
  );
}
