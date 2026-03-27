import GoogleSignInCard from "./components/GoogleSignInCard";

export default function Page() {
  return (
    <main className="min-h-screen bg-white">
      <GoogleSignInCard
        heading="Welcome to the Humor Project"
        subtitle="Sign in to continue"
        description="Browse curated captions, vote on your favorites, and contribute new uploads."
      />
    </main>
  );
}
