import { Play, Sun, Smartphone, Calendar, Handshake, LucideIcon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface Row {
  Icon: LucideIcon;
  title: { en: string; tl: string };
  desc: { en: string; tl: string };
}

const rows: Row[] = [
  {
    Icon: Play,
    title: { en: "Inline video reel", tl: "Inline video reel" },
    desc: {
      en: "Your best 15-sec clip plays right on your profile. No YouTube link needed.",
      tl: "Ang pinakamagandang 15-sec clip mo ay maglalaro mismo sa profile mo. Walang YouTube link kailangan.",
    },
  },
  {
    Icon: Sun,
    title: { en: "Mood of the day", tl: "Mood ng araw" },
    desc: {
      en: "Update your vibe daily. Give followers a reason to come back.",
      tl: "I-update ang vibe mo araw-araw. Bigyan ng dahilan ang followers na bumalik.",
    },
  },
  {
    Icon: Smartphone,
    title: { en: "Pasaload button", tl: "Pasaload button" },
    desc: {
      en: "Let fans send you load directly. Globe, Smart, TNT supported.",
      tl: "Hayaang magpadala ng load ang fans mo nang diretso. Globe, Smart, TNT suportado.",
    },
  },
  {
    Icon: Calendar,
    title: { en: "Schedule widget", tl: "Schedule widget" },
    desc: {
      en: "Show your open hours. Perfect for home-based sellers.",
      tl: "Ipakita ang oras na bukas ka. Perpekto para sa home-based sellers.",
    },
  },
  {
    Icon: Handshake,
    title: { en: "Collab card", tl: "Collab card" },
    desc: {
      en: "Show brands your rates and categories. Get discovered faster.",
      tl: "Ipakita sa brands ang rates at categories mo. Mas mabilis ma-discover.",
    },
  },
];

export const UniqueFeatures = () => {
  const { t } = useLanguage();
  return (
    <section className="px-5 pb-10">
      <h2
        className="text-[24px] leading-tight font-extrabold tracking-tight"
        style={{ color: "var(--color-text)" }}
      >
        {t({
          en: "Built different. Built for Filipinos.",
          tl: "Iba ang pagkagawa. Para sa mga Pilipino.",
        })}
      </h2>
      <div className="mt-5 space-y-4">
        {rows.map(({ Icon, title, desc }, i) => (
          <div key={i} className="flex gap-3">
            <div
              className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "rgba(0,56,168,0.08)" }}
            >
              <Icon size={20} strokeWidth={2} style={{ color: "var(--color-primary)" }} />
            </div>
            <div className="flex-1">
              <div
                className="text-[15px] font-bold"
                style={{ fontFamily: "var(--font-heading)", color: "var(--color-text)" }}
              >
                {t(title)}
              </div>
              <div className="mt-0.5 text-[13px] leading-snug" style={{ color: "var(--color-text-muted)" }}>
                {t(desc)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
