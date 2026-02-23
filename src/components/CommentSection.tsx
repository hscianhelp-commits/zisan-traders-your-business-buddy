import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Comment } from "@/types";
import { Send, Reply, Trash2, Edit2, X } from "lucide-react";
import { toast } from "sonner";

interface CommentSectionProps {
  reportId: string;
}

export default function CommentSection({ reportId }: CommentSectionProps) {
  const { user, isAdmin } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "comments"),
      where("reportId", "==", reportId)
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Comment));
      data.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
      setComments(data);
      setLoading(false);
    });
    return unsub;
  }, [reportId]);

  const handleSubmit = async () => {
    if (!text.trim() || !user) {
      if (!user) toast.error("মন্তব্য করতে লগইন করুন");
      return;
    }
    await addDoc(collection(db, "comments"), {
      reportId,
      userId: user.uid,
      text: text.trim(),
      parentId: replyTo,
      createdAt: serverTimestamp(),
    });
    setText("");
    setReplyTo(null);
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, "comments", id));
    toast.success("মন্তব্য মুছে ফেলা হয়েছে");
  };

  const handleEdit = async (id: string) => {
    if (!editText.trim()) return;
    await updateDoc(doc(db, "comments", id), { text: editText.trim() });
    setEditingId(null);
    setEditText("");
    toast.success("মন্তব্য আপডেট হয়েছে");
  };

  const rootComments = comments.filter((c) => !c.parentId);

  const renderComment = (comment: Comment, depth: number) => {
    const replies = comments.filter((c) => c.parentId === comment.id);
    const canModify = user?.uid === comment.userId || isAdmin;

    return (
      <div key={comment.id} className={`${depth > 0 ? "ml-4 border-l-2 border-border pl-3" : ""}`}>
        <div className="py-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <span className="text-[10px] font-semibold text-muted-foreground">বেনামী ব্যবহারকারী</span>
              {editingId === comment.id ? (
                <div className="flex gap-1 mt-1">
                  <input
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="flex-1 text-sm border border-input rounded-md px-2 py-1 bg-background"
                  />
                  <button onClick={() => handleEdit(comment.id)} className="text-primary p-1">
                    <Send size={14} />
                  </button>
                  <button onClick={() => setEditingId(null)} className="text-muted-foreground p-1">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <p className="text-sm mt-0.5">{comment.text}</p>
              )}
            </div>
            <div className="flex gap-1 shrink-0">
              {user && (
                <button
                  onClick={() => {
                    setReplyTo(comment.id);
                    setText("");
                  }}
                  className="p-1 text-muted-foreground"
                >
                  <Reply size={12} />
                </button>
              )}
              {canModify && (
                <>
                  <button
                    onClick={() => {
                      setEditingId(comment.id);
                      setEditText(comment.text);
                    }}
                    className="p-1 text-muted-foreground"
                  >
                    <Edit2 size={12} />
                  </button>
                  <button onClick={() => handleDelete(comment.id)} className="p-1 text-destructive">
                    <Trash2 size={12} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        {replies.map((r) => renderComment(r, depth + 1))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-2 animate-skeleton-pulse">
        <div className="h-4 w-32 bg-muted rounded" />
        <div className="h-10 w-full bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-sm">মন্তব্য ({comments.length})</h3>

      {rootComments.map((c) => renderComment(c, 0))}

      {replyTo && (
        <div className="flex items-center gap-1 text-xs text-primary">
          <Reply size={12} />
          <span>উত্তর দিচ্ছেন...</span>
          <button onClick={() => setReplyTo(null)} className="text-muted-foreground">
            <X size={12} />
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={user ? "মন্তব্য লিখুন..." : "লগইন করুন"}
          disabled={!user}
          className="flex-1 text-sm border border-input rounded-lg px-3 py-2 bg-background disabled:opacity-50"
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
        <button
          onClick={handleSubmit}
          disabled={!user || !text.trim()}
          className="bg-primary text-primary-foreground p-2 rounded-lg disabled:opacity-50"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
