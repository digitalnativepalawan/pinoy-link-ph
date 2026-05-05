import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

export const Hero = () => {
  const { t } = useLanguage();
  const [slug, setSlug] = useState("");

  const handleClaim = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    if (!cleaned) {
      toast.error(t({ en: "Please enter a username", tl: "Maglagay ng username" }));
      return;
    }
    toast.success(
      t({
        en: `Reserved pinoy.digital/${cleaned} — sign up coming soon`,
        tl: `Na-reserve pinoy.digital/${cleaned} — malapit nang mag-sign up`,
      })
    );
  };

  return (
    <section className="px-5 pt-4 pb-8">
      <h1
        className="text-[34px] leading-[1.05] font-extrabold tracking-tight"
        style={{ color: "var(--color-text)" }}
      >
        {t({
          en: "One link. All your socials.",
          tl: "Isang link. Lahat ng iyong socials.",
        })}
      </h1>
      <p
        className="mt-4 text-[15px] leading-relaxed"
        style={{ color: "var(--color-text-muted)" }}
      >
        {t({
          en: "One link for Instagram, TikTok, Facebook, YouTube, and everything else. Update once, update everywhere.",
          tl: "Isang link para sa Instagram, TikTok, Facebook, YouTube, at lahat ng iba pa. I-update minsan, mag-a-update kahit saan.",
        })}
      </p>

      <form
        onSubmit={handleClaim}
        className="mt-6 flex items-center gap-2 p-1.5 rounded-full"
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        <div className="flex items-center pl-3 pr-1 flex-1 min-w-0">
          <span className="text-[14px] mr-1" style={{ color: "var(--color-text-muted)" }}>
            pinoy.digital/
          </span>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder={t({ en: "yourname", tl: "yourname" })}
            className="flex-1 min-w-0 bg-transparent outline-none text-[14px] font-medium"
            style={{ color: "var(--color-text)" }}
          />
        </div>
        <button
          type="submit"
          className="flex items-center gap-1 rounded-full px-4 py-2.5 text-[13px] font-semibold text-white shrink-0"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          {t({ en: "Claim", tl: "Kunin" })}
          <ArrowRight size={14} strokeWidth={2.5} />
        </button>
      </form>

      <p className="mt-3 text-center text-[13px]" style={{ color: "var(--color-text-muted)" }}>
        {t({ en: "Already have an account?", tl: "May account ka na?" })}{" "}
        <a
          href="#login"
          className="font-medium underline"
          style={{ color: "var(--color-primary)" }}
        >
          {t({ en: "Log in", tl: "Mag-log in" })}
        </a>
      </p>
    </section>
  );
};
