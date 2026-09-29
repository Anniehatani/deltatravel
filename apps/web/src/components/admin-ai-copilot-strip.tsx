'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { AiContextCard } from '@/components/ai-context-card';

function promptFor(pathname: string) {
  if (pathname.startsWith('/admin/tours')) {
    return {
      title: 'AI Copilot đang theo dõi catalog tour',
      prompt:
        'Phân tích catalog tour hiện tại dưới góc nhìn vận hành. Hãy chỉ ra điều đáng chú ý và những bước kiểm tra admin nên làm.',
      suggestions: [
        'Tour nào cần kiểm tra trước khi mở bán?',
        'Tóm tắt catalog production hiện tại.',
        'Có rủi ro dữ liệu nào admin nên chú ý không?',
      ],
    };
  }
  if (pathname.startsWith('/admin/schedules')) {
    return {
      title: 'AI Copilot cho lịch khởi hành & kho chỗ',
      prompt:
        'Tóm tắt tình trạng lịch khởi hành và kho chỗ. Ưu tiên lịch có rủi ro vận hành, số chỗ cần chú ý và dữ liệu cần kiểm tra.',
      suggestions: [
        'Lịch nào cần chú ý về số chỗ?',
        'Tóm tắt trạng thái inventory.',
        'Có lịch nào nên đóng hoặc rà soát không?',
      ],
    };
  }
  if (pathname.startsWith('/admin/bookings')) {
    return {
      title: 'AI Copilot cho booking operations',
      prompt:
        'Tóm tắt booking hiện tại và những việc vận hành cần ưu tiên. Đặc biệt chú ý trạng thái thanh toán, hủy và đơn cần xử lý.',
      suggestions: [
        'Booking nào cần hành động ngay?',
        'Có đơn nào đang chờ thanh toán không?',
        'Tóm tắt các trạng thái booking.',
      ],
    };
  }
  if (pathname.startsWith('/admin/payments')) {
    return {
      title: 'AI Copilot cho thanh toán & hoàn tiền',
      prompt:
        'Tóm tắt tình hình payment và refund cần xử lý. Không suy đoán gateway chưa cấu hình là hoạt động.',
      suggestions: [
        'Có khoản hoàn tiền nào đang chờ không?',
        'Cổng thanh toán nào thực sự đang sẵn sàng?',
        'Tôi cần đối soát gì hôm nay?',
      ],
    };
  }
  if (pathname.startsWith('/admin/system')) {
    return {
      title: 'AI Copilot cho production readiness',
      prompt:
        'Đánh giá trạng thái production hiện tại từ dữ liệu hệ thống có thể kiểm chứng. Nêu rõ integration nào ready và dependency nào còn bên ngoài.',
      suggestions: [
        'Tóm tắt production readiness.',
        'AI provider hiện có đang sẵn sàng không?',
        'Payment gateway nào còn thiếu cấu hình?',
      ],
    };
  }
  if (pathname.startsWith('/admin/audit-logs')) {
    return {
      title: 'AI Copilot cho audit & compliance',
      prompt:
        'Giải thích cách đọc audit trail và các loại side effect quản trị cần chú ý. Chỉ dựa trên dữ liệu mà quyền hiện tại được phép xem.',
      suggestions: [
        'Tôi nên kiểm tra audit trail như thế nào?',
        'Những hành động nào cần được audit?',
        'Giải thích dấu vết booking/payment.',
      ],
    };
  }
  return {
    title: 'AI Operations Copilot',
    prompt:
      'Tóm tắt tình hình vận hành hiện tại của Delta Travel và ưu tiên những việc cần xử lý trước.',
    suggestions: [
      'Hôm nay có gì cần chú ý?',
      'Tóm tắt booking và refund.',
      'Kiểm tra trạng thái hệ thống.',
    ],
  };
}

export function AdminAiCopilotStrip() {
  const pathname = usePathname();
  const content = useMemo(() => promptFor(pathname), [pathname]);

  if (pathname === '/admin') return null;

  return (
    <AiContextCard
      eyebrow="DELTA AI • OPERATIONS COPILOT"
      title={content.title}
      description="AI chạy trong lớp vận hành hiện có, không thay đổi quyền backend và không tự thực hiện side effect."
      prompt={content.prompt}
      context={'Admin route hiện tại: ' + pathname}
      suggestions={content.suggestions}
      compact
      className="mb-6"
    />
  );
}
