import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Share2, CheckCircle, AlertTriangle, HelpCircle, MessageCircle } from "lucide-react";
import { collection, query, where, getCountFromServer } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Report } from "@/types";
import ImageCarousel from "@/components/ImageCarousel";
import LinkPreview from "@/components/LinkPreview";
import LinkifyText from "@/components/LinkifyText";

interface ReportCardProps {
  report: Report;
  showStatus?: boolean;
}

export default function ReportCard({ report, showStatus }: ReportCardProps) {
  const navigate = useNavigate();
  const [commentCount, setCommentCount] = useState(0);

  useEffect(() => {
    const q = query(collection(db, "comments"), where("reportId", "==", report.id));
    getCountFromServer(q).then((snap) => setCommentCount(snap.data().count)).catch(() => {});
  }, [report.id]);

  const statusColors: Record<string, string> = {
    pending: "bg-badge-pending",
    approved: "bg-badge-approved",
    rejected: "bg-badge-rejected",
  };

  const statusLabels: Record<string, string> = {
    pending: "মুলতুবি",
    approved: "অনুমোদিত",
    rejected: "প্রত্যাখ্যাত",
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/reports/${report.id}`;
    if (navigator.share) {
      navigator.share({ title: "দুর্নীতি রিপোর্ট", url });
    } else {
      navigator.clipboard.writeText(url);
    }
  };

  return (
    <div
      onClick={() => navigate(`/reports/${report.id}`)}
      className="bg-card rounded-lg overflow-hidden shadow-sm border border-border animate-slide-up cursor-pointer active:scale-[0.98] transition-transform"
    >
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-semibold bg-accent text-accent-foreground px-2 py-0.5 rounded-full">
            {report.corruptionType}
          </span>
          {showStatus && (
            <span className={`text-[10px] font-semibold text-primary-foreground px-2 py-0.5 rounded-full ${statusColors[report.status]}`}>
              {statusLabels[report.status]}
            </span>
          )}
        </div>

        <LinkifyText
          text={report.description}
          className="text-sm leading-relaxed line-clamp-3"
        />
      </div>

      {report.evidenceBase64?.length > 0 && (
        <div onClick={(e) => e.stopPropagation()}>
          <ImageCarousel images={report.evidenceBase64} />
        </div>
      )}

      {report.evidenceLinks?.length > 0 && !report.evidenceBase64?.length && (
        <div onClick={(e) => e.stopPropagation()} className="px-3 space-y-1">
          {report.evidenceLinks.slice(0, 2).map((link, i) => (
            <LinkPreview key={i} url={link} />
          ))}
        </div>
      )}

      <div className="p-3 pt-1 space-y-2">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin size={12} />
          <span className="truncate">{report.location?.address || "অজানা অবস্থান"}</span>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <span className="flex items-center gap-1 text-[11px] text-vote-true font-medium">
            <CheckCircle size={14} /> {report.votes?.true || 0}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-vote-suspicious font-medium">
            <AlertTriangle size={14} /> {report.votes?.suspicious || 0}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-vote-evidence font-medium">
            <HelpCircle size={14} /> {report.votes?.needEvidence || 0}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
            <MessageCircle size={14} /> {commentCount}
          </span>
          <div className="flex-1" />
          <button onClick={handleShare} className="p-1.5 text-muted-foreground">
            <Share2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
