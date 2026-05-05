import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link as RLink } from "react-router-dom";
import {
  ArrowUpRight, Clock, Handshake, Mail, Instagram, Share2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { applyTheme, type Theme, THEMES } from "@/lib/themes";
import { categoryIcon, platformIcon, youtubeEmbed, tiktokEmbed } from "@/lib/categories";
import {
  DAYS, DEFAULT_SCHEDULE, formatTime12, todayKey, timeAgo, type DayKey, type ScheduleJson,
} from "@/lib/schedule";
import { toast } from "sonner";

export const PublicProfile = ({ usernameProp, isPreview = false }: { usernameProp?: string; isPreview?: boolean }) => {
  const params = useParams();
  const username = usernameProp ?? params.username ?? "";
  const [search] = useSearchParams();
  const source = search.get("from") ?? null;
  const { t, lang, toggle } = useLanguage();

  const [profile, setProfile] = useState<any | null>(null);
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduleExpanded, setScheduleExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .maybeSingle();
      if (cancelled) return;
      setProfile(prof);
      if (prof) {
        const { data: lks } = await supabase
          .from("links")
          .select("*")
          .eq("profile_id", prof.id)
          .eq("is_active", true)
          .order("sort_order", { ascending: true });
        if (!cancelled) setLinks(lks ?? []);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [username]);

  // Apply theme
  useEffect(() => {
    if (!profile?.theme) return;
    const th = profile.theme as Theme;
    applyTheme(th);
    return () => {
      // restore Pilipinas default when leaving (only when full-page, not preview)
      if (!isPreview) applyTheme(THEMES[0]);
    };
  }, [profile, isPreview]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ color: "var(--color-text-muted)" }}>
        …
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ backgroundColor: "var(--color-bg)" }}>
        <h1 className="text-[22px] font-extrabold mb-2" style={{ color: "var(--color-text)" }}>
          {t({ en: "This page doesn't exist yet.", tl: "Wala pa ang page na ito." })}
        </h1>
        <p className="mb-5 text-[14px]" style={{ color: "var(--color-text-muted)" }}>
          {t({ en: "Claim yours at Pinoy.Digital", tl: "Kunin ang sa iyo sa Pinoy.Digital" })}
        </p>
        <RLink to="/" className="px-5 py-2.5 rounded-full text-[13px] font-semibold text-white" style={{ backgroundColor: "var(--color-primary)" }}>
          Pinoy.Digital
        </RLink>
      </div>
    );
  }

  const recordClick = async (linkId: string) => {
    await supabase.from("clicks").insert({
      link_id: linkId,
      profile_id: profile.id,
      source,
    });
  };

  const onLinkTap = async (link: any) => {
    if (link.is_video) return; // videos play inline
    await recordClick(link.id);
    if (link.url) window.open(link.url, "_blank", "noopener,noreferrer");
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: profile.display_name ?? profile.username, url });
      } catch {
        // dismissed
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success(t({ en: "Link copied!", tl: "Nakopya ang link!" }));
    }
  };

  const heroLink = links[0];
  const restLinks = links.slice(1);

  const schedule: ScheduleJson = profile.schedule_json && typeof profile.schedule_json === "object"
    ? { ...DEFAULT_SCHEDULE, ...profile.schedule_json }
    : DEFAULT_SCHEDULE;

  const moodText = lang === "EN" ? profile.mood_en : profile.mood_tl;
  const bioText = lang === "EN" ? profile.bio_en : profile.bio_tl;

  const hasBg = !!profile.bg_image_url;
  const coverStyle: React.CSSProperties = hasBg
    ? { backgroundImage: `url(${profile.bg_image_url})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: `linear-gradient(135deg, var(--color-primary), var(--color-secondary))` };

  return (
    <div
      className="relative min-h-screen animate-fade-in pb-20"
      style={{ backgroundColor: hasBg ? "transparent" : "var(--color-bg)" }}
    >
      {/* Fixed background */}
      {hasBg && (
        <div className="fixed inset-0 -z-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${profile.bg_image_url})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} />
        </div>
      )}

      {/* Full-bleed cover */}
      <div className="relative h-[200px] w-full overflow-hidden" style={coverStyle}>
        <div className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.35)" }} />
      </div>

      {/* Content */}
      <div className="relative max-w-[460px] mx-auto px-4">
        {/* Avatar — overlaps cover */}
        <div className="flex justify-center -mt-12">
          <div
            className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center"
            style={{
              border: "4px solid white",
              backgroundColor: "var(--color-surface)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
            }}
          >
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.display_name ?? ""} className="w-full h-full object-cover" />
            ) : (
              <span className="text-[32px]" style={{ color: "var(--color-text-muted)" }}>
                {(profile.display_name ?? profile.username ?? "?").charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* Mood badge — above name */}
        {moodText && (
          <div className="flex justify-center mt-3">
            <span
              className="px-4 py-1.5 rounded-full text-[12px] font-semibold"
              style={{ backgroundColor: "var(--color-accent)", color: "var(--color-text)" }}
            >
              {moodText}
              <span className="ml-1.5 opacity-60 text-[10px]">{timeAgo(profile.mood_updated_at, lang)}</span>
            </span>
          </div>
        )}

        {/* Name / username / bio */}
        <div className="text-center mt-2">
          <h1
            className="text-[22px] font-bold"
            style={{ color: hasBg ? "#fff" : "var(--color-text)" }}
          >
            {profile.display_name ?? profile.username}
          </h1>
          <p className="text-[13px]" style={{ color: hasBg ? "rgba(255,255,255,0.72)" : "var(--color-text-muted)" }}>
            @{profile.username}
          </p>
          {bioText && (
            <p
              className="mt-2 text-[14px] leading-snug max-w-[280px] mx-auto"
              style={{ color: hasBg ? "rgba(255,255,255,0.9)" : "var(--color-text)" }}
            >
              {bioText}
            </p>
          )}
        </div>

        {/* Lang toggle — below avatar */}
        <div className="flex justify-center mt-3 mb-6">
          <button
            onClick={toggle}
            className="px-3 py-1 rounded-full text-[11px] font-semibold"
            style={{
              backgroundColor: hasBg ? "rgba(255,255,255,0.9)" : "var(--color-surface)",
              color: "var(--color-text)",
              border: "1px solid rgba(0,0,0,0.08)",
            }}
          >
            {lang === "EN" ? "EN | TL" : "TL | EN"}
          </button>
        </div>

        {/* Links */}
        <div className="flex flex-col gap-[10px]">
          {heroLink && <LinkCard link={heroLink} hero onTap={onLinkTap} lang={lang} t={t} />}
          {restLinks.length > 0 && (
            <div className="grid grid-cols-2 gap-[10px]">
              {restLinks.map((l) =>
                l.is_video || l.category === "pay" ? (
                  <div key={l.id} className="col-span-2">
                    <LinkCard link={l} hero={false} onTap={onLinkTap} lang={lang} t={t} forceFull />
                  </div>
                ) : (
                  <LinkCard key={l.id} link={l} hero={false} onTap={onLinkTap} lang={lang} t={t} />
                )
              )}
            </div>
          )}
        </div>

        {/* Schedule */}
        {profile.schedule_enabled && (
          <div className="mt-[10px]">
            <ScheduleCard
              schedule={schedule}
              expanded={scheduleExpanded}
              onToggle={() => setScheduleExpanded((v) => !v)}
              lang={lang}
              t={t}
            />
          </div>
        )}

        {/* Collab */}
        {profile.collab_enabled && profile.collab_json && (
          <div className="mt-[10px]">
            <CollabCard collab={profile.collab_json} t={t} />
          </div>
        )}

        <p
          className="mt-10 text-center text-[11px]"
          style={{ color: hasBg ? "rgba(255,255,255,0.6)" : "var(--color-text-muted)" }}
        >
          Made with ♥ in the Philippines · Pinoy.Digital
        </p>
      </div>

      {/* Bottom share strip */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between px-5"
        style={{
          height: 56,
          backgroundColor: "white",
          borderTop: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        <span className="text-[13px] font-extrabold" style={{ color: "var(--color-primary)" }}>
          Pinoy.Digital
        </span>
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-white text-[13px] font-semibold"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          <Share2 size={14} />
          {t({ en: "Share", tl: "I-share" })}
        </button>
      </div>
    </div>
  );
};

const LinkCard = ({
  link, hero, onTap, lang, t, forceFull = false,
}: {
  link: any; hero: boolean; onTap: (l: any) => void; lang: "EN" | "TL"; t: any; forceFull?: boolean;
}) => {
  const Icon = link.icon_name ? platformIcon(link.icon_name) : categoryIcon(link.category);
  const title = (lang === "EN" ? link.title_en : link.title_tl) || link.title_en || link.title_tl || "Open";
  const isQR = link.category === "pay" && link.url && link.url.includes("/storage/v1/object/public/qr-codes/");

  if (link.is_video) {
    return (
      <div
        className="rounded-2xl overflow-hidden w-full"
        style={{ backgroundColor: "var(--color-surface)", border: "1px solid rgba(0,0,0,0.06)" }}
      >
        <VideoPlayer link={link} />
        <div className="p-3 flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "var(--color-bg)", color: "var(--color-primary)" }}
          >
            <Icon size={16} />
          </div>
          <p className="text-[13px] font-semibold flex-1 truncate" style={{ color: "var(--color-text)" }}>
            {title}
          </p>
        </div>
      </div>
    );
  }

  if (isQR) {
    return (
      <div
        className="rounded-2xl overflow-hidden w-full"
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <div className="p-4 flex flex-col items-center">
          <p className="text-[14px] font-bold mb-3" style={{ color: "var(--color-text)" }}>
            {title}
          </p>
          <img
            src={link.url}
            alt={`${title} QR code`}
            className="rounded-xl object-contain"
            style={{ width: 180, height: 180 }}
          />
          <p className="mt-2 text-[12px]" style={{ color: "var(--color-text-muted)" }}>
            {t({ en: "Scan to pay", tl: "I-scan para bayaran" })}
          </p>
        </div>
      </div>
    );
  }

  // Hero card
  if (hero || forceFull) {
    return (
      <button
        onClick={() => onTap(link)}
        className="relative w-full rounded-2xl p-4 flex items-center gap-3 text-left transition-transform active:scale-[0.98] text-white"
        style={{
          backgroundColor: "var(--color-primary)",
          minHeight: 100,
        }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: "rgba(255,255,255,0.18)" }}
        >
          <Icon size={20} />
        </div>
        <p className="flex-1 font-bold text-[16px] text-center">{title}</p>
        <ArrowUpRight size={20} className="shrink-0" />
      </button>
    );
  }

  // Grid card
  return (
    <button
      onClick={() => onTap(link)}
      className="relative w-full rounded-2xl p-3 flex flex-col justify-between text-left transition-transform active:scale-[0.98]"
      style={{
        height: 90,
        backgroundColor: "var(--color-surface)",
        border: "1px solid rgba(0,0,0,0.06)",
        color: "var(--color-text)",
      }}
    >
      <div className="flex items-start justify-between">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: "var(--color-bg)", color: "var(--color-primary)" }}
        >
          <Icon size={14} />
        </div>
        <ArrowUpRight size={12} style={{ color: "var(--color-text-muted)" }} />
      </div>
      <p className="text-[13px] font-bold truncate" style={{ color: "var(--color-text)" }}>{title}</p>
    </button>
  );
};

const VideoPlayer = ({ link }: { link: any }) => {
  if (link.video_type === "youtube") {
    const src = youtubeEmbed(link.video_url ?? link.url ?? "");
    if (!src) return null;
    return (
      <div className="aspect-video w-full">
        <iframe src={src} className="w-full h-full" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
      </div>
    );
  }
  if (link.video_type === "tiktok") {
    const src = tiktokEmbed(link.video_url ?? link.url ?? "");
    if (!src) return null;
    return (
      <div className="aspect-[9/16] w-full max-h-[520px]">
        <iframe src={src} className="w-full h-full" allowFullScreen />
      </div>
    );
  }
  // upload
  return (
    <video
      src={link.video_url ?? ""}
      autoPlay
      muted
      loop
      playsInline
      controls
      className="w-full max-h-[520px] object-cover"
    />
  );
};

// --- Cards ---

const ScheduleCard = ({
  schedule, expanded, onToggle, lang, t,
}: { schedule: ScheduleJson; expanded: boolean; onToggle: () => void; lang: "EN" | "TL"; t: any }) => {
  const today = todayKey();
  const cur = schedule[today];
  const now = new Date();
  const minsNow = now.getHours() * 60 + now.getMinutes();
  const toMins = (s?: string) => {
    if (!s) return 0;
    const [h, m] = s.split(":").map(Number);
    return h * 60 + m;
  };
  let isOpen = false;
  let label = "";
  if (cur?.open && cur.start && cur.end) {
    const start = toMins(cur.start);
    const end = toMins(cur.end);
    if (minsNow >= start && minsNow < end) {
      isOpen = true;
      label = `${t({ en: "Open · closes at", tl: "Bukas · sasara sa" })} ${formatTime12(cur.end)}`;
    }
  }
  if (!isOpen) {
    // find next open day
    const order: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
    const idx = order.indexOf(today);
    let nextLabel = t({ en: "Closed", tl: "Sarado" });
    for (let i = 1; i <= 7; i++) {
      const d = order[(idx + i) % 7];
      const ds = schedule[d];
      if (ds.open && ds.start) {
        const dayName = DAYS.find((x) => x.key === d);
        const when = i === 1 ? t({ en: "tomorrow", tl: "bukas" }) : (lang === "EN" ? dayName?.en : dayName?.tl);
        nextLabel = `${t({ en: "Closed · opens", tl: "Sarado · bubukas" })} ${when} ${formatTime12(ds.start)}`;
        break;
      }
    }
    label = nextLabel;
  }

  return (
    <button
      onClick={onToggle}
      className="w-full p-4 rounded-2xl flex flex-col gap-2 text-left"
      style={{
        backgroundColor: "var(--color-surface)",
        border: "1px solid rgba(0,0,0,0.06)",
      }}
    >
      <div className="flex items-center gap-3">
        <Clock size={20} style={{ color: isOpen ? "#10b981" : "#ef4444" }} />
        <p className="text-[14px] font-semibold flex-1" style={{ color: isOpen ? "#10b981" : "#ef4444" }}>
          {label}
        </p>
      </div>
      {expanded && (
        <div className="mt-2 space-y-1">
          {DAYS.map((d) => {
            const ds = schedule[d.key as DayKey];
            return (
              <div key={d.key} className="flex justify-between text-[12px]">
                <span style={{ color: today === d.key ? "var(--color-primary)" : "var(--color-text-muted)" }}>
                  {lang === "EN" ? d.en : d.tl}
                </span>
                <span style={{ color: "var(--color-text)" }}>
                  {ds.open ? `${formatTime12(ds.start)} – ${formatTime12(ds.end)}` : t({ en: "Closed", tl: "Sarado" })}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </button>
  );
};

const CollabCard = ({ collab, t }: { collab: any; t: any }) => {
  const contact = collab.contact ?? "";
  const isEmail = (collab.contact_type ?? "email") === "email";
  const href = isEmail ? `mailto:${contact}` : `https://instagram.com/${contact.replace(/^@/, "")}`;
  return (
    <div
      className="p-4 rounded-2xl"
      style={{ backgroundColor: "var(--color-surface)", border: "1px solid rgba(0,0,0,0.06)" }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Handshake size={20} style={{ color: "var(--color-primary)" }} />
        <h3 className="text-[15px] font-extrabold" style={{ color: "var(--color-text)" }}>
          {t({ en: "Work with me", tl: "Mag-collab tayo" })}
        </h3>
      </div>
      {collab.rate && (
        <p className="text-[14px] font-semibold mb-2" style={{ color: "var(--color-text)" }}>
          {t({ en: "Starting at", tl: "Simula sa" })} ₱{collab.rate}
        </p>
      )}
      {Array.isArray(collab.categories) && collab.categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {collab.categories.map((c: string) => (
            <span
              key={c}
              className="px-2.5 py-1 rounded-full text-[11px]"
              style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}
            >
              {c}
            </span>
          ))}
        </div>
      )}
      {contact && (
        <a
          href={href}
          target={isEmail ? undefined : "_blank"}
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-2.5 rounded-full text-[13px] font-semibold text-white"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          {isEmail ? <Mail size={14} /> : <Instagram size={14} />}
          {isEmail ? contact : `@${contact.replace(/^@/, "")}`}
        </a>
      )}
    </div>
  );
};

export default PublicProfile;
