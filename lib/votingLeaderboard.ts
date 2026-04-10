import type { SupabaseClient } from "@supabase/supabase-js";

export type LeaderboardRow = {
  rank: number;
  profileId: string;
  displayName: string;
  voteCount: number;
};

/** UUID strings from Postgres/JS can differ by case; Map keys are case-sensitive. */
function normProfileId(id: string | null | undefined): string | null {
  if (id == null || typeof id !== "string") return null;
  const t = id.trim();
  return t ? t.toLowerCase() : null;
}

function profileDisplayName(p: Record<string, unknown>): string {
  for (const key of ["full_name", "display_name", "name", "username"]) {
    const v = p[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  const email = p.email;
  if (typeof email === "string" && email.includes("@")) {
    return email.split("@")[0]!.trim() || "Voter";
  }
  return "Voter";
}

const PAGE = 1000;

/** PostgREST defaults to max ~1000 rows per request; paginate so totals reflect the full table. */
async function fetchAllVoteProfileIds(
  supabase: SupabaseClient
): Promise<{ rows: { profile_id: unknown; created_by_user_id: unknown }[]; error: string | null }> {
  const rows: { profile_id: unknown; created_by_user_id: unknown }[] = [];
  let from = 0;

  for (;;) {
    const { data, error } = await supabase
      .from("caption_votes")
      .select("profile_id, created_by_user_id, caption_id")
      .order("profile_id", { ascending: true })
      .order("caption_id", { ascending: true })
      .range(from, from + PAGE - 1);

    if (error) {
      return { rows: [], error: error.message };
    }
    const batch = data ?? [];
    rows.push(...batch);
    if (batch.length < PAGE) break;
    from += PAGE;
  }

  return { rows, error: null };
}

export async function loadVotingLeaderboard(
  supabase: SupabaseClient,
  viewerUserId: string | null
): Promise<{
  topFive: LeaderboardRow[];
  viewerRank: number | null;
  viewerVoteCount: number;
  error: string | null;
}> {
  const { rows: votes, error: votesError } = await fetchAllVoteProfileIds(supabase);

  if (votesError) {
    return {
      topFive: [],
      viewerRank: null,
      viewerVoteCount: 0,
      error: votesError,
    };
  }

  const counts = new Map<string, number>();
  for (const row of votes) {
    const raw = (row.profile_id ?? row.created_by_user_id) as string | null;
    const pid = normProfileId(raw);
    if (!pid) continue;
    counts.set(pid, (counts.get(pid) ?? 0) + 1);
  }

  const sorted = [...counts.entries()].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return a[0].localeCompare(b[0]);
  });

  const topFiveIds = sorted.slice(0, 5).map(([id]) => id);
  const idToName = new Map<string, string>();

  if (topFiveIds.length > 0) {
    const { data: profiles } = await supabase.from("profiles").select("*").in("id", topFiveIds);

    for (const p of profiles ?? []) {
      const row = p as Record<string, unknown>;
      const id = normProfileId(row.id as string);
      if (id) idToName.set(id, profileDisplayName(row));
    }
  }

  const topFive: LeaderboardRow[] = sorted.slice(0, 5).map(([profileId, voteCount], i) => ({
    rank: i + 1,
    profileId,
    displayName: idToName.get(profileId) ?? "Voter",
    voteCount,
  }));

  const viewerNorm = normProfileId(viewerUserId);
  let viewerRank: number | null = null;
  let viewerVoteCount = 0;
  if (viewerNorm) {
    viewerVoteCount = counts.get(viewerNorm) ?? 0;
    const idx = sorted.findIndex(([id]) => id === viewerNorm);
    viewerRank = idx === -1 ? null : idx + 1;
  }

  return { topFive, viewerRank, viewerVoteCount, error: null };
}
