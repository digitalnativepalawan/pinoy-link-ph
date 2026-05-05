import {
  Share2, ShoppingBag, Wallet, Mic2, Video, Link as LinkIcon,
  Instagram, Facebook, Youtube, Twitter, Music, Store, Smartphone,
  type LucideIcon,
} from "lucide-react";

export type Category = "social" | "shop" | "pay" | "creator" | "video" | "custom";

export interface CategoryDef {
  id: Category;
  label: string;
  icon: LucideIcon;
}

export const CATEGORIES: CategoryDef[] = [
  { id: "social", label: "Social", icon: Share2 },
  { id: "shop", label: "Shop", icon: ShoppingBag },
  { id: "pay", label: "Pay", icon: Wallet },
  { id: "creator", label: "Creator", icon: Mic2 },
  { id: "video", label: "Video", icon: Video },
  { id: "custom", label: "Custom", icon: LinkIcon },
];

export interface PlatformShortcut {
  id: string;
  label: string;
  icon: LucideIcon;
  urlPrefix?: string;
  videoType?: "tiktok" | "youtube" | "upload";
}

export const PLATFORMS: Record<Category, PlatformShortcut[]> = {
  social: [
    { id: "instagram", label: "Instagram", icon: Instagram, urlPrefix: "https://instagram.com/" },
    { id: "facebook", label: "Facebook", icon: Facebook, urlPrefix: "https://facebook.com/" },
    { id: "tiktok", label: "TikTok", icon: Music, urlPrefix: "https://tiktok.com/@" },
    { id: "youtube", label: "YouTube", icon: Youtube, urlPrefix: "https://youtube.com/@" },
    { id: "twitter", label: "X / Twitter", icon: Twitter, urlPrefix: "https://x.com/" },
    { id: "threads", label: "Threads", icon: Share2, urlPrefix: "https://threads.net/@" },
  ],
  shop: [
    { id: "shopee", label: "Shopee", icon: Store, urlPrefix: "https://shopee.ph/" },
    { id: "lazada", label: "Lazada", icon: Store, urlPrefix: "https://lazada.com.ph/shop/" },
    { id: "etsy", label: "Etsy", icon: ShoppingBag, urlPrefix: "https://etsy.com/shop/" },
    { id: "fbshop", label: "FB Shop", icon: Facebook, urlPrefix: "https://facebook.com/" },
  ],
  pay: [
    { id: "gcash", label: "GCash", icon: Wallet },
    { id: "maya", label: "Maya", icon: Wallet },
    { id: "bdo", label: "BDO", icon: Wallet },
    { id: "bpi", label: "BPI", icon: Wallet },
  ],
  creator: [
    { id: "spotify", label: "Spotify", icon: Music, urlPrefix: "https://open.spotify.com/" },
    { id: "soundcloud", label: "SoundCloud", icon: Music, urlPrefix: "https://soundcloud.com/" },
    { id: "applemusic", label: "Apple Music", icon: Music, urlPrefix: "https://music.apple.com/" },
    { id: "podcast", label: "Podcast", icon: Mic2 },
  ],
  video: [
    { id: "tiktok-vid", label: "TikTok video", icon: Music, videoType: "tiktok" },
    { id: "youtube-vid", label: "YouTube video", icon: Youtube, videoType: "youtube" },
    { id: "upload-vid", label: "Upload", icon: Smartphone, videoType: "upload" },
  ],
  custom: [],
};

export function categoryIcon(category: string | null | undefined): LucideIcon {
  const c = CATEGORIES.find((x) => x.id === category);
  return c?.icon ?? LinkIcon;
}

export function platformIcon(iconName: string | null | undefined): LucideIcon {
  if (!iconName) return LinkIcon;
  for (const list of Object.values(PLATFORMS)) {
    const p = list.find((x) => x.id === iconName);
    if (p) return p.icon;
  }
  return LinkIcon;
}

export function detectVideoType(url: string): "tiktok" | "youtube" | null {
  if (/tiktok\.com/i.test(url)) return "tiktok";
  if (/(youtube\.com|youtu\.be)/i.test(url)) return "youtube";
  return null;
}

export function youtubeEmbed(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

export function tiktokEmbed(url: string): string | null {
  const m = url.match(/tiktok\.com\/@[\w.-]+\/video\/(\d+)/);
  return m ? `https://www.tiktok.com/embed/v2/${m[1]}` : null;
}
