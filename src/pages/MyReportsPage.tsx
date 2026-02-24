import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Report } from "@/types";
import SkeletonCard from "@/components/SkeletonCard";
import ImageCarousel from "@/components/ImageCarousel";
import { MapPin, Edit2, Trash2, X, Plus, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
] as const;

const statusLabels: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
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
  const [editingEvidence, setEditingEvidence] = useState<string | null>(null);
  const [editLinks, setEditLinks] = useState<string[]>([]);
  const [editBase64, setEditBase64] = useState<string[]>([]);
  const [newLinkInput, setNewLinkInput] = useState("");

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const q = query(collection(db, "reports"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
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
    toast.success("Report deleted");
  };

  const startEditEvidence = (e: React.MouseEvent, report: Report) => {
    e.stopPropagation();
    setEditingEvidence(report.id);
    setEditLinks([...(report.evidenceLinks || [])]);
    setEditBase64([...(report.evidenceBase64 || [])]);
    setNewLinkInput("");
  };

  const saveEvidence = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editingEvidence) return;
    try {
      await updateDoc(doc(db, "reports", editingEvidence), {
        evidenceLinks: editLinks,
        evidenceBase64: editBase64,
      });
      toast.success("Evidence updated");
      setEditingEvidence(null);
    } catch {
      toast.error("Update failed");
    }
  };

  const addNewLink = () => {
    if (newLinkInput.trim()) {
      setEditLinks((prev) => [...prev, newLinkInput.trim()]);
      setNewLinkInput("");
    }
  };

  const filtered = reports.filter((r) => activeTab === "all" || r.status === activeTab);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <p className="text-lg font-bold mb-2">My Reports</p>
        <p className="text-sm text-muted-foreground mb-6">Login to track your reports</p>
        <button onClick={() => navigate("/login")} className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-bold text-base">
          Login
        </button>
      </div>
    );
  }

  return (
    <div className="pb-2">
      <div className="flex items-center justify-between px-4 py-4">
        <h2 className="text-lg font-bold">My Reports</h2>
      </div>

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

      {loading ? (
        <div className="px-4 space-y-3">{[1, 2].map((i) => <SkeletonCard key={i} />)}</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-base font-semibold text-muted-foreground">No reports found</p>
        </div>
      ) : (
        <div className="space-y-3 px-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
          {filtered.map((report) => {
            const date = report.createdAt?.toDate ? report.createdAt.toDate().toLocaleDateString("bn-BD") : "";
            const isEditing = editingEvidence === report.id;
            const allImages = isEditing
              ? [...editBase64, ...editLinks.filter((u) => /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i.test(u))]
              : [...(report.evidenceBase64 || []), ...(report.evidenceLinks || []).filter((u) => /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i.test(u))];

            return (
              <div
                key={report.id}
                onClick={() => !isEditing && navigate(`/reports/${report.id}`)}
                className="bg-card rounded-2xl shadow-sm overflow-hidden border border-border cursor-pointer active:scale-[0.98] transition-transform"
              >
                <div className="p-3 pb-2 flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold">{report.corruptionType || "অন্যান্য"}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{date}</p>
                    <p className="text-[13px] text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">{report.description}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ml-2 ${statusStyles[report.status] || ""}`}>
                    {statusLabels[report.status]}
                  </span>
                </div>

                {/* Evidence display or edit */}
                {isEditing ? (
                  <div className="px-3 pb-3 space-y-2" onClick={(e) => e.stopPropagation()}>
                    {/* Base64 images */}
                    {editBase64.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {editBase64.map((img, i) => (
                          <div key={`b64-${i}`} className="relative w-16 h-16">
                            <img src={img} alt="" className="w-full h-full object-cover rounded-lg" />
                            <button
                              onClick={() => setEditBase64((prev) => prev.filter((_, j) => j !== i))}
                              className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-4 h-4 flex items-center justify-center"
                            >
                              <X size={8} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Links */}
                    {editLinks.map((link, i) => (
                      <div key={`lnk-${i}`} className="flex items-center gap-2 text-xs bg-muted rounded-lg px-2.5 py-2">
                        <LinkIcon size={10} className="shrink-0 text-muted-foreground" />
                        <span className="truncate flex-1">{link}</span>
                        <button onClick={() => setEditLinks((prev) => prev.filter((_, j) => j !== i))} className="text-destructive shrink-0">
                          <X size={12} />
                        </button>
                      </div>
                    ))}

                    {/* Add new link */}
                    <div className="flex gap-1.5">
                      <input
                        value={newLinkInput}
                        onChange={(e) => setNewLinkInput(e.target.value)}
                        placeholder="নতুন লিংক যোগ করুন"
                        className="flex-1 border border-input rounded-lg px-2.5 py-2 text-xs bg-card outline-none focus:border-primary"
                        onKeyDown={(e) => e.key === "Enter" && addNewLink()}
                      />
                      <button onClick={addNewLink} className="bg-primary text-primary-foreground px-2.5 rounded-lg">
                        <Plus size={14} />
                      </button>
                    </div>

                    {/* Save / Cancel */}
                    <div className="flex gap-2 pt-1">
                      <button onClick={saveEvidence} className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-[12px] font-semibold">
                        Save
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingEvidence(null); }}
                        className="flex-1 py-2 rounded-xl bg-muted text-foreground text-[12px] font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {allImages.length > 0 && (
                      <div onClick={(e) => e.stopPropagation()}>
                        <ImageCarousel images={allImages} />
                      </div>
                    )}
                  </>
                )}

                {report.location?.address && (
                  <div className="flex items-center gap-1 px-3 py-1.5 text-[11px] text-muted-foreground">
                    <MapPin size={12} className="text-primary shrink-0" />
                    <span className="truncate">{report.location.address}</span>
                  </div>
                )}

                <div className="flex gap-2 px-3 pb-3" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => startEditEvidence(e, report)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-muted text-foreground text-[13px] font-semibold"
                  >
                    <Edit2 size={14} />
                    Edit Evidence
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, report.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-destructive/10 text-destructive text-[13px] font-semibold"
                  >
                    <Trash2 size={14} />
                    Delete
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
