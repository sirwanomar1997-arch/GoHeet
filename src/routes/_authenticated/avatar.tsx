import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AvatarStudio } from "@/components/reelzy/avatar-studio";
import { useMe } from "@/lib/use-me";

export const Route = createFileRoute("/_authenticated/avatar")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Create your GoHeet avatar" },
      {
        name: "description",
        content:
          "Build the 3D character that represents you on GoHeet — snap a selfie or design your look.",
      },
      { property: "og:title", content: "Create your GoHeet avatar" },
      {
        property: "og:description",
        content: "Snap a selfie or design a look, and GoHeet renders the 3D you.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AvatarPage,
});

function AvatarPage() {
  const navigate = useNavigate();
  const me = useMe();
  const username = me.data?.profile?.username;
  const hadAvatar = Boolean(me.data?.profile?.avatar_url);

  const leave = () => {
    // Editing an existing avatar: return to Edit profile (where "Edit avatar" was tapped).
    if (hadAvatar) {
      void navigate({ to: "/edit-profile", replace: true });
      return;
    }
    void navigate({ to: "/camera" });
  };

  return (
    <main className="min-h-svh bg-background">
      <h1 className="sr-only">Create your GoHeet avatar</h1>
      <AvatarStudio onDone={leave} onSkip={leave} />
    </main>
  );
}
