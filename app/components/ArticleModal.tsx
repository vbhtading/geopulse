"use client";

import { Article } from "@/lib/types";
import { format } from "date-fns";
import { X, ExternalLink, Bookmark, BookmarkCheck, Share2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface ArticleModalProps {
  article: Article | null;
  isBookmarked: boolean;
  onClose: () => void;
  onToggleBookmark: () => void;
}

export default function ArticleModal({
  article,
  isBookmarked,
  onClose,
  onToggleBookmark,
}: ArticleModalProps) {
  if (!article) return null;

  const publishedDate = format(new Date(article.publishedAt), "MMMM d, yyyy 'at' h:mm a");

  const handleShare = async () => {
    const text = `${article.title}\n\n${article.summary}\n\nSource: ${article.source}`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Article details copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleOpenOriginal = () => {
    window.open(article.url, "_blank", "noopener,noreferrer");
  };

  const categoryAccent = article.category === "geopolitics" ? "#c2410f" : "#0e8a7a";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="modal w-full max-w-3xl max-h-[92vh] overflow-hidden rounded-2xl shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#252a36]">
            <div className="flex items-center gap-3">
              <div
                className="px-3 py-1 text-xs font-medium rounded-full"
                style={{ background: `${categoryAccent}22`, color: categoryAccent, border: `1px solid ${categoryAccent}44` }}
              >
                {article.category.toUpperCase()}
              </div>
              <span className="text-sm text-[#a1a7b5]">{article.source}</span>
            </div>
            <button onClick={onClose} className="p-2 -mr-2 text-[#6f7685] hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto p-6 md:p-8 flex-1">
            <div className="flex flex-wrap gap-2 mb-4">
              {article.regions.map((r) => (
                <span key={r} className="tag text-xs">{r}</span>
              ))}
            </div>

            <h1 className="text-2xl md:text-[27px] leading-tight font-semibold tracking-[-0.4px] mb-4 pr-4">
              {article.title}
            </h1>

            <div className="flex items-center gap-4 text-sm text-[#6f7685] mb-6">
              <span>{publishedDate}</span>
              <span className="text-[#353c4a]">•</span>
              <span
                className={`px-2 py-px rounded text-xs font-medium ${
                  article.impact === "High"
                    ? "impact-high"
                    : article.impact === "Medium"
                    ? "impact-medium"
                    : "impact-low"
                }`}
              >
                {article.impact} IMPACT
              </span>
            </div>

            {/* Summary callout */}
            <div className="bg-[#11141c] border border-[#252a36] rounded-xl p-4 mb-6">
              <div className="uppercase tracking-[1px] text-[10px] text-[#6f7685] mb-1.5">KEY SUMMARY</div>
              <p className="text-[#c5c9d4] leading-relaxed">{article.summary}</p>
            </div>

            {/* Body */}
            <div className="prose prose-invert max-w-none">
              <p className="text-[15px] leading-relaxed text-[#c5c9d4] whitespace-pre-line">
                {article.body}
              </p>
            </div>

            {/* Topics */}
            <div className="mt-8">
              <div className="text-xs uppercase tracking-[1px] text-[#6f7685] mb-2.5">TOPICS</div>
              <div className="flex flex-wrap gap-2">
                {article.topics.map((topic) => (
                  <span key={topic} className="tag px-3 py-1 text-sm">{topic}</span>
                ))}
              </div>
            </div>

            {/* Market Implications callout for markets stories */}
            {article.category === "markets" && (
              <div className="mt-8 rounded-xl border border-[#0e8a7a]/30 bg-[#0e8a7a]/5 p-4">
                <div className="uppercase text-[#14b8a6] text-xs tracking-[1px] mb-1">MARKET IMPLICATIONS</div>
                <p className="text-sm text-[#a8d5cf]">
                  This development is likely to influence commodity pricing, cross-border capital flows, and sector rotation in global equities over the coming sessions.
                </p>
              </div>
            )}

            {article.category === "geopolitics" && (
              <div className="mt-8 rounded-xl border border-[#c2410f]/30 bg-[#c2410f]/5 p-4">
                <div className="uppercase text-[#f97316] text-xs tracking-[1px] mb-1">STRATEGIC CONTEXT</div>
                <p className="text-sm text-[#e8c3a8]">
                  Monitor secondary effects on energy markets, defense budgets, and supply chain rerouting. Escalation ladders remain fluid.
                </p>
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="border-t border-[#252a36] px-6 py-4 flex items-center justify-between gap-3 bg-[#11141c]">
            <div className="flex items-center gap-2">
              <button
                onClick={onToggleBookmark}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#353c4a] hover:bg-[#1a1f2a] text-sm transition-colors"
              >
                {isBookmarked ? <BookmarkCheck size={16} className="text-[#c5a46e]" /> : <Bookmark size={16} />}
                {isBookmarked ? "Bookmarked" : "Bookmark"}
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#353c4a] hover:bg-[#1a1f2a] text-sm transition-colors"
              >
                <Share2 size={16} /> Share
              </button>
            </div>

            <button
              onClick={handleOpenOriginal}
              className="flex items-center gap-2 bg-white text-[#0a0c12] hover:bg-[#c5a46e] px-5 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Open Original Source <ExternalLink size={16} />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
