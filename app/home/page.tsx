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

  // get total count for pagination
  let totalCount: number;
  if (imageIdsForCategory) {
    totalCount = imageIdsForCategory.length;
  } else {
    const { count } = await supabase
      .from("images")
      .select("*", { count: "exact", head: true });
    totalCount = count ?? 0;
  }

  const totalPages = totalCount ? Math.ceil(totalCount / itemsPerPage) : 1;

  // get images from supabase with pagination (filtered by category when selected)
  let images: ImageRow[] = [];
  if (imageIdsForCategory && imageIdsForCategory.length === 0) {
    // category has no images — skip query
  } else {
    let imagesQuery = supabase
      .from("images")
      .select("id, url, created_datetime_utc")
      .order("created_datetime_utc", { ascending: false });

    if (imageIdsForCategory && imageIdsForCategory.length > 0) {
      imagesQuery = imagesQuery.in("id", imageIdsForCategory);
    }

    const { data: imagesData, error: imagesError } = await imagesQuery.range(
      offset,
      offset + itemsPerPage - 1
    );

    if (imagesError) {
      return <pre>Error loading images: {imagesError.message}</pre>;
    }
    images = imagesData ?? [];
  }

  // get captions for those images (only when we have images)
  const captionsByImageId = new Map<string, CaptionRow[]>();
  if (images.length > 0) {
    const imageIds = images.map((img) => img.id);
    const { data: captions, error: captionsError } = await supabase
      .from("captions")
      .select("id, image_id, content")
      .in("image_id", imageIds);

    if (captionsError) {
      return <pre>Error loading captions: {captionsError.message}</pre>;
    }

    (captions ?? []).forEach((caption) => {
      const arr = captionsByImageId.get(caption.image_id) ?? [];
      arr.push(caption);
      captionsByImageId.set(caption.image_id, arr);
    });
  }

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
              const first = imageCaptions[0];
              return imageCaptions.length > 0 && !!first?.content?.trim();
            })
            .map((img: ImageRow) => {
              const imageCaptions = captionsByImageId.get(img.id) ?? [];
              const firstCaption = imageCaptions[0] ?? null;

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
                  {firstCaption?.content ? (
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

