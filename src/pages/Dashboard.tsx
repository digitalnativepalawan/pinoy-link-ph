import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  };
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 text-center" style={{ backgroundColor: "var(--color-bg)" }}>
      <h1 className="text-[24px] font-extrabold mb-3" style={{ color: "var(--color-text)" }}>
        Dashboard coming in Prompt 3
      </h1>
      <button onClick={handleLogout} className="mt-4 px-5 py-2 rounded-full text-[13px] font-semibold text-white" style={{ backgroundColor: "var(--color-primary)" }}>
        Log out
      </button>
    </div>
  );
};

export default Dashboard;
