import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Report, CORRUPTION_TYPES } from "@/types";
import { useNavigate } from "react-router-dom";
import { Loader2, Navigation } from "lucide-react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

function FlyToLocation({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 13);
  }, [lat, lng, map]);
  return null;
}

export default function MapPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [center, setCenter] = useState<[number, number]>([23.8103, 90.4125]);
  const [locating, setLocating] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);

  useEffect(() => {
    const q = query(collection(db, "reports"), where("status", "==", "approved"));
    const unsub = onSnapshot(q, (snap) => {
      setReports(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Report)));
      setLoading(false);
    });
    return unsub;
  }, []);

  const goToMyLocation = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFlyTarget([pos.coords.latitude, pos.coords.longitude]);
        setLocating(false);
      },
      () => setLocating(false)
    );
  };

  const filteredReports = reports.filter((r) => {
    if (filterType === "all") return true;
    return r.corruptionType === filterType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <MapContainer center={center} zoom={7} className="h-full w-full z-0" zoomControl={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {flyTarget && <FlyToLocation lat={flyTarget[0]} lng={flyTarget[1]} />}
        {filteredReports.map((report) =>
          report.location?.lat && report.location?.lng ? (
            <CircleMarker
              key={report.id}
              center={[report.location.lat, report.location.lng]}
              radius={10}
              pathOptions={{
                color: "hsl(var(--primary))",
                fillColor: "hsl(var(--primary))",
                fillOpacity: 0.7,
                weight: 2,
              }}
            >
              <Popup>
                <div className="max-w-[220px] font-sans">
                  <h4 className="font-bold text-[13px] mb-1">{report.corruptionType}</h4>
                  <p className="text-[12px] text-muted-foreground line-clamp-2 mb-1">
                    {report.description}
                  </p>
                  <p className="text-[11px] text-muted-foreground mb-2">
                    📍 {report.location?.address || ""}
                  </p>
                  <button
                    onClick={() => navigate(`/reports/${report.id}`)}
                    className="text-[12px] text-primary font-semibold"
                  >
                    বিস্তারিত দেখুন →
                  </button>
                </div>
              </Popup>
            </CircleMarker>
          ) : null
        )}
      </MapContainer>

      {/* Map Controls Bar */}
      <div className="absolute top-3 left-3 right-3 z-[1000] bg-card rounded-xl px-3 py-2.5 shadow-md flex gap-2 items-center">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="flex-1 border border-input rounded-lg px-2.5 py-1.5 text-[13px] bg-background outline-none"
        >
          <option value="all">সব ধরন</option>
          {CORRUPTION_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <button
          onClick={goToMyLocation}
          disabled={locating}
          className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-[12px] font-semibold whitespace-nowrap disabled:opacity-50"
        >
          {locating ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Navigation size={14} />
          )}
          আমার অবস্থান
        </button>
      </div>
    </div>
  );
}
