import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, ImagePlus, X, ChevronRight, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { compressImage, readAsDataURL } from "@/lib/imageCompress";
import { THEMES, applyTheme, type Theme } from "@/lib/themes";
import { toast } from "sonner";

const Onboarding = () => {
  const { t } = useLanguage();
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

  // Step 3
  const [theme, setTheme] = useState<Theme>(THEMES[0]);
  const [bgFile, setBgFile] = useState<File | null>(null);
  const [bgPreview, setBgPreview] = useState<string | null>(null);
  const [bgUrl, setBgUrl] = useState<string | null>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

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
        const { error } = await supabase.storage.from("avatars").upload(path, blob, {
          upsert: true,
          contentType: "image/jpeg",
        });
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
      // Check username availability if changed
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
          const { error } = await supabase.storage.from("backgrounds").upload(path, blob, {
            upsert: true,
            contentType: "image/jpeg",
          });
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
    if (step === 4) {
      await finish();
    }
  };

  const skip = () => {
    if (step === 3) {
      setBgFile(null);
      setBgPreview(null);
      setStep(4);
    } else if (step === 4) {
      finish();
    } else if (step === 2) {
      setStep(3);
    }
  };

  const finish = async () => {
    if (!userId) return;
    setSubmitting(true);
    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      username,
      display_name: displayName.trim(),
      bio_en: bioEn || null,
      bio_tl: bioTl || null,
      avatar_url: avatarUrl,
      bg_image_url: bgUrl,
      theme: theme as any,
      mood_en: moodEn || null,
      mood_tl: moodTl || null,
      mood_updated_at: new Date().toISOString(),
      gcash_enabled: false,
      pasaload_enabled: false,
      schedule_enabled: false,
      collab_enabled: false,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
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
            <div
              key={n}
              className="h-2 rounded-full transition-all"
              style={{
                width: step === n ? 28 : 8,
                backgroundColor: n <= step ? "var(--color-primary)" : "rgba(0,0,0,0.12)",
              }}
            />
          ))}
        </div>

        {/* Step 1 */}
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
              style={{
                backgroundColor: "var(--color-surface)",
                border: "2px dashed rgba(0,0,0,0.15)",
              }}
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <Camera size={36} style={{ color: "var(--color-text-muted)" }} />
              )}
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              capture="user"
              hidden
              onChange={handleAvatarPick}
            />
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div>
            <h2 className="text-[24px] font-extrabold mb-2" style={{ color: "var(--color-text)" }}>
              {t({ en: "What should we call you?", tl: "Anong itatawag namin sayo?" })}
            </h2>
            <p className="text-[13px] mb-6" style={{ color: "var(--color-text-muted)" }}>
              {t({ en: "Your name and username on Pinoy Link.", tl: "Iyong pangalan at username sa Pinoy Link." })}
            </p>

            <Field label={t({ en: "Display name", tl: "Display name" })}>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value.slice(0, 50))}
                placeholder="Juan Dela Cruz"
                className="w-full px-4 py-3 rounded-xl text-[15px] outline-none"
                style={{ backgroundColor: "var(--color-surface)", border: "1px solid rgba(0,0,0,0.1)", color: "var(--color-text)" }}
              />
            </Field>

            <Field label="Username">
              <div className="flex items-center px-4 py-3 rounded-xl" style={{ backgroundColor: "var(--color-surface)", border: "1px solid rgba(0,0,0,0.1)" }}>
                <span className="text-[14px]" style={{ color: "var(--color-text-muted)" }}>pinoy.digital/</span>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 30))}
                  className="flex-1 bg-transparent outline-none text-[15px] font-medium"
                  style={{ color: "var(--color-text)" }}
                />
                {usernameValid && <Check size={16} style={{ color: "var(--color-primary)" }} />}
              </div>
              {username && !usernameValid && (
                <p className="text-[12px] mt-1" style={{ color: "var(--color-secondary)" }}>
                  {t({ en: "3–30 chars: lowercase, numbers, hyphens", tl: "3–30 karakter: maliit na titik, numero, gitling" })}
                </p>
              )}
            </Field>

            <Field label={`${t({ en: "Bio (English)", tl: "Bio (English)" })} — ${bioEn.length}/120`}>
              <textarea
                value={bioEn}
                onChange={(e) => setBioEn(e.target.value.slice(0, 120))}
                rows={2}
                className="w-full px-4 py-3 rounded-xl text-[14px] outline-none resize-none"
                style={{ backgroundColor: "var(--color-surface)", border: "1px solid rgba(0,0,0,0.1)", color: "var(--color-text)" }}
              />
            </Field>

            <Field label={`${t({ en: "Bio (Tagalog)", tl: "Bio (Tagalog)" })} — ${bioTl.length}/120`}>
              <textarea
                value={bioTl}
                onChange={(e) => setBioTl(e.target.value.slice(0, 120))}
                rows={2}
                className="w-full px-4 py-3 rounded-xl text-[14px] outline-none resize-none"
                style={{ backgroundColor: "var(--color-surface)", border: "1px solid rgba(0,0,0,0.1)", color: "var(--color-text)" }}
              />
            </Field>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div>
            <h2 className="text-[24px] font-extrabold mb-2" style={{ color: "var(--color-text)" }}>
              {t({ en: "Make it yours", tl: "Gawin mong sa iyo" })}
            </h2>
            <p className="text-[13px] mb-5" style={{ color: "var(--color-text-muted)" }}>
              {t({ en: "Pick a theme and an optional background.", tl: "Pumili ng theme at optional na background." })}
            </p>

            <div className="grid grid-cols-4 gap-3 mb-6">
              {THEMES.map((th) => (
                <button
                  key={th.id}
                  onClick={() => {
                    setTheme(th);
                    applyTheme(th);
                  }}
                  className="flex flex-col items-center gap-1.5"
                >
                  <div
                    className="w-14 h-14 rounded-full overflow-hidden flex transition-all"
                    style={{
                      boxShadow: theme.id === th.id ? `0 0 0 3px var(--color-primary)` : "none",
                      border: "1px solid rgba(0,0,0,0.08)",
                    }}
                  >
                    <div className="flex-1" style={{ backgroundColor: th.primary }} />
                    <div className="flex-1" style={{ backgroundColor: th.secondary }} />
                    <div className="flex-1" style={{ backgroundColor: th.accent }} />
                  </div>
                  <span className="text-[11px] font-medium" style={{ color: "var(--color-text)" }}>
                    {th.name}
                  </span>
                </button>
              ))}
            </div>

            <button
              onClick={() => bgInputRef.current?.click()}
              className="w-full h-[160px] rounded-2xl overflow-hidden relative flex items-center justify-center"
              style={{
                border: "2px dashed rgba(0,0,0,0.15)",
                backgroundColor: "var(--color-surface)",
                backgroundImage: bgPreview ? `url(${bgPreview})` : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              {!bgPreview && (
                <div className="flex flex-col items-center gap-2" style={{ color: "var(--color-text-muted)" }}>
                  <ImagePlus size={28} />
                  <span className="text-[13px]">
                    {t({ en: "Tap to upload a background image", tl: "Mag-upload ng background image" })}
                  </span>
                </div>
              )}
              {bgPreview && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setBgFile(null);
                    setBgPreview(null);
                  }}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
                >
                  <X size={16} />
                </button>
              )}
            </button>
            <input
              ref={bgInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={handleBgPick}
            />
          </div>
        )}

        {/* Step 4 */}
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
                <button
                  key={c.label}
                  onClick={() => {
                    setMoodEn(c.en);
                    setMoodTl(c.tl);
                  }}
                  className="px-3 py-1.5 rounded-full text-[12px] font-medium"
                  style={{
                    backgroundColor: "var(--color-surface)",
                    border: "1px solid rgba(0,0,0,0.1)",
                    color: "var(--color-text)",
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <Field label={`Mood (English) — ${moodEn.length}/60`}>
              <input
                value={moodEn}
                onChange={(e) => setMoodEn(e.target.value.slice(0, 60))}
                placeholder="e.g. Negosyo mode today 💼"
                className="w-full px-4 py-3 rounded-xl text-[15px] outline-none"
                style={{ backgroundColor: "var(--color-surface)", border: "1px solid rgba(0,0,0,0.1)", color: "var(--color-text)" }}
              />
            </Field>
            <Field label={`Mood (Tagalog) — ${moodTl.length}/60`}>
              <input
                value={moodTl}
                onChange={(e) => setMoodTl(e.target.value.slice(0, 60))}
                placeholder="e.g. Busy ngayon, babalik agad!"
                className="w-full px-4 py-3 rounded-xl text-[15px] outline-none"
                style={{ backgroundColor: "var(--color-surface)", border: "1px solid rgba(0,0,0,0.1)", color: "var(--color-text)" }}
              />
            </Field>
          </div>
        )}

        {/* Footer actions */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <button
            onClick={next}
            disabled={nextDisabled}
            className="w-full max-w-[320px] py-3.5 rounded-full text-[14px] font-semibold text-white flex items-center justify-center gap-1 disabled:opacity-40"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            {step === 4 ? t({ en: "Finish setup", tl: "Tapusin" }) : t({ en: "Next", tl: "Susunod" })}
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
