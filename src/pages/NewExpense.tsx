import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { addExpense, getMerchants, getCategories, createMerchant } from "../services/firestoreService";
import { Merchant, Category } from "../types";
import { Search, ArrowRight, Store, Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

const CATEGORY_EMOJI: Record<string, string> = {
  food: "🍖", groceries: "🛒", utilities: "⚡", transport: "🚗",
  education: "📚", health: "💊", occasions: "🎁", entertainment: "🎬", clothing: "👕",
};

const DEFAULT_CATEGORIES: Category[] = [
  { id: "food",      familyId: "", name: "طعام ومشروبات", icon: "Utensils",     subItems: ["لحوم","دجاج","أسماك","خضروات","فواكه","مشروبات"] },
  { id: "groceries", familyId: "", name: "مقاضي وبقالة",  icon: "ShoppingCart", subItems: ["ألبان وأجبان","خبز ومعجنات","بقوليات","زيوت","معلبات"] },
  { id: "transport", familyId: "", name: "مواصلات",        icon: "Car",          subItems: ["بنزين","غسيل سيارة","صيانة","تاكسي/أوبر"] },
  { id: "utilities", familyId: "", name: "فواتير",         icon: "Zap",          subItems: ["كهرباء","ماء","إنترنت","جوال"] },
];

export default function NewExpense() {
  const navigate = useNavigate();
  const { family } = useAuth();

  const [amount, setAmount] = useState("");
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [selectedCat, setSelectedCat] = useState<Category>(DEFAULT_CATEGORIES[0]);
  const [selectedSub, setSelectedSub] = useState("");
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [filteredMerchants, setFilteredMerchants] = useState<Merchant[]>([]);
  const [merchantSearch, setMerchantSearch] = useState("");
  const [selectedMerchant, setSelectedMerchant] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewMerchant, setShowNewMerchant] = useState(false);
  const [newMerchantName, setNewMerchantName] = useState("");

  useEffect(() => {
    if (!family?.id) return;
    getCategories(family.id).then(cats => {
      if (cats.length > 0) {
        setCategories(cats);
        setSelectedCat(cats[0]);
      }
    });
    getMerchants(family.id).then(ms => {
      setMerchants(ms);
      setFilteredMerchants(ms.slice(0, 6));
    });
  }, [family]);

  useEffect(() => {
    const q = merchantSearch.trim().toLowerCase();
    if (!q) {
      setFilteredMerchants(merchants.slice(0, 6));
      setShowNewMerchant(false);
    } else {
      const matched = merchants.filter(m => m.name.toLowerCase().includes(q));
      setFilteredMerchants(matched);
      setShowNewMerchant(matched.length === 0);
      setNewMerchantName(merchantSearch.trim());
    }
  }, [merchantSearch, merchants]);

  const handleAddNewMerchant = async () => {
    if (!family?.id || !newMerchantName.trim()) return;
    const m = await createMerchant(family.id, newMerchantName.trim());
    setMerchants(prev => [...prev, m]);
    setSelectedMerchant(m.id);
    setMerchantSearch(m.name);
    setShowNewMerchant(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !family?.id) return;
    setLoading(true);
    setError(null);
    try {
      await addExpense({
        familyId: family.id,
        categoryId: selectedCat.id,
        subItem: selectedSub || selectedCat.subItems[0],
        amount: parseFloat(amount),
        merchantId: selectedMerchant,
      });
      navigate("/");
    } catch (err: any) {
      console.error(err);
      setError("فشل حفظ المصروف. حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-6 pb-12 animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-4 mb-10 pt-4">
        <button onClick={() => navigate(-1)} className="p-2 bg-surface-container-low rounded-xl">
          <ArrowRight size={24} />
        </button>
        <h2 className="text-3xl font-black font-headline">إضافة مصروف</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Amount */}
        <section className="relative bg-surface-container-lowest border border-surface-container-high p-8 rounded-3xl shadow-sm">
          <label className="text-[10px] font-bold text-outline-variant mb-2 block uppercase tracking-[0.2em]">المبلغ</label>
          <div className="flex items-baseline justify-center gap-2">
            <input
              autoFocus required type="number" step="0.01"
              value={amount} onChange={e => setAmount(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-7xl font-headline font-extrabold text-center w-full placeholder:text-surface-container-high text-on-surface"
              placeholder="0.00"
            />
            <span className="text-xl font-bold text-on-surface-variant">ر.س</span>
          </div>
        </section>

        {/* Category */}
        <section>
          <h3 className="text-sm font-bold text-on-surface mb-4 px-1">الفئة</h3>
          <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
            {categories.map(cat => (
              <button key={cat.id} type="button" onClick={() => { setSelectedCat(cat); setSelectedSub(""); }}
                className="flex-shrink-0 flex flex-col items-center gap-2">
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center text-2xl transition-all duration-200",
                  selectedCat.id === cat.id ? "bg-primary shadow-lg shadow-primary/20 scale-105" : "bg-surface-container-low border border-surface-container-high"
                )}>
                  {CATEGORY_EMOJI[cat.id] || "💸"}
                </div>
                <span className={cn("text-[11px] font-medium transition-colors",
                  selectedCat.id === cat.id ? "text-primary font-bold" : "text-on-surface-variant"
                )}>{cat.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Sub-items */}
        <section>
          <h3 className="text-sm font-bold text-on-surface mb-4 px-1">الصنف</h3>
          <div className="flex flex-wrap gap-2">
            {selectedCat.subItems.map(sub => (
              <button key={sub} type="button" onClick={() => setSelectedSub(sub)}
                className={cn(
                  "px-5 py-2.5 text-xs font-bold rounded-xl border transition-all",
                  selectedSub === sub
                    ? "bg-primary border-primary text-white shadow-sm"
                    : "bg-surface-container-low border-surface-container-high text-on-surface"
                )}>
                {sub}
              </button>
            ))}
          </div>
        </section>

        {/* Merchant */}
        <section>
          <h3 className="text-sm font-bold text-on-surface mb-4 px-1">المتجر (اختياري)</h3>
          <div className="relative mb-3">
            <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text" placeholder="بحث عن متجر..."
              value={merchantSearch} onChange={e => setMerchantSearch(e.target.value)}
              className="w-full bg-surface-container-lowest border border-surface-container-high rounded-2xl py-4 pr-12 pl-4 focus:ring-2 focus:ring-primary shadow-sm text-sm"
            />
            {merchantSearch && (
              <button type="button" onClick={() => { setMerchantSearch(""); setSelectedMerchant(""); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
                <X size={16} />
              </button>
            )}
          </div>

          <AnimatePresence>
            {showNewMerchant && (
              <motion.button
                type="button"
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                onClick={handleAddNewMerchant}
                className="w-full mb-3 p-3 border-2 border-dashed border-primary/40 rounded-2xl flex items-center gap-3 text-primary text-sm font-bold">
                <Plus size={18} /> إضافة "{newMerchantName}" كمتجر جديد
              </motion.button>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-2 gap-3">
            {filteredMerchants.map(m => (
              <button key={m.id} type="button" onClick={() => setSelectedMerchant(m.id === selectedMerchant ? "" : m.id)}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-2xl border transition-all shadow-sm",
                  selectedMerchant === m.id
                    ? "bg-tertiary-container border-tertiary-container text-on-tertiary-container scale-[1.02]"
                    : "bg-surface-container-lowest border-surface-container-high"
                )}>
                <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center">
                  <Store size={14} />
                </div>
                <span className="text-xs font-bold truncate">{m.name}</span>
              </button>
            ))}
          </div>
        </section>

        {error && <p className="text-center text-sm font-bold text-red-500">{error}</p>}

        <button disabled={loading} type="submit"
          className="w-full py-6 rounded-3xl bg-primary text-white font-black text-xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50">
          {loading ? "جاري الحفظ..." : "حفظ المصروف"}
        </button>
      </form>
    </div>
  );
}
