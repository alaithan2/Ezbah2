import React from "react";
import { Home, ReceiptText, ShoppingBasket, BarChart3, MoreHorizontal } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "../../lib/utils";

const NavItem = ({ to, icon: Icon, label, active }: { to: string; icon: any; label: string; active: boolean }) => (
  <Link
    to={to}
    className={cn(
      "flex flex-col items-center gap-1 transition-all",
      active ? "text-primary scale-105" : "text-outline-variant hover:text-on-surface"
    )}
  >
    <div className="w-6 h-6 flex items-center justify-center">
      <Icon size={24} strokeWidth={active ? 2.5 : 2} />
    </div>
    <span className={cn("text-[11px] font-medium", active && "font-bold")}>{label}</span>
  </Link>
);

export const BottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface-container-lowest border-t border-surface-container-high h-20 px-6 flex justify-around items-center z-50 shadow-sm">
      <NavItem to="/" icon={Home} label="الرئيسية" active={location.pathname === "/"} />
      <NavItem to="/expenses" icon={ReceiptText} label="المصاريف" active={location.pathname === "/expenses"} />
      <NavItem to="/shopping" icon={ShoppingBasket} label="التسوق" active={location.pathname === "/shopping"} />
      <NavItem to="/reports" icon={BarChart3} label="التقارير" active={location.pathname === "/reports"} />
      <NavItem to="/more" icon={MoreHorizontal} label="المزيد" active={location.pathname === "/more"} />
    </nav>
  );
};
