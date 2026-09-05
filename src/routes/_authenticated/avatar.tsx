import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AvatarStudio } from "@/components/reelzy/avatar-studio";
import { ReelzyMark } from "@/components/reelzy/logo";

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
    <main className="min-h-svh bg-background px-6 pb-16 pt-10">
      <div className="mx-auto max-w-sm">
        <ReelzyMark className="size-9" />
        <h1 className="mt-8 font-display text-3xl font-extrabold tracking-[-0.04em]">
          Make the 3D you.
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your avatar is your face on Reelzy — the moments stay real, the character is yours.
        </p>
        <div className="mt-8">
          <AvatarStudio
            onDone={() => void navigate({ to: "/camera" })}
            onSkip={() => void navigate({ to: "/camera" })}
          />
        </div>
      </div>
    </main>
  );
}
