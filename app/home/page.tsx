import { getSupabase } from "@/lib/supabaseClient";
import Link from "next/link";

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

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const currentPage = parseInt(params?.page || "1", 10);
  const itemsPerPage = 12;
  const offset = (currentPage - 1) * itemsPerPage;

  // get total count for pagination
  const supabase = getSupabase();
  const { count } = await supabase
    .from("images")
    .select("*", { count: "exact", head: true });

  const totalPages = count ? Math.ceil(count / itemsPerPage) : 1;

  // get images from supabase with pagination
  const { data: images, error: imagesError } = await supabase
    .from("images")
    .select("id, url, created_datetime_utc")
    .order("created_datetime_utc", { ascending: false })
    .range(offset, offset + itemsPerPage - 1);

  if (imagesError) {
    return <pre>Error loading images: {imagesError.message}</pre>;
  }

  if (!images || images.length === 0) {
    return <p>No images found.</p>;
  }

  // get captions for those images
  const imageIds = images.map((img) => img.id);

  const { data: captions, error: captionsError } = await supabase
    .from("captions")
    .select("id, image_id, content")
    .in("image_id", imageIds);

  if (captionsError) {
    return <pre>Error loading captions: {captionsError.message}</pre>;
  }

  // group captions by image_id
  const captionsByImageId = new Map<string, CaptionRow[]>();

  (captions ?? []).forEach((caption) => {
    const arr = captionsByImageId.get(caption.image_id) ?? [];
    arr.push(caption);
    captionsByImageId.set(caption.image_id, arr);
  });

  // only render the first caption for each image
  return (
    <main
      style={{
        padding: "40px 88px 72px 88px",
        backgroundColor: "var(--background)",
        color: "var(--foreground)",
        minHeight: "100vh",
      }}
    >
      <h1
        style={{
          textAlign: "center",
          fontSize: "2rem",
          fontWeight: "bold",
          marginBottom: "24px",
          color: "var(--foreground)",
        }}
      >
        The Humor Project
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          marginTop: 20,
        }}
      >
        {images.map((img: ImageRow) => {
          const imageCaptions = captionsByImageId.get(img.id) ?? [];
          const firstCaption = imageCaptions[0] ?? null;

          return (
            <div
              key={img.id}
              style={{
                border: "1px solid rgba(237, 237, 237, 0.2)",
                borderRadius: 16,
                padding: 12,
                backgroundColor: "rgba(237, 237, 237, 0.05)",
              }}
            >
              <img
                src={img.url}
                alt="Supabase image"
                style={{
                  width: "100%",
                  height: 320,
                  objectFit: "cover",
                  borderRadius: 12,
                }}
              />

              {firstCaption ? (
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 15,
                    color: "var(--foreground)",
                  }}
                >
                  {firstCaption.content}
                </div>
              ) : (
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 15,
                    opacity: 0.6,
                    color: "var(--foreground)",
                  }}
                >
                  No captions for this image.
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Simple pagination controls */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "16px",
          marginTop: "32px",
          alignItems: "center",
        }}
      >
        {currentPage > 1 ? (
          <Link
            href={`?page=${currentPage - 1}`}
            style={{
              padding: "8px 16px",
              backgroundColor: "rgba(237, 237, 237, 0.1)",
              color: "var(--foreground)",
              textDecoration: "none",
              borderRadius: "6px",
              border: "1px solid rgba(237, 237, 237, 0.2)",
              display: "inline-block",
            }}
          >
            Previous
          </Link>
        ) : (
          <span
            style={{
              padding: "8px 16px",
              backgroundColor: "rgba(237, 237, 237, 0.05)",
              color: "rgba(237, 237, 237, 0.4)",
              borderRadius: "6px",
              border: "1px solid rgba(237, 237, 237, 0.1)",
              cursor: "not-allowed",
            }}
          >
            Previous
          </span>
        )}
        <span style={{ color: "var(--foreground)" }}>
          Page {currentPage} of {totalPages}
        </span>
        {currentPage < totalPages ? (
          <Link
            href={`?page=${currentPage + 1}`}
            style={{
              padding: "8px 16px",
              backgroundColor: "rgba(237, 237, 237, 0.1)",
              color: "var(--foreground)",
              textDecoration: "none",
              borderRadius: "6px",
              border: "1px solid rgba(237, 237, 237, 0.2)",
              display: "inline-block",
            }}
          >
            Next
          </Link>
        ) : (
          <span
            style={{
              padding: "8px 16px",
              backgroundColor: "rgba(237, 237, 237, 0.05)",
              color: "rgba(237, 237, 237, 0.4)",
              borderRadius: "6px",
              border: "1px solid rgba(237, 237, 237, 0.1)",
              cursor: "not-allowed",
            }}
          >
            Next
          </span>
        )}
      </div>
    </main>
  );
}

