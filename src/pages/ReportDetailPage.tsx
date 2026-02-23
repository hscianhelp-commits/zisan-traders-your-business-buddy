import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, onSnapshot, getDoc, updateDoc, increment, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Report, Vote } from "@/types";
import CommentSection from "@/components/CommentSection";
import ImageCarousel from "@/components/ImageCarousel";
import LinkPreview from "@/components/LinkPreview";
import LinkifyText from "@/components/LinkifyText";
import { ArrowLeft, MapPin, CheckCircle, AlertTriangle, HelpCircle, Share2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [userVote, setUserVote] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    if (!id) return;
    const unsub = onSnapshot(doc(db, "reports", id), (snap) => {
      if (snap.exists()) {
        setReport({ id: snap.id, ...snap.data() } as Report);
      }
      setLoading(false);
    });
    return unsub;
  }, [id]);

  useEffect(() => {
    if (!user || !id) return;
    getDoc(doc(db, "votes", `${id}_${user.uid}`)).then((snap) => {
      if (snap.exists()) setUserVote(snap.data().type);
    });
  }, [user, id]);

  const handleVote = async (type: "true" | "suspicious" | "needEvidence") => {
    if (!user) return toast.error("ভোট দিতে লগইন করুন");
    if (!id || voting) return;
    setVoting(true);

    const voteRef = doc(db, "votes", `${id}_${user.uid}`);
    const reportRef = doc(db, "reports", id);

    try {
      if (userVote === type) {
        await deleteDoc(voteRef);
        await updateDoc(reportRef, { [`votes.${type}`]: increment(-1) });
        setUserVote(null);
      } else {
        if (userVote) {
          await updateDoc(reportRef, { [`votes.${userVote}`]: increment(-1) });
        }
        await setDoc(voteRef, { reportId: id, userId: user.uid, type });
        await updateDoc(reportRef, { [`votes.${type}`]: increment(1) });
        setUserVote(type);
      }
    } catch {
      toast.error("ভোট দিতে সমস্যা হয়েছে");
    } finally {
      setVoting(false);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: "দুর্নীতি রিপোর্ট", url });
    } else {
      navigator.clipboard.writeText(url);
      toast.success("লিংক কপি হয়েছে");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-lg font-semibold">রিপোর্ট পাওয়া যায়নি</p>
        <button onClick={() => navigate("/")} className="text-primary mt-2 text-sm font-medium">
          ← হোমে ফিরুন
        </button>
      </div>
    );
  }

  const voteButtons = [
    { type: "true" as const, label: "এটি সত্য", icon: CheckCircle, color: "text-vote-true border-vote-true/30" },
    { type: "suspicious" as const, label: "সন্দেহজনক", icon: AlertTriangle, color: "text-vote-suspicious border-vote-suspicious/30" },
    { type: "needEvidence" as const, label: "প্রমাণ দরকার", icon: HelpCircle, color: "text-vote-evidence border-vote-evidence/30" },
  ];

  return (
    <div className="fixed inset-0 flex flex-col bg-background z-50">
      <header className="flex items-center gap-3 px-4 h-14 bg-topbar text-topbar-foreground shrink-0">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-sm font-bold truncate flex-1">রিপোর্ট বিস্তারিত</h1>
        <button onClick={handleShare}>
          <Share2 size={18} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-8">
        <span className="text-xs font-semibold bg-accent text-accent-foreground px-2.5 py-1 rounded-full">
          {report.corruptionType}
        </span>

        <LinkifyText
          text={report.description}
          className="text-sm leading-relaxed whitespace-pre-wrap"
        />

        {report.evidenceBase64?.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">প্রমাণ (ছবি)</p>
            <ImageCarousel images={report.evidenceBase64} />
          </div>
        )}

        {report.evidenceLinks?.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">প্রমাণ (লিংক)</p>
            {report.evidenceLinks.map((link, i) => (
              <LinkPreview key={i} url={link} />
            ))}
          </div>
        )}

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin size={14} />
          <span>{report.location?.address || "অজানা অবস্থান"}</span>
        </div>

        <div className="flex gap-2">
          {voteButtons.map((v) => (
            <button
              key={v.type}
              onClick={() => handleVote(v.type)}
              disabled={voting}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-lg border text-xs font-medium transition-all ${
                userVote === v.type ? `${v.color} bg-accent scale-105` : "border-border text-muted-foreground"
              }`}
            >
              <v.icon size={18} />
              <span>{v.label}</span>
              <span className="font-bold">{report.votes?.[v.type] || 0}</span>
            </button>
          ))}
        </div>

        <div className="border-t border-border pt-4">
          <CommentSection reportId={report.id} />
        </div>
      </div>
    </div>
  );
}
