import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { addExpense, getMerchants } from "../services/firestoreService";
import { Merchant, Category } from "../types";
import { ShoppingCart, Utensils, Home, Car, Film, Search, ArrowRight, Store } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";

const DEFAULT_CATEGORIES: Category[] = [
  { id: "cat1", familyId: "", name: "طعام", icon: "Utensils", subItems: ["لحوم", "دجاج", "أسماك"] },
  { id: "cat2", familyId: "", name: "مقاضي", icon: "ShoppingCart", subItems: ["خضروات", "فواكه", "ألبان"] },
  { id: "cat3", familyId: "", name: "المنزل", icon: "Home", subItems: ["منظفات", "صيانة"] },
  { id: "cat4", familyId: "", name: "نقل", icon: "Car", subItems: ["بنزين", "غسيل"] },
];

const CategoryIcon = ({ name, active }: { name: string; active: boolean }) => {
  const props = { size: 24, className: active ? "text-white" : "text-on-surface-variant" };
  switch (name) {
    case "طعام": return <Utensils {...props} />;
    case "مقاضي": return <ShoppingCart {...props} />;
    case "المنزل": return <Home {...props} />;
    case "نقل": return <Car {...props} />;
    default: return <Film {...props} />;
  }
};

export default function NewExpense() {
  const navigate = useNavigate();
  const { family } = useAuth();
  const [amount, setAmount] = useState("");
  const [selectedCat, setSelectedCat] = useState(DEFAULT_CATEGORIES[1]);
  const [selectedSub, setSelectedSub] = useState("");
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [selectedMerchant, setSelectedMerchant] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (family?.id) {
      getMerchants(family.id).then(setMerchants);
    }
  }, [family]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !family?.id) return;

    setLoading(true);
    try {
      await addExpense({
        familyId: family.id,
        categoryId: selectedCat.id,
        subItem: selectedSub || selectedCat.subItems[0],
        amount: parseFloat(amount),
        merchantId: selectedMerchant,
        date: new Date(),
      });
      navigate("/");
    } catch (err) {
      console.error(err);
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
        {/* Amount Input */}
        <section className="relative bg-surface-container-lowest border border-surface-container-high p-8 rounded-3xl shadow-sm">
          <label className="text-[10px] font-bold text-outline-variant mb-2 block uppercase tracking-[0.2em]">المبلغ</label>
          <div className="flex items-baseline justify-center gap-2">
            <input 
              autoFocus
              required
              type="number" 
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-7xl font-headline font-extrabold text-center w-full placeholder:text-surface-container-high text-on-surface" 
              placeholder="0.00" 
            />
            <span className="text-xl font-bold text-on-surface-variant">ر.س</span>
          </div>
        </section>

        {/* Category Picker */}
        <section>
          <div className="flex justify-between items-center mb-4 px-1">
            <h3 className="text-sm font-bold text-on-surface">الفئة</h3>
            <span className="text-xs text-primary font-bold">عرض الكل</span>
          </div>
          <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
            {DEFAULT_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCat(cat)}
                className="flex-shrink-0 flex flex-col items-center gap-2 group"
              >
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300",
                  selectedCat.id === cat.id ? "bg-primary shadow-lg shadow-primary/20 scale-105" : "bg-surface-container-low border border-surface-container-high"
                )}>
                  <CategoryIcon name={cat.name} active={selectedCat.id === cat.id} />
                </div>
                <span className={cn(
                  "text-[11px] font-medium transition-colors",
                  selectedCat.id === cat.id ? "text-primary font-bold" : "text-on-surface-variant"
                )}>{cat.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Sub-items Quick Pick */}
        <section>
          <h3 className="text-sm font-bold text-on-surface mb-4 px-1">الأصناف المتكررة</h3>
          <div className="flex flex-wrap gap-2">
            {selectedCat.subItems.map((sub) => (
              <button
                key={sub}
                type="button"
                onClick={() => setSelectedSub(sub)}
                className={cn(
                  "px-5 py-2.5 text-xs font-bold rounded-xl border transition-all",
                  selectedSub === sub 
                    ? "bg-primary border-primary text-white shadow-sm" 
                    : "bg-surface-container-low border-surface-container-high text-on-surface"
                )}
              >
                {sub}
              </button>
            ))}
          </div>
        </section>

        {/* Merchant Picker */}
        <section>
          <h3 className="text-sm font-bold text-on-surface mb-4 px-1">المتجر</h3>
          <div className="relative mb-4">
            <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input 
              type="text" 
              placeholder="بحث عن متجر..." 
              className="w-full bg-surface-container-lowest border border-surface-container-high rounded-2xl py-4 pr-12 pl-4 focus:ring-2 focus:ring-primary shadow-sm text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {merchants.length > 0 ? (
              merchants.slice(0, 4).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMerchant(m.id)}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-2xl border transition-all shadow-sm",
                    selectedMerchant === m.id 
                      ? "bg-tertiary-container border-tertiary-container text-on-tertiary-container scale-102" 
                      : "bg-surface-container-lowest border-surface-container-high"
                  )}
                >
                  <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center">
                    <Store size={14} />
                  </div>
                  <span className="text-xs font-bold truncate">{m.name}</span>
                </button>
              ))
            ) : (
                <p className="col-span-2 text-center text-xs text-on-surface-variant font-medium py-4">ابحث لإضافة متجر جديد</p>
            )}
          </div>
        </section>

        <button
          disabled={loading}
          type="submit"
          className="w-full py-6 rounded-3xl bg-primary text-white font-black text-xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {loading ? "جاري الحفظ..." : "حفظ المصروف"}
        </button>
      </form>
    </div>
  );
}
