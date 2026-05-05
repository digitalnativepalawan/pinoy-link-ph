import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link as RLink } from "react-router-dom";
import {
  ArrowUpRight, Wallet, Smartphone, Clock, Handshake, Copy, X, Mail, Instagram,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { applyTheme, type Theme, THEMES } from "@/lib/themes";
import { categoryIcon, platformIcon, youtubeEmbed, tiktokEmbed } from "@/lib/categories";
import {
  DAYS, DEFAULT_SCHEDULE, formatTime12, todayKey, type DayKey, type ScheduleJson,
} from "@/lib/schedule";
import { timeAgo } from "@/lib/timeAgo";
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
  const [tipOpen, setTipOpen] = useState(false);
  const [pasaOpen, setPasaOpen] = useState(false);
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

  const heroLink = links[0];
  const restLinks = links.slice(1);
  const presets: number[] = Array.isArray(profile.gcash_presets) && profile.gcash_presets.length === 3
    ? profile.gcash_presets
    : [20, 50, 100];

  const schedule: ScheduleJson = profile.schedule_json && typeof profile.schedule_json === "object"
    ? { ...DEFAULT_SCHEDULE, ...profile.schedule_json }
    : DEFAULT_SCHEDULE;

  const moodText = lang === "EN" ? profile.mood_en : profile.mood_tl;
  const bioText = lang === "EN" ? profile.bio_en : profile.bio_tl;

  return (
    <div className="relative min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      {profile.bg_image_url && (
        <div className="fixed inset-0 -z-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${profile.bg_image_url})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.45)" }} />
        </div>
      )}

      <div className="relative max-w-[460px] mx-auto px-5 pt-4 pb-12">
        {/* Lang toggle */}
        <div className="flex justify-end mb-2">
          <button
            onClick={toggle}
            className="px-3 py-1 rounded-full text-[11px] font-semibold"
            style={{
              backgroundColor: profile.bg_image_url ? "rgba(255,255,255,0.9)" : "var(--color-surface)",
              color: "var(--color-text)",
              border: "1px solid rgba(0,0,0,0.08)",
            }}
          >
            {lang === "EN" ? "EN · TL" : "TL · EN"}
          </button>
        </div>

        {/* Mood banner */}
        {moodText && (
          <div
            className="rounded-full px-4 py-2.5 mb-5 text-center"
            style={{ backgroundColor: "var(--color-accent)", color: "var(--color-text)" }}
          >
            <p className="text-[13px] font-semibold">{moodText}</p>
            <p className="text-[10px] opacity-70">{timeAgo(profile.mood_updated_at, lang)}</p>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-6">
          <div
            className="w-[88px] h-[88px] rounded-full mx-auto overflow-hidden flex items-center justify-center"
            style={{ boxShadow: `0 0 0 3px var(--color-accent)`, backgroundColor: "var(--color-surface)" }}
          >
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.display_name ?? ""} className="w-full h-full object-cover" />
            ) : (
              <span className="text-[28px]" style={{ color: "var(--color-text-muted)" }}>
                {(profile.display_name ?? profile.username ?? "?").charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <h1
            className="mt-3 text-[20px] font-extrabold"
            style={{ color: profile.bg_image_url ? "#fff" : "var(--color-text)" }}
          >
            {profile.display_name ?? profile.username}
          </h1>
          <p className="text-[12px]" style={{ color: profile.bg_image_url ? "rgba(255,255,255,0.75)" : "var(--color-text-muted)" }}>
            @{profile.username}
          </p>
          {bioText && (
            <p
              className="mt-2 text-[13px] leading-snug max-w-[320px] mx-auto"
              style={{ color: profile.bg_image_url ? "rgba(255,255,255,0.9)" : "var(--color-text)" }}
            >
              {bioText}
            </p>
          )}
        </div>

        {/* Links */}
        <div className="space-y-3">
          {heroLink && <LinkCard link={heroLink} hero onTap={onLinkTap} lang={lang} />}
          {restLinks.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {restLinks.map((l) =>
                l.is_video ? (
                  // videos always full-width
                  <div key={l.id} className="col-span-2">
                    <LinkCard link={l} hero={false} onTap={onLinkTap} lang={lang} forceFull />
                  </div>
                ) : (
                  <LinkCard key={l.id} link={l} hero={false} onTap={onLinkTap} lang={lang} />
                )
              )}
            </div>
          )}
        </div>

        {/* GCash */}
        {profile.gcash_enabled && profile.gcash_number && (
          <button
            onClick={() => setTipOpen(true)}
            className="mt-4 w-full p-4 rounded-2xl flex items-center gap-3 text-white"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            <Wallet size={22} />
            <div className="flex-1 text-left">
              <p className="text-[13px] opacity-80">GCash</p>
              <p className="text-[16px] font-extrabold">{t({ en: "Send a tip", tl: "Magpadala ng tip" })}</p>
            </div>
            <ArrowUpRight size={20} />
          </button>
        )}

        {/* Pasaload */}
        {profile.pasaload_enabled && profile.pasaload_number && (
          <button
            onClick={() => setPasaOpen(true)}
            className="mt-3 w-full p-4 rounded-2xl flex items-center gap-3"
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid rgba(0,0,0,0.06)",
              color: "var(--color-text)",
            }}
          >
            <Smartphone size={22} style={{ color: "var(--color-secondary)" }} />
            <div className="flex-1 text-left">
              <p className="text-[13px]" style={{ color: "var(--color-text-muted)" }}>
                {profile.pasaload_network ?? "Pasaload"}
              </p>
              <p className="text-[16px] font-extrabold">{t({ en: "Send me load", tl: "Padalhan mo ako ng load" })}</p>
            </div>
            <ArrowUpRight size={20} />
          </button>
        )}

        {/* Schedule */}
        {profile.schedule_enabled && (
          <ScheduleCard
            schedule={schedule}
            expanded={scheduleExpanded}
            onToggle={() => setScheduleExpanded((v) => !v)}
            lang={lang}
            t={t}
          />
        )}

        {/* Collab */}
        {profile.collab_enabled && profile.collab_json && (
          <CollabCard collab={profile.collab_json} t={t} />
        )}

        <p
          className="mt-10 text-center text-[11px]"
          style={{ color: profile.bg_image_url ? "rgba(255,255,255,0.7)" : "var(--color-text-muted)" }}
        >
          Made with ♥ in the Philippines · Pinoy.Digital
        </p>
      </div>

      {tipOpen && (
        <TipJarSheet
          number={profile.gcash_number}
          presets={presets}
          onClose={() => setTipOpen(false)}
          t={t}
        />
      )}
      {pasaOpen && (
        <PasaloadSheet
          number={profile.pasaload_number}
          network={profile.pasaload_network ?? ""}
          onClose={() => setPasaOpen(false)}
          t={t}
        />
      )}
    </div>
  );
};

const LinkCard = ({
  link, hero, onTap, lang, forceFull = false,
}: {
  link: any; hero: boolean; onTap: (l: any) => void; lang: "EN" | "TL"; forceFull?: boolean;
}) => {
  const Icon = link.icon_name ? platformIcon(link.icon_name) : categoryIcon(link.category);
  const title = (lang === "EN" ? link.title_en : link.title_tl) || link.title_en || link.title_tl || "Open";

  if (link.is_video) {
    return (
      <div
        className="rounded-2xl overflow-hidden"
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

  return (
    <button
      onClick={() => onTap(link)}
      className={`text-left rounded-2xl p-4 flex items-center gap-3 transition-transform active:scale-[0.98] ${
        hero || forceFull ? "w-full" : ""
      }`}
      style={{
        backgroundColor: hero ? "var(--color-secondary)" : "var(--color-surface)",
        color: hero ? "#fff" : "var(--color-text)",
        border: hero ? "none" : "1px solid rgba(0,0,0,0.06)",
        minHeight: hero ? 96 : 88,
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{
          backgroundColor: hero ? "rgba(255,255,255,0.18)" : "var(--color-bg)",
          color: hero ? "#fff" : "var(--color-primary)",
        }}
      >
        <Icon size={20} />
      </div>
      <p className={`flex-1 font-bold ${hero ? "text-[16px]" : "text-[13px]"}`}>{title}</p>
      <ArrowUpRight size={hero ? 22 : 16} className="shrink-0" />
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

// --- Sheets & cards ---

const TipJarSheet = ({
  number, presets, onClose, t,
}: { number: string; presets: number[]; onClose: () => void; t: any }) => {
  const copy = async () => {
    await navigator.clipboard.writeText(number);
    toast.success(t({ en: "Copied!", tl: "Nakopya!" }));
  };
  return (
    <SheetWrap onClose={onClose} title={t({ en: "Send a tip via GCash", tl: "Mag-tip sa GCash" })}>
      <div className="flex items-center gap-2 mb-4">
        <p className="flex-1 text-[22px] font-extrabold tracking-wide" style={{ color: "var(--color-text)" }}>
          {number}
        </p>
        <button onClick={copy} className="p-3 rounded-full text-white" style={{ backgroundColor: "var(--color-primary)" }}>
          <Copy size={16} />
        </button>
      </div>
      <div className="flex gap-2 mb-4">
        {presets.map((p) => (
          <div
            key={p}
            className="flex-1 py-2 rounded-full text-center text-[14px] font-semibold"
            style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}
          >
            ₱{p}
          </div>
        ))}
      </div>
      <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>
        {t({ en: "Open GCash app → Send Money → paste number", tl: "Buksan ang GCash → Send Money → i-paste ang number" })}
      </p>
    </SheetWrap>
  );
};

const PasaloadSheet = ({
  number, network, onClose, t,
}: { number: string; network: string; onClose: () => void; t: any }) => {
  const copy = async () => {
    await navigator.clipboard.writeText(number);
    toast.success(t({ en: "Copied!", tl: "Nakopya!" }));
  };
  return (
    <SheetWrap onClose={onClose} title={t({ en: "Send me load", tl: "Padalhan ng load" })}>
      <div className="flex items-center gap-2 mb-3">
        <p className="flex-1 text-[22px] font-extrabold" style={{ color: "var(--color-text)" }}>
          {number}
        </p>
        <button onClick={copy} className="p-3 rounded-full text-white" style={{ backgroundColor: "var(--color-primary)" }}>
          <Copy size={16} />
        </button>
      </div>
      {network && (
        <span
          className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold mb-4"
          style={{ backgroundColor: "var(--color-accent)", color: "var(--color-text)" }}
        >
          {network}
        </span>
      )}
      <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>
        {t({ en: "Open GCash or your carrier app → Pasaload → paste number", tl: "Buksan ang GCash o carrier app → Pasaload → i-paste" })}
      </p>
    </SheetWrap>
  );
};

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
      className="mt-3 w-full p-4 rounded-2xl flex flex-col gap-2 text-left"
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
      className="mt-3 p-4 rounded-2xl"
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

const SheetWrap = ({
  title, onClose, children,
}: { title: string; onClose: () => void; children: React.ReactNode }) => (
  <div
    className="fixed inset-0 z-50 flex items-end justify-center"
    style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    onClick={onClose}
  >
    <div
      className="w-full max-w-[460px] rounded-t-3xl p-5"
      style={{ backgroundColor: "var(--color-surface)" }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[16px] font-extrabold" style={{ color: "var(--color-text)" }}>
          {title}
        </h3>
        <button onClick={onClose} className="p-1" style={{ color: "var(--color-text-muted)" }}>
          <X size={20} />
        </button>
      </div>
      {children}
    </div>
  </div>
);

export default PublicProfile;
