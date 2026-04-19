import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { db } from "../lib/firebase";
import { collection, query, where, onSnapshot, orderBy, Timestamp } from "firebase/firestore";
import { Expense } from "../types";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Plus, Search, Filter, Trash2, Edit2 } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

export default function Expenses() {
  const { family } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!family?.id) return;

    const q = query(
      collection(db, "families", family.id, "expenses"),
      orderBy("date", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setExpenses(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Expense)));
    });

    return unsubscribe;
  }, [family]);

  const filteredExpenses = expenses.filter(e => 
    e.subItem.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="px-6 space-y-8 pb-12 animate-in fade-in duration-500">
      <div className="pt-8 flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black font-headline mb-2">السجل</h2>
          <p className="text-on-surface-variant">جميع مصاريف العزبة التاريخية</p>
        </div>
        <Link 
          to="/expenses/new" 
          className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 active:scale-95 transition-all"
        >
          <Plus size={32} />
        </Link>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1 group">
          <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="البحث في المصاريف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface-container-lowest border border-surface-container-high rounded-2xl py-4 pr-12 pl-4 focus:ring-2 focus:ring-primary shadow-sm text-sm transition-all"
          />
        </div>
        <button className="p-4 bg-surface-container-lowest border border-surface-container-high rounded-2xl text-on-surface-variant shadow-sm">
          <Filter size={20} />
        </button>
      </div>

      {/* Expenses List */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredExpenses.map((exp) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              key={exp.id}
              className="bg-surface-container-low/50 p-4 rounded-xl flex items-center justify-between border border-surface-container-high group active:scale-[0.99] transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary/10 text-primary rounded flex items-center justify-center text-xs font-bold">
                   {exp.categoryId.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-on-surface">{exp.subItem}</h4>
                  <p className="text-[10px] text-on-surface-variant">
                    {exp.date && format(exp.date instanceof Timestamp ? exp.date.toDate() : exp.date, "dd MMMM", { locale: ar })}
                  </p>
                </div>
              </div>
              <div className="text-left rtl:text-right">
                <p className="text-lg font-bold text-error">-{exp.amount.toLocaleString()} ريال</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredExpenses.length === 0 && (
          <div className="text-center py-24">
            <div className="w-20 h-20 bg-surface-container-low rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
              <Search size={32} className="text-on-surface-variant" />
            </div>
            <p className="text-on-surface-variant font-medium">لم يتم العثور على مصاريف تطابق بحثك</p>
          </div>
        )}
      </div>
    </div>
  );
}
