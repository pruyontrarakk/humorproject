"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const STORAGE_KEY = "votingPage";

type VotingPageResumeProps = {
  currentPage: number;
  totalPages: number;
};

export default function VotingPageResume({
  currentPage,
  totalPages,
}: VotingPageResumeProps) {
  const router = useRouter();

  useEffect(() => {
    if (totalPages < 1) return;
    const saved = sessionStorage.getItem(STORAGE_KEY);
    const savedPage = saved ? parseInt(saved, 10) : 0;
    if (currentPage === 1 && savedPage > 1 && savedPage <= totalPages) {
      router.replace(`/voting?page=${savedPage}`);
      return;
    }
    sessionStorage.setItem(STORAGE_KEY, String(currentPage));
  }, [currentPage, totalPages, router]);

  return null;
}
