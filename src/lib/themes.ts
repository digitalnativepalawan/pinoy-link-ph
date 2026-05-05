export interface Theme {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  bg: string;
}

export const THEMES: Theme[] = [
  { id: "pilipinas", name: "Pilipinas", primary: "#0038A8", secondary: "#CE1126", accent: "#FCD116", bg: "#FFFBF0" },
  { id: "midnight", name: "Midnight", primary: "#6C63FF", secondary: "#FF6584", accent: "#FFD166", bg: "#0D0D1A" },
  { id: "forest", name: "Forest", primary: "#2D6A4F", secondary: "#40916C", accent: "#B7E4C7", bg: "#F0FAF4" },
  { id: "sunset", name: "Sunset", primary: "#FF6B35", secondary: "#F7C59F", accent: "#EFEFD0", bg: "#FFF8F0" },
  { id: "ocean", name: "Ocean", primary: "#0077B6", secondary: "#00B4D8", accent: "#90E0EF", bg: "#F0FAFF" },
  { id: "bohol", name: "Bohol", primary: "#6B4226", secondary: "#A0522D", accent: "#DEB887", bg: "#FDF5E6" },
  { id: "monochrome", name: "Monochrome", primary: "#1a1a1a", secondary: "#444444", accent: "#888888", bg: "#FAFAFA" },
  { id: "rose", name: "Rose", primary: "#BE185D", secondary: "#EC4899", accent: "#FDF2F8", bg: "#FFF0F6" },
];

export function applyTheme(t: Theme) {
  const root = document.documentElement;
  root.style.setProperty("--color-primary", t.primary);
  root.style.setProperty("--color-secondary", t.secondary);
  root.style.setProperty("--color-accent", t.accent);
  root.style.setProperty("--color-bg", t.bg);
}
