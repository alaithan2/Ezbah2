import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { seedSampleData } from "../utils/seedData";
import { doc, updateDoc, collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { LogOut, Database, UserCheck, Shield } from "lucide-react";
import { motion } from "motion/react";

export default function More() {
  const { user, family, logout } = useAuth();
  const [seeding, setSeeding] = useState(false);

  const handleCreateFamily = async () => {
    if (!user) return;
    try {
      setSeeding(true); // Reusing seeding state as a generic loading state
      const famRef = await addDoc(collection(db, "families"), {
        name: `عائلة ${user.displayName || "الجديدة"}`,
        createdBy: user.uid,
        createdAt: Timestamp.now(),
        members: [user.uid]
      });
      
      await updateDoc(doc(db, "users", user.uid), {
        familyId: famRef.id
      });
      
      // Force a soft reload of the page to re-trigger AuthProvider logic
      window.location.href = "/";
    } catch (err) {
      console.error("Family creation failed", err);
      alert("عذراً، فشل إنشاء العائلة. يرجى المحاولة مرة أخرى.");
    } finally {
      setSeeding(false);
    }
  };

  const handleSeed = async () => {
    if (!family?.id || !user?.uid) return;
    setSeeding(true);
    await seedSampleData(family.id, user.uid);
    setSeeding(false);
    alert("تم إضافة البيانات التجريبية بنجاح!");
  };

  return (
    <div className="px-6 space-y-8 animate-in fade-in duration-500">
      <div className="pt-8">
        <h2 className="text-4xl font-black font-headline mb-2">المزيد</h2>
        <p className="text-on-surface-variant">إعدادات الحساب والعائلة</p>
      </div>

      {/* Profile Section */}
      <section className="bg-surface-container-low p-6 rounded-3xl editorial-shadow flex items-center gap-4">
        <img src={user?.photoURL || `https://picsum.photos/seed/${user?.uid}/100/100`} className="w-16 h-16 rounded-full" alt="Profile" referrerPolicy="no-referrer" />
        <div>
          <h3 className="font-bold text-lg">{user?.displayName}</h3>
          <p className="text-xs text-on-surface-variant">{user?.email}</p>
        </div>
      </section>

      {/* Family Section */}
      <section className="space-y-4">
        <h3 className="text-sm font-bold text-on-surface px-1">إعدادات العائلة</h3>
        {!family ? (
          <button 
            onClick={handleCreateFamily}
            className="w-full p-6 bg-primary/10 text-primary font-bold rounded-3xl flex items-center justify-between group"
          >
            <span>إنشاء محفظة عائلية</span>
            <UserCheck className="group-hover:scale-110 transition-transform" />
          </button>
        ) : (
          <div className="p-6 bg-surface-container-low rounded-3xl flex items-center justify-between">
            <div>
              <p className="text-xs text-on-surface-variant mb-1">اسم العائلة</p>
              <p className="font-bold text-lg">{family.name}</p>
            </div>
            <Shield className="text-primary" />
          </div>
        )}
      </section>

      {/* Dev Utils */}
      {family && (
        <section className="space-y-4">
          <h3 className="text-sm font-bold text-on-surface px-1">أدوات التطوير</h3>
          <button 
            onClick={handleSeed}
            disabled={seeding}
            className="w-full p-6 bg-secondary-container text-on-secondary-container font-bold rounded-3xl flex items-center justify-between disabled:opacity-50"
          >
            <span>{seeding ? "جاري البيانات..." : "تجهيز بيانات تجريبية (Seed)"}</span>
            <Database />
          </button>
        </section>
      )}

      {/* Logout */}
      <button 
        onClick={() => logout()}
        className="w-full p-6 text-error font-bold bg-error/10 rounded-3xl flex items-center justify-between"
      >
        <span>تسجيل الخروج</span>
        <LogOut />
      </button>

      <p className="text-center text-[10px] text-on-surface-variant/30 pt-12">ezbah app v2.0.4</p>
    </div>
  );
}
