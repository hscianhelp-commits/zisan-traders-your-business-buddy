import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Report } from "@/types";
import { useNavigate } from "react-router-dom";
import { Loader2, Crosshair } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
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
        setCenter([pos.coords.latitude, pos.coords.longitude]);
        setLocating(false);
      },
      () => setLocating(false)
    );
  };

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
        <FlyToLocation lat={center[0]} lng={center[1]} />
        {reports.map((report) =>
          report.location?.lat && report.location?.lng ? (
            <Marker key={report.id} position={[report.location.lat, report.location.lng]}>
              <Popup>
                <div className="max-w-[200px]">
                  <p className="font-semibold text-xs mb-1">{report.corruptionType}</p>
                  <p className="text-[11px] line-clamp-2 mb-2">{report.description}</p>
                  <button
                    onClick={() => navigate(`/reports/${report.id}`)}
                    className="text-[11px] text-primary font-semibold"
                  >
                    বিস্তারিত দেখুন →
                  </button>
                </div>
              </Popup>
            </Marker>
          ) : null
        )}
      </MapContainer>

      <button
        onClick={goToMyLocation}
        disabled={locating}
        className="absolute bottom-4 right-4 z-[1000] bg-card shadow-lg border border-border rounded-full p-3"
      >
        {locating ? <Loader2 size={20} className="animate-spin text-primary" /> : <Crosshair size={20} className="text-primary" />}
      </button>
    </div>
  );
}
