import React, { useState } from 'react';
import { CommunityPost } from '../types';
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileSpreadsheet,
  Trash2,
  ListChecks,
  Eye,
  ShieldCheck,
  Check,
  X
} from 'lucide-react';

interface ReviewQueueProps {
  queue: CommunityPost[];
  onUpdatePostStatus: (postId: string, status: CommunityPost['status']) => void;
  onDeletePost: (postId: string) => void;
  onClearQueue: () => void;
}

export const ReviewQueue: React.FC<ReviewQueueProps> = ({
  queue,
  onUpdatePostStatus,
  onDeletePost,
  onClearQueue,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION'>('ALL');
  const [selectedPostDetails, setSelectedPostDetails] = useState<CommunityPost | null>(null);

  const filteredQueue = queue.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.author.toLowerCase().includes(searchTerm.toLowerCase());

    if (statusFilter === 'ALL') return matchesSearch;
    return matchesSearch && post.status === statusFilter;
  });

  const exportCSV = () => {
    const headers = ['ID', 'Tiêu đề', 'Tác giả', 'Thể loại', 'Trạng thái', 'Điểm an toàn', 'Thời gian'];
    const rows = filteredQueue.map((p) => [
      p.id,
      `"${p.title.replace(/"/g, '""')}"`,
      `"${p.author.replace(/"/g, '""')}"`,
      p.category,
      p.status,
      p.analysis?.overallScore ?? 'N/A',
      p.createdAt,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `trai_tim_viet_moderation_queue_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      
      {/* Search & Filter Header Bar */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="queue-search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm bài viết theo tiêu đề, tác giả hoặc nội dung..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none"
          />
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-xl text-xs">
            <button
              id="filter-all-btn"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-white text-gray-900 shadow-2xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Tất cả ({queue.length})
            </button>
            <button
              id="filter-approved-btn"
              onClick={() => setStatusFilter('APPROVED')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                statusFilter === 'APPROVED'
                  ? 'bg-emerald-50 text-emerald-800 shadow-2xs'
                  : 'text-gray-500 hover:text-emerald-700'
              }`}
            >
              Đã duyệt
            </button>
            <button
              id="filter-rejected-btn"
              onClick={() => setStatusFilter('REJECTED')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                statusFilter === 'REJECTED'
                  ? 'bg-red-50 text-red-800 shadow-2xs'
                  : 'text-gray-500 hover:text-red-700'
              }`}
            >
              Vi phạm
            </button>
          </div>

          <button
            id="export-csv-btn"
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Xuất CSV</span>
          </button>
        </div>
      </div>

      {/* Queue List Table */}
      {filteredQueue.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200/80 p-12 text-center">
          <ShieldCheck className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-gray-800">Không tìm thấy bài viết nào</h3>
          <p className="text-xs text-gray-500 mt-1">
            Hãy thử thay đổi từ khóa tìm kiếm hoặc kiểm duyệt bài viết mới từ tab "Kiểm Duyệt Nhanh".
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredQueue.map((post) => {
            const isApproved = post.status === 'APPROVED';
            const isRejected = post.status === 'REJECTED';

            return (
              <div
                key={post.id}
                className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-2xs hover:border-red-200 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                        isApproved
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : isRejected
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {isApproved ? 'Đã duyệt đàng hoàng' : isRejected ? 'Loại bỏ / Vi phạm' : 'Yêu cầu sửa'}
                    </span>

                    <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                      {post.category}
                    </span>

                    <span className="text-[11px] text-gray-400">
                      • {post.createdAt}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-gray-900 leading-snug">
                    {post.title}
                  </h4>

                  <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                    {post.content}
                  </p>

                  <div className="text-[11px] text-gray-500 pt-1">
                    Tác giả: <span className="font-semibold text-gray-700">{post.author}</span>
                  </div>
                </div>

                {/* Queue Actions */}
                <div className="flex items-center space-x-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-gray-100 justify-end">
                  
                  {/* Score badge */}
                  {post.analysis && (
                    <div className="text-center px-3 py-1 bg-gray-50 rounded-xl border border-gray-200">
                      <span className="text-[10px] text-gray-400 font-bold block">
                        ĐIỂM AI
                      </span>
                      <span
                        className={`text-xs font-black ${
                          post.analysis.overallScore >= 80
                            ? 'text-emerald-600'
                            : post.analysis.overallScore >= 50
                            ? 'text-amber-600'
                            : 'text-red-600'
                        }`}
                      >
                        {post.analysis.overallScore}/100
                      </span>
                    </div>
                  )}

                  <button
                    id={`view-post-btn-${post.id}`}
                    onClick={() => setSelectedPostDetails(post)}
                    className="p-2 rounded-xl text-gray-600 hover:text-red-600 bg-gray-50 hover:bg-red-50 border border-gray-200 hover:border-red-200 transition-colors cursor-pointer"
                    title="Xem tóm tắt & đánh giá AI"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    id={`approve-post-btn-${post.id}`}
                    onClick={() => onUpdatePostStatus(post.id, 'APPROVED')}
                    className={`p-2 rounded-xl transition-colors cursor-pointer ${
                      isApproved
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'
                    }`}
                    title="Chấp nhận đăng bài"
                  >
                    <Check className="w-4 h-4" />
                  </button>

                  <button
                    id={`reject-post-btn-${post.id}`}
                    onClick={() => onUpdatePostStatus(post.id, 'REJECTED')}
                    className={`p-2 rounded-xl transition-colors cursor-pointer ${
                      isRejected
                        ? 'bg-red-100 text-red-800'
                        : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                    }`}
                    title="Từ chối / Vi phạm"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <button
                    id={`delete-post-btn-${post.id}`}
                    onClick={() => onDeletePost(post.id)}
                    className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-gray-100 transition-colors cursor-pointer"
                    title="Xóa khỏi danh sách"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedPostDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 border border-gray-100 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">
                Chi Tiết Đánh Giá AI: {selectedPostDetails.title}
              </h3>
              <button
                onClick={() => setSelectedPostDetails(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-gray-50 p-3.5 rounded-xl text-xs text-gray-700 leading-relaxed font-mono whitespace-pre-wrap">
              {selectedPostDetails.content}
            </div>

            {selectedPostDetails.analysis && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-900">
                    Trạng thái: {selectedPostDetails.analysis.statusText}
                  </span>
                  <span className="text-xs font-bold text-red-700">
                    Điểm an toàn: {selectedPostDetails.analysis.overallScore}/100
                  </span>
                </div>

                <div className="bg-red-50/50 p-3 rounded-xl border border-red-100 space-y-2">
                  <h4 className="text-xs font-bold text-red-900 flex items-center gap-1.5">
                    <ListChecks className="w-4 h-4 text-red-600" />
                    Tóm Tắt 3 Gạch Đầu Dòng
                  </h4>
                  <ul className="space-y-1.5 text-xs text-gray-800 list-disc list-inside pl-1">
                    {selectedPostDetails.analysis.summaryBullets.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </div>

                <p className="text-xs text-gray-600 italic">
                  Khuyến nghị: {selectedPostDetails.analysis.recommendation} — {selectedPostDetails.analysis.reasoning}
                </p>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-gray-100">
              <button
                onClick={() => setSelectedPostDetails(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium text-xs rounded-xl"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
