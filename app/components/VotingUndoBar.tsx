"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type VotingUndoBarProps = {
  previousCaptionId: string;
  previousPageUrl: string;
};

export default function VotingUndoBar({
  previousCaptionId,
  previousPageUrl,
}: VotingUndoBarProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleUndo = async () => {
    if (loading) return;
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
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ caption_id: previousCaptionId }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const msg = data.details ?? data.error ?? "Failed to undo vote";
        throw new Error(msg);
      }
      setLoading(false);
      router.push(previousPageUrl);
      router.refresh();
    } catch (err) {
      console.error("Error undoing vote:", err);
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "sticky",
        bottom: 0,
        left: 0,
        right: 0,
        marginTop: 24,
        paddingBottom: 24,
        paddingTop: 16,
        textAlign: "center",
        background: "#f8f9fa",
      }}
    >
      <button
        type="button"
        onClick={handleUndo}
        disabled={loading}
        aria-label="Undo last vote"
        style={{
          padding: 8,
          border: "none",
          background: "none",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.7 : 1,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "transform 0.15s ease",
        }}
        onMouseDown={(e) => {
          if (!loading) e.currentTarget.style.transform = "scale(0.92)";
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = "";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "";
        }}
      >
        <svg
          width={24}
          height={24}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: "#1a1a1a", flexShrink: 0 }}
          aria-hidden
        >
          <path d="M3 10h10a5 5 0 0 1 5 5v0a5 5 0 0 1-5 5H7" />
          <path d="M7 15l-4-4 4-4" />
        </svg>
      </button>
    </div>
  );
}
