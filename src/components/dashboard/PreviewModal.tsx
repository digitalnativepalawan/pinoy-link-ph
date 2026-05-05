import { X } from "lucide-react";
import { useEffect } from "react";
import { PublicProfile } from "@/pages/PublicProfile";

export const PreviewModal = ({ username, onClose }: { username: string; onClose: () => void }) => {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center text-white"
        style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
      >
        <X size={20} />
      </button>
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[390px] h-[80vh] max-h-[780px] rounded-[36px] overflow-hidden"
        style={{
          border: "8px solid #1a1a1a",
          boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
          backgroundColor: "#000",
        }}
      >
        <div className="w-full h-full overflow-y-auto">
          <PublicProfile usernameProp={username} isPreview />
        </div>
      </div>
    </div>
  );
};
