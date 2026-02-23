import { useState, useRef, ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, FilePlus, MapPin, FileText, LogIn, LogOut, Loader2 } from "lucide-react";
import { useIPAddress } from "@/hooks/useIPAddress";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const tabs = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/report", icon: FilePlus, label: "Report" },
  { path: "/map", icon: MapPin, label: "Map" },
  { path: "/my-reports", icon: FileText, label: "My Reports" },
];

export default function Layout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { ip, locationInfo, loading: ipLoading } = useIPAddress();
  const { user, signOut } = useAuth();
  const [showLocation, setShowLocation] = useState(false);
  const [exactLocation, setExactLocation] = useState("");
  const [locatingGps, setLocatingGps] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const currentTabIndex = tabs.findIndex((t) => t.path === location.pathname);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > 80 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0 && currentTabIndex < tabs.length - 1) {
        navigate(tabs[currentTabIndex + 1].path);
      } else if (dx > 0 && currentTabIndex > 0) {
        navigate(tabs[currentTabIndex - 1].path);
      }
    }
  };

  const isTabPage = tabs.some((t) => t.path === location.pathname);

  if (!isTabPage) {
    return <div className="fixed inset-0 flex flex-col bg-background">{children}</div>;
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      <header className="flex items-center justify-between px-4 h-14 bg-topbar text-topbar-foreground shrink-0 z-50">
        <h1 className="text-lg font-bold tracking-tight">Corruption Alart</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (!showLocation) {
                setLocatingGps(true);
                navigator.geolocation.getCurrentPosition(
                  (pos) => {
                    const { latitude, longitude } = pos.coords;
                    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=bn`)
                      .then((r) => r.json())
                      .then((data) => {
                        setExactLocation(data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
                        setShowLocation(true);
                        setLocatingGps(false);
                      })
                      .catch(() => {
                        setExactLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
                        setShowLocation(true);
                        setLocatingGps(false);
                      });
                  },
                  () => {
                    toast.error("লোকেশন পারমিশন দেওয়া হয়নি");
                    setLocatingGps(false);
                  }
                );
              } else {
                setShowLocation(false);
              }
            }}
            className="text-[10px] bg-topbar-foreground/15 px-2 py-1 rounded-full font-mono flex items-center gap-1"
          >
            {locatingGps ? <Loader2 size={10} className="animate-spin" /> : null}
            {ipLoading ? "..." : ip}
          </button>
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

      {showLocation && exactLocation && (
        <div className="bg-topbar/90 text-topbar-foreground px-4 py-2 text-xs shrink-0 z-40">
          📍 {exactLocation}
        </div>
      )}

      <main
        className="flex-1 overflow-y-auto overscroll-contain"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
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
                active
                  ? "text-primary scale-105"
                  : "text-muted-foreground"
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
