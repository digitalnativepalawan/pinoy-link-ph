import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutGrid, User, Eye, LogOut, BarChart2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { applyTheme, THEMES, type Theme } from "@/lib/themes";
import { LinksTab } from "@/components/dashboard/LinksTab";
import { ProfileTab } from "@/components/dashboard/ProfileTab";
import { PreviewModal } from "@/components/dashboard/PreviewModal";
import { AnalyticsTab } from "@/components/dashboard/AnalyticsTab";

type Tab = "links" | "profile" | "stats";

function loadGoogleFont(fontName: string) {
  const id = `gf-${fontName.replace(/\s/g, "-")}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@400;700;800&display=swap`;
  document.head.appendChild(link);
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [tab, setTab] = useState<Tab>("links");
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data } = await supabase
        .from("profiles")
        .select("display_name, username, theme, font_heading")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setDisplayName(data.display_name ?? "");
        setUsername(data.username);
        if (data.theme) applyTheme(data.theme as unknown as Theme);
        if (data.font_heading) {
          loadGoogleFont(data.font_heading);
          document.documentElement.style.setProperty("--font-heading", `'${data.font_heading}', sans-serif`);
        }
      }
    })();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    applyTheme(THEMES[0]);
    navigate("/", { replace: true });
  };

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ color: "var(--color-text-muted)" }}>
        …
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="max-w-[460px] mx-auto">
        <header className="flex items-center justify-between px-5 pt-5 pb-3">
          <h1 className="text-[18px] font-extrabold" style={{ color: "var(--color-text)" }}>
            {t({ en: `Hey, ${displayName || username} 👋`, tl: `Kumusta, ${displayName || username} 👋` })}
          </h1>
          <button onClick={logout} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center" style={{ color: "var(--color-text-muted)" }} aria-label="Log out">
            <LogOut size={20} />
          </button>
        </header>

        {tab === "links" && <LinksTab userId={userId} />}
        {tab === "profile" && <ProfileTab userId={userId} />}
        {tab === "stats" && <AnalyticsTab userId={userId} />}
      </div>

      <nav
        className="fixed bottom-0 inset-x-0 z-40"
        style={{
          backgroundColor: "var(--color-surface)",
          borderTop: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <div className="max-w-[460px] mx-auto flex justify-around py-2 pb-[max(8px,env(safe-area-inset-bottom))]">
          <TabBtn active={tab === "links"} onClick={() => setTab("links")} icon={LayoutGrid} label={t({ en: "Links", tl: "Mga link" })} />
          <TabBtn active={tab === "profile"} onClick={() => setTab("profile")} icon={User} label={t({ en: "Profile", tl: "Profile" })} />
          <TabBtn active={false} onClick={() => setPreviewOpen(true)} icon={Eye} label={t({ en: "Preview", tl: "Preview" })} />
          <TabBtn active={tab === "stats"} onClick={() => setTab("stats")} icon={BarChart2} label={t({ en: "Stats", tl: "Stats" })} />
        </div>
      </nav>

      {previewOpen && username && <PreviewModal username={username} onClose={() => setPreviewOpen(false)} />}
    </div>
  );
};

const TabBtn = ({
  active, onClick, icon: Icon, label,
}: { active: boolean; onClick: () => void; icon: any; label: string }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center gap-0.5 px-3 py-1.5 min-h-[44px] justify-center"
    style={{ color: active ? "var(--color-primary)" : "var(--color-text-muted)" }}
  >
    <Icon size={22} strokeWidth={active ? 2.5 : 2} />
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

export default Dashboard;
