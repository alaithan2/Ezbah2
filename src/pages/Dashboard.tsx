import React, { useEffect, useState } from "react";
import { Plus, ShoppingCart, BarChart3, Store, ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getWallet } from "../services/firestoreService";
import { Wallet } from "../types";
import { motion } from "motion/react";
import { cn } from "../lib/utils";

export default function Dashboard() {
  const { user, family } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);

  useEffect(() => {
    if (family?.id) {
      return getWallet(family.id, setWallet);
    }
  }, [family]);

  if (!family) {
    return (
      <div className="px-6 flex flex-col items-center justify-center min-h-[80vh] text-center space-y-8 animate-in fade-in duration-700">
        <div className="w-24 h-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center text-primary text-5xl shadow-inner">
          🏘️
        </div>
        <div className="space-y-3">
          <h2 className="text-3xl font-bold font-headline text-on-surface">أهلاً بك في العزبة</h2>
          <p className="text-on-surface-variant text-sm max-w-[280px]">
            لم نجد أي ميزانية عائلية مرتبطة بحسابك. ابدأ الآن بإنشاء محفظة لعائلتك.
          </p>
        </div>
        <Link 
          to="/more" 
          className="w-full max-w-[240px] h-14 bg-primary text-white font-bold rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-primary/20 active:scale-95 transition-all text-sm"
        >
          <ChevronLeft size={18} />
          إنشاء ميزانية عائلية
        </Link>
        <p className="text-[10px] text-on-surface-variant/40 tracking-widest uppercase">
          تحكم كامل في مصاريفك وخططك
        </p>
      </div>
    );
  }

  const spentPercentage = wallet ? Math.round(((wallet.monthlyBudget - wallet.balance) / wallet.monthlyBudget) * 100) : 0;

  return (
    <div className="px-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Wallet Summary */}
      <section className="mt-4 px-2">
        <div className="relative overflow-hidden rounded-3xl p-7 bg-primary text-white shadow-lg shadow-primary/20">
          <div className="relative z-10 flex flex-col justify-between h-[180px]">
            <div>
              <p className="text-primary-foreground/80 text-xs font-medium mb-1">رصيد المحفظة المتبقي</p>
              <h2 className="text-5xl font-bold mt-2 font-headline">
                {wallet?.balance.toLocaleString() || "0"} 
                <span className="text-lg font-normal mr-2">ريال</span>
              </h2>
            </div>
            <div className="mt-auto">
              <div className="flex justify-between text-xs mb-3">
                <span className="opacity-90">{spentPercentage}% من الميزانية مستخدم</span>
                <span className="font-bold">المتبقي: {wallet?.balance.toLocaleString()} ر.س</span>
              </div>
              <div className="w-full h-2 bg-on-primary/20 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${spentPercentage}%` }}
                  className="h-full bg-white rounded-full transition-all duration-1000" 
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats Grid */}
      <section className="grid grid-cols-3 gap-3 px-2">
        {[
          { label: "مصروف اليوم", value: "142", icon: "🥩", color: "text-error" },
          { label: "الأسبوع", value: "1,150", icon: "🥛", color: "text-on-surface" },
          { label: "أعلى تصنيف", value: "المواد الغذائية", icon: "🧺", color: "text-primary" }
        ].map((stat, i) => (
          <div key={i} className="bg-surface-container-lowest p-4 rounded-2xl border border-surface-container-high shadow-sm flex flex-col items-center justify-center text-center">
            <span className="text-[10px] text-on-surface-variant font-bold mb-1 uppercase spacing-wider">{stat.label}</span>
            <span className={cn("text-sm font-bold truncate w-full", stat.color)}>
              {stat.value} 
              {i < 2 && <small className="text-[10px] opacity-60 mr-0.5"> ر.س</small>}
            </span>
          </div>
        ))}
      </section>

      {/* Quick Actions GRID */}
      <section className="px-2">
        <div className="bg-surface-container-lowest border border-surface-container-high rounded-3xl p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-5 font-headline">إجراءات سريعة</h3>
          <div className="grid grid-cols-2 gap-4">
            <Link to="/expenses/new" className="flex flex-col items-center justify-center p-4 bg-surface-container-low border border-surface-container-high rounded-2xl hover:bg-primary-container transition-colors active:scale-95">
              <div className="w-10 h-10 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center mb-2 font-bold text-xl">+</div>
              <span className="text-sm font-medium text-on-surface-variant">إضافة مصاريف</span>
            </Link>
            <Link to="/shopping" className="flex flex-col items-center justify-center p-4 bg-surface-container-low border border-surface-container-high rounded-2xl hover:bg-tertiary-container transition-colors active:scale-95">
              <div className="w-10 h-10 bg-tertiary-container text-on-tertiary-container rounded-full flex items-center justify-center mb-2 text-xl">🛒</div>
              <span className="text-sm font-medium text-on-surface-variant">قائمة تسوق</span>
            </Link>
            <Link to="/reports" className="flex flex-col items-center justify-center p-4 bg-surface-container-low border border-surface-container-high rounded-2xl hover:bg-secondary-container transition-colors active:scale-95">
              <div className="w-10 h-10 bg-secondary-container text-on-secondary-container rounded-full flex items-center justify-center mb-2 text-xl">📊</div>
              <span className="text-sm font-medium text-on-surface-variant">التقارير</span>
            </Link>
            <Link to="/more" className="flex flex-col items-center justify-center p-4 bg-surface-container-low border border-surface-container-high rounded-2xl hover:bg-surface-container-high transition-colors active:scale-95">
              <div className="w-10 h-10 bg-surface-container-highest rounded-full flex items-center justify-center mb-2 text-xl">👥</div>
              <span className="text-sm font-medium text-on-surface-variant">التجار</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Smart Shopping Suggestions */}
      <section className="px-2 space-y-4">
        <div className="flex justify-between items-center mb-1">
          <h3 className="text-lg font-bold font-headline">اقتراحات التسوق</h3>
          <span className="text-[10px] bg-primary-container text-on-primary-container px-3 py-1 rounded-full border border-primary-dim/10 font-bold">بناءً على تاريخك</span>
        </div>
        <div className="space-y-3 bg-surface-container-lowest border border-surface-container-high rounded-3xl p-5 shadow-sm">
          {[
            { name: "خبز صامولي (كيس كبير)", price: "5.00", frequency: "كل يومين" },
            { name: "حليب طازج (١ لتر)", price: "8.50", frequency: "كل ٣ أيام" }
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-4 p-3 border border-dashed border-surface-container-high rounded-2xl bg-surface-container-low/30">
              <div className="w-6 h-6 border-2 border-surface-container-high rounded-lg"></div>
              <div className="flex-1">
                <p className="text-sm font-bold">{item.name}</p>
                <p className="text-[10px] text-on-surface-variant">معدل الاستهلاك: {item.frequency}</p>
              </div>
              <span className="text-xs font-bold text-on-surface-variant">{item.price} ريال</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
