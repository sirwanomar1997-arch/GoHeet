import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AvatarStudio } from "@/components/reelzy/avatar-studio";

export const Route = createFileRoute("/_authenticated/avatar")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Create your Reelzy avatar" },
      {
        name: "description",
        content:
          "Build the 3D character that represents you on Reelzy — snap a selfie or design your look.",
      },
      { property: "og:title", content: "Create your Reelzy avatar" },
      {
        property: "og:description",
        content: "Snap a selfie or design a look, and Reelzy renders the 3D you.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AvatarPage,
});

function AvatarPage() {
  const navigate = useNavigate();
  return (
    <main className="min-h-svh bg-background">
      <h1 className="sr-only">Create your Reelzy avatar</h1>
      <AvatarStudio
        onDone={() => void navigate({ to: "/camera" })}
        onSkip={() => void navigate({ to: "/camera" })}
      />
    </main>
  );
}
