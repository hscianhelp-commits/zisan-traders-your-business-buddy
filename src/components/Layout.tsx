import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, FilePlus, MapPin, FileText, LogIn, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const tabs = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/report", icon: FilePlus, label: "Report" },
  { path: "/map", icon: MapPin, label: "Map" },
  { path: "/my-reports", icon: FileText, label: "My Reports" },
];

export default function Layout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();

  const isTabPage = tabs.some((t) => t.path === location.pathname);

  if (!isTabPage) {
    return <div className="fixed inset-0 flex flex-col bg-background">{children}</div>;
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      <header className="flex items-center justify-between px-4 h-14 bg-topbar text-topbar-foreground shrink-0 z-50">
        <h1 className="text-lg font-bold tracking-tight">Corruption Alert</h1>
        <div className="flex items-center gap-2">
          {user ? (
            <button onClick={signOut} className="p-1.5 rounded-full bg-topbar-foreground/15">
              <LogOut size={14} />
            </button>
          ) : (
            <button onClick={() => navigate("/login")} className="p-1.5 rounded-full bg-topbar-foreground/15">
              <LogIn size={14} />
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto overscroll-contain">
        {children}
      </main>

      <nav className="flex items-center justify-around h-16 bg-card border-t border-border shrink-0 z-50">
        {tabs.map((tab) => {
          const active = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
                active ? "text-primary scale-105" : "text-muted-foreground"
              }`}
            >
              <tab.icon size={20} strokeWidth={active ? 2.5 : 1.5} />
              <span className="text-[10px] font-semibold">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
