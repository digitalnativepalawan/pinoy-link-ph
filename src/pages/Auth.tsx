import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

type Tab = "signup" | "login";

const Auth = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("signup");

  // Redirect if already logged in
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", data.session.user.id)
          .maybeSingle();
        navigate(profile ? "/dashboard" : "/onboarding", { replace: true });
      }
    });
  }, [navigate]);

  // signup state
  const [sEmail, setSEmail] = useState("");
  const [sPwd, setSPwd] = useState("");
  const [sConfirm, setSConfirm] = useState("");
  const [showSPwd, setShowSPwd] = useState(false);
  const [sErrors, setSErrors] = useState<Record<string, string>>({});
  const [sLoading, setSLoading] = useState(false);

  // login state
  const [lEmail, setLEmail] = useState("");
  const [lPwd, setLPwd] = useState("");
  const [showLPwd, setShowLPwd] = useState(false);
  const [lErrors, setLErrors] = useState<Record<string, string>>({});
  const [lLoading, setLLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!/^\S+@\S+\.\S+$/.test(sEmail)) errs.email = t({ en: "Enter a valid email", tl: "Maglagay ng tamang email" });
    if (sPwd.length < 8) errs.password = t({ en: "Min 8 characters", tl: "Min 8 karakter" });
    if (sPwd !== sConfirm) errs.confirm = t({ en: "Passwords don't match", tl: "Hindi magkatugma ang password" });
    setSErrors(errs);
    if (Object.keys(errs).length) return;

    setSLoading(true);
    const { error } = await supabase.auth.signUp({
      email: sEmail,
      password: sPwd,
      options: { emailRedirectTo: `${window.location.origin}/onboarding` },
    });
    setSLoading(false);
    if (error) {
      setSErrors({ form: error.message });
      return;
    }
    navigate("/onboarding", { replace: true });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!/^\S+@\S+\.\S+$/.test(lEmail)) errs.email = t({ en: "Enter a valid email", tl: "Maglagay ng tamang email" });
    if (!lPwd) errs.password = t({ en: "Enter your password", tl: "Ilagay ang password" });
    setLErrors(errs);
    if (Object.keys(errs).length) return;

    setLLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: lEmail, password: lPwd });
    if (error) {
      setLLoading(false);
      setLErrors({ form: error.message });
      return;
    }
    const userId = data.user?.id;
    const { data: profile } = await supabase.from("profiles").select("id").eq("id", userId!).maybeSingle();
    setLLoading(false);
    navigate(profile ? "/dashboard" : "/onboarding", { replace: true });
  };

  const handleForgot = async () => {
    if (!/^\S+@\S+\.\S+$/.test(lEmail)) {
      setLErrors({ email: t({ en: "Enter your email above first", tl: "Ilagay muna ang email" }) });
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(lEmail, {
      redirectTo: `${window.location.origin}/auth`,
    });
    if (error) toast.error(error.message);
    else toast.success(t({ en: "Reset email sent", tl: "Naipadala ang reset email" }));
  };

  const inputBase =
    "w-full pl-10 pr-3 py-3 rounded-xl text-[15px] outline-none transition-colors";
  const inputStyle = {
    backgroundColor: "var(--color-surface)",
    border: "1px solid rgba(0,0,0,0.1)",
    color: "var(--color-text)",
  } as const;

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-10" style={{ backgroundColor: "var(--color-bg)" }}>
      <div
        className="w-full max-w-[390px] rounded-3xl p-6"
        style={{ backgroundColor: "var(--color-surface)", boxShadow: "0 10px 40px rgba(0,0,0,0.06)" }}
      >
        <h1 className="text-[24px] font-extrabold mb-1" style={{ color: "var(--color-text)" }}>
          {t({ en: "Welcome to Pinoy Link", tl: "Maligayang pagdating sa Pinoy Link" })}
        </h1>
        <p className="text-[13px] mb-5" style={{ color: "var(--color-text-muted)" }}>
          {t({ en: "Your one link for everything", tl: "Iisang link para sa lahat" })}
        </p>

        <div className="flex p-1 rounded-full mb-5" style={{ backgroundColor: "var(--color-bg)" }}>
          {(["signup", "login"] as Tab[]).map((x) => (
            <button
              key={x}
              onClick={() => setTab(x)}
              className="flex-1 py-2 rounded-full text-[13px] font-semibold transition-colors"
              style={{
                backgroundColor: tab === x ? "var(--color-primary)" : "transparent",
                color: tab === x ? "#fff" : "var(--color-text-muted)",
              }}
            >
              {x === "signup" ? t({ en: "Sign Up", tl: "Mag-sign Up" }) : t({ en: "Log In", tl: "Mag-log In" })}
            </button>
          ))}
        </div>

        {tab === "signup" ? (
          <form onSubmit={handleSignup} className="space-y-3">
            <div>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }} />
                <input type="email" placeholder="Email" value={sEmail} onChange={(e) => setSEmail(e.target.value)} className={inputBase} style={inputStyle} />
              </div>
              {sErrors.email && <p className="text-[12px] mt-1" style={{ color: "var(--color-secondary)" }}>{sErrors.email}</p>}
            </div>
            <div>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }} />
                <input type={showSPwd ? "text" : "password"} placeholder={t({ en: "Password (min 8)", tl: "Password (min 8)" })} value={sPwd} onChange={(e) => setSPwd(e.target.value)} className={inputBase + " pr-10"} style={inputStyle} />
                <button type="button" onClick={() => setShowSPwd(!showSPwd)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }}>
                  {showSPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {sErrors.password && <p className="text-[12px] mt-1" style={{ color: "var(--color-secondary)" }}>{sErrors.password}</p>}
            </div>
            <div>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }} />
                <input type={showSPwd ? "text" : "password"} placeholder={t({ en: "Confirm password", tl: "Kumpirmahin ang password" })} value={sConfirm} onChange={(e) => setSConfirm(e.target.value)} className={inputBase} style={inputStyle} />
              </div>
              {sErrors.confirm && <p className="text-[12px] mt-1" style={{ color: "var(--color-secondary)" }}>{sErrors.confirm}</p>}
            </div>
            {sErrors.form && <p className="text-[12px]" style={{ color: "var(--color-secondary)" }}>{sErrors.form}</p>}
            <button type="submit" disabled={sLoading} className="w-full py-3 rounded-full text-[14px] font-semibold text-white disabled:opacity-50" style={{ backgroundColor: "var(--color-primary)" }}>
              {sLoading ? "…" : t({ en: "Create account", tl: "Gumawa ng account" })}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }} />
                <input type="email" placeholder="Email" value={lEmail} onChange={(e) => setLEmail(e.target.value)} className={inputBase} style={inputStyle} />
              </div>
              {lErrors.email && <p className="text-[12px] mt-1" style={{ color: "var(--color-secondary)" }}>{lErrors.email}</p>}
            </div>
            <div>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }} />
                <input type={showLPwd ? "text" : "password"} placeholder="Password" value={lPwd} onChange={(e) => setLPwd(e.target.value)} className={inputBase + " pr-10"} style={inputStyle} />
                <button type="button" onClick={() => setShowLPwd(!showLPwd)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }}>
                  {showLPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {lErrors.password && <p className="text-[12px] mt-1" style={{ color: "var(--color-secondary)" }}>{lErrors.password}</p>}
            </div>
            {lErrors.form && <p className="text-[12px]" style={{ color: "var(--color-secondary)" }}>{lErrors.form}</p>}
            <button type="submit" disabled={lLoading} className="w-full py-3 rounded-full text-[14px] font-semibold text-white disabled:opacity-50" style={{ backgroundColor: "var(--color-primary)" }}>
              {lLoading ? "…" : t({ en: "Log in", tl: "Mag-log in" })}
            </button>
            <button type="button" onClick={handleForgot} className="w-full text-center text-[13px] underline" style={{ color: "var(--color-text-muted)" }}>
              {t({ en: "Forgot password?", tl: "Nakalimutan ang password?" })}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Auth;
