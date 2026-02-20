import { getSupabase } from "@/lib/supabaseClient";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import VotingCard from "@/app/components/VotingCard";

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

  // Same as home: get images first (paginated)
  const { count } = await supabase
    .from("images")
    .select("*", { count: "exact", head: true });
  const totalCount = count ?? 0;
  const totalPages = totalCount ? Math.ceil(totalCount / itemsPerPage) : 1;

  const { data: imagesData, error: imagesError } = await supabase
    .from("images")
    .select("id, url, created_datetime_utc")
    .order("created_datetime_utc", { ascending: false })
    .range(offset, offset + itemsPerPage - 1);

  if (imagesError) {
    return <pre style={{ padding: 24 }}>Error loading images: {imagesError.message}</pre>;
  }
  const images: ImageRow[] = imagesData ?? [];
  const img = images[0] ?? null;

  // Same as home: get captions for those images (captions.image_id = images.id)
  const captionsByImageId = new Map<string, CaptionRow[]>();
  if (images.length > 0) {
    const imageIds = images.map((i) => i.id);
    const { data: captions, error: captionsError } = await supabase
      .from("captions")
      .select("id, image_id, content")
      .in("image_id", imageIds);

    if (captionsError) {
      return <pre style={{ padding: 24 }}>Error loading captions: {captionsError.message}</pre>;
    }

    (captions ?? []).forEach((caption) => {
      const arr = captionsByImageId.get(caption.image_id) ?? [];
      arr.push(caption);
      captionsByImageId.set(caption.image_id, arr);
    });
  }

  const imageCaptions = img ? captionsByImageId.get(img.id) ?? [] : [];
  const firstCaption = imageCaptions[0] ?? null;
  const hasCaption = firstCaption?.content?.trim();

  if (img && !hasCaption && currentPage < totalPages) {
    redirect(`/voting?page=${currentPage + 1}`);
  }

  const serverSupabase = await createClient();
  const {
    data: { user },
  } = await serverSupabase.auth.getUser();

  const nextPageUrl =
    currentPage < totalPages ? `/voting?page=${currentPage + 1}` : null;

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#ffffff",
      }}
    >
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

        {!user ? (
          <p
            style={{
              textAlign: "center",
              color: "#1a1a1a",
              opacity: 0.9,
              marginBottom: 24,
            }}
          >
            Sign in with Google to vote.
          </p>
        ) : null}

        <div
          style={{
            maxWidth: 560,
            margin: "20px auto 0",
          }}
        >
          {!img ? (
            <p
              style={{
                textAlign: "center",
                color: "#1a1a1a",
                opacity: 0.8,
                marginTop: 24,
              }}
            >
              No images found.
            </p>
          ) : !hasCaption ? (
            <p
              style={{
                textAlign: "center",
                color: "#1a1a1a",
                opacity: 0.8,
                marginTop: 24,
              }}
            >
              No more images with captions to vote on.
            </p>
          ) : (
            <VotingCard
              captionId={firstCaption.id}
              userId={user?.id ?? null}
              nextPageUrl={nextPageUrl}
            >
              <figure style={{ margin: 0 }}>
                <img
                  src={img.url}
                  alt=""
                  style={{
                    width: "100%",
                    borderRadius: 14,
                    display: "block",
                    objectFit: "contain",
                    maxHeight: "70vh",
                  }}
                />
                {firstCaption.content ? (
                  <figcaption
                    style={{
                      marginTop: 16,
                      padding: "12px 16px",
                      background: "rgba(0,0,0,0.04)",
                      borderRadius: 10,
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
      </div>
    </main>
  );
}
