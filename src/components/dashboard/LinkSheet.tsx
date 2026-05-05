import { useEffect, useRef, useState } from "react";
import { X, QrCode } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { compressImage } from "@/lib/imageCompress";
import {
  CATEGORIES, PLATFORMS, type Category, type PlatformShortcut, detectVideoType,
} from "@/lib/categories";
import { toast } from "sonner";

export interface LinkRow {
  id: string;
  profile_id: string;
  title_en: string | null;
  title_tl: string | null;
  url: string | null;
  category: string | null;
  icon_name: string | null;
  sort_order: number;
  is_active: boolean;
  is_video: boolean;
  video_url: string | null;
  video_type: string | null;
}

export const LinkSheet = ({
  userId,
  link,
  existingCount,
  onClose,
  onSaved,
}: {
  userId: string;
  link: LinkRow | null;
  existingCount: number;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const { t } = useLanguage();
  const [category, setCategory] = useState<Category>(
    (link?.category as Category) || "social"
  );
  const [platformId, setPlatformId] = useState<string | null>(link?.icon_name ?? null);
  const [titleEn, setTitleEn] = useState(link?.title_en ?? "");
  const [titleTl, setTitleTl] = useState(link?.title_tl ?? "");
  const [url, setUrl] = useState(link?.url ?? "");
  const [isActive, setIsActive] = useState(link?.is_active ?? true);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoType, setVideoType] = useState<"tiktok" | "youtube" | "upload" | null>(
    (link?.video_type as any) ?? null
  );
  const [saving, setSaving] = useState(false);
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(link?.url ?? null);
  const [qrUploading, setQrUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // lock body scroll
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const platforms: PlatformShortcut[] = PLATFORMS[category] ?? [];
  const isVideoUpload = category === "video" && videoType === "upload";
  const isPayCategory = category === "pay";

  const save = async () => {
    if (category === "video") {
      if (videoType === "upload" && !videoFile && !link?.video_url) {
        toast.error(t({ en: "Pick a video file", tl: "Pumili ng video" }));
        return;
      }
      if ((videoType === "tiktok" || videoType === "youtube") && !url.trim()) {
        toast.error(t({ en: "Enter the video URL", tl: "Ilagay ang URL ng video" }));
        return;
      }
    } else if (isPayCategory) {
      if (!qrFile && !qrPreview) {
        toast.error(t({ en: "Upload a QR code image", tl: "Mag-upload ng QR code" }));
        return;
      }
    } else if (!url.trim()) {
      toast.error(t({ en: "Enter a URL", tl: "Ilagay ang URL" }));
      return;
    }
    if (!titleEn.trim() && !titleTl.trim()) {
      toast.error(t({ en: "Add a title", tl: "Magdagdag ng pamagat" }));
      return;
    }

    setSaving(true);
    let videoUrl = link?.video_url ?? null;
    let resolvedVideoType = videoType;
    let isVideoFlag = category === "video";

    try {
      if (category === "video") {
        if (videoType === "upload" && videoFile) {
          if (videoFile.size > 50 * 1024 * 1024) {
            toast.error(t({ en: "Video must be under 50MB", tl: "Hanggang 50MB lamang" }));
            setSaving(false);
            return;
          }
          const vid = link?.id ?? crypto.randomUUID();
          const path = `${userId}/${vid}.mp4`;
          const { error } = await supabase.storage
            .from("videos")
            .upload(path, videoFile, { upsert: true, contentType: videoFile.type || "video/mp4" });
          if (error) throw error;
          const { data } = supabase.storage.from("videos").getPublicUrl(path);
          videoUrl = `${data.publicUrl}?t=${Date.now()}`;
        } else if (videoType === "tiktok" || videoType === "youtube") {
          videoUrl = url.trim();
          const detected = detectVideoType(videoUrl);
          if (detected) resolvedVideoType = detected;
        }
      }

      if (isPayCategory && qrFile) {
        setQrUploading(true);
        try {
          const blob = await compressImage(qrFile, 800, 0.9);
          const path = `${userId}/${platformId ?? "pay"}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.jpg`;
          const { error } = await supabase.storage
            .from("qr-codes")
            .upload(path, blob, { upsert: true, contentType: "image/jpeg" });
          if (error) throw error;
          const { data } = supabase.storage.from("qr-codes").getPublicUrl(path);
          setUrl(data.publicUrl);
          url = data.publicUrl;
        } catch (err: any) {
          toast.error("QR upload failed: " + err.message);
          setSaving(false);
          setQrUploading(false);
          return;
        }
        setQrUploading(false);
      }

      const payload = {
        profile_id: userId,
        title_en: titleEn.trim() || null,
        title_tl: titleTl.trim() || null,
        url: category === "video" && videoType === "upload" ? null : url.trim() || null,
        category,
        icon_name: platformId,
        is_active: isActive,
        is_video: isVideoFlag,
        video_url: videoUrl,
        video_type: resolvedVideoType,
      };

      if (link) {
        const { error } = await supabase.from("links").update(payload).eq("id", link.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("links")
          .insert({ ...payload, sort_order: existingCount });
        if (error) throw error;
      }
      toast.success(t({ en: "Saved", tl: "Nai-save" }));
      onSaved();
    } catch (err: any) {
      toast.error(err.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const onPickPlatform = (p: PlatformShortcut) => {
    setPlatformId(p.id);
    if (!titleEn) setTitleEn(p.label);
    if (!titleTl) setTitleTl(p.label);
    if (p.urlPrefix && !url) setUrl(p.urlPrefix);
    if (p.videoType) setVideoType(p.videoType);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[460px] rounded-t-3xl p-5 max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: "var(--color-surface)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[18px] font-extrabold" style={{ color: "var(--color-text)" }}>
            {link ? t({ en: "Edit link", tl: "I-edit ang link" }) : t({ en: "Add a link", tl: "Magdagdag ng link" })}
          </h3>
          <button onClick={onClose} className="p-1" style={{ color: "var(--color-text-muted)" }}>
            <X size={20} />
          </button>
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2 pb-2 mb-3">
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            const sel = category === c.id;
            return (
              <button
                key={c.id}
                onClick={() => {
                  setCategory(c.id);
                  setPlatformId(null);
                  if (c.id !== "video") setVideoType(null);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full text-[12px] font-medium shrink-0"
                style={{
                  backgroundColor: sel ? "var(--color-primary)" : "var(--color-bg)",
                  color: sel ? "#fff" : "var(--color-text)",
                }}
              >
                <Icon size={14} />
                {c.label}
              </button>
            );
          })}
        </div>

        {/* Platform shortcuts */}
        {platforms.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {platforms.map((p) => {
              const Icon = p.icon;
              const sel = platformId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => onPickPlatform(p)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px]"
                  style={{
                    backgroundColor: sel ? "var(--color-accent)" : "var(--color-bg)",
                    color: "var(--color-text)",
                    border: "1px solid rgba(0,0,0,0.06)",
                  }}
                >
                  <Icon size={14} />
                  {p.label}
                </button>
              );
            })}
          </div>
        )}

        <div className="space-y-3">
          <Field label={`Title EN — ${titleEn.length}/50`}>
            <input
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value.slice(0, 50))}
              className={inputCls}
              style={inputStyle}
            />
          </Field>
          <Field label={`Title TL — ${titleTl.length}/50`}>
            <input
              value={titleTl}
              onChange={(e) => setTitleTl(e.target.value.slice(0, 50))}
              className={inputCls}
              style={inputStyle}
            />
          </Field>

          {!isVideoUpload && !isPayCategory && (
            <Field label="URL">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://"
                className={inputCls}
                style={inputStyle}
              />
            </Field>
          )}

          {isPayCategory && (
            <Field label={t({ en: "QR Code image", tl: "Larawan ng QR Code" })}>
              <input
                ref={qrInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setQrFile(file);
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = () => setQrPreview(reader.result as string);
                    reader.readAsDataURL(file);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => qrInputRef.current?.click()}
                className="w-full rounded-xl flex flex-col items-center justify-center gap-2 py-4 transition-opacity active:opacity-70"
                style={{
                  backgroundColor: "var(--color-bg)",
                  border: "1px dashed rgba(0,0,0,0.2)",
                  color: "var(--color-text-muted)",
                }}
              >
                {qrPreview ? (
                  <img
                    src={qrPreview}
                    alt="QR code"
                    className="w-40 h-40 object-contain rounded-lg"
                  />
                ) : (
                  <>
                    <QrCode size={36} />
                    <span className="text-[12px]">
                      {t({ en: "Tap to upload QR code", tl: "Pindutin para mag-upload ng QR code" })}
                    </span>
                  </>
                )}
              </button>
              {qrPreview && (
                <p className="text-[11px] mt-1 text-center" style={{ color: "var(--color-text-muted)" }}>
                  {t({ en: "Tap image to replace", tl: "Pindutin ang larawan para palitan" })}
                </p>
              )}
            </Field>
          )}

          {isVideoUpload && (
            <Field label={t({ en: "Video file (max 50MB)", tl: "Video file (hanggang 50MB)" })}>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
                className="text-[13px]"
              />
              {videoFile && (
                <p className="text-[11px] mt-1" style={{ color: "var(--color-text-muted)" }}>
                  {videoFile.name} · {(videoFile.size / 1024 / 1024).toFixed(1)}MB
                </p>
              )}
            </Field>
          )}

          <label className="flex items-center justify-between py-2">
            <span className="text-[13px]" style={{ color: "var(--color-text)" }}>
              {t({ en: "Active", tl: "Aktibo" })}
            </span>
            <button
              type="button"
              onClick={() => setIsActive((v) => !v)}
              role="switch"
              aria-checked={isActive}
              className="relative inline-flex h-6 w-10 items-center rounded-full transition-colors"
              style={{ backgroundColor: isActive ? "var(--color-primary)" : "rgba(0,0,0,0.15)" }}
            >
              <span
                className="inline-block h-5 w-5 rounded-full bg-white transition-transform"
                style={{ transform: isActive ? "translateX(18px)" : "translateX(2px)" }}
              />
            </button>
          </label>

          <button
            onClick={save}
            disabled={saving || qrUploading}
            className="w-full py-3 rounded-full text-[14px] font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            {saving || qrUploading ? "…" : t({ en: "Save", tl: "I-save" })}
          </button>
        </div>
      </div>
    </div>
  );
};

const inputCls = "w-full px-4 py-3 rounded-xl text-[14px] outline-none";
const inputStyle = {
  backgroundColor: "var(--color-bg)",
  border: "1px solid rgba(0,0,0,0.08)",
  color: "var(--color-text)",
} as const;

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-[11px] font-medium mb-1.5" style={{ color: "var(--color-text-muted)" }}>
      {label}
    </label>
    {children}
  </div>
);
