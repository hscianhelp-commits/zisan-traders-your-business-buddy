import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Report } from "@/types";
import SkeletonCard from "@/components/SkeletonCard";
import ImageCarousel from "@/components/ImageCarousel";
import { MapPin, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";

const STATUS_TABS = [
  { key: "all", label: "সব" },
  { key: "pending", label: "অপেক্ষমাণ" },
  { key: "approved", label: "অনুমোদিত" },
  { key: "rejected", label: "প্রত্যাখ্যাত" },
] as const;

const statusLabels: Record<string, string> = {
  pending: "অপেক্ষমাণ",
  approved: "অনুমোদিত",
  rejected: "প্রত্যাখ্যাত",
};

const statusStyles: Record<string, string> = {
  pending: "bg-[hsl(45,93%,90%)] text-[hsl(30,100%,35%)]",
  approved: "bg-[hsl(142,71%,90%)] text-[hsl(142,71%,30%)]",
  rejected: "bg-[hsl(0,84%,92%)] text-[hsl(0,84%,35%)]",
};

export default function MyReportsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, "reports"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setReports(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Report)));
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const handleDelete = async (e: React.MouseEvent, reportId: string) => {
    e.stopPropagation();
    if (!confirm("রিপোর্টটি মুছে ফেলতে চান?")) return;
    await deleteDoc(doc(db, "reports", reportId));
    toast.success("রিপোর্ট মুছে ফেলা হয়েছে");
  };

  const filtered = reports.filter((r) => activeTab === "all" || r.status === activeTab);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <svg width="64" height="64" fill="none" viewBox="0 0 24 24" className="text-muted-foreground/40 mb-4">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.5" />
          <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <p className="text-lg font-bold mb-2">আমার রিপোর্টসমূহ</p>
        <p className="text-sm text-muted-foreground mb-6">রিপোর্ট ট্র্যাক করতে লগইন করুন</p>
        <button
          onClick={() => navigate("/login")}
          className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-bold text-base"
        >
          লগইন করুন
        </button>
      </div>
    );
  }

  return (
    <div className="pb-2">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4">
        <h2 className="text-lg font-bold">আমার রিপোর্টসমূহ</h2>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-1.5 px-4 pb-3 overflow-x-auto scrollbar-hide">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? "bg-primary border-primary text-primary-foreground"
                : "bg-card border-border text-muted-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="px-4 space-y-3">
          {[1, 2].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <svg width="64" height="64" fill="none" viewBox="0 0 24 24" className="text-border mb-4">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <p className="text-base font-semibold text-muted-foreground">কোনো রিপোর্ট নেই</p>
        </div>
      ) : (
        <div className="space-y-3 px-4">
          {filtered.map((report) => {
            const date = report.createdAt?.toDate
              ? report.createdAt.toDate().toLocaleDateString("bn-BD")
              : "";
            return (
              <div
                key={report.id}
                onClick={() => navigate(`/reports/${report.id}`)}
                className="bg-card rounded-2xl shadow-sm overflow-hidden border border-border cursor-pointer active:scale-[0.98] transition-transform"
              >
                {/* Card Header */}
                <div className="p-3 pb-2 flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold">{report.corruptionType || "অন্যান্য"}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{date}</p>
                    <p className="text-[13px] text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                      {report.description}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ml-2 ${
                      statusStyles[report.status] || ""
                    }`}
                  >
                    {statusLabels[report.status]}
                  </span>
                </div>

                {/* Evidence */}
                {report.evidenceBase64?.length > 0 && (
                  <div onClick={(e) => e.stopPropagation()}>
                    <ImageCarousel images={report.evidenceBase64} />
                  </div>
                )}

                {/* Location */}
                {report.location?.address && (
                  <div className="flex items-center gap-1 px-3 py-1.5 text-[11px] text-muted-foreground">
                    <MapPin size={12} className="text-primary shrink-0" />
                    <span className="truncate">{report.location.address}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 px-3 pb-3" onClick={(e) => e.stopPropagation()}>
                  {report.status === "pending" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Could open edit modal
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-muted text-foreground text-[13px] font-semibold"
                    >
                      <Edit2 size={14} />
                      সম্পাদনা
                    </button>
                  )}
                  <button
                    onClick={(e) => handleDelete(e, report.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-destructive/10 text-destructive text-[13px] font-semibold"
                  >
                    <Trash2 size={14} />
                    মুছুন
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
