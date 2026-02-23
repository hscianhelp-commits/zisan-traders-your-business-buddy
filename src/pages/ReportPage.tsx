import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { CORRUPTION_TYPES } from "@/types";
import { Camera, Link as LinkIcon, MapPin, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";

export default function ReportPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [description, setDescription] = useState("");
  const [corruptionType, setCorruptionType] = useState("");
  const [base64Images, setBase64Images] = useState<string[]>([]);
  const [links, setLinks] = useState<string[]>([]);
  const [linkInput, setLinkInput] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <p className="text-lg font-semibold mb-2">লগইন প্রয়োজন</p>
        <p className="text-sm text-muted-foreground mb-4">রিপোর্ট জমা দিতে আপনাকে লগইন করতে হবে</p>
        <button
          onClick={() => navigate("/login")}
          className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium"
        >
          লগইন করুন
        </button>
      </div>
    );
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (file.size > 500000) {
        toast.error("ছবির সাইজ ৫০০KB এর বেশি হতে পারবে না");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => setBase64Images((prev) => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const addLink = () => {
    if (linkInput.trim()) {
      setLinks((prev) => [...prev, linkInput.trim()]);
      setLinkInput("");
    }
  };

  const detectLocation = () => {
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&accept-language=bn`
        )
          .then((r) => r.json())
          .then((data) => setAddress(data.display_name || ""))
          .catch(() => setAddress(`${pos.coords.latitude}, ${pos.coords.longitude}`))
          .finally(() => setDetectingLocation(false));
      },
      () => {
        toast.error("লোকেশন পাওয়া যায়নি");
        setDetectingLocation(false);
      }
    );
  };

  const handleSubmit = async () => {
    if (!description.trim()) return toast.error("বিবরণ লিখুন");
    if (!corruptionType) return toast.error("দুর্নীতির ধরন নির্বাচন করুন");
    if (base64Images.length === 0 && links.length === 0)
      return toast.error("অন্তত একটি প্রমাণ যোগ করুন");
    if (!lat || !lng) return toast.error("অবস্থান নির্বাচন করুন");

    setSubmitting(true);
    try {
      await addDoc(collection(db, "reports"), {
        userId: user.uid,
        description: description.trim(),
        corruptionType,
        location: { lat, lng, address },
        evidenceBase64: base64Images,
        evidenceLinks: links,
        status: "pending",
        votes: { true: 0, suspicious: 0, needEvidence: 0 },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success("রিপোর্ট সফলভাবে জমা হয়েছে!");
      navigate("/my-reports");
    } catch {
      toast.error("রিপোর্ট জমা দিতে সমস্যা হয়েছে");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 space-y-4 pb-8">
      <h2 className="text-base font-bold">নতুন রিপোর্ট</h2>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-muted-foreground">দুর্নীতির ধরন *</label>
        <select
          value={corruptionType}
          onChange={(e) => setCorruptionType(e.target.value)}
          className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-card"
        >
          <option value="">নির্বাচন করুন</option>
          {CORRUPTION_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-muted-foreground">বিবরণ *</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="দুর্নীতির বিস্তারিত বিবরণ লিখুন..."
          className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-card resize-none"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground">প্রমাণ (ছবি/লিংক) *</label>

        <label className="flex items-center gap-2 bg-card border border-input rounded-lg px-3 py-2.5 text-sm cursor-pointer text-muted-foreground">
          <Camera size={16} />
          <span>ছবি আপলোড করুন (সর্বোচ্চ ৫০০KB)</span>
          <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
        </label>

        {base64Images.length > 0 && (
          <div className="flex gap-2 overflow-x-auto">
            {base64Images.map((img, i) => (
              <div key={i} className="relative shrink-0">
                <img src={img} alt="" className="w-20 h-20 object-cover rounded-lg pointer-events-none" />
                <button
                  onClick={() => setBase64Images((prev) => prev.filter((_, j) => j !== i))}
                  className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            placeholder="প্রমাণের লিংক দিন"
            className="flex-1 border border-input rounded-lg px-3 py-2.5 text-sm bg-card"
            onKeyDown={(e) => e.key === "Enter" && addLink()}
          />
          <button onClick={addLink} className="bg-secondary text-secondary-foreground px-3 rounded-lg">
            <Plus size={16} />
          </button>
        </div>

        {links.map((link, i) => (
          <div key={i} className="flex items-center gap-2 text-xs bg-muted rounded-lg px-3 py-2">
            <LinkIcon size={12} />
            <span className="truncate flex-1">{link}</span>
            <button onClick={() => setLinks((prev) => prev.filter((_, j) => j !== i))} className="text-destructive">
              <X size={12} />
            </button>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground">অবস্থান *</label>
        <button
          onClick={detectLocation}
          disabled={detectingLocation}
          className="flex items-center gap-2 w-full bg-card border border-input rounded-lg px-3 py-2.5 text-sm"
        >
          {detectingLocation ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
          <span className="text-muted-foreground">
            {address || "স্বয়ংক্রিয়ভাবে লোকেশন সনাক্ত করুন"}
          </span>
        </button>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="অথবা ঠিকানা লিখুন"
          className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-card"
        />
        {!lat && address && (
          <button
            onClick={async () => {
              try {
                const res = await fetch(
                  `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`
                );
                const data = await res.json();
                if (data[0]) {
                  setLat(parseFloat(data[0].lat));
                  setLng(parseFloat(data[0].lon));
                  toast.success("অবস্থান পাওয়া গেছে");
                } else {
                  toast.error("অবস্থান খুঁজে পাওয়া যায়নি");
                }
              } catch {
                toast.error("অবস্থান খোঁজায় সমস্যা");
              }
            }}
            className="text-xs text-primary font-medium"
          >
            📍 ঠিকানা থেকে অবস্থান খুঁজুন
          </button>
        )}
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {submitting && <Loader2 size={16} className="animate-spin" />}
        রিপোর্ট জমা দিন
      </button>
    </div>
  );
}
