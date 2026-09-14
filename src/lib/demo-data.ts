/**
 * Demo content for App Store screenshots.
 *
 * When demo mode is enabled (Settings → Screenshot mode), the app shows
 * this rich mock content instead of querying the database. This makes the
 * feed, profiles, discover, and activity pages look fully alive without
 * needing real users or media.
 */

import skate from "@/assets/demo/skate-sunset.jpg";
import skateBowl from "@/assets/demo/skate-bowl.jpg";
import dogFrisbee from "@/assets/demo/dog-frisbee.jpg";
import sunset from "@/assets/demo/sunset.jpg";

import city from "@/assets/demo/city.jpg";
import coffee from "@/assets/demo/coffee.jpg";
import mountain from "@/assets/demo/mountain.jpg";
import avatar1 from "@/assets/demo/avatar-1.jpg";
import avatar2 from "@/assets/demo/avatar-2.jpg";
import avatar3 from "@/assets/demo/avatar-3.jpg";
import avatar4 from "@/assets/demo/avatar-4.jpg";
import type { MomentCard } from "@/lib/reelzy.functions";

export type DemoProfile = {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  hasAvatar: boolean;
  hasPersonalPhoto: boolean;
  profileImageType: string;
  followerCount: number;
  followingCount: number;
  momentCount: number;
  totalViews: number;
  totalLikes: number;
  isPrivate: boolean;
  showReposts: boolean;
  socialLinks: Record<string, string>;
  createdAt: string;
};

export type DemoNotification = {
  id: string;
  type: string;
  createdAt: string;
  read: boolean;
  momentId: string | null;
  momentThumbUrl: string | null;
  momentCaption: string | null;
  actor: { username: string; displayName: string; avatarUrl: string } | null;
};

const now = Date.now();
const hoursAgo = (h: number) => new Date(now - h * 3600_000).toISOString();
const daysAgo = (d: number) => new Date(now - d * 86400_000).toISOString();

const PHOTOS = [skate, sunset, city, coffee, mountain, sunset, city, coffee];

export const demoAuthors: Array<{
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
}> = [
  { id: "d1", username: "maya", displayName: "Maya", avatarUrl: avatar1 },
  { id: "d2", username: "david", displayName: "David", avatarUrl: avatar2 },
  { id: "d3", username: "lena", displayName: "Lena", avatarUrl: avatar3 },
  { id: "d4", username: "yasmin", displayName: "Yasmin", avatarUrl: avatar4 },
];

export const demoProfiles: Record<string, DemoProfile> = {
  maya: {
    id: "d1",
    username: "maya",
    displayName: "Maya",
    bio: "Golden hour chaser, Stockholm to everywhere.\nCapturing real life, one Heet at a time.",
    avatarUrl: avatar1,
    hasAvatar: true,
    hasPersonalPhoto: true,
    profileImageType: "photo",
    followerCount: 12847,
    followingCount: 342,
    momentCount: 87,
    totalViews: 459231,
    totalLikes: 89234,
    isPrivate: false,
    showReposts: true,
    socialLinks: { instagram: "maya", tiktok: "maya", website: "mayacaptures.com" },
    createdAt: daysAgo(180),
  },
  david: {
    id: "d2",
    username: "david",
    displayName: "David",
    bio: "City lights and late nights.\nMusic producer, coffee addict.",
    avatarUrl: avatar2,
    hasAvatar: true,
    hasPersonalPhoto: false,
    profileImageType: "avatar",
    followerCount: 8421,
    followingCount: 521,
    momentCount: 54,
    totalViews: 234100,
    totalLikes: 41200,
    isPrivate: false,
    showReposts: true,
    socialLinks: { youtube: "davidbeats", instagram: "david" },
    createdAt: daysAgo(120),
  },
  lena: {
    id: "d3",
    username: "lena",
    displayName: "Lena",
    bio: "Adventure is calling and I must go.\nTravel, hiking, real moments only.",
    avatarUrl: avatar3,
    hasAvatar: true,
    hasPersonalPhoto: true,
    profileImageType: "photo",
    followerCount: 21043,
    followingCount: 198,
    momentCount: 132,
    totalViews: 892400,
    totalLikes: 156700,
    isPrivate: false,
    showReposts: false,
    socialLinks: { instagram: "lenatravels", tiktok: "lena", website: "lenatravels.blog" },
    createdAt: daysAgo(300),
  },
  yasmin: {
    id: "d4",
    username: "yasmin",
    displayName: "Yasmin",
    bio: "Real life, real moments.\nSun, music and long walks home.",
    avatarUrl: avatar4,
    hasAvatar: true,
    hasPersonalPhoto: false,
    profileImageType: "avatar",
    followerCount: 54200,
    followingCount: 12,
    momentCount: 24,
    totalViews: 1200000,
    totalLikes: 234000,
    isPrivate: false,
    showReposts: true,
    socialLinks: { website: "yasmin.co", instagram: "yasmin", tiktok: "yasmin" },
    createdAt: daysAgo(365),
  },
};

const captions = [
  "Rolling down to the beach at golden hour",
  "Golden hour at the harbour. Stockholm never disappoints",
  "City lights hit different at midnight",
  "Morning ritual. What's yours?",
  "Found this view on today's hike, no filter needed",
  "Real moments only. This is what GoHeet is about",
  "The sunset chase never stops",
  "Late night walks > everything",
];


const locations = ["Stockholm", "Gothenburg", "Malmö", "Abisko", "Kiruna", "Lisbon", "Oslo", "Copenhagen"];

const overlays = [
  null,
  { text: "Golden hour", font: "bungee", style: "gradient", place: "custom", color: "sunset", x: 50, y: 20, size: 32, rotate: -3 },
  { text: "City nights", font: "pacifico", style: "gradient", place: "custom", color: "neon", x: 50, y: 25, size: 28, rotate: 2 },
  null,
  { text: "Real moments", font: "bungee", style: "gradient", place: "custom", color: "fire", x: 50, y: 18, size: 34, rotate: -4 },
  null,
  { text: "Late nights", font: "anton", style: "gradient", place: "custom", color: "violet", x: 50, y: 22, size: 30, rotate: 0 },
  null,
];

const newMoments: MomentCard[] = [
  {
    id: "demo-new-1",
    caption: "Golden hour at the skatepark",
    kind: "photo",
    mediaUrl: skateBowl,
    posterUrl: null,
    durationMs: null,
    locationLabel: "Stockholm",
    createdAt: hoursAgo(1),
    viewCount: 2841,
    likeCount: 512,
    commentCount: 34,
    liked: false,
    saved: false,
    reposted: false,
    styleFilter: null,
    overlay: null,
    originalAudioVolume: 1,
    author: demoAuthors[0]!,
    isOwn: false,
  },
  {
    id: "demo-new-2",
    caption: "Catching air in the park",
    kind: "photo",
    mediaUrl: dogFrisbee,
    posterUrl: null,
    durationMs: null,
    locationLabel: "Gothenburg",
    createdAt: hoursAgo(4),
    viewCount: 1932,
    likeCount: 423,
    commentCount: 28,
    liked: false,
    saved: false,
    reposted: false,
    styleFilter: null,
    overlay: null,
    originalAudioVolume: 1,
    author: demoAuthors[2]!,
    isOwn: false,
  },
];

export const demoMoments: MomentCard[] = [...newMoments, ...PHOTOS.map((photo, i) => ({
  id: `demo-${i + 1}`,
  caption: captions[i] ?? "Real moment",
  kind: "photo",
  mediaUrl: photo,
  posterUrl: null,
  durationMs: null,
  locationLabel: locations[i] ?? "Stockholm",
  createdAt: hoursAgo(i * 3 + 1),
  viewCount: [1284, 3421, 892, 5621, 2103, 4532, 1820, 943][i] ?? 1000,
  likeCount: [231, 512, 145, 893, 367, 621, 284, 156][i] ?? 200,
  commentCount: [18, 34, 7, 41, 22, 28, 12, 9][i] ?? 10,
  liked: i % 3 === 0,
  saved: i === 1 || i === 3,
  reposted: i === 2,
  styleFilter: i === 1 ? "cinematic-warm" : i === 4 ? "vivid" : null,
  overlay: overlays[i] ?? null,
  originalAudioVolume: 1,
  author: demoAuthors[i % demoAuthors.length]!,
  isOwn: false,
}))];

export const demoComments: Record<string, Array<{
  id: string;
  author: string;
  authorAvatar: string;
  body: string;
  createdAt: string;
  likes: number;
  liked: boolean;
  replies: Array<{ id: string; author: string; authorAvatar: string; body: string; createdAt: string }>;
}>> = {
  "demo-1": [
    { id: "c1", author: "lena", authorAvatar: avatar3, body: "This is unreal, Stockholm golden hour hits different", createdAt: hoursAgo(2), likes: 24, liked: false, replies: [] },
    { id: "c2", author: "david", authorAvatar: avatar2, body: "Need to visit again", createdAt: hoursAgo(1), likes: 8, liked: true, replies: [] },
    { id: "c3", author: "yasmin", authorAvatar: avatar4, body: "This is what GoHeet is all about, real moments", createdAt: hoursAgo(1), likes: 42, liked: false, replies: [{ id: "r1", author: "maya", authorAvatar: avatar1, body: "Thank you! 🙏", createdAt: hoursAgo(1) }] },
  ],
  "demo-2": [
    { id: "c4", author: "maya", authorAvatar: avatar1, body: "The vibe is immaculate", createdAt: hoursAgo(3), likes: 15, liked: false, replies: [] },
    { id: "c5", author: "lena", authorAvatar: avatar3, body: "City lights forever", createdAt: hoursAgo(2), likes: 9, liked: true, replies: [] },
  ],
  "demo-3": [
    { id: "c6", author: "yasmin", authorAvatar: avatar4, body: "Coffee gang", createdAt: hoursAgo(4), likes: 31, liked: false, replies: [] },
  ],
};

const rawNotifications: Array<Omit<DemoNotification, "momentThumbUrl" | "momentCaption">> = [
  { id: "n1", type: "like", createdAt: hoursAgo(1), read: false, momentId: "demo-1", actor: { username: "lena", displayName: "Lena", avatarUrl: avatar3 } },
  { id: "n2", type: "follow", createdAt: hoursAgo(2), read: false, momentId: null, actor: { username: "david", displayName: "David", avatarUrl: avatar2 } },
  { id: "n3", type: "comment", createdAt: hoursAgo(3), read: false, momentId: "demo-1", actor: { username: "lena", displayName: "Lena", avatarUrl: avatar3 } },
  { id: "n4", type: "like", createdAt: hoursAgo(5), read: true, momentId: "demo-3", actor: { username: "david", displayName: "David", avatarUrl: avatar2 } },
  { id: "n5", type: "follow", createdAt: hoursAgo(8), read: true, momentId: null, actor: { username: "lena", displayName: "Lena", avatarUrl: avatar3 } },
  { id: "n6", type: "like", createdAt: daysAgo(1), read: true, momentId: "demo-2", actor: { username: "yasmin", displayName: "Yasmin", avatarUrl: avatar4 } },
  { id: "n7", type: "comment", createdAt: daysAgo(1), read: true, momentId: "demo-2", actor: { username: "maya", displayName: "Maya", avatarUrl: avatar1 } },
  { id: "n8", type: "follow", createdAt: daysAgo(2), read: true, momentId: null, actor: { username: "maya", displayName: "Maya", avatarUrl: avatar1 } },
];

export const demoNotifications: DemoNotification[] = rawNotifications.map((n) => {
  const m = n.momentId ? demoMoments.find((x) => x.id === n.momentId) : undefined;
  return {
    ...n,
    momentThumbUrl: m?.posterUrl ?? m?.mediaUrl ?? null,
    momentCaption: m?.caption ?? null,
  };
});


export const demoPeople = [
  { id: "d1", username: "maya", displayName: "Maya", avatarUrl: avatar1, followerCount: 12847, momentCount: 87 },
  { id: "d2", username: "david", displayName: "David", avatarUrl: avatar2, followerCount: 8421, momentCount: 54 },
  { id: "d3", username: "lena", displayName: "Lena", avatarUrl: avatar3, followerCount: 21043, momentCount: 132 },
  { id: "d4", username: "yasmin", displayName: "Yasmin", avatarUrl: avatar4, followerCount: 54200, momentCount: 24 },
];

export async function getDemoFeed(scope: "following" | "discover"): Promise<{ moments: MomentCard[]; nextCursor: null }> {
  if (scope === "following") {
    return { moments: demoMoments.slice(0, 3), nextCursor: null };
  }
  return { moments: demoMoments, nextCursor: null };
}

export async function getDemoProfile(
  username: string,
  sort: "new" | "views" | "old",
): Promise<{
  profile: DemoProfile | null;
  moments: MomentCard[];
  reposts: MomentCard[];
  isFollowing: boolean;
  isSelf: boolean;
}> {
  const profile = demoProfiles[username.toLowerCase()];
  if (!profile) return { profile: null, moments: [], reposts: [], isFollowing: false, isSelf: false };

  let moments = [...demoMoments.filter((m) => m.author.username === username.toLowerCase())];
  if (moments.length === 0) moments = [...demoMoments]; // fallback: show all

  if (sort === "views") moments.sort((a, b) => b.viewCount - a.viewCount);
  else if (sort === "old") moments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  else moments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return {
    profile,
    moments,
    reposts: sort === "new" ? demoMoments.slice(2, 4) : [],
    // Demo profiles start unfollowed, just like a relationship that does not
    // exist in the saved follows table. FollowButton owns instant demo changes.
    isFollowing: false,
    isSelf: false,
  };
}

export async function getDemoSearch(q: string): Promise<{
  people: Array<(typeof demoPeople)[number] & { isFollowing: boolean }>;
  moments: MomentCard[];
}> {
  const term = q.trim().toLowerCase();
  if (!term) {
    return {
      people: demoPeople.map((p) => ({ ...p, isFollowing: false })),
      moments: demoMoments.slice(0, 6),
    };
  }
  const people = demoPeople
    .filter(
      (p) => p.username.toLowerCase().includes(term) || p.displayName.toLowerCase().includes(term),
    )
    .map((p) => ({ ...p, isFollowing: false }));
  const moments = demoMoments.filter((m) => (m.caption ?? "").toLowerCase().includes(term));
  return { people, moments };
}

export function getDemoComments(momentId: string) {
  return demoComments[momentId] ?? [];
}

export function getDemoNotifications() {
  return demoNotifications;
}

export function getDemoConversations() {
  const chats = [
    {
      id: "dm1",
      status: "accepted" as const,
      unread: 2,
      lastMessageAt: hoursAgo(1),
      person: { username: "lena", displayName: "Lena", avatarUrl: avatar3 },
      lastMessage: { body: "That skate clip was insane, where was it?" },
    },
    {
      id: "dm2",
      status: "accepted" as const,
      unread: 0,
      lastMessageAt: hoursAgo(6),
      person: { username: "david", displayName: "David", avatarUrl: avatar2 },
      lastMessage: { body: "Let's shoot something at golden hour tomorrow" },
    },
  ];
  const requests = [
    {
      id: "dm3",
      status: "pending" as const,
      unread: 1,
      lastMessageAt: hoursAgo(3),
      person: { username: "yasmin", displayName: "Yasmin", avatarUrl: avatar4 },
      lastMessage: { body: "Your moment is trending this week!" },
    },
  ];
  return { chats, requests };
}
