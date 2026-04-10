import { getSupabase } from "@/lib/supabaseClient";
import { createClient } from "@/lib/supabase/server";
import VotingDeck from "@/app/components/VotingDeck";
import VotingLeaderboard from "@/app/components/VotingLeaderboard";
import VotingUndoBar from "@/app/components/VotingUndoBar";
import VotingPageResume from "@/app/components/VotingPageResume";
import { safeSupabaseErrorMessage } from "@/lib/safeSupabaseError";
import { loadVotingLeaderboard } from "@/lib/votingLeaderboard";
import { votingTheme as vt } from "@/lib/votingTheme";

type ImageRow = {
  id: string;
  url: string;
  created_datetime_utc: string | null;
};

type CaptionRow = {
  id: string;
  image_id: string;
  content: string | null;
};

export default async function VotingPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const currentPage = parseInt(params?.page || "1", 10);
  const itemsPerPage = 1;
  const offset = (currentPage - 1) * itemsPerPage;

  const supabase = getSupabase();

  const { data: captionsData, error: captionsError } = await supabase
    .from("captions")
    .select("id, image_id, content")
    .not("content", "is", null);

  if (captionsError) {
    return (
      <pre style={{ padding: 24, background: vt.mainBg, color: vt.brown800 }}>
        Error loading captions:{" "}
        {safeSupabaseErrorMessage(captionsError.message)}
      </pre>
    );
  }

  const captions: CaptionRow[] = captionsData ?? [];
  const imageIdToFirstCaption = new Map<string, CaptionRow>();
  const invalidCaptionText = (t: string) => !t || t.toLowerCase() === "next";
  for (const c of captions) {
    const trimmed = c.content?.trim();
    if (invalidCaptionText(trimmed ?? "")) continue;
    if (!imageIdToFirstCaption.has(c.image_id)) {
      imageIdToFirstCaption.set(c.image_id, { ...c, content: trimmed ?? null });
    }
  }
  const votableImageIds = Array.from(imageIdToFirstCaption.keys());

  if (votableImageIds.length === 0) {
    const serverSupabase = await createClient();
    const { data: { user } } = await serverSupabase.auth.getUser();
    const leaderboard = await loadVotingLeaderboard(serverSupabase, user?.id ?? null);
    return (
      <main style={{ minHeight: "100vh", backgroundColor: vt.mainBg }}>
        <div
          style={{
            borderTopLeftRadius: 40,
            borderTopRightRadius: 40,
            background: vt.panelBgGradient,
            padding: "40px clamp(16px, 5vw, 32px) 72px",
            minHeight: "calc(100vh - 0px)",
            boxShadow: vt.panelShadow,
            position: "relative",
            borderTop: `1px solid ${vt.borderBrownLight}`,
          }}
        >
          <div style={{ position: "absolute", top: 40, right: "clamp(16px, 5vw, 32px)", zIndex: 2 }}>
            <VotingLeaderboard
              topFive={leaderboard.topFive}
              viewerUserId={user?.id ?? null}
              viewerRank={leaderboard.viewerRank}
              viewerVoteCount={leaderboard.viewerVoteCount}
              loadError={leaderboard.error}
            />
          </div>
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            <h1
              style={{
                display: "inline-block",
                fontSize: "2rem",
                fontWeight: "bold",
                margin: 0,
                color: vt.brown800,
                borderBottom: `3px solid ${vt.purple}`,
                paddingBottom: 6,
              }}
            >
              Voting
            </h1>
          </div>
          <p
            style={{
              textAlign: "center",
              color: vt.textMuted,
              margin: "0 auto 24px",
              maxWidth: 720,
              lineHeight: 1.55,
              fontSize: 15,
            }}
          >
            We want to understand how funny the image and caption are together—like getting the meme as a whole, with both in mind.
          </p>
          {!user ? (
            <p style={{ textAlign: "center", color: vt.brown700, marginBottom: 24 }}>Sign in with Google to vote.</p>
          ) : null}
          <p style={{ textAlign: "center", color: vt.textMuted, marginTop: 24 }}>
            No images with captions to vote on.
          </p>
        </div>
      </main>
    );
  }

  const { data: imagesData, error: imagesError } = await supabase
    .from("images")
    .select("id, url, created_datetime_utc")
    .in("id", votableImageIds)
    .order("created_datetime_utc", { ascending: false });

  if (imagesError) {
    return (
      <pre style={{ padding: 24, background: vt.mainBg, color: vt.brown800 }}>
        Error loading images:{" "}
        {safeSupabaseErrorMessage(imagesError.message)}
      </pre>
    );
  }

  const orderedImages: ImageRow[] = imagesData ?? [];
  const serverSupabase = await createClient();
  const {
    data: { user },
  } = await serverSupabase.auth.getUser();

  const leaderboard = await loadVotingLeaderboard(serverSupabase, user?.id ?? null);

  const votedCaptionIds = new Set<string>();
  if (user) {
    const { data: votesData } = await serverSupabase
      .from("caption_votes")
      .select("caption_id")
      .eq("profile_id", user.id);
    (votesData ?? []).forEach((v) => votedCaptionIds.add(v.caption_id));
  }

  const unvotedImages = orderedImages.filter(
    (img) => !votedCaptionIds.has(imageIdToFirstCaption.get(img.id)?.id ?? "")
  );

  const totalCount = unvotedImages.length;
  const totalPages = totalCount ? Math.ceil(totalCount / itemsPerPage) : 1;

  const img = unvotedImages[offset] ?? null;
  const firstCaption = img ? imageIdToFirstCaption.get(img.id) ?? null : null;
  const hasCaption = Boolean(firstCaption?.content?.trim());

  const previousPageUrl =
    currentPage > 1 ? `/voting?page=${currentPage - 1}` : null;
  const previousImage =
    currentPage > 1 ? unvotedImages[offset - 1] ?? null : null;
  const previousCaption = previousImage
    ? imageIdToFirstCaption.get(previousImage.id) ?? null
    : null;
  const showUndo =
    Boolean(user) &&
    currentPage > 1 &&
    previousCaption != null &&
    previousPageUrl != null;

  const voteQueue = unvotedImages.map((image) => {
    const cap = imageIdToFirstCaption.get(image.id)!;
    return {
      captionId: cap.id,
      imageUrl: image.url,
      captionText: cap.content?.trim() ?? "",
    };
  });

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: vt.mainBg,
      }}
    >
      {user && totalPages >= 1 ? (
        <VotingPageResume currentPage={currentPage} totalPages={totalPages} />
      ) : null}
      <div
        style={{
          borderTopLeftRadius: 40,
          borderTopRightRadius: 40,
          background: vt.panelBgGradient,
          padding: "20px clamp(12px, 4vw, 20px) 40px",
          minHeight: "calc(100vh - 0px)",
          boxShadow: vt.panelShadow,
          position: "relative",
          borderTop: `1px solid ${vt.borderBrownLight}`,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 20,
            right: "clamp(12px, 4vw, 20px)",
            zIndex: 2,
          }}
        >
          <VotingLeaderboard
            topFive={leaderboard.topFive}
            viewerUserId={user?.id ?? null}
            viewerRank={leaderboard.viewerRank}
            viewerVoteCount={leaderboard.viewerVoteCount}
            loadError={leaderboard.error}
          />
        </div>
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <h1
            style={{
              display: "inline-block",
              fontSize: "2rem",
              fontWeight: "bold",
              margin: 0,
              color: vt.brown800,
              borderBottom: `3px solid ${vt.purple}`,
              paddingBottom: 6,
            }}
          >
            Voting
          </h1>
        </div>
        <p
          style={{
            textAlign: "center",
            color: vt.textMuted,
            margin: "0 auto 24px",
            maxWidth: 720,
            lineHeight: 1.55,
            fontSize: 15,
          }}
        >
          We want to understand how funny the image and caption are together—like getting the meme as a whole, with both in mind.
        </p>

        {user && img && hasCaption ? (
          <p
            style={{
              textAlign: "center",
              fontSize: 14,
              color: vt.purple,
              fontWeight: 600,
              marginBottom: 6,
            }}
          >
            {currentPage} of {totalCount} · {Math.max(0, totalCount - currentPage)} left
          </p>
        ) : null}

        {!user ? (
          <p
            style={{
              textAlign: "center",
              color: vt.brown700,
              marginBottom: 16,
            }}
          >
            Sign in with Google to vote.
          </p>
        ) : null}

        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "center",
            gap: 12,
            margin: "12px 0 0",
            width: "100%",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              flex: "0 1 480px",
              maxWidth: 480,
              width: "100%",
            }}
          >
            {!img ? (
              <p
                style={{
                  textAlign: "center",
                  color: vt.textMuted,
                  marginTop: 16,
                }}
              >
                All done for now!
              </p>
            ) : !hasCaption ? (
              <p
                style={{
                  textAlign: "center",
                  color: vt.textMuted,
                  marginTop: 16,
                }}
              >
                All done for now!
              </p>
            ) : firstCaption ? (
              <VotingDeck
                queue={voteQueue}
                page={currentPage}
                userId={user?.id ?? null}
              />
            ) : (
              <p
                style={{
                  textAlign: "center",
                  color: vt.textMuted,
                  marginTop: 16,
                }}
              >
                All done for now!
              </p>
            )}
          </div>
          {showUndo &&
          previousCaption &&
          previousPageUrl &&
          img &&
          hasCaption &&
          firstCaption ? (
            <div style={{ flexShrink: 0, paddingTop: 10 }}>
              <VotingUndoBar
                previousCaptionId={previousCaption.id}
                previousPageUrl={previousPageUrl}
              />
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
