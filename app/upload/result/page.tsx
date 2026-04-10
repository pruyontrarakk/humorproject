"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { votingTheme as vt } from "@/lib/votingTheme";

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
          backgroundColor: vt.mainBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p style={{ color: vt.textMuted }}>Loading…</p>
      </main>
    );
  }

  if (!imageUrl) {
    return (
      <main
        style={{
          minHeight: "100vh",
          backgroundColor: vt.mainBg,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
        }}
      >
        <p style={{ color: vt.textMuted }}>
          No result found. Upload an image first.
        </p>
        <Link
          href="/upload"
          style={{
            padding: "10px 20px",
            backgroundColor: vt.ctaBg,
            color: vt.ctaFg,
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
        backgroundColor: vt.mainBg,
      }}
    >
      <div
        style={{
          borderTopLeftRadius: 40,
          borderTopRightRadius: 40,
          background: vt.panelBgGradient,
          padding: "40px clamp(16px, 5vw, 88px) 72px",
          minHeight: "calc(100vh - 0px)",
          boxShadow: vt.panelShadow,
          borderTop: `1px solid ${vt.borderBrownLight}`,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 8 }}>
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
            Generated Captions
          </h1>
        </div>
        <p
          style={{
            textAlign: "center",
            color: vt.textMuted,
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
                  border: `1px solid ${vt.borderBrown}`,
                  boxShadow: vt.cardShadow,
                }}
              >
                <p style={{ margin: 0, color: vt.textMuted }}>
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
                    border: `1px solid ${vt.borderBrown}`,
                    fontSize: 16,
                    color: vt.brown800,
                    lineHeight: 1.5,
                    boxShadow: vt.cardShadow,
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
                backgroundColor: vt.ctaBg,
                color: vt.ctaFg,
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
