import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Sparkles } from "lucide-react";
import { updateProfile } from "@/lib/reelzy.functions";
import { useMe } from "@/lib/use-me";
import { AppShell } from "@/components/reelzy/nav";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/edit-profile")({
  component: EditProfilePage,
});

const PLATFORMS = [
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/you" },
  { key: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@you" },
  { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@you" },
  { key: "twitter", label: "X (Twitter)", placeholder: "https://x.com/you" },
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/you" },
  { key: "snapchat", label: "Snapchat", placeholder: "https://snapchat.com/add/you" },
] as const;

function EditProfilePage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: me } = useMe();
  const save = useServerFn(updateProfile);

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [links, setLinks] = useState<Record<string, string>>({});

  useEffect(() => {
    const p = me?.profile as
      | (NonNullable<typeof me>["profile"] & { social_links?: Record<string, string> })
      | null
      | undefined;
    if (!p) return;
    setUsername(p.username ?? "");
    setDisplayName(p.display_name ?? "");
    setBio(p.bio ?? "");
    setLinks(p.social_links ?? {});
  }, [me]);

  const mutation = useMutation({
    mutationFn: () =>
      save({ data: { username, displayName, bio, socialLinks: links } }),
    onSuccess: async () => {
      toast.success("Profile updated.");
      await qc.invalidateQueries({ queryKey: ["me"] });
      await navigate({ to: "/u/$username", params: { username } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const card = "rounded-2xl border border-border bg-surface p-4";

  return (
    <AppShell>
      <header className="flex items-center gap-3 px-5 pb-2 pt-6">
        <Link
          to="/u/$username"
          params={{ username: me?.profile?.username ?? "" }}
          aria-label="Back to profile"
          className="grid size-9 place-items-center rounded-full border border-border bg-surface text-muted-foreground"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-[-0.04em]">Edit profile</h1>
          <p className="text-sm text-muted-foreground">How people see you on Reelzy.</p>
        </div>
      </header>

      <div className="space-y-4 px-5 pb-12">
        <section className={card}>
          <h2 className="font-display text-base font-semibold">Your avatar</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Your picture on Reelzy is always your avatar — no personal photos.
          </p>
          <Link
            to="/avatar"
            className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-raised px-3.5 py-1.5 text-[11px] font-semibold"
          >
            <Sparkles className="size-3" /> Open the avatar studio
          </Link>
        </section>

        <section className={card}>
          <h2 className="font-display text-base font-semibold">You</h2>
          <div className="mt-4 space-y-4">
            <div>
              <Label htmlFor="un">Username</Label>
              <Input
                id="un"
                value={username}
                maxLength={24}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                className="mt-1.5 h-11 bg-surface-raised"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Letters, numbers, dots and underscores. Must be unique.
              </p>
            </div>
            <div>
              <Label htmlFor="dn">Nickname</Label>
              <Input
                id="dn"
                value={displayName}
                maxLength={40}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-1.5 h-11 bg-surface-raised"
              />
            </div>
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                maxLength={160}
                onChange={(e) => setBio(e.target.value)}
                className="mt-1.5 bg-surface-raised"
              />
              <p className="mt-1 text-right text-[11px] text-muted-foreground">{bio.length}/160</p>
            </div>
          </div>
        </section>

        <section className={card}>
          <h2 className="font-display text-base font-semibold">Your other platforms</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Paste the full link to your profile on each platform. It becomes a tappable icon on
            your Reelzy profile.
          </p>
          <div className="mt-4 space-y-3">
            {PLATFORMS.map((pl) => (
              <div key={pl.key}>
                <Label htmlFor={pl.key} className="text-xs">
                  {pl.label}
                </Label>
                <Input
                  id={pl.key}
                  value={links[pl.key] ?? ""}
                  maxLength={300}
                  inputMode="url"
                  autoCapitalize="off"
                  autoCorrect="off"
                  placeholder={pl.placeholder}
                  onChange={(e) => setLinks((l) => ({ ...l, [pl.key]: e.target.value.trim() }))}
                  className="mt-1.5 h-11 bg-surface-raised"
                />
              </div>
            ))}
          </div>
        </section>

        <Button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !username}
          className="ember-fill h-12 w-full rounded-2xl text-base font-semibold text-primary-foreground"
        >
          {mutation.isPending ? "Saving…" : "Save profile"}
        </Button>

        <Link
          to="/settings"
          className="block rounded-2xl border border-border p-4 text-sm font-medium"
        >
          Looking for privacy, password or account settings? →
        </Link>
      </div>
    </AppShell>
  );
}
