export type SafetyRating = 'SAFE' | 'NEEDS_REVIEW' | 'UNSAFE';

export interface SafetyFlag {
  category: string; // e.g. 'Phát ngôn thù hận', 'Từ ngữ thô tục', 'Thông tin sai lệch', 'Quảng cáo rác'
  severity: 'Thấp' | 'Trung bình' | 'Cao';
  detail: string;
}

export interface ModerationAnalysis {
  isSafe: boolean;
  statusText: 'Phù hợp' | 'Cần xem xét' | 'Phản cảm / Vi phạm';
  overallScore: number; // 0 to 100 safety score
  flags: SafetyFlag[];
  summaryBullets: string[]; // Exactly 3 bullet points
  recommendation: 'Cho phép đăng' | 'Sửa đổi trước khi đăng' | 'Từ chối đăng';
  reasoning: string;
  suggestedEdit?: string;
  tone?: string;
  processedAt: string;
}

export interface CommunityPost {
  id: string;
  title: string;
  author: string;
  category: 'Kêu gọi quyên góp' | 'Truyền thông tình nguyện' | 'Chia sẻ câu chuyện' | 'Đóng góp ý kiến';
  content: string;
  createdAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION';
  analysis?: ModerationAnalysis;
}

export interface ModerationStats {
  totalAnalyzed: number;
  approvedCount: number;
  flaggedCount: number;
  avgResponseTimeMs: number;
}
