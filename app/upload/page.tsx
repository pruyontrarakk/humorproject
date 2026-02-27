"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const API_BASE = "https://api.almostcrackd.ai";

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
];

const ACCEPT_STRING = ACCEPTED_TYPES.join(",");

const UPLOAD_RESULT_KEY = "upload-result";

export default function UploadPage() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validateFile = useCallback((file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return `Unsupported format. Use: JPEG, PNG, WebP, GIF, or HEIC.`;
    }
    const maxSizeMB = 10;
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `File too large. Max size: ${maxSizeMB}MB.`;
    }
    return null;
  }, []);

  const handleFileSelect = useCallback(
    (file: File | null) => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setSelectedFile(null);
      setError(null);

      if (!file) return;

      const err = validateFile(file);
      if (err) {
        setError(err);
        return;
      }

      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    },
    [previewUrl, validateFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] ?? null;
      handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handleClear = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSelectedFile(null);
    setError(null);
  }, [previewUrl]);

  const handleGeneratePresignedUrl = useCallback(async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setError("Please sign in to upload images.");
        return;
      }

      // Step 1: Get presigned URL
      const contentType = selectedFile.type;
      const res = await fetch(`${API_BASE}/pipeline/generate-presigned-url`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ contentType }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `Request failed: ${res.status}`);
      }

      const data = (await res.json()) as {
        presignedUrl: string;
        cdnUrl: string;
      };

      // Step 2: PUT image bytes to presigned URL
      const putRes = await fetch(data.presignedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": contentType,
        },
        body: selectedFile,
      });

      if (!putRes.ok) {
        const errText = await putRes.text();
        throw new Error(errText || `Upload failed: ${putRes.status}`);
      }

      // Step 3: Register image URL in the pipeline
      const registerRes = await fetch(
        `${API_BASE}/pipeline/upload-image-from-url`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            imageUrl: data.cdnUrl,
            isCommonUse: false,
          }),
        }
      );

      if (!registerRes.ok) {
        const errText = await registerRes.text();
        throw new Error(errText || `Registration failed: ${registerRes.status}`);
      }

      const registerData = (await registerRes.json()) as {
        imageId: string;
        now: number;
      };

      // Step 4: Generate captions
      const captionsRes = await fetch(
        `${API_BASE}/pipeline/generate-captions`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ imageId: registerData.imageId }),
        }
      );

      if (!captionsRes.ok) {
        const errText = await captionsRes.text();
        throw new Error(errText || `Caption generation failed: ${captionsRes.status}`);
      }

      const captionsData = (await captionsRes.json()) as Array<{
        id?: string;
        content?: string;
      }>;
      const captionsList = Array.isArray(captionsData) ? captionsData : [];

      sessionStorage.setItem(
        UPLOAD_RESULT_KEY,
        JSON.stringify({
          imageUrl: data.cdnUrl,
          captions: captionsList,
        })
      );
      router.push("/upload/result");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to upload image."
      );
    } finally {
      setLoading(false);
    }
  }, [selectedFile]);

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
          Upload Image
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
          Upload an image here to generate a funny caption for it!
        </p>

        <div
          style={{
            maxWidth: 480,
            margin: "0 auto",
          }}
        >
          {!selectedFile && (
            <div
              role="button"
              tabIndex={0}
              onClick={() => document.getElementById("file-input")?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  document.getElementById("file-input")?.click();
                }
              }}
              style={{
                border: "2px dashed rgba(0, 0, 0, 0.2)",
                borderRadius: 16,
                padding: 48,
                textAlign: "center",
                backgroundColor: "#ffffff",
                cursor: "pointer",
                marginBottom: 16,
              }}
            >
              <input
                id="file-input"
                type="file"
                accept={ACCEPT_STRING}
                onChange={handleInputChange}
                style={{ display: "none" }}
              />
              <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.5 }}>
                📷
              </div>
              <p style={{ fontSize: 16, fontWeight: 500, color: "#1a1a1a", margin: 0 }}>
                Choose image or click to browse
              </p>
            </div>
          )}

          {selectedFile && (
            <div
              style={{
                padding: 24,
                backgroundColor: "#ffffff",
                borderRadius: 12,
                border: "1px solid rgba(0, 0, 0, 0.08)",
                textAlign: "center",
              }}
            >
              <img
                src={previewUrl!}
                alt="Preview"
                style={{
                  maxWidth: "100%",
                  maxHeight: 280,
                  objectFit: "contain",
                  borderRadius: 12,
                  display: "block",
                  margin: "0 auto 12px auto",
                }}
              />
              <p style={{ margin: "0 0 12px 0", fontSize: 14, color: "#1a1a1a", opacity: 0.8 }}>
                {selectedFile.name}
              </p>
              <button
                type="button"
                onClick={handleClear}
                style={{
                  padding: "8px 16px",
                  fontSize: 14,
                  fontWeight: 500,
                  color: "#1a1a1a",
                  backgroundColor: "rgba(0, 0, 0, 0.08)",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                Clear
              </button>
            </div>
          )}

          {error && (
            <p
              style={{
                marginTop: 16,
                padding: 12,
                backgroundColor: "rgba(220, 38, 38, 0.1)",
                color: "#b91c1c",
                borderRadius: 8,
                fontSize: 14,
              }}
            >
              {error}
            </p>
          )}

          {selectedFile && !error && (
            <div
              style={{
                marginTop: 24,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <button
                type="button"
                onClick={handleGeneratePresignedUrl}
                disabled={loading}
                style={{
                  padding: "12px 24px",
                  fontSize: 16,
                  fontWeight: 500,
                  color: "#ffffff",
                  backgroundColor: loading ? "rgba(0, 0, 0, 0.4)" : "#1a1a1a",
                  border: "none",
                  borderRadius: 12,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Generating…" : "Generate caption"}
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
