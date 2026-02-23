import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Report } from "@/types";
import ReportCard from "@/components/ReportCard";
import SkeletonCard from "@/components/SkeletonCard";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function MyReportsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <p className="text-lg font-semibold mb-2">লগইন প্রয়োজন</p>
        <p className="text-sm text-muted-foreground mb-4">আপনার রিপোর্ট দেখতে লগইন করুন</p>
        <button
          onClick={() => navigate("/login")}
          className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium"
        >
          লগইন করুন
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3 pb-2">
      <h2 className="text-base font-bold">আমার রিপোর্ট</h2>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg">কোনো রিপোর্ট নেই</p>
          <p className="text-sm mt-1">আপনি এখনো কোনো রিপোর্ট জমা দেননি</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div key={report.id} className="relative">
              <ReportCard report={report} showStatus />
              {report.status !== "approved" && (
                <button
                  onClick={(e) => handleDelete(e, report.id)}
                  className="absolute top-3 right-3 bg-destructive text-destructive-foreground rounded-full p-1.5 shadow-md z-10"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
