import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { db } from "../lib/firebase";
import { collection, query, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { addShoppingItem, deleteShoppingItem } from "../services/firestoreService";
import { ShoppingListItem, ShoppingListType } from "../types";
import { Check, Plus, X, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

const SUGGESTIONS = [
  { name: "مياه معدنية",  sub: "يُشترى كل 3 أيام",     emoji: "💧", list: "DAILY"   as ShoppingListType, price: 25 },
  { name: "بيض طازج",    sub: "أوشك على النفاذ",        emoji: "🥚", list: "WEEKLY"  as ShoppingListType, price: 20 },
  { name: "خبز صامولي",  sub: "ضروري يومياً",           emoji: "🍞", list: "DAILY"   as ShoppingListType, price: 10 },
  { name: "أرز",         sub: "احتياط شهري",            emoji: "🌾", list: "MONTHLY" as ShoppingListType, price: 60 },
];

export default function Shopping() {
  const { family } = useAuth();
  const [activeTab, setActiveTab] = useState<ShoppingListType>("DAILY");
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [showForm, setShowForm] = useState(false);

  // New item form state
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newQty, setNewQty] = useState("1");
  const [newPriority, setNewPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!family?.id) return;
    const q = query(collection(db, "families", family.id, "shoppingItems"));
    return onSnapshot(q, snap => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as ShoppingListItem)));
    });
  }, [family]);

  const toggleItem = async (itemId: string, completed: boolean) => {
    if (!family?.id) return;
    await updateDoc(doc(db, "families", family.id, "shoppingItems", itemId), { completed: !completed });
  };

  const removeItem = async (itemId: string) => {
    if (!family?.id) return;
    await deleteShoppingItem(family.id, itemId);
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!family?.id || !newName.trim()) return;
    setSaving(true);
    try {
      await addShoppingItem(family.id, {
        name: newName.trim(),
        listType: activeTab,
        category: "groceries",
        quantity: parseInt(newQty) || 1,
        estimatedPrice: parseFloat(newPrice) || 0,
        priority: newPriority,
        suggested: false,
        completed: false,
      });
      setNewName(""); setNewPrice(""); setNewQty("1"); setNewPriority("MEDIUM");
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  const addSuggestion = async (s: typeof SUGGESTIONS[0]) => {
    if (!family?.id) return;
    await addShoppingItem(family.id, {
      name: s.name, listType: s.list, category: "groceries",
      quantity: 1, estimatedPrice: s.price, priority: "MEDIUM",
      suggested: true, completed: false,
    });
  };

  const filteredItems = items.filter(i => i.listType === activeTab);
  const totalExpected = filteredItems.reduce((a, i) => a + i.estimatedPrice, 0);
  const completedCount = filteredItems.filter(i => i.completed).length;

  return (
    <div className="px-6 space-y-6 pb-52 animate-in fade-in duration-500">
      <div className="pt-8">
        <h2 className="text-4xl font-black font-headline mb-2">قوائم التسوق</h2>
        <p className="text-on-surface-variant">نظم مشتريات عائلتك بذكاء</p>
      </div>

      {/* Tabs */}
      <div className="flex p-1.5 bg-surface-container-low rounded-2xl">
        {(["DAILY","WEEKLY","MONTHLY"] as ShoppingListType[]).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={cn("flex-1 py-3 text-center rounded-xl font-bold transition-all",
              activeTab === tab ? "bg-surface-container-lowest text-primary shadow-sm scale-[1.02]" : "text-on-surface-variant")}>
            {tab === "DAILY" ? "يومي" : tab === "WEEKLY" ? "أسبوعي" : "شهري"}
          </button>
        ))}
      </div>

      {/* Smart Suggestions */}
      <section>
        <h3 className="text-xl font-bold font-headline mb-4">اقتراحات سريعة</h3>
        <div className="flex gap-4 overflow-x-auto hide-scrollbar -mx-6 px-6 pb-1">
          {SUGGESTIONS.map((s, i) => (
            <div key={i} className="min-w-[150px] p-4 rounded-3xl border bg-surface-container-lowest border-surface-container-high flex flex-col items-center text-center shadow-sm">
              <span className="text-3xl mb-2">{s.emoji}</span>
              <span className="font-bold text-sm">{s.name}</span>
              <span className="text-[10px] text-on-surface-variant mt-1 leading-tight">{s.sub}</span>
              <span className="text-xs text-primary font-bold mt-1">{s.price} ر.س</span>
              <button onClick={() => addSuggestion(s)}
                className="mt-3 px-5 py-1.5 bg-primary rounded-full text-xs font-bold text-white active:scale-95 transition-all">
                إضافة
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* My List */}
      <section>
        <div className="flex justify-between items-center mb-4 px-1">
          <h3 className="text-xl font-bold font-headline">قائمتي</h3>
          <span className="text-xs text-on-surface-variant font-medium">{completedCount} / {filteredItems.length} مكتمل</span>
        </div>

        <div className="space-y-3">
          <AnimatePresence>
            {filteredItems.map(item => (
              <motion.div key={item.id}
                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                className={cn("p-4 rounded-2xl flex items-center gap-4 border shadow-sm",
                  item.completed ? "bg-surface-container-low/50 opacity-60 border-surface-container-high" : "bg-surface-container-lowest border-surface-container-high")}>
                <button onClick={() => toggleItem(item.id, item.completed)}
                  className={cn("w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center transition-all",
                    item.completed ? "bg-primary text-white" : "border-2 border-primary/30")}>
                  {item.completed && <Check size={16} strokeWidth={3} />}
                </button>
                <div className="flex-1">
                  <p className={cn("font-bold text-sm", item.completed && "line-through")}>{item.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-on-surface-variant">{item.estimatedPrice} ر.س</span>
                    <span className={cn("text-[9px] px-2 py-0.5 rounded font-black uppercase",
                      item.priority === "HIGH" ? "bg-error/10 text-error" : "bg-surface-container-high text-on-surface-variant")}>
                      {item.priority === "HIGH" ? "عالي" : item.priority === "MEDIUM" ? "متوسط" : "منخفض"}
                    </span>
                  </div>
                </div>
                <button onClick={() => removeItem(item.id)} className="p-1 text-on-surface-variant/40 hover:text-error transition-colors">
                  <Trash2 size={15} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredItems.length === 0 && !showForm && (
            <div className="text-center py-16 bg-surface-container-low/30 rounded-3xl border-2 border-dashed border-outline-variant/10">
              <p className="text-on-surface-variant font-medium">لا توجد طلبات في هذه القائمة</p>
            </div>
          )}

          {/* Inline Add Form */}
          <AnimatePresence>
            {showForm && (
              <motion.form onSubmit={handleAddItem}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                className="bg-surface-container-lowest border-2 border-primary/20 rounded-3xl p-5 space-y-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm">منتج جديد</span>
                  <button type="button" onClick={() => setShowForm(false)}><X size={18} className="text-on-surface-variant" /></button>
                </div>
                <input required value={newName} onChange={e => setNewName(e.target.value)}
                  placeholder="اسم المنتج"
                  className="w-full bg-surface-container-low border border-surface-container-high rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary" />
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" step="0.01" value={newPrice} onChange={e => setNewPrice(e.target.value)}
                    placeholder="السعر التقديري"
                    className="bg-surface-container-low border border-surface-container-high rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary" />
                  <input type="number" min="1" value={newQty} onChange={e => setNewQty(e.target.value)}
                    placeholder="الكمية"
                    className="bg-surface-container-low border border-surface-container-high rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary" />
                </div>
                <div className="flex gap-2">
                  {(["LOW","MEDIUM","HIGH"] as const).map(p => (
                    <button key={p} type="button" onClick={() => setNewPriority(p)}
                      className={cn("flex-1 py-2 rounded-xl text-xs font-bold border transition-all",
                        newPriority === p ? "bg-primary text-white border-primary" : "border-surface-container-high text-on-surface-variant")}>
                      {p === "HIGH" ? "عالي" : p === "MEDIUM" ? "متوسط" : "منخفض"}
                    </button>
                  ))}
                </div>
                <button type="submit" disabled={saving}
                  className="w-full py-3 bg-primary text-white font-bold rounded-2xl disabled:opacity-50">
                  {saving ? "جاري الإضافة..." : "إضافة للقائمة"}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {!showForm && (
            <button onClick={() => setShowForm(true)}
              className="w-full py-5 bg-surface-container-low border-2 border-dashed border-outline-variant/20 rounded-3xl flex items-center justify-center gap-3 text-on-surface-variant font-bold hover:bg-surface-container-high transition-all active:scale-[0.98]">
              <Plus size={20} /> إضافة منتج جديد
            </button>
          )}
        </div>
      </section>

      {/* Floating Summary */}
      <div className="fixed bottom-28 left-6 right-6 z-40 pointer-events-none">
        <div className="bg-surface/80 backdrop-blur-2xl p-5 rounded-3xl shadow-xl border border-white/40">
          <div className="flex justify-between items-center mb-3">
            <div>
              <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest block mb-1">الإجمالي المتوقع</span>
              <span className="text-2xl font-black font-headline">{totalExpected.toLocaleString()} <small className="text-xs font-medium">ر.س</small></span>
            </div>
            <div>
              <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest block mb-1">التقدم</span>
              <span className="text-sm font-bold text-primary">{completedCount} من {filteredItems.length}</span>
            </div>
          </div>
          <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-l from-primary to-primary-dim rounded-full transition-all duration-700"
              style={{ width: `${(completedCount / (filteredItems.length || 1)) * 100}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
