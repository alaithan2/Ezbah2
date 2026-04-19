import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getCategories, createCategory, updateCategory, deleteCategory } from "../services/firestoreService";
import { Category } from "../types";
import { ArrowRight, Plus, Trash2, ChevronDown, ChevronUp, X, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

const getCatEmoji = (cat: Category) => cat.icon.length <= 4 ? cat.icon : "💸";

export default function ManageCategories() {
  const navigate = useNavigate();
  const { family } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showNewCatForm, setShowNewCatForm] = useState(false);

  // New sub-item state per category
  const [subInputs, setSubInputs] = useState<Record<string, string>>({});

  // New category form
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("💸");
  const [newSubs, setNewSubs] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    if (family?.id) getCategories(family.id).then(setCategories);
  };

  useEffect(() => { load(); }, [family]);

  const handleAddSubItem = async (cat: Category) => {
    const val = subInputs[cat.id]?.trim();
    if (!val || !family?.id) return;
    const updated = [...cat.subItems, val];
    await updateCategory(family.id, cat.id, { subItems: updated });
    setSubInputs(prev => ({ ...prev, [cat.id]: "" }));
    setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, subItems: updated } : c));
  };

  const handleRemoveSubItem = async (cat: Category, sub: string) => {
    if (!family?.id) return;
    const updated = cat.subItems.filter(s => s !== sub);
    await updateCategory(family.id, cat.id, { subItems: updated });
    setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, subItems: updated } : c));
  };

  const handleDeleteCategory = async (catId: string) => {
    if (!family?.id) return;
    if (!confirm("حذف هذه الفئة؟ لن تُحذف المصاريف المرتبطة بها.")) return;
    await deleteCategory(family.id, catId);
    setCategories(prev => prev.filter(c => c.id !== catId));
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!family?.id || !newName.trim()) return;
    setSaving(true);
    try {
      const subItems = newSubs.split("،").map(s => s.trim()).filter(Boolean);
      await createCategory(family.id, {
        familyId: family.id,
        name: newName.trim(),
        icon: newEmoji.trim() || "💸",
        subItems,
      });
      setNewName(""); setNewEmoji("💸"); setNewSubs("");
      setShowNewCatForm(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-6 pb-16 animate-in slide-in-from-right-4 duration-300">
      {/* Header */}
      <div className="flex items-center gap-4 pt-4 mb-8">
        <button onClick={() => navigate("/more")} className="p-2 bg-surface-container-low rounded-xl">
          <ArrowRight size={24} />
        </button>
        <h2 className="text-2xl font-black font-headline">إدارة الفئات</h2>
      </div>

      {/* Category List */}
      <div className="space-y-3">
        <AnimatePresence>
          {categories.map(cat => (
            <motion.div key={cat.id} layout
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="bg-surface-container-lowest border border-surface-container-high rounded-3xl overflow-hidden shadow-sm">

              {/* Category Header */}
              <div className="flex items-center gap-3 p-4">
                <span className="text-2xl w-10 text-center">{getCatEmoji(cat)}</span>
                <span className="font-bold text-on-surface flex-1">{cat.name}</span>
                <span className="text-xs text-on-surface-variant bg-surface-container px-2 py-1 rounded-full">
                  {cat.subItems.length} صنف
                </span>
                <button onClick={() => handleDeleteCategory(cat.id)}
                  className="p-1.5 text-on-surface-variant/40 hover:text-error hover:bg-error/10 rounded-lg transition-all">
                  <Trash2 size={15} />
                </button>
                <button onClick={() => setExpandedId(expandedId === cat.id ? null : cat.id)}
                  className="p-1.5 text-on-surface-variant bg-surface-container rounded-lg">
                  {expandedId === cat.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              {/* Sub-items */}
              <AnimatePresence>
                {expandedId === cat.id && (
                  <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                    className="overflow-hidden border-t border-surface-container-high">
                    <div className="p-4 space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {cat.subItems.map(sub => (
                          <span key={sub}
                            className="flex items-center gap-1.5 bg-surface-container px-3 py-1.5 rounded-xl text-sm font-medium">
                            {sub}
                            <button onClick={() => handleRemoveSubItem(cat, sub)}
                              className="text-on-surface-variant/50 hover:text-error transition-colors">
                              <X size={13} />
                            </button>
                          </span>
                        ))}
                      </div>

                      {/* Add sub-item */}
                      <div className="flex gap-2">
                        <input
                          value={subInputs[cat.id] ?? ""}
                          onChange={e => setSubInputs(prev => ({ ...prev, [cat.id]: e.target.value }))}
                          onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleAddSubItem(cat))}
                          placeholder="اسم الصنف الجديد..."
                          className="flex-1 bg-surface-container-low border border-surface-container-high rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-primary"
                        />
                        <button onClick={() => handleAddSubItem(cat)}
                          className="px-4 py-2.5 bg-primary text-white rounded-xl font-bold text-sm active:scale-95 transition-all">
                          <Plus size={18} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* New Category Form */}
        <AnimatePresence>
          {showNewCatForm && (
            <motion.form onSubmit={handleCreateCategory}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
              className="bg-surface-container-lowest border-2 border-primary/20 rounded-3xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-bold">فئة جديدة</span>
                <button type="button" onClick={() => setShowNewCatForm(false)}>
                  <X size={18} className="text-on-surface-variant" />
                </button>
              </div>

              <div className="flex gap-3">
                <input value={newEmoji} onChange={e => setNewEmoji(e.target.value)}
                  placeholder="🎯" maxLength={4}
                  className="w-16 text-center text-2xl bg-surface-container-low border border-surface-container-high rounded-2xl py-3 focus:ring-2 focus:ring-primary" />
                <input required value={newName} onChange={e => setNewName(e.target.value)}
                  placeholder="اسم الفئة (مثال: رياضة)"
                  className="flex-1 bg-surface-container-low border border-surface-container-high rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary" />
              </div>

              <div>
                <label className="text-xs text-on-surface-variant font-bold block mb-1.5">
                  الأصناف (افصل بينها بفاصلة عربية ،)
                </label>
                <input value={newSubs} onChange={e => setNewSubs(e.target.value)}
                  placeholder="مثال: بروتين، أحذية رياضية، كرة"
                  className="w-full bg-surface-container-low border border-surface-container-high rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary" />
              </div>

              <button type="submit" disabled={saving}
                className="w-full py-3.5 bg-primary text-white font-bold rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-all">
                <Check size={18} />
                {saving ? "جاري الحفظ..." : "إضافة الفئة"}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {!showNewCatForm && (
          <button onClick={() => setShowNewCatForm(true)}
            className="w-full py-5 bg-surface-container-low border-2 border-dashed border-outline-variant/20 rounded-3xl flex items-center justify-center gap-3 text-on-surface-variant font-bold hover:bg-surface-container-high transition-all active:scale-[0.98]">
            <Plus size={20} /> إضافة فئة جديدة
          </button>
        )}
      </div>
    </div>
  );
}
