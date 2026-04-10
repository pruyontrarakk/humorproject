import type { CSSProperties } from "react";
import type { LeaderboardRow } from "@/lib/votingLeaderboard";
import { votingTheme as T } from "@/lib/votingTheme";

type VotingLeaderboardProps = {
  topFive: LeaderboardRow[];
  viewerUserId: string | null;
  viewerRank: number | null;
  viewerVoteCount: number;
  loadError: string | null;
};

function truncateName(name: string, max = 12) {
  if (name.length <= max) return name;
  return `${name.slice(0, max - 1)}…`;
}

function rankMedal(rank: number): string {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return "";
}

function rankRowStyle(rank: number, isYou: boolean): CSSProperties {
  const base: CSSProperties = {
    borderRadius: 10,
    marginBottom: 4,
    padding: "6px 8px",
    display: "grid",
    gridTemplateColumns: "28px 1fr auto",
    alignItems: "center",
    gap: 6,
  };
  if (isYou) {
    return {
      ...base,
      background: `linear-gradient(90deg, ${T.brown100} 0%, ${T.purpleMuted} 100%)`,
      border: `1px solid ${T.brown600}`,
      boxShadow: `0 0 0 1px ${T.purpleBorder}`,
    };
  }
  if (rank === 1) {
    return {
      ...base,
      background: "linear-gradient(90deg, rgba(250, 204, 21, 0.2) 0%, rgba(251, 191, 36, 0.06) 100%)",
      border: `1px solid rgba(234, 179, 8, 0.35)`,
    };
  }
  if (rank === 2) {
    return {
      ...base,
      background: "linear-gradient(90deg, rgba(203, 213, 225, 0.45) 0%, rgba(226, 232, 240, 0.2) 100%)",
      border: "1px solid rgba(148, 163, 184, 0.35)",
    };
  }
  if (rank === 3) {
    return {
      ...base,
      background: `linear-gradient(90deg, rgba(180, 83, 9, 0.12) 0%, ${T.panelBg} 100%)`,
      border: `1px solid ${T.borderBrown}`,
    };
  }
  return {
    ...base,
    background: T.cardWhite,
    border: `1px solid ${T.borderBrown}`,
  };
}

export default function VotingLeaderboard({
  topFive,
  viewerUserId,
  viewerRank,
  viewerVoteCount,
  loadError,
}: VotingLeaderboardProps) {
  if (loadError) {
    return (
      <div
        style={{
          fontSize: 11,
          color: T.brown700,
          maxWidth: 220,
          textAlign: "center",
          padding: "12px 14px",
          borderRadius: 14,
          background: T.cream,
          border: `1px solid rgba(185, 28, 28, 0.25)`,
        }}
      >
        Can’t load scoreboard
      </div>
    );
  }

  const viewerNorm = viewerUserId?.trim().toLowerCase() ?? "";

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 248,
        borderRadius: 16,
        padding: "12px 12px 14px",
        background: `linear-gradient(165deg, ${T.cardWhite} 0%, ${T.cream} 55%, ${T.panelBg} 100%)`,
        color: T.brown800,
        fontSize: 12,
        border: `1px solid ${T.borderBrown}`,
        boxShadow: `
          0 2px 10px rgba(93, 48, 23, 0.06),
          0 0 0 1px ${T.purpleBorder}
        `,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          marginBottom: 10,
          paddingBottom: 8,
          borderBottom: `2px dashed ${T.brown200}`,
        }}
      >
        <span style={{ fontSize: 17, lineHeight: 1 }} aria-hidden>
          🏆
        </span>
        <div
          style={{
            fontWeight: 800,
            fontSize: 12,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: T.brown800,
          }}
        >
          High{" "}
          <span style={{ color: T.purple }}>scores</span>
        </div>
        <span style={{ fontSize: 16, lineHeight: 1, opacity: 0.85 }} aria-hidden>
          ✨
        </span>
      </div>

      {topFive.length === 0 ? (
        <p
          style={{
            margin: 0,
            textAlign: "center",
            color: T.brown600,
            fontSize: 12,
            padding: "8px 0",
            opacity: 0.9,
          }}
        >
          No scores yet — your turn! 🎮
        </p>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "28px 1fr auto",
              gap: 6,
              padding: "0 8px 6px",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: T.purple,
              opacity: 0.85,
            }}
          >
            <span style={{ color: T.brown600 }}>#</span>
            <span>Player</span>
            <span style={{ textAlign: "right" }}>Pts</span>
          </div>
          <div role="list">
            {topFive.map((row) => {
              const isYou = Boolean(viewerNorm && row.profileId === viewerNorm);
              const medal = rankMedal(row.rank);
              return (
                <div key={row.profileId} role="listitem" style={rankRowStyle(row.rank, isYou)}>
                  <span
                    style={{
                      fontSize: 14,
                      textAlign: "center",
                      lineHeight: 1,
                    }}
                    aria-hidden
                  >
                    {medal || (
                      <span style={{ fontWeight: 800, color: T.brown600, fontSize: 12 }}>{row.rank}</span>
                    )}
                  </span>
                  <span
                    style={{
                      fontWeight: isYou ? 700 : 500,
                      color: isYou ? T.brown900 : T.brown800,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      fontSize: 12,
                    }}
                    title={row.displayName}
                  >
                    {truncateName(row.displayName)}
                    {isYou ? " ★" : ""}
                  </span>
                  <span
                    style={{
                      fontWeight: 800,
                      fontVariantNumeric: "tabular-nums",
                      textAlign: "right",
                      color: T.purple,
                      fontSize: 13,
                    }}
                  >
                    {row.voteCount.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {viewerUserId ? (
        <div
          style={{
            marginTop: 12,
            padding: "10px 10px 8px",
            borderRadius: 12,
            background: T.cream,
            border: `1px solid ${T.borderBrown}`,
            borderLeft: `3px solid ${T.purple}`,
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: T.purple,
              marginBottom: 4,
              opacity: 0.9,
            }}
          >
            Your run
          </div>
          <div style={{ fontSize: 12, color: T.brown800, lineHeight: 1.45 }}>
            {viewerRank != null ? (
              <>
                <span style={{ color: T.brown900, fontWeight: 800 }}>#{viewerRank}</span>
                <span style={{ color: T.brown200, margin: "0 6px" }}>·</span>
                <span style={{ fontWeight: 700, color: T.purple }}>
                  {viewerVoteCount.toLocaleString()} pts
                </span>
              </>
            ) : (
              <>
                <span style={{ color: T.brown600, fontWeight: 700 }}>—</span>
                <span style={{ color: T.brown200, margin: "0 6px" }}>·</span>
                <span style={{ fontWeight: 700, color: T.purple }}>
                  {viewerVoteCount.toLocaleString()} pts
                </span>
                {viewerVoteCount === 0 ? (
                  <span
                    style={{
                      display: "block",
                      fontSize: 10,
                      color: T.brown600,
                      marginTop: 4,
                      opacity: 0.9,
                    }}
                  >
                    Rate memes to climb the board!
                  </span>
                ) : null}
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
