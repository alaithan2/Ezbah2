import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getMerchants, createMerchant, deleteMerchant, updateMerchant } from "../services/firestoreService";
import { Merchant } from "../types";
import { ArrowRight, Plus, Trash2, Pencil, Check, X, Store } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { toDate } from "../utils/budgetCycle";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function ManageMerchants() {
  const navigate = useNavigate();
  const { family } = useAuth();
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [newName, setNewName] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = () => {
    if (family?.id) getMerchants(family.id).then(ms =>
      setMerchants(ms.sort((a, b) => (b.stats?.totalPurchases ?? 0) - (a.stats?.totalPurchases ?? 0)))
    );
  };

  useEffect(() => { load(); }, [family]);

  const handleDelete = async (id: string) => {
    if (!family?.id) return;
    if (!confirm("حذف هذا المتجر؟")) return;
    setDeletingId(id);
    try {
      await deleteMerchant(family.id, id);
      setMerchants(prev => prev.filter(m => m.id !== id));
    } finally { setDeletingId(null); }
  };

  const handleEdit = (m: Merchant) => {
    setEditingId(m.id);
    setEditName(m.name);
  };

  const handleSaveEdit = async (id: string) => {
    if (!family?.id || !editName.trim()) return;
    await updateMerchant(family.id, id, editName.trim());
    setMerchants(prev => prev.map(m => m.id === id ? { ...m, name: editName.trim() } : m));
    setEditingId(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!family?.id || !newName.trim()) return;
    setSaving(true);
    try {
      const m = await createMerchant(family.id, newName.trim());
      setMerchants(prev => [m, ...prev]);
      setNewName("");
      setShowNewForm(false);
    } finally { setSaving(false); }
  };

  return (
    <div className="px-6 pb-16 animate-in slide-in-from-right-4 duration-300">
      {/* Header */}
      <div className="flex items-center gap-4 pt-4 mb-8">
        <button onClick={() => navigate("/more")} className="p-2 bg-surface-container-low rounded-xl">
          <ArrowRight size={24} />
        </button>
        <h2 className="text-2xl font-black font-headline">إدارة المتاجر</h2>
      </div>

      {/* Stats summary */}
      {merchants.length > 0 && (
        <div className="flex gap-3 mb-6">
          <div className="flex-1 bg-surface-container-lowest border border-surface-container-high rounded-2xl p-4 text-center shadow-sm">
            <p className="text-2xl font-black text-primary">{merchants.length}</p>
            <p className="text-xs text-on-surface-variant mt-1">متجر مسجّل</p>
          </div>
          <div className="flex-1 bg-surface-container-lowest border border-surface-container-high rounded-2xl p-4 text-center shadow-sm">
            <p className="text-2xl font-black text-on-surface">
              {merchants.reduce((s, m) => s + (m.stats?.totalPurchases ?? 0), 0)}
            </p>
            <p className="text-xs text-on-surface-variant mt-1">إجمالي الزيارات</p>
          </div>
          <div className="flex-1 bg-surface-container-lowest border border-surface-container-high rounded-2xl p-4 text-center shadow-sm">
            <p className="text-lg font-black text-error">
              {merchants.reduce((s, m) => s + (m.stats?.totalSpent ?? 0), 0).toLocaleString()}
            </p>
            <p className="text-xs text-on-surface-variant mt-1">ر.س مُنفق</p>
          </div>
        </div>
      )}

      {/* Merchants List */}
      <div className="space-y-3">
        <AnimatePresence>
          {merchants.map(m => (
            <motion.div key={m.id} layout
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface-container-lowest border border-surface-container-high rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Store size={18} className="text-primary" />
                </div>

                {editingId === m.id ? (
                  <input autoFocus value={editName} onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSaveEdit(m.id)}
                    className="flex-1 bg-surface-container-low border border-primary rounded-xl py-1.5 px-3 text-sm focus:ring-2 focus:ring-primary" />
                ) : (
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm">{m.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {(m.stats?.totalPurchases ?? 0) > 0 && (
                        <>
                          <span className="text-[10px] text-on-surface-variant">
                            {m.stats!.totalPurchases} زيارة
                          </span>
                          <span className="text-[10px] text-error font-bold">
                            {m.stats!.totalSpent.toLocaleString()} ر.س
                          </span>
                        </>
                      )}
                      {m.stats?.lastPurchaseDate && (m.stats.totalPurchases ?? 0) > 0 && (
                        <span className="text-[10px] text-on-surface-variant">
                          آخر زيارة: {format(toDate(m.stats.lastPurchaseDate), "d MMM", { locale: ar })}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-1">
                  {editingId === m.id ? (
                    <>
                      <button onClick={() => handleSaveEdit(m.id)}
                        className="p-2 bg-primary text-white rounded-xl active:scale-90 transition-all">
                        <Check size={15} />
                      </button>
                      <button onClick={() => setEditingId(null)}
                        className="p-2 text-on-surface-variant bg-surface-container rounded-xl">
                        <X size={15} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleEdit(m)}
                        className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-xl transition-all">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleDelete(m.id)} disabled={deletingId === m.id}
                        className={cn("p-2 text-on-surface-variant/40 hover:text-error hover:bg-error/10 rounded-xl transition-all",
                          deletingId === m.id && "opacity-30 pointer-events-none")}>
                        <Trash2 size={15} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* New Merchant Form */}
        <AnimatePresence>
          {showNewForm && (
            <motion.form onSubmit={handleCreate}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
              className="bg-surface-container-lowest border-2 border-primary/20 rounded-2xl p-4 flex gap-3">
              <input autoFocus required value={newName} onChange={e => setNewName(e.target.value)}
                placeholder="اسم المتجر (مثال: العثيم)"
                className="flex-1 bg-surface-container-low border border-surface-container-high rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary" />
              <button type="submit" disabled={saving}
                className="px-4 bg-primary text-white rounded-xl font-bold text-sm disabled:opacity-50 active:scale-95 transition-all">
                <Check size={18} />
              </button>
              <button type="button" onClick={() => { setShowNewForm(false); setNewName(""); }}
                className="px-3 bg-surface-container text-on-surface-variant rounded-xl">
                <X size={18} />
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {!showNewForm && (
          <button onClick={() => setShowNewForm(true)}
            className="w-full py-5 bg-surface-container-low border-2 border-dashed border-outline-variant/20 rounded-3xl flex items-center justify-center gap-3 text-on-surface-variant font-bold hover:bg-surface-container-high transition-all active:scale-[0.98]">
            <Plus size={20} /> إضافة متجر جديد
          </button>
        )}

        {merchants.length === 0 && !showNewForm && (
          <p className="text-center text-on-surface-variant text-sm py-8">لا توجد متاجر مسجّلة بعد</p>
        )}
      </div>
    </div>
  );
}
