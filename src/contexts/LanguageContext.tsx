import { createContext, useContext, useState, ReactNode } from "react";

export type Lang = "EN" | "TL";

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  t: <T extends { en: string; tl: string }>(pair: T) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Lang>("EN");
  const toggle = () => setLang((l) => (l === "EN" ? "TL" : "EN"));
  const t = <T extends { en: string; tl: string }>(pair: T) =>
    lang === "EN" ? pair.en : pair.tl;
  return (
    <LanguageContext.Provider value={{ lang, setLang, toggle, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};
