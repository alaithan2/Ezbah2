import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { getFamilyExpenses, getCategories } from "../services/firestoreService";
import { Expense, Category, Wallet } from "../types";
import { getWallet } from "../services/firestoreService";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { FileText, Share2, TrendingUp, TrendingDown } from "lucide-react";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { motion } from "motion/react";
import { cn } from "../lib/utils";
import { getCycleStart, getCycleEnd, getCycleLabel, toDate } from "../utils/budgetCycle";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

type TabType = "CURRENT" | "PREVIOUS" | "THREE_MONTHS";

const COLORS = ["#006a6a","#8dedec","#ffdcc3","#98fabe","#b4c5ff","#ffd6e0","#d4f7c5","#ffe4b5","#c8d8ff"];

const CATEGORY_EMOJI: Record<string, string> = {
  food: "🍖", groceries: "🛒", utilities: "⚡", transport: "🚗",
  education: "📚", health: "💊", occasions: "🎁", entertainment: "🎬", clothing: "👕",
};

const formatDate = (v: any): string => {
  try {
    const d = toDate(v);
    if (d.getTime() === 0) return "—";
    return format(d, "d MMM yyyy", { locale: ar });
  } catch { return "—"; }
};

export default function Reports() {
  const { family } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("CURRENT");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);

  useEffect(() => {
    if (!family?.id) return;
    const unsub1 = getFamilyExpenses(family.id, setExpenses);
    const unsub2 = getWallet(family.id, setWallet);
    getCategories(family.id).then(setCategories);
    return () => { unsub1(); unsub2(); };
  }, [family]);

  const salaryDay = wallet?.salaryDay ?? 27;
  const now = new Date();

  const currentCycleStart = getCycleStart(now, salaryDay);
  const currentCycleEnd   = getCycleEnd(currentCycleStart);
  const prevCycleStart    = getCycleStart(new Date(currentCycleStart.getTime() - 1), salaryDay);
  const prevCycleEnd      = getCycleEnd(prevCycleStart);
  const threeMonthsAgo    = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());

  const filterExpenses = (): Expense[] => {
    switch (activeTab) {
      case "CURRENT":      return expenses.filter(e => { const d = toDate(e.date); return d >= currentCycleStart && d <= now; });
      case "PREVIOUS":     return expenses.filter(e => { const d = toDate(e.date); return d >= prevCycleStart && d <= prevCycleEnd; });
      case "THREE_MONTHS": return expenses.filter(e => toDate(e.date) >= threeMonthsAgo);
    }
  };

  const filtered = filterExpenses();
  const currentTotal  = expenses.filter(e => { const d = toDate(e.date); return d >= currentCycleStart && d <= now; }).reduce((s,e) => s + e.amount, 0);
  const previousTotal = expenses.filter(e => { const d = toDate(e.date); return d >= prevCycleStart && d <= prevCycleEnd; }).reduce((s,e) => s + e.amount, 0);
  const totalSpent = filtered.reduce((s, e) => s + e.amount, 0);

  const diffPct = previousTotal > 0 ? Math.round(((currentTotal - previousTotal) / previousTotal) * 100) : 0;
  const isMore  = diffPct > 0;

  // Category breakdown for pie
  const catTotals = filtered.reduce((acc: Record<string, number>, e) => {
    acc[e.categoryId] = (acc[e.categoryId] || 0) + e.amount;
    return acc;
  }, {});
  const pieData = Object.entries(catTotals).map(([catId, value]) => ({
    name: categories.find(c => c.id === catId)?.name ?? catId,
    value,
    emoji: CATEGORY_EMOJI[catId] || "💸",
  })).sort((a, b) => b.value - a.value);

  const generatePDF = () => {
    try {
      const pdfDoc = new jsPDF("p", "mm", "a4");
      pdfDoc.setFont("helvetica", "bold");
      pdfDoc.text("Al Ezbah - Budget Report", 105, 20, { align: "center" });
      pdfDoc.setFontSize(10);
      pdfDoc.text(`Family: ${family?.name ?? ""}`, 20, 30);
      pdfDoc.text(`Total: ${totalSpent.toLocaleString()} SAR`, 20, 40);

      const tableData = filtered.map(e => [
        formatDate(e.date),
        categories.find(c => c.id === e.categoryId)?.name ?? e.categoryId,
        e.subItem,
        `${e.amount.toLocaleString()} SAR`,
      ]);

      (pdfDoc as any).autoTable({
        head: [["Date", "Category", "Item", "Amount"]],
        body: tableData, startY: 50,
      });

      pdfDoc.save(`ezbah-${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (err) { console.error("PDF error", err); }
  };

  const tabLabel = (t: TabType) =>
    t === "CURRENT" ? `هذا الشهر (${getCycleLabel(currentCycleStart, currentCycleEnd)})` :
    t === "PREVIOUS" ? `الشهر الماضي` : "آخر 3 أشهر";

  return (
    <div className="px-6 space-y-6 pb-12 animate-in fade-in duration-500">
      <div className="pt-8 flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-black font-headline mb-2">التقارير</h2>
          <p className="text-on-surface-variant text-sm">تحليل مصاريف العائلة</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1.5 bg-surface-container-low rounded-2xl gap-1">
        {(["CURRENT","PREVIOUS","THREE_MONTHS"] as TabType[]).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={cn("flex-1 py-3 text-center rounded-xl font-bold transition-all text-xs",
              activeTab === tab ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant")}>
            {tab === "CURRENT" ? "هذا الشهر" : tab === "PREVIOUS" ? "الشهر الماضي" : "٣ أشهر"}
          </button>
        ))}
      </div>

      {/* Total Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary to-primary-dim rounded-3xl p-8 text-white shadow-lg shadow-primary/20">
        <p className="text-white/70 text-sm mb-1">{tabLabel(activeTab)}</p>
        <h2 className="text-5xl font-extrabold tracking-tight mb-4">{totalSpent.toLocaleString()} <span className="text-xl opacity-60">ر.س</span></h2>

        {activeTab === "CURRENT" && previousTotal > 0 && (
          <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full w-fit text-xs font-bold ring-1 ring-white/20">
            {isMore ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span>{Math.abs(diffPct)}% {isMore ? "أكثر" : "أقل"} من الشهر الماضي ({previousTotal.toLocaleString()} ر.س)</span>
          </div>
        )}
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-[80px]" />
      </div>

      {/* Pie Chart */}
      {pieData.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-xl font-bold font-headline">توزيع المصاريف</h3>
          <div className="bg-surface-container-low h-56 rounded-3xl flex items-center justify-center p-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: any) => [`${v.toLocaleString()} ر.س`]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="grid grid-cols-2 gap-2">
            {pieData.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="truncate text-on-surface-variant">{item.emoji} {item.name}</span>
                <span className="font-bold text-on-surface mr-auto">{item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Top Expenses */}
      {filtered.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-xl font-bold font-headline">أعلى المصاريف</h3>
          <div className="bg-surface-container-lowest rounded-3xl divide-y divide-outline-variant/10 overflow-hidden border border-outline-variant/10 shadow-sm">
            {filtered.slice(0, 5).map((exp, i) => (
              <div key={i} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{CATEGORY_EMOJI[exp.categoryId] || "💸"}</span>
                  <div>
                    <p className="font-bold text-sm">{exp.subItem}</p>
                    <p className="text-xs text-on-surface-variant">{formatDate(exp.date)}</p>
                  </div>
                </div>
                <p className="font-black text-error">{exp.amount.toLocaleString()} <small className="text-[10px]">ر.س</small></p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Export */}
      <div className="grid grid-cols-2 gap-4">
        <button onClick={generatePDF}
          className="bg-surface-container-high text-on-surface font-bold py-5 px-6 rounded-3xl flex items-center justify-center gap-3 active:scale-95 transition-all">
          <FileText size={20} /> تصدير PDF
        </button>
        <button className="bg-gradient-to-r from-primary to-primary-dim text-white font-bold py-5 px-6 rounded-3xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-lg shadow-primary/20">
          <Share2 size={20} /> مشاركة
        </button>
      </div>
    </div>
  );
}
