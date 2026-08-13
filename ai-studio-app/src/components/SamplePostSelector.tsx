import React from 'react';
import { SAMPLE_POSTS } from '../data/samplePosts';
import { CommunityPost } from '../types';
import { Sparkles, FileText, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

interface SamplePostSelectorProps {
  onSelectPost: (post: CommunityPost) => void;
  selectedPostId?: string;
}

export const SamplePostSelector: React.FC<SamplePostSelectorProps> = ({
  onSelectPost,
  selectedPostId,
}) => {
  return (
    <div className="bg-gradient-to-br from-red-50/50 to-orange-50/30 rounded-2xl p-4 border border-red-100/80 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-red-600" />
          <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
            Thử nghiệm nhanh với bài viết mẫu (Trái Tim Việt)
          </h3>
        </div>
        <span className="text-[11px] text-gray-500">
          Chọn 1 mẫu để kiểm duyệt & tóm tắt tự động
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {SAMPLE_POSTS.map((post) => {
          const isSelected = selectedPostId === post.id;
          const isSafe = post.analysis?.isSafe ?? true;

          return (
            <button
              key={post.id}
              id={`sample-post-${post.id}`}
              onClick={() => onSelectPost(post)}
              className={`text-left p-3 rounded-xl border transition-all text-xs cursor-pointer flex flex-col justify-between h-full ${
                isSelected
                  ? 'bg-white border-red-500 shadow-md ring-2 ring-red-200'
                  : 'bg-white/80 hover:bg-white border-gray-200 hover:border-red-300 shadow-2xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="font-semibold text-gray-900 line-clamp-1">
                    {post.title}
                  </span>
                  {isSafe ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  )}
                </div>
                <p className="text-gray-500 text-[11px] line-clamp-2 leading-snug">
                  {post.content}
                </p>
              </div>

              <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between text-[10px]">
                <span className="px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-600 font-medium">
                  {post.category}
                </span>
                <span
                  className={`font-semibold ${
                    isSafe ? 'text-emerald-700' : 'text-red-700'
                  }`}
                >
                  {isSafe ? 'An toàn' : 'Cần loại bỏ'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
