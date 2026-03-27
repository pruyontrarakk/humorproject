"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import GoogleSignInCard from "@/app/components/GoogleSignInCard";

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <GoogleSignInCard
      heading="Sign in"
      subtitle="Humor Project"
      description="Use your Google account to browse captions, vote, and upload images."
      error={error}
    />
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
