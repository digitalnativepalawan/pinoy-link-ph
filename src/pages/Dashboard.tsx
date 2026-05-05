import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutGrid, User, Eye, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { applyTheme, THEMES, type Theme } from "@/lib/themes";
import { LinksTab } from "@/components/dashboard/LinksTab";
import { ProfileTab } from "@/components/dashboard/ProfileTab";
import { PreviewModal } from "@/components/dashboard/PreviewModal";

type Tab = "links" | "profile";

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
        .select("display_name, username, theme")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setDisplayName(data.display_name ?? "");
        setUsername(data.username);
        if (data.theme) applyTheme(data.theme as Theme);
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
        {/* Header */}
        <header className="flex items-center justify-between px-5 pt-5 pb-3">
          <h1 className="text-[18px] font-extrabold" style={{ color: "var(--color-text)" }}>
            {t({ en: `Hey, ${displayName || username} 👋`, tl: `Kumusta, ${displayName || username} 👋` })}
          </h1>
          <button onClick={logout} className="p-2" style={{ color: "var(--color-text-muted)" }} aria-label="Log out">
            <LogOut size={20} />
          </button>
        </header>

        {/* Tab content */}
        {tab === "links" && <LinksTab userId={userId} />}
        {tab === "profile" && <ProfileTab userId={userId} />}
      </div>

      {/* Bottom tab bar */}
      <nav
        className="fixed bottom-0 inset-x-0 z-40"
        style={{
          backgroundColor: "var(--color-surface)",
          borderTop: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <div className="max-w-[460px] mx-auto flex justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <TabBtn active={tab === "links"} onClick={() => setTab("links")} icon={LayoutGrid} label={t({ en: "Links", tl: "Mga link" })} />
          <TabBtn active={tab === "profile"} onClick={() => setTab("profile")} icon={User} label={t({ en: "Profile", tl: "Profile" })} />
          <TabBtn active={false} onClick={() => setPreviewOpen(true)} icon={Eye} label={t({ en: "Preview", tl: "Preview" })} />
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
    className="flex flex-col items-center gap-0.5 px-4 py-1.5"
    style={{ color: active ? "var(--color-primary)" : "var(--color-text-muted)" }}
  >
    <Icon size={22} strokeWidth={active ? 2.5 : 2} />
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

export default Dashboard;
