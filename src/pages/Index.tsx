import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Report } from "@/types";
import ReportCard from "@/components/ReportCard";
import SkeletonCard from "@/components/SkeletonCard";
import { Navigation, Filter } from "lucide-react";
import { toast } from "sonner";

export default function Index() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [nearbyMode, setNearbyMode] = useState(false);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [filterType, setFilterType] = useState("");

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
  if (filterType) {
    filtered = filtered.filter((r) => r.corruptionType === filterType);
  }

  return (
    <div className="p-4 space-y-3 pb-2">
      <div className="flex items-center gap-2">
        <h2 className="text-base font-bold flex-1">সব রিপোর্ট</h2>
        <button
          onClick={handleNearby}
          className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border transition-colors ${
            nearbyMode ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"
          }`}
        >
          <Navigation size={12} />
          কাছাকাছি
        </button>
        <button
          onClick={() => setFilterType(filterType ? "" : "ঘুষ")}
          className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border transition-colors ${
            filterType ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"
          }`}
        >
          <Filter size={12} />
          ফিল্টার
        </button>
      </div>

      {filterType && (
        <div className="flex gap-1.5 flex-wrap">
          {["সরকারি দুর্নীতি", "ঘুষ", "জমি দখল", "পুলিশ দুর্নীতি", "অন্যান্য"].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type === filterType ? "" : type)}
              className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors ${
                type === filterType
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      )}

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
  );
}
