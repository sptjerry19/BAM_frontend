import { upload } from '../utils/uploads'

/**
 * Mock news feed + article bodies for UI only (no API yet).
 */
export const NEWS_FILTERS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'tournament', label: 'Giải đấu' },
  { id: 'club', label: 'Câu lạc bộ' },
  { id: 'gear', label: 'Trang bị' },
]

export const NEWS = [
  {
    id: 'n1',
    category: 'tournament',
    tag: 'Giải đấu',
    title: 'JBadminton Open 2026 mở đăng ký từ tuần này',
    excerpt:
      'Hơn 200 suất cho hạng phong trào và bán chuyên. Đăng ký sớm giữ suất sân trung tâm Cầu Giấy.',
    date: '14.08.2026',
    read: '4 phút',
    image: upload(1),
    featured: true,
    author: {
      name: 'Minh Quân',
      role: 'Biên tập viên giải đấu',
      avatar: 'https://i.pravatar.cc/96?img=12',
    },
    coverCaption: 'Sân trung tâm Cầu Giấy — khu vực thi đấu chính Open 2026',
    body: [
      {
        type: 'p',
        text: 'JBadminton Open 2026 chính thức mở cổng đăng ký từ thứ Hai tuần này. Ban tổ chức dành hơn 200 suất cho hạng phong trào và bán chuyên, ưu tiên thành viên đã chơi tại hệ thống sân trong 90 ngày gần nhất.',
      },
      {
        type: 'p',
        text: 'Giải diễn ra trong ba ngày cuối tháng chín tại cụm sân Cầu Giấy. Mỗi khung giờ thi đấu được khóa trước 48 giờ; vận động viên nhận mã QR check-in trên ứng dụng trước khi vào sân.',
      },
      {
        type: 'quote',
        text: 'Đăng ký sớm không chỉ giữ suất — bạn còn chọn được khung giờ và đối thủ phù hợp cấp độ.',
        cite: 'Ban tổ chức JBadminton Open',
      },
      {
        type: 'h2',
        text: 'Lịch đăng ký và lệ phí',
      },
      {
        type: 'p',
        text: 'Hạng phong trào mở trước, sau đó đến bán chuyên. Lệ phí bao gồm thuê sân, trọng tài và áo giải. Thành viên Gold được giảm 15% khi thanh toán trong ứng dụng trước ngày 25.08.',
      },
      {
        type: 'image',
        src: upload(8),
        alt: 'Khu vực check-in giải đấu',
        caption: 'Khu check-in và phòng chờ vận động viên tại tầng 1',
      },
      {
        type: 'h2',
        text: 'Cách giữ suất sân trung tâm',
      },
      {
        type: 'p',
        text: 'Suất trung tâm Cầu Giấy thường hết trong 72 giờ đầu. Bạn chọn hạng → khung giờ → xác nhận thanh toán. Nếu hủy trước 7 ngày, phí hoàn 70%; trong vòng 48 giờ trước giờ thi đấu sẽ không hoàn.',
      },
      {
        type: 'p',
        text: 'Danh sách hạt giống công bố một tuần trước khai mạc trên trang xếp hạng. Highlight các trận bán kết và chung kết sẽ lên bảng tin sau mỗi buổi thi đấu.',
      },
    ],
  },
  {
    id: 'n2',
    category: 'club',
    tag: 'CLB',
    title: 'Lịch tối thứ Ba: sparring cấp độ trung cấp',
    excerpt: 'Nhóm 12 người, ưu tiên thành viên Gold. Mang vợt của bạn hoặc mượn tại quầy.',
    date: '12.08.2026',
    read: '2 phút',
    image: upload(2),
    author: {
      name: 'Thu Hà',
      role: 'Điều phối CLB',
      avatar: 'https://i.pravatar.cc/96?img=5',
    },
    coverCaption: 'Buổi sparring tối tại sân Đống Đa',
    body: [
      {
        type: 'p',
        text: 'Mỗi tối thứ Ba, CLB mở một suất sparring 90 phút dành cho cấp trung cấp. Nhóm tối đa 12 người để mỗi người có đủ set đánh và nghỉ ngắn giữa các hiệp.',
      },
      {
        type: 'p',
        text: 'Thành viên Gold được giữ chỗ trước đến 18:00 cùng ngày. Còn lại mở cho thành viên thường trên ứng dụng. Mang vợt của bạn; quầy có sẵn vợt mượn nếu báo trước.',
      },
      {
        type: 'quote',
        text: 'Sparring không phải tập đối kháng — mục tiêu là nhịp độ và đọc đường cầu của người chơi cùng cấp.',
        cite: 'Coach Linh',
      },
      {
        type: 'h2',
        text: 'Lịch và địa điểm',
      },
      {
        type: 'p',
        text: '19:30–21:00 tại sân Đống Đa. Check-in trước 10 phút. Nếu vắng không báo hai lần liên tiếp trong tháng, suất ưu tiên Gold sẽ bị tạm khóa một tuần.',
      },
    ],
  },
  {
    id: 'n3',
    category: 'gear',
    tag: 'Trang bị',
    title: 'Astrox thế hệ mới đã có tại cửa hàng',
    excerpt: 'Ba màu khung, cân nặng 3U/4U. Đặt thử vợt 15 phút miễn phí khi mua kèm căng vợt.',
    date: '10.08.2026',
    read: '3 phút',
    image: upload(3),
    author: {
      name: 'Đức Anh',
      role: 'Chuyên viên trang bị',
      avatar: 'https://i.pravatar.cc/96?img=15',
    },
    coverCaption: 'Kệ Astrox mới tại cửa hàng JBadminton',
    body: [
      {
        type: 'p',
        text: 'Dòng Astrox thế hệ mới về đủ ba màu khung và hai mức cân 3U/4U. Khách có thể thử vợt 15 phút miễn phí khi đặt kèm dịch vụ căng dây trong ngày.',
      },
      {
        type: 'h2',
        text: 'Ai nên chọn 3U hay 4U',
      },
      {
        type: 'p',
        text: '3U phù hợp người thích smash nặng và đã quen khung cứng. 4U nhẹ hơn, dễ xoay cổ tay trong các pha lưới. Nhân viên quầy sẽ đo grip và gợi ý tension dựa trên lối đánh bạn mô tả.',
      },
      {
        type: 'image',
        src: upload(9),
        alt: 'Chi tiết khung vợt Astrox',
        caption: 'Chi tiết họng vợt và cân bằng đầu khung',
      },
      {
        type: 'p',
        text: 'Đặt trước trên ứng dụng để giữ màu khung; nhận tại quầy hoặc giao trong nội thành Hà Nội trong 24 giờ với đơn kèm căng vợt.',
      },
    ],
  },
  {
    id: 'n4',
    category: 'tournament',
    tag: 'Giải đấu',
    title: 'Kết quả vòng loại miền Bắc — điểm nổi bật',
    excerpt: 'Đôi nam nữ U35 lập kỷ lục điểm số nội bộ. Xem lại highlight trên trang xếp hạng.',
    date: '08.08.2026',
    read: '5 phút',
    image: upload(4),
    author: {
      name: 'Minh Quân',
      role: 'Biên tập viên giải đấu',
      avatar: 'https://i.pravatar.cc/96?img=12',
    },
    coverCaption: 'Trận bán kết đôi nam nữ U35',
    body: [
      {
        type: 'p',
        text: 'Vòng loại miền Bắc khép lại với nhiều trận đấu sát nút. Đôi nam nữ U35 ghi dấu ấn khi lập kỷ lục điểm số nội bộ mùa giải — highlight đã lên trang xếp hạng.',
      },
      {
        type: 'p',
        text: 'Các hạt giống số 1 và 2 đều đi tiếp. Vòng trong sẽ đá tại Hà Nội vào cuối tháng. Ban tổ chức công bố khung giờ chi tiết trong 48 giờ tới.',
      },
      {
        type: 'quote',
        text: 'Chúng tôi chơi chậm ở set đầu để đọc nhịp đối thủ — set hai mới dâng tốc độ.',
        cite: 'Đôi vô địch vòng loại U35',
      },
      {
        type: 'h2',
        text: 'Những cái tên đáng chú ý',
      },
      {
        type: 'p',
        text: 'Ngoài cặp U35, đơn nam phong trào chứng kiến hai bất ngờ khi hạt giống số 4 và số 6 dừng ở tứ kết. Bảng xếp hạng cập nhật điểm tích lũy ngay sau khi trọng tài khóa sổ.',
      },
    ],
  },
  {
    id: 'n5',
    category: 'club',
    tag: 'CLB',
    title: 'Workshop kỹ thuật smash cho người mới',
    excerpt: 'Coach Linh hướng dẫn tư thế và nhịp chân. Suất tối thứ Sáu còn 6 chỗ.',
    date: '05.08.2026',
    read: '3 phút',
    image: upload(5),
    author: {
      name: 'Thu Hà',
      role: 'Điều phối CLB',
      avatar: 'https://i.pravatar.cc/96?img=5',
    },
    coverCaption: 'Workshop smash — nhóm người mới',
    body: [
      {
        type: 'p',
        text: 'Workshop 75 phút tập trung vào tư thế đứng, nhịp chân trước khi nhảy và điểm tiếp xúc cầu. Coach Linh chia nhóm nhỏ để sửa từng người.',
      },
      {
        type: 'p',
        text: 'Suất tối thứ Sáu còn 6 chỗ. Đăng ký trên ứng dụng; mang giày sân trong nhà và vợt của bạn. Cầu tập được CLB chuẩn bị sẵn.',
      },
      {
        type: 'h2',
        text: 'Bạn sẽ mang về gì sau buổi học',
      },
      {
        type: 'p',
        text: 'Một checklist tư thế ngắn để tự tập lại trong tuần, kèm video góc chậm gửi vào nhóm CLB trong vòng 24 giờ sau workshop.',
      },
    ],
  },
  {
    id: 'n6',
    category: 'gear',
    tag: 'Trang bị',
    title: 'Cách chọn giày sân trong nhà mùa ẩm',
    excerpt: 'Đế non-marking, độ ôm gót và lưới thoáng — checklist nhanh trước khi xuống sân.',
    date: '01.08.2026',
    read: '4 phút',
    image: upload(6),
    author: {
      name: 'Đức Anh',
      role: 'Chuyên viên trang bị',
      avatar: 'https://i.pravatar.cc/96?img=15',
    },
    coverCaption: 'Giày sân trong nhà — kiểm tra đế trước khi mua',
    body: [
      {
        type: 'p',
        text: 'Mùa ẩm, sàn gỗ và PVC giữ hơi nước lâu hơn. Giày sai đế làm trượt hoặc để lại vết. Checklist dưới đây giúp chọn nhanh trước khi xuống sân.',
      },
      {
        type: 'h2',
        text: 'Ba điểm cần kiểm',
      },
      {
        type: 'p',
        text: 'Đế non-marking rõ trên tem; gót ôm nhưng không cấn gân Achilles; lưới mũi thoáng để chân khô sau set dài. Thử giày trên sàn cửa hàng khoảng năm phút xoay người và phanh ngang.',
      },
      {
        type: 'image',
        src: upload(10),
        alt: 'Chi tiết đế giày non-marking',
        caption: 'Họa tiết đế giúp bám khi sàn hơi ẩm',
      },
      {
        type: 'p',
        text: 'Đổi size miễn phí trong 7 ngày nếu chưa xuống sân thi đấu. Giữ hóa đơn điện tử trong mục đơn hàng trên ứng dụng.',
      },
    ],
  },
]

export function getNewsById(id) {
  return NEWS.find((n) => String(n.id) === String(id)) || null
}

export function getRelatedNews(id, limit = 3) {
  const current = getNewsById(id)
  if (!current) return NEWS.slice(0, limit)
  return NEWS.filter((n) => n.id !== current.id && n.category === current.category)
    .concat(NEWS.filter((n) => n.id !== current.id && n.category !== current.category))
    .slice(0, limit)
}
