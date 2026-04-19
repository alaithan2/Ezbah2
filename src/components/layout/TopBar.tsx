import React from "react";
import { Bell } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

export const TopBar = ({ title }: { title?: string }) => {
  const { user } = useAuth();

  return (
    <header className="bg-surface-container-lowest border-b border-surface-container-high px-6 py-4 flex justify-between items-center shadow-sm sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xl">ع</div>
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-on-surface">{title || "العزبة"}</h1>
          <span className="text-[10px] bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded border border-surface-container-high w-fit">بيت العائلة</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button className="text-on-surface-variant hover:text-primary transition-all">
          <Bell size={20} />
        </button>
        <div className="w-10 h-10 rounded-full bg-surface-container border-2 border-surface-container-lowest shadow-sm overflow-hidden">
          <img 
            src={user?.photoURL || `https://picsum.photos/seed/${user?.uid}/100/100`} 
            alt="User Profile"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </header>
  );
};
