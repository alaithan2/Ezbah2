import React, { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { LogIn, User, Lock, Sparkles } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUsernameLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    
    setError("");
    setIsSubmitting(true);
    
    // Check specific credentials requested by user
    if (username === "Resalah" && password === "1751") {
      const demoEmail = "resalah@ezbah.app";
      const demoPass = "ezbah1751";
      
      try {
        await signInWithEmailAndPassword(auth, demoEmail, demoPass);
        navigate("/");
      } catch (err: any) {
        if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
          try {
            await createUserWithEmailAndPassword(auth, demoEmail, demoPass);
            navigate("/");
          } catch (createErr: any) {
            console.error("Auto-create failed", createErr);
            setError(`بيانات الدخول صحيحة ولكن فشل تهيئة الحساب: ${createErr.code}`);
          }
        } else if (err.code === "auth/operation-not-allowed") {
           setError("خطأ: تفويض الدخول معطل. يرجى تفعيل (Email/Password) في لوحة Firebase.");
        } else if (err.code === "auth/network-request-failed") {
           setError("خطأ في الاتصال: يرجى المحاولة من متصفح آخر أو نافذة جديدة.");
        } else {
           console.error("Login failed", err);
           setError(`عذراً، حدث خطأ: ${err.code || "unknown"}`);
        }
      }
    } else {
      setError("بيانات الدخول غير صحيحة");
    }
    setIsSubmitting(false);
  };

  return (
    <main className="flex flex-col min-h-screen bg-surface px-6 overflow-hidden relative justify-center items-center">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-sm">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-6 w-20 h-20 bg-primary rounded-[2.5rem] flex items-center justify-center text-white font-bold text-4xl shadow-xl shadow-primary/20"
        >
          ع
        </motion.div>
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-10"
        >
          <h1 className="text-5xl font-bold text-on-surface mb-3 font-headline tracking-tight">
            العزبة
          </h1>
          <div className="flex items-center justify-center gap-2 text-on-surface-variant/60">
            <Sparkles size={14} className="text-primary" />
            <p className="text-sm font-medium">بوابتك لإدارة ميزانية العائلة</p>
          </div>
        </motion.div>

        <motion.form 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleUsernameLogin}
          className="w-full space-y-5 bg-surface-container-lowest border border-surface-container-high p-8 rounded-[3rem] shadow-xl shadow-surface-container-high/20"
        >
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant flex justify-between px-1">
              <span>اسم المستخدم</span>
              <span className="text-[10px] opacity-40">Username</span>
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-outline-variant group-focus-within:text-primary transition-colors">
                <User size={20} />
              </div>
              <input 
                dir="ltr"
                type="text"
                autoComplete="username"
                placeholder="Resalah"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-surface-container-low border border-surface-container-high rounded-2xl py-4 pr-12 pl-5 text-base font-medium focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest outline-none transition-all placeholder:text-outline-variant/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant flex justify-between px-1">
              <span>كلمة المرور</span>
              <span className="text-[10px] opacity-40">Password</span>
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-outline-variant group-focus-within:text-primary transition-colors">
                <Lock size={20} />
              </div>
              <input 
                dir="ltr"
                type="password"
                autoComplete="current-password"
                placeholder="••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface-container-low border border-surface-container-high rounded-2xl py-4 pr-12 pl-5 text-base font-medium focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest outline-none transition-all placeholder:text-outline-variant/30"
              />
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="px-4 py-3 bg-red-50 border border-red-100 rounded-2xl flex flex-col items-center gap-1"
            >
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                <p className="text-[11px] text-red-600 font-bold leading-relaxed text-center">
                  {error}
                </p>
              </div>
              <button 
                onClick={() => window.location.reload()} 
                className="text-[9px] text-red-400 font-medium underline"
              >
                تحديث الصفحة
              </button>
            </motion.div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-16 bg-primary text-white font-bold rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-primary/25 active:scale-95 hover:shadow-primary/40 transition-all text-lg disabled:opacity-50 disabled:grayscale"
          >
            {isSubmitting ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <LogIn size={22} />
                دخول النظام
              </>
            )}
          </button>
        </motion.form>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-[10px] text-on-surface-variant/30 uppercase tracking-[0.2em] font-bold"
        >
          Ezbah System • Secure Gateway
        </motion.p>
      </div>
    </main>
  );
}
