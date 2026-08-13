import { CommunityPost } from '../types';

export const SAMPLE_POSTS: CommunityPost[] = [
  {
    id: 'post-1',
    title: 'Hành trình Trái Tim Việt: Bữa ăn 0 đồng cho bệnh nhân xóm chạy thận',
    author: 'Nguyễn Văn Minh (Đội Tình nguyện Thủ đô)',
    category: 'Truyền thông tình nguyện',
    createdAt: '11/08/2026 14:30',
    status: 'APPROVED',
    content: `Hôm nay, chiến dịch "Bữa ăn 0 đồng" thuộc Dự án Trái Tim Việt đã trao tận tay 300 suất cơm nóng hổi cho các bệnh nhân tại xóm chạy thận Lê Thanh Nghị. Mỗi phần cơm không chỉ đầy đủ dinh dưỡng mà còn chứa đựng tình yêu thương và sự đồng cảm sâu sắc của các tình nguyện viên. Dự án xin gửi lời cảm ơn chân thành tới các nhà tài trợ và cộng đồng đã đồng hành cùng chương trình. Sang tuần tới, dự án sẽ mở rộng thêm điểm phát cơm tại Bệnh viện K Tân Triều.`,
    analysis: {
      isSafe: true,
      statusText: 'Phù hợp',
      overallScore: 98,
      flags: [],
      summaryBullets: [
        'Dự án Trái Tim Việt đã hoàn thành trao 300 suất cơm 0 đồng cho bệnh nhân xóm chạy thận.',
        'Sự kiện nhận được sự hỗ trợ và đóng góp tích cực từ các nhà tài trợ và đội ngũ tình nguyện viên.',
        'Kế hoạch tiếp theo sẽ mở rộng điểm phát cơm miễn phí sang Bệnh viện K Tân Triều trong tuần tới.'
      ],
      recommendation: 'Cho phép đăng',
      reasoning: 'Nội dung tích cực, mang tính xây dựng cộng đồng cao, tuân thủ hoàn toàn tiêu chuẩn cộng đồng của Dự án Trái Tim Việt.',
      tone: 'Ấm áp & Truyền cảm hứng',
      processedAt: '11/08/2026 14:31'
    }
  },
  {
    id: 'post-2',
    title: 'Cảnh báo mạo danh Dự án Trái Tim Việt kêu gọi chuyển tiền tài khoản cá nhân',
    author: 'Ban Kiểm soát Dự án Trái Tim Việt',
    category: 'Kêu gọi quyên góp',
    createdAt: '11/08/2026 10:15',
    status: 'APPROVED',
    content: `Hiện nay xuất hiện một số trang mạng xã hội giả mạo logo Dự án Trái Tim Việt để kêu gọi chuyển tiền ủng hộ vào tài khoản cá nhân tên "Nguyen Van A". Ban Tổ chức xin khẳng định: Trái Tim Việt chỉ tiếp nhận ủng hộ qua tài khoản ngân hàng chính thức công khai trên trang web chính thức, hoàn toàn không tiếp nhận qua số tài khoản cá nhân trôi nổi. Kính mong quý nhà hào tâm cảnh giác để tránh bị kẻ xấu lợi dụng.`,
    analysis: {
      isSafe: true,
      statusText: 'Phù hợp',
      overallScore: 92,
      flags: [
        {
          category: 'Cảnh báo an toàn',
          severity: 'Thấp',
          detail: 'Bài viết chứa nội dung cảnh báo lừa đảo nhằm bảo vệ cộng đồng.'
        }
      ],
      summaryBullets: [
        'Xuất hiện các trang giả mạo logo Trái Tim Việt kêu gọi quyên góp vào tài khoản cá nhân.',
        'Ban tổ chức khẳng định dự án chỉ tiếp nhận đóng góp qua tài khoản ngân hàng chính thức.',
        'Cảnh báo cộng đồng và các nhà hào tâm nâng cao cảnh giác trước các thủ đoạn lừa đảo.'
      ],
      recommendation: 'Cho phép đăng',
      reasoning: 'Nội dung mang tính minh bạch thông tin và bảo vệ uy tín của quỹ từ thiện Trái Tim Việt.',
      tone: 'Cảnh báo & Nghiêm túc',
      processedAt: '11/08/2026 10:16'
    }
  },
  {
    id: 'post-3',
    title: 'Mắng chửi nhóm thiện nguyện khác và kích động tranh cãi gay gắt',
    author: 'Tài khoản ẩn danh 88',
    category: 'Chia sẻ câu chuyện',
    createdAt: '11/08/2026 08:45',
    status: 'REJECTED',
    content: `Bọn nhóm từ thiện B kia toàn một lũ lừa đảo, làm màu vô học! Mấy người đi quyên góp cho bọn đó đúng là ngu ngốc. Lũ tham lam chỉ biết đớp tiền của dân nghèo. Mọi người tẩy chay ngay lập tức và đến chửi sấp mặt bọn đó đi!`,
    analysis: {
      isSafe: false,
      statusText: 'Phản cảm / Vi phạm',
      overallScore: 12,
      flags: [
        {
          category: 'Từ ngữ thô tục / Xúc phạm',
          severity: 'Cao',
          detail: 'Sử dụng các từ ngữ công kích thô bạo (lũ lừa đảo, vô học, ngu ngốc, đớp tiền).'
        },
        {
          category: 'Kích động thù hận / Tranh cãi',
          severity: 'Cao',
          detail: 'Kêu gọi tấn công, tẩy chay và lăng mạ tổ chức khác.'
        }
      ],
      summaryBullets: [
        'Bài viết chứa ngôn từ công kích, lăng mạ cá nhân và các tổ chức thiện nguyện khác.',
        'Tác giả sử dụng từ ngữ thô tục, thiến nhã và thiếu văn hóa ứng xử trên không gian mạng.',
        'Có hành vi kích động cộng đồng tham gia tranh cãi tiêu cực và gây chia rẽ.'
      ],
      recommendation: 'Từ chối đăng',
      reasoning: 'Vi phạm nghiêm trọng chính sách không công kích cá nhân/tổ chức và tiêu chuẩn cộng đồng của Trái Tim Việt.',
      tone: 'Hằn học & Kích động',
      processedAt: '11/08/2026 08:46'
    }
  },
  {
    id: 'post-4',
    title: 'Núp bóng từ thiện để chèn link quảng cáo cờ bạc & vay tín dụng đen',
    author: 'ThanhTu_Shop99',
    category: 'Đóng góp ý kiến',
    createdAt: '10/08/2026 21:10',
    status: 'REJECTED',
    content: `Cảm ơn Trái Tim Việt vì chương trình rất hay. Nhân tiện ai muốn kiếm tiền ủng hộ từ thiện nhanh chóng thì vào ngay web banh-ca-cuoc-88.com nhận thưởng 100k, rút tiền mặt liền tay. Vay tiền không thế chấp lãi suất 0% liên hệ zalo 0909xxxxxx.`,
    analysis: {
      isSafe: false,
      statusText: 'Phản cảm / Vi phạm',
      overallScore: 20,
      flags: [
        {
          category: 'Quảng cáo rác / Spam',
          severity: 'Cao',
          detail: 'Chèn link cá cược trực tuyến và dịch vụ vay tín dụng đen trái phép.'
        }
      ],
      summaryBullets: [
        'Bài viết lợi dụng diễn đàn từ thiện để đăng tải thông tin quảng cáo trái phép.',
        'Nội dung chứa liên kết cá cược trực tuyến và quảng cáo cho vay tín dụng đen.',
        'Nội dung không liên quan đến mục tiêu hoạt động nhân đạo của dự án.'
      ],
      recommendation: 'Từ chối đăng',
      reasoning: 'Lợi dụng nền tảng thiện nguyện để phát tán quảng cáo cờ bạc và gian lận tài chính.',
      tone: 'Quảng cáo Rác / Spam',
      processedAt: '10/08/2026 21:11'
    }
  }
];
