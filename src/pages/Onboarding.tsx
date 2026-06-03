import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, ImagePlus, X, ChevronRight, ChevronLeft, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { compressImage, readAsDataURL } from "@/lib/imageCompress";
import { THEMES, applyTheme, type Theme } from "@/lib/themes";
import { toast } from "sonner";

// ─── Theme emoji map ───────────────────────────────────────────
const THEME_META: Record<string, { emoji: string; tagEN: string; tagTL: string; links: string[] }> = {
  pilipinas: { emoji: "🇵🇭", tagEN: "Patriot", tagTL: "Makabayen", links: ["▶️ Aking Channel", "🛍 Shopee Store", "💬 WhatsApp"] },
  midnight:  { emoji: "🌙", tagEN: "Dark & Edgy", tagTL: "Madilim at Makulay", links: ["🎤 Music", "📸 IG Feed", "🛍 Shop"] },
  forest:    { emoji: "🌿", tagEN: "Nature Lover", tagTL: "Mahilig sa Kalikasan", links: ["🌱 Blog", "🏕 Travel", "🌾 Farm"] },
  sunset:    { emoji: "🌅", tagEN: "Warm & Bright", tagTL: "Mainit at Maliwanag", links: ["📸 Photos", "🍹 Lifestyle", "✈️ Travel"] },
  ocean:     { emoji: "🌊", tagEN: "Palawan Vibes", tagTL: "Dagat-dagatan", links: ["🤿 Tours", "🏖 Beach", "🐠 Nature"] },
  bohol:     { emoji: "🏺", tagEN: "Heritage Rich", tagTL: "Mayamang Kultura", links: ["🧵 Crafts", "🍽 Food", "🗺 Tours"] },
  monochrome:{ emoji: "💼", tagEN: "Clean & Pro", tagTL: "Propesyonal", links: ["📋 Portfolio", "🤝 Collab", "📊 Services"] },
  rose:      { emoji: "🌸", tagEN: "Soft & Sweet", tagTL: "Malambot at Matamis", links: ["💄 Beauty", "✨ Lifestyle", "🛍 Shop"] },
};

// ─── Mini profile card preview ─────────────────────────────────
function ThemeCard({
  theme,
  avatarPreview,
  displayName,
  username,
  isSelected,
  lang,
  onClick,
}: {
  theme: Theme;
  avatarPreview: string | null;
  displayName: string;
  username: string;
  isSelected: boolean;
  lang: string;
  onClick: () => void;
}) {
  const meta = THEME_META[theme.id] ?? { emoji: "✨", tagEN: theme.name, tagTL: theme.name, links: ["🔗 Link 1", "🔗 Link 2", "🔗 Link 3"] };
  const isDark = ["midnight"].includes(theme.id);
  const textColor = isDark ? "#ffffff" : "#1a1a1a";
  const mutedColor = isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.45)";
  const surfaceColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.07)";
  const borderColor = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)";

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-shrink-0 rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 text-left focus:outline-none select-none"
      style={{
        width: 210,
        border: isSelected ? `2.5px solid ${theme.primary}` : "2px solid rgba(0,0,0,0.08)",
        boxShadow: isSelected
          ? `0 0 0 4px ${theme.primary}25, 0 8px 28px rgba(0,0,0,0.18)`
          : "0 2px 12px rgba(0,0,0,0.1)",
        transform: isSelected ? "scale(1.02)" : "scale(1)",
      }}
    >
      {/* Preview body */}
      <div
        className="relative flex flex-col items-center px-4 pt-6 pb-4"
        style={{ height: 260, backgroundColor: theme.bg }}
      >
        {/* Subtle gradient overlay using theme colors */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(ellipse at 80% 10%, ${theme.secondary}60 0%, transparent 55%),
                         radial-gradient(ellipse at 15% 85%, ${theme.primary}40 0%, transparent 50%)`,
          }}
        />

        {/* Selected check */}
        {isSelected && (
          <div
            className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center z-20 shadow"
            style={{ backgroundColor: theme.primary }}
          >
            <Check size={13} strokeWidth={3} color={isDark ? "#000" : "#fff"} />
          </div>
        )}

        {/* Avatar */}
        <div className="relative mb-2 z-10">
          <div
            className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center text-[16px] font-black"
            style={{
              border: `2.5px solid ${theme.primary}`,
              boxShadow: `0 0 0 4px ${theme.primary}22`,
              backgroundColor: `${theme.primary}18`,
              color: theme.primary,
            }}
          >
            {avatarPreview
              ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
              : (displayName?.charAt(0).toUpperCase() || "M")
            }
          </div>
        </div>

        {/* Name */}
        <p className="text-[12px] font-bold text-center leading-tight z-10" style={{ color: textColor }}>
          {displayName || "Maria Santos"}
        </p>
        <p className="text-[10px] mb-2 z-10" style={{ color: mutedColor }}>
          @{username || "mariasantos"}
        </p>

        {/* Tag pill */}
        <div
          className="px-2 py-0.5 rounded-full text-[9px] font-semibold mb-3 z-10"
          style={{ backgroundColor: `${theme.primary}18`, color: theme.primary, border: `1px solid ${theme.primary}35` }}
        >
          {meta.emoji} {lang === "tl" ? meta.tagTL : meta.tagEN}
        </div>

        {/* Mini link buttons */}
        <div className="w-full space-y-1.5 z-10">
          {meta.links.map((label, i) => (
            <div
              key={i}
              className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg"
              style={{
                backgroundColor: surfaceColor,
                border: `1px solid ${borderColor}`,
              }}
            >
              <span className="text-[9px]">{label.split(" ")[0]}</span>
              <div className="flex-1 h-[5px] rounded-full opacity-40" style={{ backgroundColor: textColor }} />
            </div>
          ))}
        </div>
      </div>

      {/* Info footer */}
      <div
        className="px-3 py-2.5 flex items-center justify-between"
        style={{ backgroundColor: isDark ? "#111" : "#fff", borderTop: `1px solid ${borderColor}` }}
      >
        <div>
          <p className="text-[13px] font-bold" style={{ color: isDark ? "#fff" : "#1a1a1a" }}>{theme.name}</p>
          <p className="text-[10px]" style={{ color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)" }}>
            {meta.emoji} {lang === "tl" ? meta.tagTL : meta.tagEN}
          </p>
        </div>
        <div className="flex gap-1">
          <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: theme.primary }} />
          <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: theme.secondary }} />
          <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: theme.accent }} />
        </div>
      </div>
    </button>
  );
}

// ─── Main Onboarding ───────────────────────────────────────────
const Onboarding = () => {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Step 2
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bioEn, setBioEn] = useState("");
  const [bioTl, setBioTl] = useState("");

  // Step 3 — swipe card picker
  const [theme, setTheme] = useState<Theme>(THEMES[0]);
  const [themeIdx, setThemeIdx] = useState(0);
  const [bgFile, setBgFile] = useState<File | null>(null);
  const [bgPreview, setBgPreview] = useState<string | null>(null);
  const [bgUrl, setBgUrl] = useState<string | null>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  // Step 4
  const [moodEn, setMoodEn] = useState("");
  const [moodTl, setMoodTl] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
    const pending = localStorage.getItem("pending_username");
    if (pending) setUsername(pending);
  }, []);

  // Apply theme preview live as user swipes
  useEffect(() => { applyTheme(theme); }, [theme]);

  // Sync track position
  useEffect(() => {
    if (trackRef.current) {
      trackRef.current.style.transform = `translateX(${-themeIdx * 222}px)`;
    }
  }, [themeIdx]);

  const goToTheme = useCallback((idx: number) => {
    const clamped = Math.max(0, Math.min(idx, THEMES.length - 1));
    setThemeIdx(clamped);
    setTheme(THEMES[clamped]);
    applyTheme(THEMES[clamped]);
  }, []);

  // Touch/drag on theme swipe stage
  useEffect(() => {
    if (step !== 3) return;
    const stage = stageRef.current;
    const track = trackRef.current;
    if (!stage || !track) return;

    let startX = 0;
    let moved = false;

    const onDown = (e: MouseEvent | TouchEvent) => {
      startX = "touches" in e ? e.touches[0].clientX : e.clientX;
      moved = false;
      track.style.transition = "none";
    };
    const onMove = (e: MouseEvent | TouchEvent) => {
      const cx = "touches" in e ? e.touches[0].clientX : e.clientX;
      const dx = cx - startX;
      if (Math.abs(dx) > 6) moved = true;
      track.style.transform = `translateX(${-themeIdx * 222 + dx}px)`;
    };
    const onUp = (e: MouseEvent | TouchEvent) => {
      const cx = "changedTouches" in e ? e.changedTouches[0].clientX : (e as MouseEvent).clientX;
      const dx = cx - startX;
      track.style.transition = "transform 0.3s cubic-bezier(0.4,0,0.2,1)";
      if (moved) {
        if (dx < -40 && themeIdx < THEMES.length - 1) goToTheme(themeIdx + 1);
        else if (dx > 40 && themeIdx > 0) goToTheme(themeIdx - 1);
        else goToTheme(themeIdx);
      }
      window.removeEventListener("mousemove", onMove as any);
      window.removeEventListener("mouseup", onUp as any);
      window.removeEventListener("touchmove", onMove as any);
      window.removeEventListener("touchend", onUp as any);
    };
    const onStart = (e: MouseEvent | TouchEvent) => {
      onDown(e);
      window.addEventListener("mousemove", onMove as any);
      window.addEventListener("mouseup", onUp as any);
      window.addEventListener("touchmove", onMove as any, { passive: true });
      window.addEventListener("touchend", onUp as any);
    };
    stage.addEventListener("mousedown", onStart as any);
    stage.addEventListener("touchstart", onStart as any, { passive: true });
    return () => {
      stage.removeEventListener("mousedown", onStart as any);
      stage.removeEventListener("touchstart", onStart as any);
    };
  }, [step, themeIdx, goToTheme]);

  const usernameValid = /^[a-z0-9-]{3,30}$/.test(username);

  const handleAvatarPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setAvatarFile(f);
    setAvatarPreview(await readAsDataURL(f));
  };

  const handleBgPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setBgFile(f);
    setBgPreview(await readAsDataURL(f));
  };

  const next = async () => {
    if (!userId) return;
    if (step === 1) {
      if (!avatarFile) return;
      setSubmitting(true);
      try {
        const blob = await compressImage(avatarFile, 400, 0.85);
        const path = `${userId}/avatar.jpg`;
        const { error } = await supabase.storage.from("avatars").upload(path, blob, { upsert: true, contentType: "image/jpeg" });
        if (error) throw error;
        const { data } = supabase.storage.from("avatars").getPublicUrl(path);
        setAvatarUrl(`${data.publicUrl}?t=${Date.now()}`);
        setStep(2);
      } catch (err: any) {
        toast.error(err.message ?? "Upload failed");
      } finally {
        setSubmitting(false);
      }
      return;
    }
    if (step === 2) {
      if (!displayName.trim() || !usernameValid) return;
      const pending = localStorage.getItem("pending_username");
      if (username !== pending) {
        const { data } = await supabase.from("profiles").select("id").eq("username", username).maybeSingle();
        if (data && data.id !== userId) {
          toast.error(t({ en: "Username taken, try another", tl: "Nakuha na ang username" }));
          return;
        }
      }
      setStep(3);
      return;
    }
    if (step === 3) {
      if (bgFile) {
        setSubmitting(true);
        try {
          const blob = await compressImage(bgFile, 1200, 0.8);
          const path = `${userId}/bg.jpg`;
          const { error } = await supabase.storage.from("backgrounds").upload(path, blob, { upsert: true, contentType: "image/jpeg" });
          if (error) throw error;
          const { data } = supabase.storage.from("backgrounds").getPublicUrl(path);
          setBgUrl(`${data.publicUrl}?t=${Date.now()}`);
        } catch (err: any) {
          toast.error(err.message ?? "Upload failed");
          setSubmitting(false);
          return;
        } finally {
          setSubmitting(false);
        }
      }
      setStep(4);
      return;
    }
    if (step === 4) { await finish(); }
  };

  const skip = () => {
    if (step === 3) { setBgFile(null); setBgPreview(null); setStep(4); }
    else if (step === 4) { finish(); }
    else if (step === 2) { setStep(3); }
  };

  const finish = async () => {
    if (!userId) return;
    setSubmitting(true);
    const { error } = await supabase.from("profiles").upsert({
      id: userId, username, display_name: displayName.trim(),
      bio_en: bioEn || null, bio_tl: bioTl || null,
      avatar_url: avatarUrl, bg_image_url: bgUrl,
      theme: theme as any,
      mood_en: moodEn || null, mood_tl: moodTl || null,
      mood_updated_at: new Date().toISOString(),
      gcash_enabled: false, pasaload_enabled: false, schedule_enabled: false, collab_enabled: false,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    localStorage.removeItem("pending_username");
    navigate("/dashboard", { replace: true });
  };

  const moodChips = [
    { label: "Masaya 🌞", en: "Feeling happy today 🌞", tl: "Masaya ako ngayon 🌞" },
    { label: "Busy mode 💼", en: "Busy mode today 💼", tl: "Busy ngayon 💼" },
    { label: "Chill lang 🌊", en: "Taking it easy 🌊", tl: "Chill lang ngayon 🌊" },
    { label: "Available ✨", en: "Open for collabs ✨", tl: "Bukas sa collab ✨" },
    { label: "On leave 🌴", en: "On leave, back soon 🌴", tl: "Naka-leave, babalik agad 🌴" },
    { label: "Mag-order na! 🛒", en: "Orders open! DM me 🛒", tl: "Bukas ang orders! Mag-DM 🛒" },
  ];

  const nextDisabled =
    submitting ||
    (step === 1 && !avatarFile) ||
    (step === 2 && (!displayName.trim() || !usernameValid));

  return (
    <div className="min-h-screen px-5 py-6" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="max-w-[460px] mx-auto">

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-2 rounded-full transition-all" style={{
              width: step === n ? 28 : 8,
              backgroundColor: n <= step ? "var(--color-primary)" : "rgba(0,0,0,0.12)",
            }} />
          ))}
        </div>

        {/* ── Step 1: Photo ── */}
        {step === 1 && (
          <div className="text-center">
            <h2 className="text-[24px] font-extrabold mb-2" style={{ color: "var(--color-text)" }}>
              {t({ en: "Add a profile photo", tl: "Magdagdag ng profile photo" })}
            </h2>
            <p className="text-[13px] mb-8" style={{ color: "var(--color-text-muted)" }}>
              {t({ en: "Show your face — it builds trust.", tl: "Ipakita ang mukha mo — para may tiwala." })}
            </p>
            <button
              onClick={() => avatarInputRef.current?.click()}
              className="w-[120px] h-[120px] rounded-full mx-auto flex items-center justify-center overflow-hidden"
              style={{ backgroundColor: "var(--color-surface)", border: "2px dashed rgba(0,0,0,0.15)" }}
            >
              {avatarPreview
                ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                : <Camera size={36} style={{ color: "var(--color-text-muted)" }} />
              }
            </button>
            <input ref={avatarInputRef} type="file" accept="image/*" capture="user" hidden onChange={handleAvatarPick} />
          </div>
        )}

        {/* ── Step 2: Name & Bio ── */}
        {step === 2 && (
          <div>
            <h2 className="text-[24px] font-extrabold mb-2" style={{ color: "var(--color-text)" }}>
              {t({ en: "What should we call you?", tl: "Anong itatawag namin sayo?" })}
            </h2>
            <p className="text-[13px] mb-6" style={{ color: "var(--color-text-muted)" }}>
              {t({ en: "Your name and username on Pinoy Link.", tl: "Iyong pangalan at username sa Pinoy Link." })}
            </p>
            <Field label={t({ en: "Display name", tl: "Display name" })}>
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value.slice(0, 50))}
                placeholder="Juan Dela Cruz" className="w-full px-4 py-3 rounded-xl text-[15px] outline-none"
                style={{ backgroundColor: "var(--color-surface)", border: "1px solid rgba(0,0,0,0.1)", color: "var(--color-text)" }} />
            </Field>
            <Field label="Username">
              <div className="flex items-center px-4 py-3 rounded-xl" style={{ backgroundColor: "var(--color-surface)", border: "1px solid rgba(0,0,0,0.1)" }}>
                <span className="text-[14px]" style={{ color: "var(--color-text-muted)" }}>pinoy.digital/</span>
                <input value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 30))}
                  className="flex-1 bg-transparent outline-none text-[15px] font-medium" style={{ color: "var(--color-text)" }} />
                {usernameValid && <Check size={16} style={{ color: "var(--color-primary)" }} />}
              </div>
              {username && !usernameValid && (
                <p className="text-[12px] mt-1" style={{ color: "var(--color-secondary)" }}>
                  {t({ en: "3–30 chars: lowercase, numbers, hyphens", tl: "3–30 karakter: maliit na titik, numero, gitling" })}
                </p>
              )}
            </Field>
            <Field label={`${t({ en: "Bio (English)", tl: "Bio (English)" })} — ${bioEn.length}/120`}>
              <textarea value={bioEn} onChange={(e) => setBioEn(e.target.value.slice(0, 120))} rows={2}
                className="w-full px-4 py-3 rounded-xl text-[14px] outline-none resize-none"
                style={{ backgroundColor: "var(--color-surface)", border: "1px solid rgba(0,0,0,0.1)", color: "var(--color-text)" }} />
            </Field>
            <Field label={`${t({ en: "Bio (Tagalog)", tl: "Bio (Tagalog)" })} — ${bioTl.length}/120`}>
              <textarea value={bioTl} onChange={(e) => setBioTl(e.target.value.slice(0, 120))} rows={2}
                className="w-full px-4 py-3 rounded-xl text-[14px] outline-none resize-none"
                style={{ backgroundColor: "var(--color-surface)", border: "1px solid rgba(0,0,0,0.1)", color: "var(--color-text)" }} />
            </Field>
          </div>
        )}

        {/* ── Step 3: Theme swipe picker ── */}
        {step === 3 && (
          <div>
            <h2 className="text-[24px] font-extrabold mb-1" style={{ color: "var(--color-text)" }}>
              {t({ en: <>Make it <span style={{ color: "var(--color-primary)" }}>yours.</span></>, tl: <>Gawin mong <span style={{ color: "var(--color-primary)" }}>sa iyo.</span></> })}
            </h2>
            <p className="text-[13px] mb-4" style={{ color: "var(--color-text-muted)" }}>
              {t({ en: "Swipe to pick a theme. Your profile updates live.", tl: "Mag-swipe para pumili ng tema. Live ang preview." })}
            </p>

            {/* Swipe stage */}
            <div
              ref={stageRef}
              className="overflow-hidden cursor-grab active:cursor-grabbing select-none mb-3"
              style={{ touchAction: "pan-y" }}
            >
              <div
                ref={trackRef}
                className="flex gap-3"
                style={{ transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)", willChange: "transform" }}
              >
                {THEMES.map((th, i) => (
                  <ThemeCard
                    key={th.id}
                    theme={th}
                    avatarPreview={avatarPreview}
                    displayName={displayName}
                    username={username}
                    isSelected={theme.id === th.id}
                    lang={lang}
                    onClick={() => goToTheme(i)}
                  />
                ))}
              </div>
            </div>

            {/* Dots + arrows */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => goToTheme(themeIdx - 1)}
                disabled={themeIdx === 0}
                className="w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-25 transition-opacity"
                style={{ backgroundColor: "var(--color-surface)", border: "1px solid rgba(0,0,0,0.1)" }}
              >
                <ChevronLeft size={16} style={{ color: "var(--color-text)" }} />
              </button>

              <div className="flex gap-1.5">
                {THEMES.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => goToTheme(i)}
                    className="h-1.5 rounded-full transition-all duration-200"
                    style={{
                      width: i === themeIdx ? 20 : 6,
                      backgroundColor: i === themeIdx ? "var(--color-primary)" : "rgba(0,0,0,0.18)",
                    }}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => goToTheme(themeIdx + 1)}
                disabled={themeIdx === THEMES.length - 1}
                className="w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-25 transition-opacity"
                style={{ backgroundColor: "var(--color-surface)", border: "1px solid rgba(0,0,0,0.1)" }}
              >
                <ChevronRight size={16} style={{ color: "var(--color-text)" }} />
              </button>
            </div>

            {/* Selected badge */}
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl mb-4"
              style={{ backgroundColor: `${theme.primary}12`, border: `1px solid ${theme.primary}30` }}
            >
              <span className="text-[13px]">{THEME_META[theme.id]?.emoji}</span>
              <span className="text-[12px] font-semibold" style={{ color: theme.primary }}>{theme.name}</span>
              <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                — {lang === "tl" ? THEME_META[theme.id]?.tagTL : THEME_META[theme.id]?.tagEN}
              </span>
              <div className="flex gap-1 ml-auto">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.primary }} />
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.secondary }} />
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.accent }} />
              </div>
            </div>

            {/* Background upload */}
            <p className="text-[12px] font-medium mb-2" style={{ color: "var(--color-text-muted)" }}>
              {t({ en: "Optional: add a cover photo", tl: "Optional: magdagdag ng cover photo" })}
            </p>
            <button
              onClick={() => bgInputRef.current?.click()}
              className="w-full h-[120px] rounded-2xl overflow-hidden relative flex items-center justify-center"
              style={{
                border: "2px dashed rgba(0,0,0,0.12)",
                backgroundColor: "var(--color-surface)",
                backgroundImage: bgPreview ? `url(${bgPreview})` : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              {!bgPreview && (
                <div className="flex flex-col items-center gap-2" style={{ color: "var(--color-text-muted)" }}>
                  <ImagePlus size={24} />
                  <span className="text-[12px]">{t({ en: "Tap to upload", tl: "Mag-tap para mag-upload" })}</span>
                </div>
              )}
              {bgPreview && (
                <button type="button"
                  onClick={(e) => { e.stopPropagation(); setBgFile(null); setBgPreview(null); }}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
                >
                  <X size={15} />
                </button>
              )}
            </button>
            <input ref={bgInputRef} type="file" accept="image/*" capture="environment" hidden onChange={handleBgPick} />
          </div>
        )}

        {/* ── Step 4: Mood ── */}
        {step === 4 && (
          <div>
            <h2 className="text-[24px] font-extrabold mb-2" style={{ color: "var(--color-text)" }}>
              {t({ en: "What's your vibe today?", tl: "Anong vibe mo ngayon?" })}
            </h2>
            <p className="text-[13px] mb-5" style={{ color: "var(--color-text-muted)" }}>
              {t({ en: "Visitors see this on your profile. Update it anytime.", tl: "Makikita ito ng bisita sa profile mo. Pwedeng baguhin anumang oras." })}
            </p>
            <div className="flex flex-wrap gap-2 mb-5">
              {moodChips.map((c) => (
                <button key={c.label} onClick={() => { setMoodEn(c.en); setMoodTl(c.tl); }}
                  className="px-3 py-1.5 rounded-full text-[12px] font-medium transition-all"
                  style={{
                    backgroundColor: (moodEn === c.en) ? "var(--color-primary)" : "var(--color-surface)",
                    color: (moodEn === c.en) ? "#fff" : "var(--color-text)",
                    border: "1px solid rgba(0,0,0,0.1)",
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <Field label={`Mood (English) — ${moodEn.length}/60`}>
              <input value={moodEn} onChange={(e) => setMoodEn(e.target.value.slice(0, 60))}
                placeholder="e.g. Negosyo mode today 💼"
                className="w-full px-4 py-3 rounded-xl text-[15px] outline-none"
                style={{ backgroundColor: "var(--color-surface)", border: "1px solid rgba(0,0,0,0.1)", color: "var(--color-text)" }} />
            </Field>
            <Field label={`Mood (Tagalog) — ${moodTl.length}/60`}>
              <input value={moodTl} onChange={(e) => setMoodTl(e.target.value.slice(0, 60))}
                placeholder="e.g. Busy ngayon, babalik agad!"
                className="w-full px-4 py-3 rounded-xl text-[15px] outline-none"
                style={{ backgroundColor: "var(--color-surface)", border: "1px solid rgba(0,0,0,0.1)", color: "var(--color-text)" }} />
            </Field>
          </div>
        )}

        {/* Footer actions */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <button
            onClick={next}
            disabled={nextDisabled}
            className="w-full max-w-[320px] py-3.5 rounded-full text-[14px] font-semibold text-white flex items-center justify-center gap-1 disabled:opacity-40 transition-opacity"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            {step === 4
              ? t({ en: "Finish setup", tl: "Tapusin" })
              : step === 3
                ? t({ en: `Continue with ${theme.name}`, tl: `Ituloy ang ${theme.name}` })
                : t({ en: "Next", tl: "Susunod" })}
            <ChevronRight size={16} strokeWidth={2.5} />
          </button>
          {step > 1 && (
            <button onClick={skip} className="text-[13px] underline" style={{ color: "var(--color-text-muted)" }}>
              {t({ en: "Skip", tl: "Laktawan" })}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="mb-4">
    <label className="block text-[12px] font-medium mb-1.5" style={{ color: "var(--color-text-muted)" }}>
      {label}
    </label>
    {children}
  </div>
);

export default Onboarding;
