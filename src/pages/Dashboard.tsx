import React, { useEffect, useState } from "react";
import { Plus, ChevronLeft, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getWallet, getFamilyExpenses, getCategories } from "../services/firestoreService";
import { Wallet, Expense, Category } from "../types";
import { motion } from "motion/react";
import { cn } from "../lib/utils";
import { getCycleStart, getCycleEnd, getCycleLabel, getDaysRemaining, toDate } from "../utils/budgetCycle";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const CATEGORY_EMOJI: Record<string, string> = {
  food: "🍖", groceries: "🛒", utilities: "⚡", transport: "🚗",
  education: "📚", health: "💊", occasions: "🎁", entertainment: "🎬", clothing: "👕",
};

export default function Dashboard() {
  const { user, family } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (!family?.id) return;
    return getWallet(family.id, setWallet);
  }, [family]);

  useEffect(() => {
    if (!family?.id) return;
    const unsub = getFamilyExpenses(family.id, setExpenses);
    getCategories(family.id).then(setCategories);
    return unsub;
  }, [family]);

  if (!family) {
    return (
      <div className="px-6 flex flex-col items-center justify-center min-h-[80vh] text-center space-y-8 animate-in fade-in duration-700">
        <div className="w-24 h-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center text-5xl shadow-inner">🏘️</div>
        <div className="space-y-3">
          <h2 className="text-3xl font-bold font-headline">أهلاً بك في العزبة</h2>
          <p className="text-on-surface-variant text-sm max-w-[280px]">لم نجد أي ميزانية مرتبطة بحسابك. ابدأ الآن.</p>
        </div>
        <Link to="/more" className="w-full max-w-[240px] h-14 bg-primary text-white font-bold rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-primary/20 active:scale-95 transition-all text-sm">
          <ChevronLeft size={18} />إنشاء ميزانية
        </Link>
      </div>
    );
  }

  const salaryDay = wallet?.salaryDay ?? 27;
  const cycleStart = getCycleStart(new Date(), salaryDay);
  const cycleEnd = getCycleEnd(cycleStart);
  const daysLeft = getDaysRemaining(cycleEnd);
  const cycleLabel = getCycleLabel(cycleStart, cycleEnd);

  // Filter expenses to current cycle
  const cycleExpenses = expenses.filter(e => toDate(e.date) >= cycleStart);
  const cycleTotal = cycleExpenses.reduce((sum, e) => sum + e.amount, 0);
  const monthlyBudget = wallet?.monthlyBudget ?? 0;
  const remainingBalance = monthlyBudget - cycleTotal;
  const spentPct = monthlyBudget > 0 ? Math.min(100, Math.round((cycleTotal / monthlyBudget) * 100)) : 0;
  const isWarning = spentPct >= 80;

  // Today & week totals
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - 7);
  const todayTotal = cycleExpenses.filter(e => toDate(e.date) >= todayStart).reduce((s, e) => s + e.amount, 0);
  const weekTotal  = cycleExpenses.filter(e => toDate(e.date) >= weekStart).reduce((s, e) => s + e.amount, 0);

  // Top category this cycle
  const catTotals = cycleExpenses.reduce((acc: Record<string, number>, e) => {
    acc[e.categoryId] = (acc[e.categoryId] || 0) + e.amount;
    return acc;
  }, {});
  const topCatId = Object.keys(catTotals).sort((a, b) => catTotals[b] - catTotals[a])[0];
  const topCat = categories.find(c => c.id === topCatId);

  // Category budget bars
  const categoryBudgets = wallet?.categoryBudgets ?? {};
  const catsWithBudget = categories.filter(c => categoryBudgets[c.id]);

  const last3 = cycleExpenses.slice(0, 3);

  return (
    <div className="px-6 space-y-6 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Wallet Card */}
      <section className="mt-4">
        <div className={cn(
          "relative overflow-hidden rounded-3xl p-7 text-white shadow-lg transition-colors",
          isWarning ? "bg-gradient-to-br from-orange-500 to-red-500 shadow-red-500/20"
                    : "bg-primary shadow-primary/20"
        )}>
          {isWarning && (
            <div className="flex items-center gap-2 mb-3 bg-white/20 rounded-xl px-3 py-1.5 w-fit text-xs font-bold">
              <AlertTriangle size={14} /> تجاوزت {spentPct}% من الميزانية
            </div>
          )}
          <p className="text-white/70 text-xs font-medium mb-1">المتبقي من الميزانية</p>
          <h2 className="text-5xl font-bold font-headline mb-1">
            {remainingBalance.toLocaleString()}
            <span className="text-lg font-normal mr-2 opacity-80">ريال</span>
          </h2>
          <p className="text-white/60 text-xs mb-4">{cycleLabel}</p>
          <div className="flex justify-between text-xs mb-2">
            <span className="opacity-80">{spentPct}% مُنفق</span>
            <span className="font-bold">{daysLeft} يوم متبقي</span>
          </div>
          <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${spentPct}%` }}
              transition={{ duration: 1 }}
              className="h-full bg-white rounded-full"
            />
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="grid grid-cols-3 gap-3">
        {[
          { label: "اليوم",    value: todayTotal,  suffix: "ر.س", color: "text-error"    },
          { label: "الأسبوع",  value: weekTotal,   suffix: "ر.س", color: "text-on-surface" },
          { label: "أعلى فئة", value: topCat?.name ?? "—", suffix: "", color: "text-primary" },
        ].map((s, i) => (
          <div key={i} className="bg-surface-container-lowest p-4 rounded-2xl border border-surface-container-high shadow-sm flex flex-col items-center text-center">
            <span className="text-[10px] text-on-surface-variant font-bold mb-1 uppercase tracking-wider">{s.label}</span>
            <span className={cn("text-sm font-bold truncate w-full", s.color)}>
              {typeof s.value === "number" ? s.value.toLocaleString() : s.value}
              {s.suffix && <small className="text-[10px] opacity-60 mr-0.5"> {s.suffix}</small>}
            </span>
          </div>
        ))}
      </section>

      {/* Category Budget Bars */}
      {catsWithBudget.length > 0 && (
        <section className="bg-surface-container-lowest border border-surface-container-high rounded-3xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold font-headline">ميزانية التصنيفات</h3>
          {catsWithBudget.map(cat => {
            const spent = catTotals[cat.id] || 0;
            const budget = categoryBudgets[cat.id];
            const pct = Math.min(100, Math.round((spent / budget) * 100));
            return (
              <div key={cat.id}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium">{CATEGORY_EMOJI[cat.id] || "•"} {cat.name}</span>
                  <span className={cn("font-bold", pct >= 90 ? "text-error" : pct >= 70 ? "text-orange-500" : "text-on-surface-variant")}>
                    {spent.toLocaleString()} / {budget.toLocaleString()} ر.س
                  </span>
                </div>
                <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-700", pct >= 90 ? "bg-error" : pct >= 70 ? "bg-orange-400" : "bg-primary")}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Last 3 Expenses */}
      {last3.length > 0 && (
        <section className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-lg font-bold font-headline">آخر المصاريف</h3>
            <Link to="/expenses" className="text-xs text-primary font-bold">عرض الكل</Link>
          </div>
          <div className="bg-surface-container-lowest border border-surface-container-high rounded-3xl divide-y divide-outline-variant/10 overflow-hidden shadow-sm">
            {last3.map(exp => (
              <div key={exp.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center text-base">
                    {CATEGORY_EMOJI[exp.categoryId] || "💸"}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{exp.subItem}</p>
                    <p className="text-[10px] text-on-surface-variant">
                      {format(toDate(exp.date), "EEEE d MMM", { locale: ar })}
                    </p>
                  </div>
                </div>
                <p className="font-bold text-error">-{exp.amount.toLocaleString()} <small className="text-[9px]">ر.س</small></p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Quick Actions */}
      <section>
        <div className="grid grid-cols-2 gap-4">
          <Link to="/expenses/new" className="flex flex-col items-center justify-center p-5 bg-primary text-white rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-all">
            <Plus size={28} className="mb-1" />
            <span className="text-sm font-bold">إضافة مصروف</span>
          </Link>
          <Link to="/shopping" className="flex flex-col items-center justify-center p-5 bg-surface-container-lowest border border-surface-container-high rounded-2xl active:scale-95 transition-all shadow-sm">
            <span className="text-2xl mb-1">🛒</span>
            <span className="text-sm font-medium text-on-surface-variant">قائمة التسوق</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
