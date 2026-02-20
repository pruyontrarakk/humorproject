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

type CategoryRow = {
  id: string;
  name: string;
};

const ALL_CATEGORIES_ID = "all";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string }>;
}) {
  const params = await searchParams;
  const currentPage = parseInt(params?.page || "1", 10);
  const selectedCategoryId = params?.category ?? ALL_CATEGORIES_ID;
  const itemsPerPage = 12;
  const offset = (currentPage - 1) * itemsPerPage;

  const supabase = getSupabase();

  // fetch all categories for the tabs
  const { data: categories, error: categoriesError } = await supabase
    .from("common_use_categories")
    .select("id, name")
    .order("name", { ascending: true });

  if (categoriesError) {
    return <pre>Error loading categories: {categoriesError.message}</pre>;
  }

  let imageIdsForCategory: string[] | null = null;
  if (selectedCategoryId !== ALL_CATEGORIES_ID) {
    const { data: mapping, error: mappingError } = await supabase
      .from("common_use_category_image_mappings")
      .select("image_id")
      .eq("common_use_category_id", selectedCategoryId);

    if (mappingError) {
      return <pre>Error loading category mapping: {mappingError.message}</pre>;
    }
    imageIdsForCategory = (mapping ?? []).map((row) => row.image_id);
  }

  // Only include images that have at least one non-empty caption (and valid image)
  const { data: captionsWithContent } = await supabase
    .from("captions")
    .select("id, image_id, content")
    .not("content", "is", null);

  const imageIdsWithCaption = new Set<string>();
  (captionsWithContent ?? []).forEach((c) => {
    const t = c.content?.trim();
    if (t && t.toLowerCase() !== "next") imageIdsWithCaption.add(c.image_id);
  });

  if (imageIdsWithCaption.size === 0) {
    const totalPages = 1;
    const paginationBase =
      selectedCategoryId === ALL_CATEGORIES_ID
        ? "/home?"
        : `/home?category=${encodeURIComponent(selectedCategoryId)}&`;
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
            The Humor Project
          </h1>
          <p style={{ gridColumn: "1 / -1", textAlign: "center", color: "#1a1a1a", opacity: 0.7, marginTop: 24 }}>
            No images with captions found.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginTop: "32px", alignItems: "center" }}>
            <span style={{ color: "#1a1a1a" }}>Page 1 of 1</span>
          </div>
        </div>
      </main>
    );
  }

  let imagesQuery = supabase
    .from("images")
    .select("id, url, created_datetime_utc")
    .in("id", Array.from(imageIdsWithCaption))
    .order("created_datetime_utc", { ascending: false });

  const { data: allDisplayableImages, error: imagesError } = await imagesQuery;

  if (imagesError) {
    return <pre>Error loading images: {imagesError.message}</pre>;
  }

  let displayableOrdered: ImageRow[] = (allDisplayableImages ?? []).filter(
    (img) => img?.url
  );

  if (imageIdsForCategory && imageIdsForCategory.length > 0) {
    const categorySet = new Set(imageIdsForCategory);
    displayableOrdered = displayableOrdered.filter((img) =>
      categorySet.has(img.id)
    );
  } else if (imageIdsForCategory && imageIdsForCategory.length === 0) {
    displayableOrdered = [];
  }

  const totalCount = displayableOrdered.length;
  const totalPages = totalCount ? Math.ceil(totalCount / itemsPerPage) : 1;
  const pageImages = displayableOrdered.slice(offset, offset + itemsPerPage);

  const captionsByImageId = new Map<string, CaptionRow[]>();
  if (pageImages.length > 0) {
    const { data: captions, error: captionsError } = await supabase
      .from("captions")
      .select("id, image_id, content")
      .in("image_id", pageImages.map((img) => img.id))
      .not("content", "is", null);

    if (captionsError) {
      return <pre>Error loading captions: {captionsError.message}</pre>;
    }

    (captions ?? []).forEach((caption) => {
      const t = caption.content?.trim();
      if (!t || t.toLowerCase() === "next") return;
      const arr = captionsByImageId.get(caption.image_id) ?? [];
      arr.push(caption);
      captionsByImageId.set(caption.image_id, arr);
    });
  }

  const images = pageImages;

  const paginationBase =
    selectedCategoryId === ALL_CATEGORIES_ID
      ? "/home?"
      : `/home?category=${encodeURIComponent(selectedCategoryId)}&`;

  // only render the first caption for each image
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
          The Humor Project
        </h1>

        {/* Category tabs */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "10px",
            marginBottom: "24px",
          }}
        >
          <Link
            href="/home"
            style={{
              padding: "12px 22px",
              borderRadius: 9999,
              fontWeight: 500,
              textDecoration: "none",
              border: "1px solid rgba(0, 0, 0, 0.12)",
              backgroundColor:
                selectedCategoryId === ALL_CATEGORIES_ID
                  ? "rgba(0, 0, 0, 0.08)"
                  : "#ffffff",
              color: "#1a1a1a",
            }}
          >
            All
          </Link>
          {(categories ?? []).map((cat: CategoryRow) => (
            <Link
              key={cat.id}
              href={`/home?category=${encodeURIComponent(cat.id)}`}
              style={{
                padding: "12px 22px",
                borderRadius: 9999,
                fontWeight: 500,
                textDecoration: "none",
                border: "1px solid rgba(0, 0, 0, 0.12)",
                backgroundColor:
                  selectedCategoryId === cat.id
                    ? "rgba(0, 0, 0, 0.08)"
                    : "#ffffff",
                color: "#1a1a1a",
              }}
            >
              {cat.name}
            </Link>
          ))}
        </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          marginTop: 20,
        }}
      >
        {images.length === 0 ? (
          <p
            style={{
              gridColumn: "1 / -1",
              textAlign: "center",
              color: "#1a1a1a",
              opacity: 0.7,
              marginTop: 24,
            }}
          >
            {selectedCategoryId !== ALL_CATEGORIES_ID
              ? "No images in this category."
              : "No images found."}
          </p>
        ) : (
          images
            .filter((img: ImageRow) => {
              const imageCaptions = captionsByImageId.get(img.id) ?? [];
              const withContent = imageCaptions.find((c) => c.content?.trim());
              return !!img?.url && !!withContent;
            })
            .map((img: ImageRow) => {
              const imageCaptions = captionsByImageId.get(img.id) ?? [];
              const firstCaption =
                imageCaptions.find((c) => c.content?.trim()) ?? imageCaptions[0] ?? null;

              return (
                <figure key={img.id} style={{ margin: 0 }}>
                  <img
                    src={img.url}
                    alt="Supabase image"
                    style={{
                      width: "100%",
                      height: 320,
                      objectFit: "cover",
                      borderRadius: 14,
                      display: "block",
                    }}
                  />
                  {firstCaption?.content && firstCaption.content.trim().toLowerCase() !== "next" ? (
                    <figcaption
                      style={{
                        marginTop: 10,
                        fontSize: 15,
                        color: "#1a1a1a",
                        opacity: 1,
                        lineHeight: 1.4,
                      }}
                    >
                      {firstCaption.content}
                    </figcaption>
                  ) : null}
                </figure>
              );
            })
        )}
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
              href={`${paginationBase}page=${currentPage - 1}`}
              style={{
                padding: "10px 20px",
                backgroundColor: "#ffffff",
                color: "#1a1a1a",
                textDecoration: "none",
                borderRadius: 14,
                border: "1px solid rgba(0, 0, 0, 0.12)",
                display: "inline-block",
              }}
            >
              Previous
            </Link>
          ) : (
            <span
              style={{
                padding: "10px 20px",
                backgroundColor: "rgba(0, 0, 0, 0.04)",
                color: "rgba(0, 0, 0, 0.4)",
                borderRadius: 14,
                border: "1px solid rgba(0, 0, 0, 0.08)",
                cursor: "not-allowed",
              }}
            >
              Previous
            </span>
          )}
          <span style={{ color: "#1a1a1a" }}>
            Page {currentPage} of {totalPages}
          </span>
          {currentPage < totalPages ? (
            <Link
              href={`${paginationBase}page=${currentPage + 1}`}
              style={{
                padding: "10px 20px",
                backgroundColor: "#ffffff",
                color: "#1a1a1a",
                textDecoration: "none",
                borderRadius: 14,
                border: "1px solid rgba(0, 0, 0, 0.12)",
                display: "inline-block",
              }}
            >
              Next
            </Link>
          ) : (
            <span
              style={{
                padding: "10px 20px",
                backgroundColor: "rgba(0, 0, 0, 0.04)",
                color: "rgba(0, 0, 0, 0.4)",
                borderRadius: 14,
                border: "1px solid rgba(0, 0, 0, 0.08)",
                cursor: "not-allowed",
              }}
            >
              Next
            </span>
          )}
        </div>
      </div>
    </main>
  );
}

