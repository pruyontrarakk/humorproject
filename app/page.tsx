import ProfileButton from "./ProfileButton";

export default function Page() {
  return (
    <main
      style={{
        position: "relative",
        minHeight: "100vh",
        backgroundColor: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 24,
      }}
    >
      <h1
        style={{
          fontSize: 32,
          fontWeight: 600,
          margin: 0,
          color: "#000000",
        }}
      >
        Welcome to the humor project!
      </h1>

      <ProfileButton />
    </main>
  );
}
