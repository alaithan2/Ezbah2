import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { getFamilyExpenses, deleteExpense } from "../services/firestoreService";
import { Expense } from "../types";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Plus, Search, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { toDate } from "../utils/budgetCycle";

const CATEGORY_EMOJI: Record<string, string> = {
  food: "🍖", groceries: "🛒", utilities: "⚡", transport: "🚗",
  education: "📚", health: "💊", occasions: "🎁", entertainment: "🎬", clothing: "👕",
};

export default function Expenses() {
  const { family } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!family?.id) return;
    return getFamilyExpenses(family.id, setExpenses);
  }, [family]);

  const handleDelete = async (exp: Expense) => {
    if (!family?.id) return;
    if (!confirm(`حذف "${exp.subItem}" (${exp.amount} ر.س)؟`)) return;
    setDeletingId(exp.id);
    try {
      await deleteExpense(family.id, exp.id);
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = expenses.filter(e =>
    e.subItem?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group by date label
  const grouped: { label: string; items: Expense[] }[] = [];
  filtered.forEach(exp => {
    const d = toDate(exp.date);
    const label = d.getTime() === 0 ? "—" : format(d, "EEEE، d MMMM yyyy", { locale: ar });
    const last = grouped[grouped.length - 1];
    if (last && last.label === label) last.items.push(exp);
    else grouped.push({ label, items: [exp] });
  });

  return (
    <div className="px-6 space-y-6 pb-12 animate-in fade-in duration-500">
      <div className="pt-8 flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black font-headline mb-2">السجل</h2>
          <p className="text-on-surface-variant text-sm">جميع المصاريف</p>
        </div>
        <Link to="/expenses/new"
          className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 active:scale-95 transition-all">
          <Plus size={28} />
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
        <input type="text" placeholder="بحث في المصاريف..." value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full bg-surface-container-lowest border border-surface-container-high rounded-2xl py-4 pr-12 pl-4 focus:ring-2 focus:ring-primary shadow-sm text-sm" />
      </div>

      {/* Grouped List */}
      <div className="space-y-6">
        <AnimatePresence>
          {grouped.map(({ label, items }) => (
            <div key={label}>
              <p className="text-xs text-on-surface-variant font-bold px-1 mb-3">{label}</p>
              <div className="space-y-2">
                {items.map(exp => (
                  <motion.div key={exp.id} layout
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-surface-container-lowest border border-surface-container-high rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                      {CATEGORY_EMOJI[exp.categoryId] || "💸"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-on-surface truncate">{exp.subItem}</p>
                      {exp.notes && <p className="text-xs text-on-surface-variant truncate">{exp.notes}</p>}
                    </div>
                    <p className="font-bold text-error text-sm flex-shrink-0">
                      -{exp.amount.toLocaleString()} <small className="text-[10px]">ر.س</small>
                    </p>
                    <button
                      onClick={() => handleDelete(exp)}
                      disabled={deletingId === exp.id}
                      className={cn("p-2 rounded-xl text-on-surface-variant/40 hover:text-error hover:bg-error/10 transition-all active:scale-90",
                        deletingId === exp.id && "opacity-30 pointer-events-none")}>
                      <Trash2 size={16} />
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="text-center py-24">
            <div className="w-20 h-20 bg-surface-container-low rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
              <Search size={32} className="text-on-surface-variant" />
            </div>
            <p className="text-on-surface-variant font-medium">لا توجد مصاريف</p>
          </div>
        )}
      </div>
    </div>
  );
}
