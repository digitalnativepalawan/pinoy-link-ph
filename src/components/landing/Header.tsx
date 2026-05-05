import { Sun } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export const Header = () => {
  const { lang, setLang } = useLanguage();
  return (
    <header className="flex items-center justify-between px-5 pt-5 pb-3">
      <div className="flex items-center gap-2">
        <Sun size={22} strokeWidth={2.5} style={{ color: "var(--color-accent)" }} />
        <span
          className="font-bold text-[17px] tracking-tight"
          style={{ fontFamily: "var(--font-heading)", color: "var(--color-text)" }}
        >
          Pinoy.Digital
        </span>
      </div>
      <div
        className="flex items-center rounded-full p-1 text-xs font-medium"
        style={{ backgroundColor: "var(--color-surface)", border: "1px solid rgba(0,0,0,0.06)" }}
      >
        <button
          onClick={() => setLang("TL")}
          className="px-3 py-1 rounded-full transition-colors"
          style={{
            backgroundColor: lang === "TL" ? "var(--color-primary)" : "transparent",
            color: lang === "TL" ? "#fff" : "var(--color-text-muted)",
          }}
          aria-pressed={lang === "TL"}
        >
          TL
        </button>
        <button
          onClick={() => setLang("EN")}
          className="px-3 py-1 rounded-full transition-colors"
          style={{
            backgroundColor: lang === "EN" ? "var(--color-primary)" : "transparent",
            color: lang === "EN" ? "#fff" : "var(--color-text-muted)",
          }}
          aria-pressed={lang === "EN"}
        >
          EN
        </button>
      </div>
    </header>
  );
};
