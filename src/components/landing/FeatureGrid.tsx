import { Languages, Wallet, Smartphone, Zap, LucideIcon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface Card {
  Icon: LucideIcon;
  title: { en: string; tl: string };
  subtitle: { en: string; tl: string };
}

const cards: Card[] = [
  {
    Icon: Languages,
    title: { en: "Bilingual", tl: "Bilingual" },
    subtitle: { en: "Tagalog & English", tl: "Tagalog at English" },
  },
  {
    Icon: Wallet,
    title: { en: "GCash", tl: "GCash" },
    subtitle: { en: "Built-in tip jar", tl: "May tip jar na" },
  },
  {
    Icon: Smartphone,
    title: { en: "Pasaload", tl: "Pasaload" },
    subtitle: { en: "Globe · Smart · TNT", tl: "Globe · Smart · TNT" },
  },
  {
    Icon: Zap,
    title: { en: "Mobile-first", tl: "Mobile-first" },
    subtitle: { en: "Loads fast on any signal", tl: "Mabilis kahit mahinang signal" },
  },
];

export const FeatureGrid = () => {
  const { t } = useLanguage();
  return (
    <section className="px-5 pb-8">
      <div className="grid grid-cols-2 gap-3">
        {cards.map(({ Icon, title, subtitle }, i) => (
          <div
            key={i}
            className="rounded-2xl p-4"
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid rgba(0,0,0,0.06)",
            }}
          >
            <Icon size={22} strokeWidth={2} style={{ color: "var(--color-primary)" }} />
            <div
              className="mt-3 text-[15px] font-bold"
              style={{ fontFamily: "var(--font-heading)", color: "var(--color-text)" }}
            >
              {t(title)}
            </div>
            <div className="mt-0.5 text-[12px]" style={{ color: "var(--color-text-muted)" }}>
              {t(subtitle)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
