import React from 'react';
import { Heart, ShieldCheck, BookOpen } from 'lucide-react';

interface HeaderProps {
  onOpenGuidelines: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenGuidelines,
}) => {
  return (
    <header className="bg-white dark:bg-gray-800 border-b border-red-100 dark:border-gray-700 sticky top-0 z-30 shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Admin Tool Badge */}
          <div className="flex items-center space-x-3">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/50 shadow-sm">
              <ShieldCheck className="w-4 h-4 text-red-600 dark:text-red-500" />
              Công Cụ AI Tự Động Phân Tích
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            <button
              id="open-guidelines-btn"
              onClick={onOpenGuidelines}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded-xl transition-colors cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-red-600 dark:text-red-500" />
              <span>Tiêu Chuẩn Đăng Bài</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
