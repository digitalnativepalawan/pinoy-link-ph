import { Heart } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="px-5 py-8 flex items-center justify-center gap-1.5 text-[12px]"
      style={{ color: "var(--color-text-muted)" }}
    >
      <span>Made with</span>
      <Heart size={12} fill="var(--color-secondary)" style={{ color: "var(--color-secondary)" }} />
      <span>in the Philippines · Pinoy.Digital</span>
    </footer>
  );
};
