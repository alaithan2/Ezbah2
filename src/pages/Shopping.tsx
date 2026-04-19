import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { db } from "../lib/firebase";
import { collection, query, where, onSnapshot, updateDoc, doc, Timestamp, addDoc } from "firebase/firestore";
import { ShoppingListItem, ShoppingListType } from "../types";
import { Check, Plus, Droplets, Egg, Coffee, Filter, GripVertical } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

export default function Shopping() {
  const { family } = useAuth();
  const [activeTab, setActiveTab] = useState<ShoppingListType>("DAILY");
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  useEffect(() => {
    if (!family?.id) return;

    const q = query(collection(db, "families", family.id, "shoppingItems"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ShoppingListItem)));
    });

    return unsubscribe;
  }, [family]);

  useEffect(() => {
    // Basic Rule-based Suggestions (Mocked for MVP)
    setSuggestions([
      { name: "مياه معدنية", icon: Droplets, sub: "يُشترى عادةً كل 3 أيام", color: "tertiary" },
      { name: "بيض طازج", icon: Egg, sub: "أوشك على النفاذ", color: "secondary" },
      { name: "قهوة مختصة", icon: Coffee, sub: "متوفر عرض في بنده", color: "primary" }
    ]);
  }, []);

  const toggleItem = async (itemId: string, completed: boolean) => {
    if (!family?.id) return;
    await updateDoc(doc(db, "families", family.id, "shoppingItems", itemId), { completed: !completed });
  };

  const filteredItems = items.filter(i => i.listType === activeTab);
  const totalExpected = filteredItems.reduce((acc, curr) => acc + curr.estimatedPrice, 0);
  const completedCount = filteredItems.filter(i => i.completed).length;

  return (
    <div className="px-6 space-y-8 animate-in fade-in duration-500">
      <div className="pt-8">
        <h2 className="text-4xl font-black font-headline mb-2">قوائم التسوق</h2>
        <p className="text-on-surface-variant">نظم مشتريات عائلتك بذكاء</p>
      </div>

      {/* Tabs */}
      <div className="flex p-1.5 bg-surface-container-low rounded-2xl">
        {(["DAILY", "WEEKLY", "MONTHLY"] as ShoppingListType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 py-3 text-center rounded-xl font-bold transition-all",
              activeTab === tab ? "bg-surface-container-lowest text-primary shadow-sm scale-[1.02]" : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            {tab === "DAILY" ? "يومي" : tab === "WEEKLY" ? "أسبوعي" : "شهري"}
          </button>
        ))}
      </div>

      {/* Smart Suggestions */}
      <section>
        <div className="flex justify-between items-end mb-4 px-1">
          <h3 className="text-xl font-bold font-headline">اقتراحات ذكية</h3>
          <span className="text-primary text-sm font-medium">عرض الكل</span>
        </div>
        <div className="flex gap-4 overflow-x-auto hide-scrollbar -mx-6 px-6">
          {suggestions.map((s, i) => (
            <div 
              key={i} 
              className={cn(
                "min-w-[160px] p-5 rounded-3xl border flex flex-col items-center text-center",
                s.color === "tertiary" ? "bg-tertiary-container/30 border-tertiary-container/10" :
                s.color === "secondary" ? "bg-secondary-container/30 border-secondary-container/10" :
                "bg-primary-container/30 border-primary-container/10"
              )}
            >
              <div className="w-12 h-12 bg-surface-container-lowest rounded-full flex items-center justify-center mb-3 editorial-shadow">
                <s.icon size={24} className={`text-${s.color}`} />
              </div>
              <span className="font-bold text-on-surface text-sm">{s.name}</span>
              <span className="text-[10px] text-on-surface-variant mt-1 leading-tight">{s.sub}</span>
              <button className={cn(
                "mt-4 px-5 py-1.5 rounded-full text-xs font-bold text-white transition-all active:scale-95",
                `bg-${s.color}`
              )}>إضافة</button>
            </div>
          ))}
        </div>
      </section>

      {/* My List */}
      <section className="pb-12">
        <div className="flex justify-between items-center mb-6 px-1">
          <h3 className="text-xl font-bold font-headline">قائمتي</h3>
          <div className="flex items-center gap-2 text-on-surface-variant bg-surface-container-low px-4 py-2 rounded-full text-xs font-bold">
            <Filter size={14} />
            <span>الأولوية</span>
          </div>
        </div>

        <div className="space-y-4">
          <AnimatePresence>
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={cn(
                  "p-5 rounded-3xl flex items-center gap-4 transition-all editorial-shadow",
                  item.completed ? "bg-surface-container-low/50 opacity-60" : "bg-surface-container-lowest"
                )}
              >
                <button 
                  onClick={() => toggleItem(item.id, item.completed)}
                  className={cn(
                    "w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center transition-all",
                    item.completed ? "bg-primary text-white" : "border-2 border-primary-container"
                  )}
                >
                  {item.completed && <Check size={18} strokeWidth={3} />}
                </button>
                <div className="flex-1">
                  <h4 className={cn("font-bold text-on-surface", item.completed && "line-through")}>{item.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-on-surface-variant">{item.estimatedPrice} ر.س</span>
                    <span className="w-1 h-1 bg-outline-variant/30 rounded-full"></span>
                    <span className={cn(
                      "text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-wider",
                      item.priority === "HIGH" ? "bg-error/10 text-error" : "bg-surface-container-high text-on-surface-variant"
                    )}>{item.priority === "HIGH" ? "عالية" : "عادية"}</span>
                  </div>
                </div>
                <GripVertical size={20} className="text-outline-variant/30" />
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredItems.length === 0 && (
            <div className="text-center py-20 bg-surface-container-low/30 rounded-3xl border-2 border-dashed border-outline-variant/10">
              <p className="text-on-surface-variant font-medium">لا توجد طلبات في هذه القائمة</p>
            </div>
          )}

          <button className="w-full py-5 bg-surface-container-low border-2 border-dashed border-outline-variant/20 rounded-3xl flex items-center justify-center gap-3 text-on-surface-variant font-bold hover:bg-surface-container-high transition-all active:scale-[0.98]">
            <Plus size={20} />
            إضافة منتج جديد
          </button>
        </div>
      </section>

      {/* Floating Summary */}
      <div className="fixed bottom-28 left-6 right-6 z-40">
        <div className="bg-surface/80 backdrop-blur-2xl p-6 rounded-3xl editorial-shadow border border-white/40">
          <div className="flex justify-between items-center mb-4">
            <div>
              <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest block mb-1">الإجمالي المتوقع</span>
              <span className="text-2xl font-black font-headline text-on-surface">{totalExpected} <small className="text-xs font-medium">ر.س</small></span>
            </div>
            <div className="text-left rtl:text-right">
              <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest block mb-1">التقدم</span>
              <span className="text-sm font-bold text-primary">{completedCount} من {filteredItems.length} منتجات</span>
            </div>
          </div>
          <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-l from-primary to-primary-dim rounded-full transition-all duration-1000" 
              style={{ width: `${(completedCount / (filteredItems.length || 1)) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
