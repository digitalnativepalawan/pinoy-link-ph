import { useEffect, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";
import { GripVertical, Pencil, Trash2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { categoryIcon, platformIcon } from "@/lib/categories";
import { LinkSheet, type LinkRow } from "./LinkSheet";
import { toast } from "sonner";

export const LinksTab = ({ userId }: { userId: string }) => {
  const { t } = useLanguage();
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<LinkRow | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("links")
      .select("*")
      .eq("profile_id", userId)
      .order("sort_order", { ascending: true });
    setLinks((data as LinkRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [userId]);

  const handleSaved = () => {
    setSheetOpen(false);
    setEditing(null);
    load();
  };

  const toggleActive = async (link: LinkRow) => {
    const next = !link.is_active;
    setLinks((ls) => ls.map((l) => (l.id === link.id ? { ...l, is_active: next } : l)));
    await supabase.from("links").update({ is_active: next }).eq("id", link.id);
  };

  const remove = async (link: LinkRow) => {
    if (!confirm(t({ en: "Delete this link?", tl: "Burahin ang link?" }))) return;
    await supabase.from("links").delete().eq("id", link.id);
    toast.success(t({ en: "Deleted", tl: "Nabura" }));
    load();
  };

  const handleDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = links.findIndex((l) => l.id === active.id);
    const newIdx = links.findIndex((l) => l.id === over.id);
    const reordered = arrayMove(links, oldIdx, newIdx);
    setLinks(reordered);
    await Promise.all(
      reordered.map((l, i) =>
        supabase.from("links").update({ sort_order: i }).eq("id", l.id)
      )
    );
  };

  return (
    <div className="px-5 pb-32 pt-2">
      <button
        onClick={() => {
          setEditing(null);
          setSheetOpen(true);
        }}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[14px] font-semibold text-white"
        style={{ backgroundColor: "var(--color-primary)" }}
      >
        <Plus size={18} strokeWidth={2.5} />
        {t({ en: "Add a link", tl: "Magdagdag ng link" })}
      </button>

      <div className="mt-5">
        {loading ? (
          <p className="text-center text-[13px]" style={{ color: "var(--color-text-muted)" }}>
            …
          </p>
        ) : links.length === 0 ? (
          <div
            className="text-center py-12 rounded-2xl"
            style={{ backgroundColor: "var(--color-surface)", border: "1px dashed rgba(0,0,0,0.12)" }}
          >
            <Plus size={32} className="mx-auto mb-2" style={{ color: "var(--color-text-muted)" }} />
            <p className="text-[13px]" style={{ color: "var(--color-text-muted)" }}>
              {t({ en: "No links yet. Add your first one!", tl: "Wala pang link. Magdagdag ng una!" })}
            </p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={links.map((l) => l.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {links.map((l) => (
                  <SortableLinkItem
                    key={l.id}
                    link={l}
                    onToggle={toggleActive}
                    onEdit={(x) => {
                      setEditing(x);
                      setSheetOpen(true);
                    }}
                    onDelete={remove}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {sheetOpen && (
        <LinkSheet
          userId={userId}
          link={editing}
          existingCount={links.length}
          onClose={() => {
            setSheetOpen(false);
            setEditing(null);
          }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
};

const SortableLinkItem = ({
  link,
  onToggle,
  onEdit,
  onDelete,
}: {
  link: LinkRow;
  onToggle: (l: LinkRow) => void;
  onEdit: (l: LinkRow) => void;
  onDelete: (l: LinkRow) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: link.id,
  });
  const Icon = link.icon_name ? platformIcon(link.icon_name) : categoryIcon(link.category);
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        backgroundColor: "var(--color-surface)",
        border: "1px solid rgba(0,0,0,0.06)",
      }}
      className="flex items-center gap-2 p-3 rounded-2xl"
    >
      <button
        {...attributes}
        {...listeners}
        className="touch-none p-1"
        style={{ color: "var(--color-text-muted)", cursor: "grab" }}
        aria-label="Drag"
      >
        <GripVertical size={18} />
      </button>
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: "var(--color-bg)", color: "var(--color-primary)" }}
      >
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold truncate" style={{ color: "var(--color-text)" }}>
          {link.title_en || link.title_tl || link.url || "Untitled"}
        </p>
        {link.url && (
          <p className="text-[11px] truncate" style={{ color: "var(--color-text-muted)" }}>
            {link.url}
          </p>
        )}
      </div>
      <button
        onClick={() => onToggle(link)}
        role="switch"
        aria-checked={link.is_active}
        className="relative inline-flex h-6 w-10 items-center rounded-full transition-colors shrink-0"
        style={{ backgroundColor: link.is_active ? "var(--color-primary)" : "rgba(0,0,0,0.15)" }}
      >
        <span
          className="inline-block h-5 w-5 rounded-full bg-white transition-transform"
          style={{ transform: link.is_active ? "translateX(18px)" : "translateX(2px)" }}
        />
      </button>
      <button onClick={() => onEdit(link)} className="p-2" style={{ color: "var(--color-text-muted)" }}>
        <Pencil size={16} />
      </button>
      <button onClick={() => onDelete(link)} className="p-2" style={{ color: "var(--color-secondary)" }}>
        <Trash2 size={16} />
      </button>
    </div>
  );
};
