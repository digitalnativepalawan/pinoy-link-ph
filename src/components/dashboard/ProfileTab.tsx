import { useEffect, useRef, useState } from "react";
import {
  Camera, X, Wallet, Smartphone, Calendar, Handshake,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { compressImage } from "@/lib/imageCompress";
import { DAYS, DEFAULT_SCHEDULE, type ScheduleJson, type DayKey } from "@/lib/schedule";
import { toast } from "sonner";

const NETWORKS = ["Globe", "Smart", "TNT", "DITO"];
const COLLAB_CATEGORIES = [
  "Lifestyle", "Food", "Travel", "Fashion", "Tech", "Gaming", "Beauty", "Business",
];

interface ProfileRow {
  id: string;
  username: string;
  display_name: string | null;
  bio_en: string | null;
  bio_tl: string | null;
  avatar_url: string | null;
  bg_image_url: string | null;
  gcash_enabled: boolean;
  gcash_number: string | null;
  gcash_presets: any;
  pasaload_enabled: boolean;
  pasaload_number: string | null;
  pasaload_network: string | null;
  schedule_enabled: boolean;
  schedule_json: any;
  collab_enabled: boolean;
  collab_json: any;
}

export const ProfileTab = ({ userId }: { userId: string }) => {
  const { t } = useLanguage();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);
  const bgRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle().then(({ data }) => {
      setProfile(data as ProfileRow);
      setLoading(false);
    });
  }, [userId]);

  if (loading || !profile) {
    return <p className="px-5 py-8 text-center text-[13px]" style={{ color: "var(--color-text-muted)" }}>…</p>;
  }

  const update = (patch: Partial<ProfileRow>) => setProfile((p) => (p ? { ...p, ...patch } : p));

  const saveBasics = async () => {
    if (!profile.display_name?.trim()) {
      toast.error(t({ en: "Display name required", tl: "Kailangan ang display name" }));
      return;
    }
    if (!/^[a-z0-9-]{3,30}$/.test(profile.username)) {
      toast.error(t({ en: "Invalid username", tl: "Mali ang username" }));
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      display_name: profile.display_name.trim(),
      username: profile.username,
      bio_en: profile.bio_en,
      bio_tl: profile.bio_tl,
      gcash_enabled: profile.gcash_enabled,
      gcash_number: profile.gcash_number,
      gcash_presets: profile.gcash_presets,
      pasaload_enabled: profile.pasaload_enabled,
      pasaload_number: profile.pasaload_number,
      pasaload_network: profile.pasaload_network,
      schedule_enabled: profile.schedule_enabled,
      schedule_json: profile.schedule_json,
      collab_enabled: profile.collab_enabled,
      collab_json: profile.collab_json,
    }).eq("id", userId);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success(t({ en: "Saved", tl: "Nai-save" }));
  };

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const blob = await compressImage(f, 400, 0.85);
    const path = `${userId}/avatar.jpg`;
    const { error } = await supabase.storage.from("avatars").upload(path, blob, {
      upsert: true, contentType: "image/jpeg",
    });
    if (error) return toast.error(error.message);
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = `${data.publicUrl}?t=${Date.now()}`;
    await supabase.from("profiles").update({ avatar_url: url }).eq("id", userId);
    update({ avatar_url: url });
    toast.success(t({ en: "Avatar updated", tl: "Na-update ang avatar" }));
  };

  const handleBg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const blob = await compressImage(f, 1200, 0.8);
    const path = `${userId}/bg.jpg`;
    const { error } = await supabase.storage.from("backgrounds").upload(path, blob, {
      upsert: true, contentType: "image/jpeg",
    });
    if (error) return toast.error(error.message);
    const { data } = supabase.storage.from("backgrounds").getPublicUrl(path);
    const url = `${data.publicUrl}?t=${Date.now()}`;
    await supabase.from("profiles").update({ bg_image_url: url }).eq("id", userId);
    update({ bg_image_url: url });
    toast.success(t({ en: "Background updated", tl: "Na-update ang background" }));
  };

  const removeBg = async () => {
    await supabase.from("profiles").update({ bg_image_url: null }).eq("id", userId);
    update({ bg_image_url: null });
  };

  // GCash presets
  const presets: number[] = Array.isArray(profile.gcash_presets) && profile.gcash_presets.length === 3
    ? profile.gcash_presets
    : [20, 50, 100];

  // Schedule
  const schedule: ScheduleJson = profile.schedule_json && typeof profile.schedule_json === "object"
    ? { ...DEFAULT_SCHEDULE, ...profile.schedule_json }
    : DEFAULT_SCHEDULE;

  // Collab
  const collab = profile.collab_json && typeof profile.collab_json === "object"
    ? profile.collab_json
    : { rate: "", categories: [], contact_type: "email", contact: "" };

  const setCollab = (patch: any) => update({ collab_json: { ...collab, ...patch } });
  const toggleCollabCat = (c: string) => {
    const cats: string[] = collab.categories ?? [];
    setCollab({ categories: cats.includes(c) ? cats.filter((x) => x !== c) : [...cats, c] });
  };

  return (
    <div className="px-5 pb-32 pt-2 space-y-6">
      {/* Avatar + Bg */}
      <Section title={t({ en: "Photos", tl: "Mga larawan" })}>
        <div className="flex items-center gap-4">
          <button
            onClick={() => avatarRef.current?.click()}
            className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center"
            style={{ backgroundColor: "var(--color-bg)", border: "1px solid rgba(0,0,0,0.08)" }}
          >
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <Camera size={22} style={{ color: "var(--color-text-muted)" }} />
            )}
          </button>
          <div className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>
            {t({ en: "Tap to replace avatar", tl: "I-tap para palitan" })}
          </div>
          <input ref={avatarRef} type="file" accept="image/*" hidden onChange={handleAvatar} />
        </div>

        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={() => bgRef.current?.click()}
            className="w-20 h-[50px] rounded-xl overflow-hidden flex items-center justify-center"
            style={{
              backgroundColor: "var(--color-bg)",
              border: "1px solid rgba(0,0,0,0.08)",
              backgroundImage: profile.bg_image_url ? `url(${profile.bg_image_url})` : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {!profile.bg_image_url && (
              <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                None
              </span>
            )}
          </button>
          <div className="text-[12px] flex-1" style={{ color: "var(--color-text-muted)" }}>
            {t({ en: "Background image", tl: "Larawang panlikod" })}
          </div>
          {profile.bg_image_url && (
            <button onClick={removeBg} className="p-2" style={{ color: "var(--color-secondary)" }}>
              <X size={16} />
            </button>
          )}
          <input ref={bgRef} type="file" accept="image/*" hidden onChange={handleBg} />
        </div>
      </Section>

      {/* Basic info */}
      <Section title={t({ en: "Basic info", tl: "Pangunahing impormasyon" })}>
        <Field label={t({ en: "Display name", tl: "Display name" })}>
          <input
            value={profile.display_name ?? ""}
            onChange={(e) => update({ display_name: e.target.value.slice(0, 50) })}
            className={inputCls} style={inputStyle}
          />
        </Field>
        <Field label="Username">
          <input
            value={profile.username}
            onChange={(e) =>
              update({ username: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 30) })
            }
            className={inputCls} style={inputStyle}
          />
        </Field>
        <Field label={`Bio EN — ${(profile.bio_en ?? "").length}/120`}>
          <textarea
            rows={2}
            value={profile.bio_en ?? ""}
            onChange={(e) => update({ bio_en: e.target.value.slice(0, 120) })}
            className={inputCls + " resize-none"} style={inputStyle}
          />
        </Field>
        <Field label={`Bio TL — ${(profile.bio_tl ?? "").length}/120`}>
          <textarea
            rows={2}
            value={profile.bio_tl ?? ""}
            onChange={(e) => update({ bio_tl: e.target.value.slice(0, 120) })}
            className={inputCls + " resize-none"} style={inputStyle}
          />
        </Field>
      </Section>

      {/* GCash */}
      <Section title={<ToggleHeader icon={Wallet} label={t({ en: "GCash tip jar", tl: "GCash tip jar" })} value={profile.gcash_enabled} onChange={(v) => update({ gcash_enabled: v })} />}>
        {profile.gcash_enabled && (
          <>
            <Field label={t({ en: "GCash number", tl: "GCash number" })}>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="09XXXXXXXXX"
                value={profile.gcash_number ?? ""}
                onChange={(e) => update({ gcash_number: e.target.value.replace(/\D/g, "").slice(0, 11) })}
                className={inputCls} style={inputStyle}
              />
            </Field>
            <Field label={t({ en: "Tip presets", tl: "Tip presets" })}>
              <div className="flex gap-2">
                {presets.map((amt, i) => (
                  <input
                    key={i}
                    type="number"
                    value={amt}
                    onChange={(e) => {
                      const next = [...presets];
                      next[i] = parseInt(e.target.value || "0", 10);
                      update({ gcash_presets: next });
                    }}
                    className="flex-1 px-3 py-2 rounded-full text-[13px] text-center outline-none"
                    style={inputStyle}
                  />
                ))}
              </div>
            </Field>
          </>
        )}
      </Section>

      {/* Pasaload */}
      <Section title={<ToggleHeader icon={Smartphone} label={t({ en: "Pasaload button", tl: "Pasaload button" })} value={profile.pasaload_enabled} onChange={(v) => update({ pasaload_enabled: v })} />}>
        {profile.pasaload_enabled && (
          <>
            <Field label={t({ en: "Mobile number", tl: "Mobile number" })}>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="09XXXXXXXXX"
                value={profile.pasaload_number ?? ""}
                onChange={(e) => update({ pasaload_number: e.target.value.replace(/\D/g, "").slice(0, 11) })}
                className={inputCls} style={inputStyle}
              />
            </Field>
            <Field label={t({ en: "Network", tl: "Network" })}>
              <div className="flex gap-2 flex-wrap">
                {NETWORKS.map((n) => {
                  const sel = profile.pasaload_network === n;
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => update({ pasaload_network: n })}
                      className="px-3 py-1.5 rounded-full text-[12px] font-medium"
                      style={{
                        backgroundColor: sel ? "var(--color-primary)" : "var(--color-bg)",
                        color: sel ? "#fff" : "var(--color-text)",
                        border: "1px solid rgba(0,0,0,0.06)",
                      }}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
            </Field>
          </>
        )}
      </Section>

      {/* Schedule */}
      <Section title={<ToggleHeader icon={Calendar} label={t({ en: "Open hours", tl: "Oras ng pagkabukas" })} value={profile.schedule_enabled} onChange={(v) => update({ schedule_enabled: v, schedule_json: profile.schedule_json ?? DEFAULT_SCHEDULE })} />}>
        {profile.schedule_enabled && (
          <div className="space-y-2">
            {DAYS.map((d) => {
              const cur = schedule[d.key as DayKey];
              return (
                <div key={d.key} className="flex items-center gap-3">
                  <label className="flex items-center gap-2 w-24">
                    <input
                      type="checkbox"
                      checked={cur.open}
                      onChange={(e) =>
                        update({
                          schedule_json: {
                            ...schedule,
                            [d.key]: { ...cur, open: e.target.checked, start: cur.start ?? "09:00", end: cur.end ?? "18:00" },
                          },
                        })
                      }
                    />
                    <span className="text-[13px]" style={{ color: "var(--color-text)" }}>{d.en}</span>
                  </label>
                  {cur.open && (
                    <>
                      <input
                        type="time"
                        value={cur.start ?? "09:00"}
                        onChange={(e) =>
                          update({ schedule_json: { ...schedule, [d.key]: { ...cur, start: e.target.value } } })
                        }
                        className="px-2 py-1.5 rounded-lg text-[12px] outline-none"
                        style={inputStyle}
                      />
                      <span style={{ color: "var(--color-text-muted)" }}>–</span>
                      <input
                        type="time"
                        value={cur.end ?? "18:00"}
                        onChange={(e) =>
                          update({ schedule_json: { ...schedule, [d.key]: { ...cur, end: e.target.value } } })
                        }
                        className="px-2 py-1.5 rounded-lg text-[12px] outline-none"
                        style={inputStyle}
                      />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* Collab */}
      <Section title={<ToggleHeader icon={Handshake} label={t({ en: "Collab card", tl: "Collab card" })} value={profile.collab_enabled} onChange={(v) => update({ collab_enabled: v, collab_json: profile.collab_json ?? collab })} />}>
        {profile.collab_enabled && (
          <>
            <Field label={t({ en: "Starting rate (₱)", tl: "Simulang rate (₱)" })}>
              <input
                value={collab.rate ?? ""}
                onChange={(e) => setCollab({ rate: e.target.value })}
                placeholder="5000"
                className={inputCls} style={inputStyle}
              />
            </Field>
            <Field label={t({ en: "Categories", tl: "Mga kategorya" })}>
              <div className="flex flex-wrap gap-2">
                {COLLAB_CATEGORIES.map((c) => {
                  const sel = (collab.categories ?? []).includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleCollabCat(c)}
                      className="px-3 py-1.5 rounded-full text-[12px]"
                      style={{
                        backgroundColor: sel ? "var(--color-accent)" : "var(--color-bg)",
                        color: "var(--color-text)",
                        border: "1px solid rgba(0,0,0,0.06)",
                      }}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </Field>
            <Field label={t({ en: "Contact preference", tl: "Paano mag-contact" })}>
              <div className="flex gap-2 mb-2">
                {(["email", "instagram"] as const).map((k) => {
                  const sel = (collab.contact_type ?? "email") === k;
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setCollab({ contact_type: k })}
                      className="px-3 py-1.5 rounded-full text-[12px]"
                      style={{
                        backgroundColor: sel ? "var(--color-primary)" : "var(--color-bg)",
                        color: sel ? "#fff" : "var(--color-text)",
                      }}
                    >
                      {k === "email" ? "Email" : "Instagram"}
                    </button>
                  );
                })}
              </div>
              <input
                value={collab.contact ?? ""}
                onChange={(e) => setCollab({ contact: e.target.value })}
                placeholder={(collab.contact_type ?? "email") === "email" ? "you@email.com" : "@yourhandle"}
                className={inputCls} style={inputStyle}
              />
            </Field>
          </>
        )}
      </Section>

      <button
        onClick={saveBasics}
        disabled={saving}
        className="w-full py-3 rounded-full text-[14px] font-semibold text-white disabled:opacity-50"
        style={{ backgroundColor: "var(--color-primary)" }}
      >
        {saving ? "…" : t({ en: "Save changes", tl: "I-save ang pagbabago" })}
      </button>
    </div>
  );
};

const inputCls = "w-full px-4 py-3 rounded-xl text-[14px] outline-none";
const inputStyle = {
  backgroundColor: "var(--color-bg)",
  border: "1px solid rgba(0,0,0,0.08)",
  color: "var(--color-text)",
} as const;

const Section = ({ title, children }: { title: React.ReactNode; children?: React.ReactNode }) => (
  <div
    className="rounded-2xl p-4"
    style={{ backgroundColor: "var(--color-surface)", border: "1px solid rgba(0,0,0,0.05)" }}
  >
    <div className="mb-3">
      {typeof title === "string" ? (
        <h3 className="text-[14px] font-bold" style={{ color: "var(--color-text)" }}>{title}</h3>
      ) : title}
    </div>
    <div className="space-y-3">{children}</div>
  </div>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-[11px] font-medium mb-1.5" style={{ color: "var(--color-text-muted)" }}>
      {label}
    </label>
    {children}
  </div>
);

const ToggleHeader = ({
  icon: Icon, label, value, onChange,
}: {
  icon: any; label: string; value: boolean; onChange: (v: boolean) => void;
}) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <Icon size={16} style={{ color: "var(--color-primary)" }} />
      <span className="text-[14px] font-bold" style={{ color: "var(--color-text)" }}>{label}</span>
    </div>
    <button
      onClick={() => onChange(!value)}
      role="switch"
      aria-checked={value}
      className="relative inline-flex h-6 w-10 items-center rounded-full transition-colors"
      style={{ backgroundColor: value ? "var(--color-primary)" : "rgba(0,0,0,0.15)" }}
    >
      <span
        className="inline-block h-5 w-5 rounded-full bg-white transition-transform"
        style={{ transform: value ? "translateX(18px)" : "translateX(2px)" }}
      />
    </button>
  </div>
);
