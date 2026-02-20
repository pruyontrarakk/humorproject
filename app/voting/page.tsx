import { getSupabase } from "@/lib/supabaseClient";
import { createClient } from "@/lib/supabase/server";
import VotingCard from "@/app/components/VotingCard";
import VotingUndoBar from "@/app/components/VotingUndoBar";
import VotingPageResume from "@/app/components/VotingPageResume";

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
    return <pre style={{ padding: 24 }}>Error loading captions: {captionsError.message}</pre>;
  }

  const captions: CaptionRow[] = captionsData ?? [];
  const imageIdToFirstCaption = new Map<string, CaptionRow>();
  const invalidCaptionText = (t: string) => !t || t.toLowerCase() === "next";
  for (const c of captions) {
    const trimmed = c.content?.trim();
    if (invalidCaptionText(trimmed ?? "")) continue;
    if (!imageIdToFirstCaption.has(c.image_id)) {
      imageIdToFirstCaption.set(c.image_id, { ...c, content: trimmed });
    }
  }
  const votableImageIds = Array.from(imageIdToFirstCaption.keys());

  if (votableImageIds.length === 0) {
    const serverSupabase = await createClient();
    const { data: { user } } = await serverSupabase.auth.getUser();
    return (
      <main style={{ minHeight: "100vh", backgroundColor: "#ffffff" }}>
        <div
          style={{
            borderTopLeftRadius: 40,
            borderTopRightRadius: 40,
            backgroundColor: "#f8f9fa",
            padding: "40px 88px 72px 88px",
            minHeight: "calc(100vh - 0px)",
            boxShadow: "0 -4px 24px rgba(0, 0, 0, 0.06)",
          }}
        >
          <h1 style={{ textAlign: "center", fontSize: "2rem", fontWeight: "bold", marginBottom: "24px", color: "#1a1a1a" }}>
            Vote on captions
          </h1>
          {!user ? (
            <p style={{ textAlign: "center", color: "#1a1a1a", opacity: 0.9, marginBottom: 24 }}>
              Sign in with Google to vote.
            </p>
          ) : null}
          <p style={{ textAlign: "center", color: "#1a1a1a", opacity: 0.8, marginTop: 24 }}>
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
    return <pre style={{ padding: 24 }}>Error loading images: {imagesError.message}</pre>;
  }

  const orderedImages: ImageRow[] = imagesData ?? [];
  const serverSupabase = await createClient();
  const {
    data: { user },
  } = await serverSupabase.auth.getUser();

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

  const nextPageUrl =
    currentPage < totalPages ? `/voting?page=${currentPage + 1}` : null;
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

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#ffffff",
      }}
    >
      {user && totalPages >= 1 ? (
        <VotingPageResume currentPage={currentPage} totalPages={totalPages} />
      ) : null}
      <div
        style={{
          borderTopLeftRadius: 40,
          borderTopRightRadius: 40,
          backgroundColor: "#f8f9fa",
          padding: "20px 32px 40px 32px",
          minHeight: "calc(100vh - 0px)",
          boxShadow: "0 -4px 24px rgba(0, 0, 0, 0.06)",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            fontSize: "2rem",
            fontWeight: "bold",
            marginBottom: "24px",
            color: "#1a1a1a",
          }}
        >
          Vote on captions
        </h1>

        {user && img && hasCaption ? (
          <p
            style={{
              textAlign: "center",
              fontSize: 14,
              color: "rgba(0,0,0,0.6)",
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
              color: "#1a1a1a",
              opacity: 0.9,
              marginBottom: 16,
            }}
          >
            Sign in with Google to vote.
          </p>
        ) : null}

        <div
          style={{
            maxWidth: 480,
            margin: "12px auto 0",
          }}
        >
          {!img ? (
            <p
              style={{
                textAlign: "center",
                color: "#1a1a1a",
                opacity: 0.8,
                marginTop: 16,
              }}
            >
              All done for now!
            </p>
          ) : !hasCaption ? (
            <p
              style={{
                textAlign: "center",
                color: "#1a1a1a",
                opacity: 0.8,
                marginTop: 16,
              }}
            >
              All done for now!
            </p>
          ) : (
            <VotingCard
              captionId={firstCaption.id}
              userId={user?.id ?? null}
              nextPageUrl={nextPageUrl}
            >
              <figure
                style={{
                  margin: 0,
                  width: "100%",
                  display: "block",
                  overflow: "hidden",
                  borderRadius: firstCaption.content ? "14px 14px 0 0" : 14,
                }}
              >
                <img
                  src={img.url}
                  alt=""
                  style={{
                    width: "100%",
                    height: "52vh",
                    display: "block",
                    objectFit: "cover",
                    borderRadius: firstCaption.content ? "14px 14px 0 0" : 14,
                  }}
                />
                {firstCaption.content && firstCaption.content.trim().toLowerCase() !== "next" ? (
                  <figcaption
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      margin: 0,
                      marginTop: -1,
                      padding: "12px 16px",
                      background: "rgba(0,0,0,0.04)",
                      borderRadius: "0 0 14px 14px",
                      fontSize: 18,
                      color: "#1a1a1a",
                      lineHeight: 1.5,
                    }}
                  >
                    {firstCaption.content}
                  </figcaption>
                ) : null}
              </figure>
            </VotingCard>
          )}
        </div>

        {showUndo && previousCaption && previousPageUrl ? (
          <VotingUndoBar
            previousCaptionId={previousCaption.id}
            previousPageUrl={previousPageUrl}
          />
        ) : null}
      </div>
    </main>
  );
}
