import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Report, CORRUPTION_TYPES } from "@/types";
import ReportCard from "@/components/ReportCard";
import SkeletonCard from "@/components/SkeletonCard";
import { Navigation } from "lucide-react";
import { toast } from "sonner";

export default function Index() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [nearbyMode, setNearbyMode] = useState(false);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    const q = query(
      collection(db, "reports"),
      where("status", "==", "approved")
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Report));
      data.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
      });
      setReports(data);
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, []);

  const handleNearby = () => {
    if (nearbyMode) {
      setNearbyMode(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLat(pos.coords.latitude);
        setUserLng(pos.coords.longitude);
        setNearbyMode(true);
        toast.success("আপনার কাছের রিপোর্ট দেখাচ্ছে");
      },
      () => toast.error("লোকেশন পাওয়া যায়নি")
    );
  };

  const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  let filtered = reports;
  if (nearbyMode && userLat && userLng) {
    filtered = filtered
      .filter((r) => r.location && getDistance(userLat, userLng, r.location.lat, r.location.lng) < 50)
      .sort(
        (a, b) =>
          getDistance(userLat, userLng, a.location.lat, a.location.lng) -
          getDistance(userLat, userLng, b.location.lat, b.location.lng)
      );
  }
  if (filterType !== "all") {
    filtered = filtered.filter((r) => r.corruptionType === filterType);
  }

  return (
    <div className="pb-2">
      {/* Always-open filter bar like index.html */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-3 py-2.5 flex items-center gap-2 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setFilterType("all")}
          className={`text-[12px] px-3 py-1.5 rounded-full border font-medium whitespace-nowrap transition-colors ${
            filterType === "all"
              ? "bg-primary border-primary text-primary-foreground"
              : "border-border text-muted-foreground bg-card"
          }`}
        >
          সব
        </button>
        {CORRUPTION_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type === filterType ? "all" : type)}
            className={`text-[12px] px-3 py-1.5 rounded-full border font-medium whitespace-nowrap transition-colors ${
              type === filterType
                ? "bg-primary border-primary text-primary-foreground"
                : "border-border text-muted-foreground bg-card"
            }`}
          >
            {type}
          </button>
        ))}
        <button
          onClick={handleNearby}
          className={`flex items-center gap-1 text-[12px] px-3 py-1.5 rounded-full font-semibold whitespace-nowrap ml-auto shrink-0 ${
            nearbyMode
              ? "bg-primary text-primary-foreground"
              : "bg-primary text-primary-foreground"
          }`}
        >
          <Navigation size={12} />
          নিকটবর্তী
        </button>
      </div>

      <div className="p-4 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg">কোনো রিপোর্ট পাওয়া যায়নি</p>
            <p className="text-sm mt-1">প্রথম রিপোর্ট জমা দিন!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
