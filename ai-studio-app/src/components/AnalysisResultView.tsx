import React, { useState } from 'react';
import { ModerationAnalysis } from '../types';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  ShieldCheck,
  Tag,
  ListChecks,
  Sparkles,
  RefreshCw,
  Lightbulb,
  ArrowRight
} from 'lucide-react';

interface AnalysisResultViewProps {
  analysis: ModerationAnalysis;
  onAddToQueue?: () => void;
  onClear: () => void;
  isAddedToQueue?: boolean;
}

export const AnalysisResultView: React.FC<AnalysisResultViewProps> = ({
  analysis,
  onAddToQueue,
  onClear,
  isAddedToQueue = false,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopySummary = () => {
    const textToCopy = analysis.summaryBullets
      .map((bullet, index) => `${index + 1}. ${bullet}`)
      .join('\n');
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isSafe = analysis.isSafe;
  const isNeedsReview = analysis.statusText === 'Cần xem xét';

  const getStatusColor = () => {
    if (isSafe && !isNeedsReview) {
      return {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-900',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        icon: <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />,
      };
    }
    if (isNeedsReview) {
      return {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-900',
        badge: 'bg-amber-100 text-amber-800 border-amber-300',
        icon: <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />,
      };
    }
    return {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-900',
      badge: 'bg-red-100 text-red-800 border-red-300',
      icon: <XCircle className="w-6 h-6 text-red-600 shrink-0" />,
    };
  };

  const statusStyle = getStatusColor();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* SECTION 1: Moderation Status & Fraud Detection */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2 text-xs font-extrabold uppercase tracking-wider text-red-700">
          <ShieldCheck className="w-4 h-4 text-red-600" />
          <span>KẾT QUẢ 1: KIỂM DUYỆT NỘI DUNG PHẢN CẢM & LỪA ĐẢO</span>
        </div>

        <div
          className={`p-5 rounded-2xl border ${statusStyle.bg} ${statusStyle.border} flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs`}
        >
          <div className="flex items-start space-x-3.5">
            {statusStyle.icon}
            <div>
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <h3 className={`text-base font-bold ${statusStyle.text}`}>
                  {analysis.isSafe ? 'AN TOÀN — Không phát hiện phản cảm / lừa đảo' : `CẢNH BÁO — ${analysis.statusText}`}
                </h3>
                <span
                  className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${statusStyle.badge}`}
                >
                  Khuyến nghị: {analysis.recommendation}
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                {analysis.reasoning}
              </p>
            </div>
          </div>

          {/* Safety Score Meter */}
          <div className="flex items-center space-x-3 bg-white/90 p-3 rounded-xl border border-gray-200/80 shrink-0">
            <div className="text-right">
              <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider block">
                Điểm an toàn
              </span>
              <span
                className={`text-xl font-black ${
                  analysis.overallScore >= 80
                    ? 'text-emerald-600'
                    : analysis.overallScore >= 50
                    ? 'text-amber-600'
                    : 'text-red-600'
                }`}
              >
                {analysis.overallScore}/100
              </span>
            </div>
            <div className="w-12 h-12 rounded-full border-4 border-gray-100 flex items-center justify-center relative">
              <svg className="w-12 h-12 transform -rotate-90">
                <circle
                  cx="24"
                  cy="24"
                  r="18"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="text-gray-200"
                  fill="transparent"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="18"
                  stroke="currentColor"
                  strokeWidth="4"
                  className={
                    analysis.overallScore >= 80
                      ? 'text-emerald-500'
                      : analysis.overallScore >= 50
                      ? 'text-amber-500'
                      : 'text-red-500'
                  }
                  fill="transparent"
                  strokeDasharray={113}
                  strokeDashoffset={113 - (113 * analysis.overallScore) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <ShieldCheck className="w-4 h-4 text-gray-600 absolute" />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: 3-Bullet Summary Box */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2 text-xs font-extrabold uppercase tracking-wider text-red-700">
          <ListChecks className="w-4 h-4 text-red-600" />
          <span>KẾT QUẢ 2: TÓM TẮT NỘI DUNG 3 GẠCH ĐẦU DÒNG</span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-5 relative overflow-hidden">
          <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-gray-100">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-red-50 text-red-600">
                <ListChecks className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">
                  Tóm Tắt Hoàn Cảnh Khó Khăn (Trái Tim Việt AI)
                </h4>
                <p className="text-[11px] text-gray-500">
                  3 gạch đầu dòng ngắn gọn, tập trung vào đối tượng, hoàn cảnh và nhu cầu hỗ trợ
                </p>
              </div>
            </div>

            <button
              id="copy-summary-btn"
              onClick={handleCopySummary}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-gray-50 hover:bg-red-50 text-gray-700 hover:text-red-700 border border-gray-200 hover:border-red-200 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Đã sao chép!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-gray-500" />
                  <span>Sao chép tóm tắt</span>
                </>
              )}
            </button>
          </div>

          <ul className="space-y-3">
            {analysis.summaryBullets.map((bullet, idx) => (
              <li
                key={idx}
                className="flex items-start space-x-3 p-3 rounded-xl bg-red-50/30 border border-red-100/50 text-xs text-gray-800 leading-relaxed font-medium"
              >
                <span className="w-5 h-5 rounded-full bg-red-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>

          {analysis.tone && (
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>Sắc thái bài viết:</span>
              <span className="font-semibold text-red-700 bg-red-50 px-2.5 py-0.5 rounded-md border border-red-100">
                {analysis.tone}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Detected Violation Flags (if any) */}
      {analysis.flags && analysis.flags.length > 0 ? (
        <div className="bg-red-50/50 rounded-2xl border border-red-200/80 p-5">
          <div className="flex items-center space-x-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <h4 className="text-xs font-bold text-red-900 uppercase tracking-wider">
              Các Yếu Tố Cần Lưu Ý / Phản Cảm Phát Hiện ({analysis.flags.length})
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {analysis.flags.map((flag, idx) => (
              <div
                key={idx}
                className="bg-white p-3.5 rounded-xl border border-red-100 shadow-2xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-red-500" />
                    {flag.category}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      flag.severity === 'Cao'
                        ? 'bg-red-100 text-red-800'
                        : flag.severity === 'Trung bình'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    Mức độ: {flag.severity}
                  </span>
                </div>
                <p className="text-xs text-gray-600 leading-normal">
                  {flag.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50/40 rounded-2xl border border-emerald-100 p-4 flex items-center space-x-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-xs text-emerald-900 font-medium">
            Không phát hiện từ ngữ thô tục, công kích, phản cảm hay hành vi vi phạm tiêu chuẩn cộng đồng Dự án Trái Tim Việt.
          </p>
        </div>
      )}

      {/* AI Suggested Edit if available */}
      {analysis.suggestedEdit && (
        <div className="bg-blue-50/60 rounded-2xl border border-blue-200/80 p-4 space-y-2">
          <div className="flex items-center space-x-2 text-blue-900 font-semibold text-xs">
            <Lightbulb className="w-4 h-4 text-blue-600" />
            <span>Gợi Ý Bản Viết Chỉnh Sửa Chuẩn Mực</span>
          </div>
          <p className="text-xs text-blue-950 bg-white p-3 rounded-xl border border-blue-100 leading-relaxed">
            "{analysis.suggestedEdit}"
          </p>
        </div>
      )}

      {/* Action Footer Buttons */}
      <div className="flex items-center justify-between pt-2">
        <button
          id="clear-analysis-btn"
          onClick={onClear}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Kiểm duyệt đoạn khác</span>
        </button>

        {onAddToQueue && (
          <button
            id="add-to-queue-btn"
            onClick={onAddToQueue}
            disabled={isAddedToQueue}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
              isAddedToQueue
                ? 'bg-emerald-600 text-white cursor-default'
                : 'bg-red-600 hover:bg-red-700 text-white shadow-red-200'
            }`}
          >
            {isAddedToQueue ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Đã thêm vào hàng chờ duyệt</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Thêm vào Hàng Chờ Ban Quản Trị</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        )}
      </div>

    </div>
  );
};
