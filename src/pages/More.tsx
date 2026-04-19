import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { seedSampleData } from "../utils/seedData";
import { doc, updateDoc, collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { getWallet, updateWalletSettings, getCategories } from "../services/firestoreService";
import { Wallet, Category } from "../types";
import { LogOut, Database, UserCheck, Shield, Save, ChevronDown, ChevronUp, Tag, Store, ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

const CATEGORY_EMOJI: Record<string, string> = {
  food: "🍖", groceries: "🛒", utilities: "⚡", transport: "🚗",
  education: "📚", health: "💊", occasions: "🎁", entertainment: "🎬", clothing: "👕",
};

export default function More() {
  const { user, family, logout } = useAuth();
  const [seeding, setSeeding] = useState(false);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showBudgetSettings, setShowBudgetSettings] = useState(false);

  // Budget form state
  const [monthlyBudget, setMonthlyBudget] = useState("");
  const [salaryDay, setSalaryDay] = useState("27");
  const [catBudgets, setCatBudgets] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!family?.id) return;
    const unsub = getWallet(family.id, w => {
      setWallet(w);
      if (w) {
        setMonthlyBudget(String(w.monthlyBudget || ""));
        setSalaryDay(String(w.salaryDay || 27));
        const budgets: Record<string, string> = {};
        Object.entries(w.categoryBudgets ?? {}).forEach(([k, v]) => { budgets[k] = String(v); });
        setCatBudgets(budgets);
      }
    });
    getCategories(family.id).then(setCategories);
    return unsub;
  }, [family]);

  const handleCreateFamily = async () => {
    if (!user) return;
    setSeeding(true);
    try {
      const famRef = await addDoc(collection(db, "families"), {
        name: `عائلة ${user.displayName || "الجديدة"}`,
        createdBy: user.uid, createdAt: Timestamp.now(), members: [user.uid],
      });
      await updateDoc(doc(db, "users", user.uid), { familyId: famRef.id });
      window.location.href = "/";
    } catch (err) {
      alert("عذراً، فشل إنشاء العائلة.");
    } finally { setSeeding(false); }
  };

  const handleSaveBudget = async () => {
    if (!family?.id || !wallet?.id) return;
    setSaving(true);
    try {
      const parsed: Record<string, number> = {};
      Object.entries(catBudgets).forEach(([k, v]) => {
        const n = parseFloat(v);
        if (!isNaN(n) && n > 0) parsed[k] = n;
      });
      await updateWalletSettings(family.id, wallet.id, {
        monthlyBudget: parseFloat(monthlyBudget) || 0,
        salaryDay: parseInt(salaryDay) || 27,
        categoryBudgets: parsed,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally { setSaving(false); }
  };

  const handleSeed = async () => {
    if (!family?.id || !user?.uid) return;
    if (!confirm("سيتم إضافة بيانات تجريبية. هل تريد المتابعة؟")) return;
    setSeeding(true);
    try {
      await seedSampleData(family.id, user.uid);
      alert("تم إضافة البيانات التجريبية بنجاح!");
    } catch { alert("فشلت عملية إضافة البيانات."); }
    finally { setSeeding(false); }
  };

  return (
    <div className="px-6 space-y-6 pb-12 animate-in fade-in duration-500">
      <div className="pt-8">
        <h2 className="text-4xl font-black font-headline mb-2">المزيد</h2>
        <p className="text-on-surface-variant">الإعدادات والميزانية</p>
      </div>

      {/* Profile */}
      <section className="bg-surface-container-low p-6 rounded-3xl flex items-center gap-4 shadow-sm">
        <img src={user?.photoURL || `https://picsum.photos/seed/${user?.uid}/100/100`}
          className="w-16 h-16 rounded-full" alt="Profile" referrerPolicy="no-referrer" />
        <div>
          <h3 className="font-bold text-lg">{user?.displayName}</h3>
          <p className="text-xs text-on-surface-variant">{user?.email}</p>
        </div>
      </section>

      {/* Family */}
      {!family ? (
        <button onClick={handleCreateFamily}
          className="w-full p-6 bg-primary/10 text-primary font-bold rounded-3xl flex items-center justify-between">
          <span>إنشاء محفظة عائلية</span>
          <UserCheck />
        </button>
      ) : (
        <section className="p-5 bg-surface-container-low rounded-3xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs text-on-surface-variant mb-1">اسم العائلة</p>
            <p className="font-bold text-lg">{family.name}</p>
          </div>
          <Shield className="text-primary" />
        </section>
      )}

      {/* Quick Links */}
      {family && (
        <section className="space-y-3">
          <h3 className="text-xs font-bold text-on-surface-variant px-1">إدارة البيانات</h3>
          <Link to="/more/categories"
            className="w-full p-5 bg-surface-container-lowest border border-surface-container-high rounded-3xl flex items-center gap-4 shadow-sm active:scale-[0.98] transition-all">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Tag size={20} className="text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">إدارة الفئات والأصناف</p>
              <p className="text-xs text-on-surface-variant mt-0.5">إضافة وتعديل وحذف الفئات</p>
            </div>
            <ChevronLeft size={18} className="text-on-surface-variant" />
          </Link>
          <Link to="/more/merchants"
            className="w-full p-5 bg-surface-container-lowest border border-surface-container-high rounded-3xl flex items-center gap-4 shadow-sm active:scale-[0.98] transition-all">
            <div className="w-10 h-10 bg-tertiary-container rounded-xl flex items-center justify-center">
              <Store size={20} className="text-on-tertiary-container" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">إدارة المتاجر</p>
              <p className="text-xs text-on-surface-variant mt-0.5">إضافة وتعديل وحذف المتاجر</p>
            </div>
            <ChevronLeft size={18} className="text-on-surface-variant" />
          </Link>
        </section>
      )}

      {/* Budget Settings */}
      {family && (
        <section className="bg-surface-container-lowest border border-surface-container-high rounded-3xl overflow-hidden shadow-sm">
          <button onClick={() => setShowBudgetSettings(!showBudgetSettings)}
            className="w-full p-5 flex items-center justify-between font-bold text-on-surface">
            <span>إعدادات الميزانية</span>
            {showBudgetSettings ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>

          <AnimatePresence>
            {showBudgetSettings && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="px-5 pb-5 space-y-5 border-t border-surface-container-high pt-5">

                  {/* Monthly Budget */}
                  <div>
                    <label className="text-xs font-bold text-on-surface-variant block mb-2">الميزانية الشهرية (ريال)</label>
                    <input type="number" value={monthlyBudget} onChange={e => setMonthlyBudget(e.target.value)}
                      placeholder="8000"
                      className="w-full bg-surface-container-low border border-surface-container-high rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary" />
                  </div>

                  {/* Salary Day */}
                  <div>
                    <label className="text-xs font-bold text-on-surface-variant block mb-2">يوم استلام الراتب</label>
                    <div className="flex gap-2 flex-wrap">
                      {[25, 26, 27, 28, 29, 30].map(d => (
                        <button key={d} type="button" onClick={() => setSalaryDay(String(d))}
                          className={cn("px-4 py-2 rounded-xl text-sm font-bold border transition-all",
                            salaryDay === String(d) ? "bg-primary text-white border-primary" : "border-surface-container-high text-on-surface-variant")}>
                          {d}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-on-surface-variant mt-2">دورة الميزانية: من اليوم {salaryDay} حتى اليوم {parseInt(salaryDay) - 1} من الشهر التالي</p>
                  </div>

                  {/* Per-category budgets */}
                  {categories.length > 0 && (
                    <div>
                      <label className="text-xs font-bold text-on-surface-variant block mb-3">ميزانية كل فئة (ريال)</label>
                      <div className="space-y-3">
                        {categories.map(cat => (
                          <div key={cat.id} className="flex items-center gap-3">
                            <span className="text-lg w-7">{CATEGORY_EMOJI[cat.id] || "💸"}</span>
                            <span className="text-sm font-medium text-on-surface flex-1">{cat.name}</span>
                            <input type="number" value={catBudgets[cat.id] ?? ""}
                              onChange={e => setCatBudgets(prev => ({ ...prev, [cat.id]: e.target.value }))}
                              placeholder="0"
                              className="w-24 bg-surface-container-low border border-surface-container-high rounded-xl py-2 px-3 text-sm focus:ring-2 focus:ring-primary text-center" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button onClick={handleSaveBudget} disabled={saving}
                    className={cn("w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all",
                      saved ? "bg-green-500 text-white" : "bg-primary text-white shadow-lg shadow-primary/20 active:scale-[0.98]",
                      saving && "opacity-50")}>
                    <Save size={18} />
                    {saving ? "جاري الحفظ..." : saved ? "تم الحفظ ✓" : "حفظ الإعدادات"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}

      {/* Dev Utils */}
      {family && (
        <section>
          <h3 className="text-xs font-bold text-on-surface-variant px-1 mb-3">أدوات التطوير</h3>
          <button onClick={handleSeed} disabled={seeding}
            className="w-full p-5 bg-secondary-container text-on-secondary-container font-bold rounded-3xl flex items-center justify-between disabled:opacity-50">
            <span>{seeding ? "جاري الإضافة..." : "تجهيز بيانات تجريبية"}</span>
            <Database />
          </button>
        </section>
      )}

      {/* Logout */}
      <button onClick={() => logout()}
        className="w-full p-5 text-error font-bold bg-error/10 rounded-3xl flex items-center justify-between">
        <span>تسجيل الخروج</span>
        <LogOut />
      </button>

      <p className="text-center text-[10px] text-on-surface-variant/30 pt-8">ezbah app v3.0.0</p>
    </div>
  );
}
