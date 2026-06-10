"use client";

import { Article } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { ExternalLink, Bookmark, BookmarkCheck } from "lucide-react";
import { motion } from "framer-motion";

interface ArticleCardProps {
  article: Article;
  isBookmarked: boolean;
  onClick: () => void;
  onToggleBookmark: (e: React.MouseEvent) => void;
  onTopicClick: (topic: string) => void;
}

export default function ArticleCard({
  article,
  isBookmarked,
  onClick,
  onToggleBookmark,
  onTopicClick,
}: ArticleCardProps) {
  const timeAgo = formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true });

  const categoryColor = article.category === "geopolitics" ? "geo" : "markets";
  const accentClass = article.category === "geopolitics" ? "text-[#c2410f]" : "text-[#0e8a7a]";

  return (
    <motion.div
      layout
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={`article-card ${categoryColor} group relative flex flex-col rounded-xl p-5 cursor-pointer`}
    >
      {/* Top meta */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-xs">
          <span className={`font-medium ${accentClass}`}>{article.source}</span>
          <span className="text-[#6f7685]">·</span>
          <span className="text-[#6f7685]">{timeAgo}</span>
        </div>
        <button
          onClick={onToggleBookmark}
          className="p-1 -mr-1 text-[#6f7685] hover:text-[#c5a46e] transition-colors"
          aria-label={isBookmarked ? "Remove bookmark" : "Bookmark article"}
        >
          {isBookmarked ? (
            <BookmarkCheck size={16} className="text-[#c5a46e]" />
          ) : (
            <Bookmark size={16} />
          )}
        </button>
      </div>

      {/* Regions */}
      <div className="flex flex-wrap gap-1.5 mb-2.5">
        {article.regions.slice(0, 2).map((region) => (
          <span key={region} className="tag">{region}</span>
        ))}
        {article.regions.length > 2 && (
          <span className="tag">+{article.regions.length - 2}</span>
        )}
      </div>

      {/* Title */}
      <h3 className="font-semibold text-[15px] leading-snug tracking-[-0.2px] mb-2.5 pr-2 group-hover:text-[#c5a46e] transition-colors line-clamp-3">
        {article.title}
      </h3>

      {/* Summary */}
      <p className="text-[#a1a7b5] text-[13.2px] leading-relaxed line-clamp-3 mb-auto">
        {article.summary}
      </p>

      {/* Bottom bar */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#252a36]">
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-medium px-2 py-px rounded ${
              article.impact === "High"
                ? "impact-high"
                : article.impact === "Medium"
                ? "impact-medium"
                : "impact-low"
            }`}
          >
            {article.impact}
          </span>
          {article.topics.slice(0, 2).map((topic) => (
            <button
              key={topic}
              onClick={(e) => {
                e.stopPropagation();
                onTopicClick(topic);
              }}
              className="tag hover:bg-[#353c4a] active:bg-[#252a36] transition-colors"
            >
              {topic}
            </button>
          ))}
        </div>

        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-[#6f7685] hover:text-[#c5a46e] transition-colors p-1"
          aria-label="Open original source"
        >
          <ExternalLink size={15} />
        </a>
      </div>
    </motion.div>
  );
}
