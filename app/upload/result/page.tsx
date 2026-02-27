"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const UPLOAD_RESULT_KEY = "upload-result";

type CaptionRecord = { id?: string; content?: string };

export default function UploadResultPage() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [captions, setCaptions] = useState<CaptionRecord[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem(UPLOAD_RESULT_KEY);
    if (raw) {
      try {
        const data = JSON.parse(raw) as {
          imageUrl: string;
          captions: CaptionRecord[];
        };
        setImageUrl(data.imageUrl ?? null);
        setCaptions(Array.isArray(data.captions) ? data.captions : []);
      } catch {
        // invalid JSON
      }
    }
    setLoaded(true);
  }, []);

  if (!loaded) {
    return (
      <main
        style={{
          minHeight: "100vh",
          backgroundColor: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p style={{ color: "#1a1a1a", opacity: 0.7 }}>Loading…</p>
      </main>
    );
  }

  if (!imageUrl) {
    return (
      <main
        style={{
          minHeight: "100vh",
          backgroundColor: "#ffffff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
        }}
      >
        <p style={{ color: "#1a1a1a", opacity: 0.7 }}>
          No result found. Upload an image first.
        </p>
        <Link
          href="/upload"
          style={{
            padding: "10px 20px",
            backgroundColor: "#1a1a1a",
            color: "#ffffff",
            borderRadius: 8,
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          Go to Upload
        </Link>
      </main>
    );
  }

  const captionsWithContent = captions.filter((c) => c.content?.trim());

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
            marginBottom: "8px",
            color: "#1a1a1a",
          }}
        >
          Generated Captions
        </h1>
        <p
          style={{
            textAlign: "center",
            color: "#1a1a1a",
            opacity: 0.7,
            marginBottom: 32,
            fontSize: 15,
          }}
        >
          {captionsWithContent.length} caption
          {captionsWithContent.length !== 1 ? "s" : ""} generated
        </p>

        <div
          style={{
            maxWidth: 900,
            margin: "0 auto",
            display: "flex",
            flexWrap: "wrap",
            gap: 32,
            alignItems: "flex-start",
          }}
        >
          <div style={{ flex: "1 1 320px" }}>
            <img
              src={imageUrl}
              alt="Uploaded"
              style={{
                width: "100%",
                maxHeight: 400,
                objectFit: "contain",
                borderRadius: 14,
                display: "block",
              }}
            />
          </div>

          <div
            style={{
              flex: "1 1 320px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {captionsWithContent.length === 0 ? (
              <div
                style={{
                  padding: 24,
                  backgroundColor: "#ffffff",
                  borderRadius: 12,
                  border: "1px solid rgba(0, 0, 0, 0.08)",
                }}
              >
                <p style={{ margin: 0, color: "#1a1a1a", opacity: 0.7 }}>
                  No captions were generated.
                </p>
              </div>
            ) : (
              captionsWithContent.map((caption, i) => (
                <div
                  key={caption.id ?? i}
                  style={{
                    padding: 24,
                    backgroundColor: "#ffffff",
                    borderRadius: 12,
                    border: "1px solid rgba(0, 0, 0, 0.08)",
                    fontSize: 16,
                    color: "#1a1a1a",
                    lineHeight: 1.5,
                  }}
                >
                  {caption.content}
                </div>
              ))
            )}
          </div>
        </div>

        <div
          style={{
            marginTop: 32,
            display: "flex",
            justifyContent: "center",
          }}
        >
            <Link
              href="/upload"
              style={{
                padding: "12px 24px",
                backgroundColor: "#1a1a1a",
                color: "#ffffff",
                borderRadius: 12,
                textDecoration: "none",
                fontSize: 16,
                fontWeight: 500,
              }}
            >
              Upload another
            </Link>
        </div>
      </div>
    </main>
  );
}
