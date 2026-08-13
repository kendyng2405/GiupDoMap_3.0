import React from 'react';
import { X, ShieldAlert, CheckCircle2, AlertTriangle, BookOpen } from 'lucide-react';

interface GuidelinesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuidelinesModal: React.FC<GuidelinesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-700 flex flex-col">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-red-50 to-red-50 dark:from-gray-800 dark:to-gray-800 border-b border-red-100 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-red-500 text-white rounded-xl shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Bộ Tiêu Chuẩn Kiểm Duyệt Trái Tim Việt
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Quy định nội dung và nguyên tắc văn hóa cho bài viết thiện nguyện
              </p>
            </div>
          </div>
          <button
            id="close-guidelines-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-gray-700 dark:text-gray-300">
          
          {/* Approved Criteria */}
          <div className="bg-emerald-50/60 dark:bg-emerald-900/10 border border-emerald-200/80 dark:border-emerald-800/30 rounded-xl p-4">
            <div className="flex items-center gap-2 font-semibold text-emerald-800 dark:text-emerald-400 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
              <span>1. Nội Dung Được Khuyến Khích</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-xs text-emerald-900/90 dark:text-emerald-100/70 leading-relaxed pl-1">
              <li>Thông tin về các chiến dịch từ thiện, hoạt động hỗ trợ hoàn cảnh khó khăn.</li>
              <li>Câu chuyện nhân ái, gương người tốt việc tốt, lan tỏa năng lượng tích cực.</li>
              <li>Báo cáo tài chính, hình ảnh hoạt động minh bạch, rõ nguồn gốc tổ chức.</li>
              <li>Chia sẻ kinh nghiệm làm tình nguyện và đóng góp ý kiến xây dựng dự án.</li>
            </ul>
          </div>

          {/* Violations */}
          <div className="bg-red-50/60 dark:bg-red-900/10 border border-red-200/80 dark:border-red-800/30 rounded-xl p-4">
            <div className="flex items-center gap-2 font-semibold text-red-800 dark:text-red-400 mb-2">
              <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-500" />
              <span>2. Nội Dung Phản Cảm & Vi Phạm (Tự động Từ Chối)</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-xs text-red-900/90 dark:text-red-100/70 leading-relaxed pl-1">
              <li>Ngôn từ thô tục, chửi thề, xúc phạm danh dự cá nhân hoặc tổ chức khác.</li>
              <li>Kích động thù hận, gây chia rẽ vùng miền, tôn giáo, sắc tộc hoặc chính trị.</li>
              <li>Chèn liên kết cờ bạc, vay tín dụng đen, lừa đảo tài chính hoặc spam thương mại.</li>
              <li>Cung cấp số tài khoản cá nhân trôi nổi không thuộc quản lý của Ban tổ chức.</li>
              <li>Sử dụng hình ảnh nhạy cảm, bạo lực hoặc không tôn trọng người yếu thế.</li>
            </ul>
          </div>

          {/* Needs Review */}
          <div className="bg-amber-50/60 dark:bg-amber-900/10 border border-amber-200/80 dark:border-amber-800/30 rounded-xl p-4">
            <div className="flex items-center gap-2 font-semibold text-amber-800 dark:text-amber-400 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-500" />
              <span>3. Tiêu Chuẩn Tóm Tắt 3 Gạch Đầu Dòng AI</span>
            </div>
            <p className="text-xs text-amber-900/90 dark:text-amber-100/70 leading-relaxed">
              Trợ lý AI Trái Tim Việt sẽ tự động cô đọng mọi thông tin chính thành đúng 3 gạch đầu dòng rõ ràng, dễ hiểu. Mỗi câu tóm tắt tập trung vào: (1) Mục tiêu/Đối tượng, (2) Hành động/Cách thức tham gia, (3) Kết quả/Tác động xã hội.
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex justify-end">
          <button
            id="guidelines-understand-btn"
            onClick={onClose}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Đã hiểu quy định
          </button>
        </div>

      </div>
    </div>
  );
};
