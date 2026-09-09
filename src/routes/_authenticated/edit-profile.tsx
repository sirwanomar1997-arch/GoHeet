import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Camera, Check, Facebook, Ghost, Globe, Instagram, MessageCircle, Music2, Sparkles, Twitter, Youtube } from "lucide-react";
import { saveProfilePhoto, updateProfile } from "@/lib/reelzy.functions";
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
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/you", Icon: Instagram, color: "oklch(0.65 0.24 350)" },
  { key: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@you", Icon: Music2, color: "oklch(0.72 0.15 195)" },
  { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@you", Icon: Youtube, color: "oklch(0.6 0.22 25)" },
  { key: "twitter", label: "X (Twitter)", placeholder: "https://x.com/you", Icon: Twitter, color: "oklch(0.75 0.02 250)" },
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/you", Icon: Facebook, color: "oklch(0.6 0.18 255)" },
  { key: "snapchat", label: "Snapchat", placeholder: "https://snapchat.com/add/you", Icon: Ghost, color: "oklch(0.88 0.16 100)" },
  { key: "whatsapp", label: "WhatsApp", placeholder: "https://wa.me/46701234567", Icon: MessageCircle, color: "oklch(0.72 0.17 150)" },
] as const;

function EditProfilePage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: me } = useMe();
  const save = useServerFn(updateProfile);
  const uploadPhoto = useServerFn(saveProfilePhoto);
  const photoInput = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [links, setLinks] = useState<Record<string, string>>({});
  const [imageType, setImageType] = useState<"avatar" | "photo">("avatar");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

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
    setImageType(p.profile_image_type === "photo" ? "photo" : "avatar");
    setPhotoPreview(p.personal_photo_url ?? null);
  }, [me]);

  const mutation = useMutation({
    mutationFn: () =>
      save({ data: { username, displayName, bio, socialLinks: links } }),
    onSuccess: () => {
      toast.success("Profile updated.");
      void navigate({ to: "/u/$username", params: { username } });
      void qc.invalidateQueries({ queryKey: ["me"] });
      void qc.invalidateQueries({ queryKey: ["profile", username] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const photoMutation = useMutation({
    mutationFn: (dataUrl: string) => uploadPhoto({ data: { dataUrl } }),
    onSuccess: async (result) => {
      setPhotoPreview(result.url);
      setImageType("photo");
      await qc.invalidateQueries({ queryKey: ["me"] });
      await qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile photo updated.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function chooseImageType(next: "avatar" | "photo") {
    if (next === "photo" && !photoPreview) {
      photoInput.current?.click();
      return;
    }
    setImageType(next);
    try {
      await save({ data: { profileImageType: next } });
      await qc.invalidateQueries({ queryKey: ["me"] });
      await qc.invalidateQueries({ queryKey: ["profile"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not switch profile image.");
    }
  }

  function onPhoto(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Choose a photo smaller than 8 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => photoMutation.mutate(String(reader.result));
    reader.onerror = () => toast.error("Could not read that photo.");
    reader.readAsDataURL(file);
  }

  const card = "rounded-2xl border border-border bg-surface p-4";

  return (
    <AppShell>
      <header className="flex items-center gap-3 px-5 pb-2 pt-6">
        <Link
          to="/u/$username"
          params={{ username: me?.profile?.username ?? "" }}
          preload="intent"
          aria-label="Back to profile"
          className="tap-target grid size-11 touch-manipulation place-items-center rounded-full border border-border bg-surface text-muted-foreground active:scale-95"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-[-0.04em]">Edit profile</h1>
          <p className="text-sm text-muted-foreground">How people see you on GoHeet.</p>
        </div>
      </header>

      <div className="space-y-4 px-5 pb-12">
        <section className={card}>
          <h2 className="font-display text-base font-semibold">Profile picture</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Use your personal photo or switch back to your avatar anytime.
          </p>
          <input
            ref={photoInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(event) => onPhoto(event.target.files?.[0])}
          />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => void chooseImageType("photo")}
              className={`relative aspect-square overflow-hidden rounded-2xl border-2 bg-surface-raised ${imageType === "photo" ? "border-primary" : "border-border"}`}
            >
              {photoPreview ? (
                <img src={photoPreview} alt="Your personal profile" className="size-full object-cover" />
              ) : (
                <span className="grid size-full place-items-center"><Camera className="size-8 text-muted-foreground" /></span>
              )}
              {imageType === "photo" ? <Check className="absolute right-2 top-2 size-5 rounded-full bg-primary p-1 text-primary-foreground" /> : null}
            </button>
            <button
              type="button"
              onClick={() => void chooseImageType("avatar")}
              disabled={!me?.profile?.avatar_url}
              className={`relative aspect-square overflow-hidden rounded-2xl border-2 bg-surface-raised disabled:opacity-40 ${imageType === "avatar" ? "border-primary" : "border-border"}`}
            >
              {me?.profile?.avatar_url ? <img src={me.profile.avatar_url} alt="Your avatar" className="size-full object-cover" /> : <span className="grid size-full place-items-center"><Sparkles className="size-8 text-muted-foreground" /></span>}
              {imageType === "avatar" ? <Check className="absolute right-2 top-2 size-5 rounded-full bg-primary p-1 text-primary-foreground" /> : null}
            </button>
          </div>
          <div className="mt-3 flex gap-2">
            <Button type="button" variant="outline" onClick={() => photoInput.current?.click()} disabled={photoMutation.isPending} className="flex-1">
              <Camera className="size-4" /> {photoMutation.isPending ? "Uploading…" : photoPreview ? "Change photo" : "Add photo"}
            </Button>
            <Button asChild type="button" variant="outline" className="flex-1">
              <Link to="/avatar"><Sparkles className="size-4" /> Edit avatar</Link>
            </Button>
          </div>
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
          <h2 className="font-display text-base font-semibold">Your link</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            One link of your own — a website, a shop, anything you want people to see. It shows as a
            blue globe on your profile.
          </p>
          <div className="mt-4">
            <Label htmlFor="website" className="flex items-center gap-2 text-xs">
              <span
                className="grid size-7 place-items-center rounded-xl border border-border bg-surface-raised"
                style={{ color: "oklch(0.7 0.17 250)" }}
              >
                <Globe className="size-4" />
              </span>
              Website
            </Label>
            <Input
              id="website"
              value={links["website"] ?? ""}
              maxLength={300}
              inputMode="url"
              autoCapitalize="off"
              autoCorrect="off"
              placeholder="https://yoursite.com"
              onChange={(e) => setLinks((l) => ({ ...l, website: e.target.value.trim() }))}
              className="mt-1.5 h-11 bg-surface-raised"
            />
            <label className="mt-3 flex items-start gap-2.5 rounded-xl border border-border bg-surface-raised p-3 text-xs">
              <input
                type="checkbox"
                checked={links["website_adult"] === "1"}
                onChange={(e) =>
                  setLinks((l) => ({ ...l, website_adult: e.target.checked ? "1" : "" }))
                }
                className="mt-0.5 size-4 accent-[oklch(0.65_0.2_30)]"
              />
              <span className="text-muted-foreground">
                This link leads to adult content (18+). Visitors must confirm their age before it
                opens. Adult sites we recognise are flagged automatically.
              </span>
            </label>
          </div>
        </section>

        <section className={card}>
          <h2 className="font-display text-base font-semibold">Your other platforms</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Paste the full link to your profile on each platform. It becomes a tappable icon on
            your GoHeet profile.
          </p>
          <div className="mt-4 space-y-3">
            {PLATFORMS.map((pl) => (
              <div key={pl.key}>
                <Label htmlFor={pl.key} className="flex items-center gap-2 text-xs">
                  <span
                    className="grid size-7 place-items-center rounded-xl border border-border bg-surface-raised"
                    style={{ color: pl.color }}
                  >
                    <pl.Icon className="size-4" />
                  </span>
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
          preload="intent"
          className="block touch-manipulation rounded-2xl border border-border p-4 text-sm font-medium active:scale-[0.99]"
        >
          Looking for privacy, password or account settings? →
        </Link>
      </div>
    </AppShell>
  );
}
