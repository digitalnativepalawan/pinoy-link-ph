import { useEffect, useState } from "react";
import { BarChart2, TrendingUp, Link as LinkIcon, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip,
} from "recharts";

interface ClickRow {
  id: string;
  link_id: string;
  clicked_at: string;
  source: string | null;
}

interface LinkRow {
  id: string;
  title_en: string | null;
  title_tl: string | null;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const AnalyticsTab = ({ userId }: { userId: string }) => {
  const { t } = useLanguage();
  const [clicks, setClicks] = useState<ClickRow[]>([]);
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    Promise.all([
      supabase.from("clicks").select("id,link_id,clicked_at,source").eq("profile_id", userId).gte("clicked_at", sevenDaysAgo),
      supabase.from("links").select("id,title_en,title_tl").eq("profile_id", userId),
    ]).then(([clicksRes, linksRes]) => {
      setClicks((clicksRes.data as ClickRow[]) ?? []);
      setLinks((linksRes.data as LinkRow[]) ?? []);
      setLoading(false);
    });
  }, [userId]);

  if (loading) {
    return (
      <div className="px-5 pt-8 text-center text-[13px]" style={{ color: "var(--color-text-muted)" }}>
        …
      </div>
    );
  }

  const totalClicks = clicks.length;

  // Clicks by day (last 7 days)
  const dayMap: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    dayMap[d.toISOString().slice(0, 10)] = 0;
  }
  clicks.forEach((c) => {
    const day = c.clicked_at.slice(0, 10);
    if (day in dayMap) dayMap[day]++;
  });
  const chartData = Object.entries(dayMap).map(([date, count]) => ({
    day: DAY_LABELS[new Date(date + "T12:00:00").getDay()],
    clicks: count,
  }));

  // Top link
  const linkClickMap: Record<string, number> = {};
  clicks.forEach((c) => {
    linkClickMap[c.link_id] = (linkClickMap[c.link_id] ?? 0) + 1;
  });
  const topLinkId = Object.entries(linkClickMap).sort((a, b) => b[1] - a[1])[0]?.[0];
  const topLink = links.find((l) => l.id === topLinkId);
  const topLinkClicks = topLinkId ? linkClickMap[topLinkId] : 0;

  // Source breakdown
  const sourceMap: Record<string, number> = {};
  clicks.forEach((c) => {
    const src = c.source || "Direct";
    sourceMap[src] = (sourceMap[src] ?? 0) + 1;
  });
  const sources = Object.entries(sourceMap).sort((a, b) => b[1] - a[1]);

  return (
    <div className="px-5 pb-32 pt-2 space-y-4">
      {/* Total clicks */}
      <div
        className="rounded-2xl p-5 text-center"
        style={{ backgroundColor: "var(--color-surface)", border: "1px solid rgba(0,0,0,0.05)" }}
      >
        <p className="text-[13px] mb-1" style={{ color: "var(--color-text-muted)" }}>
          {t({ en: "Total clicks (7 days)", tl: "Kabuuang clicks (7 araw)" })}
        </p>
        <p className="text-[48px] font-extrabold leading-none" style={{ color: "var(--color-primary)" }}>
          {totalClicks}
        </p>
      </div>

      {/* Bar chart */}
      <div
        className="rounded-2xl p-4"
        style={{ backgroundColor: "var(--color-surface)", border: "1px solid rgba(0,0,0,0.05)" }}
      >
        <p className="text-[13px] font-semibold mb-3" style={{ color: "var(--color-text)" }}>
          {t({ en: "Clicks per day", tl: "Clicks bawat araw" })}
        </p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-surface)",
                border: "1px solid rgba(0,0,0,0.08)",
                borderRadius: 12,
                fontSize: 12,
              }}
            />
            <Bar dataKey="clicks" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top link */}
      {topLink && (
        <div
          className="rounded-2xl p-4 flex items-center gap-3"
          style={{ backgroundColor: "var(--color-surface)", border: "1px solid rgba(0,0,0,0.05)" }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: "var(--color-bg)" }}
          >
            <TrendingUp size={18} style={{ color: "var(--color-primary)" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] mb-0.5" style={{ color: "var(--color-text-muted)" }}>
              {t({ en: "Top link", tl: "Pinaka-popular na link" })}
            </p>
            <p className="text-[14px] font-semibold truncate" style={{ color: "var(--color-text)" }}>
              {topLink.title_en || topLink.title_tl || "Untitled"}
            </p>
          </div>
          <div
            className="px-3 py-1 rounded-full text-[13px] font-bold"
            style={{ backgroundColor: "var(--color-bg)", color: "var(--color-primary)" }}
          >
            {topLinkClicks}
          </div>
        </div>
      )}

      {/* Source breakdown */}
      {sources.length > 0 && (
        <div
          className="rounded-2xl p-4"
          style={{ backgroundColor: "var(--color-surface)", border: "1px solid rgba(0,0,0,0.05)" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Globe size={16} style={{ color: "var(--color-primary)" }} />
            <p className="text-[13px] font-semibold" style={{ color: "var(--color-text)" }}>
              {t({ en: "Traffic sources", tl: "Pinagmulan ng traffic" })}
            </p>
          </div>
          <div className="space-y-2">
            {sources.map(([src, count]) => (
              <div key={src} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LinkIcon size={12} style={{ color: "var(--color-text-muted)" }} />
                  <span className="text-[13px]" style={{ color: "var(--color-text)" }}>
                    {src === "Direct" ? (t({ en: "Direct", tl: "Direkta" })) : `?from=${src}`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="h-1.5 rounded-full"
                    style={{
                      width: `${Math.round((count / totalClicks) * 80)}px`,
                      backgroundColor: "var(--color-primary)",
                      opacity: 0.3,
                    }}
                  />
                  <span className="text-[12px] font-semibold w-6 text-right" style={{ color: "var(--color-text-muted)" }}>
                    {count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {totalClicks === 0 && (
        <div
          className="rounded-2xl p-8 text-center"
          style={{ backgroundColor: "var(--color-surface)", border: "1px dashed rgba(0,0,0,0.12)" }}
        >
          <BarChart2 size={32} className="mx-auto mb-2" style={{ color: "var(--color-text-muted)" }} />
          <p className="text-[13px]" style={{ color: "var(--color-text-muted)" }}>
            {t({ en: "No clicks yet. Share your link!", tl: "Wala pang clicks. I-share ang link mo!" })}
          </p>
        </div>
      )}
    </div>
  );
};
