// Indexes stay stable so existing rooms retain their economy and ownership.
export const VIETNAM_TILES = [
  'Cổng Sài Gòn', 'Chợ Bến Thành', 'Vòng quay may mắn', 'Bến Nhà Rồng', 'Phí đường bộ',
  'Tàu Bắc Nam', 'Phố cổ Hội An', 'Vòng quay may mắn', 'Cầu Rồng Đà Nẵng', 'Bà Nà Hills',
  'Trạm dừng chân', 'Đại Nội Huế', 'Phí tham quan', 'Động Phong Nha', 'Biển Nhật Lệ',
  'Tàu miền Trung', 'Hồ Hoàn Kiếm', 'Văn Miếu', 'Quảng trường Ba Đình', 'Phố cổ Hà Nội',
  'Công viên Thống Nhất', 'Vịnh Hạ Long', 'Vòng quay may mắn', 'Đảo Cát Bà', 'Tràng An',
  'Tàu Đông Bắc', 'Sa Pa', 'Đỉnh Fansipan', 'Nhà cầu lông Việt Nam', 'Mù Cang Chải',
  'Về trạm dừng chân', 'Thác Bản Giốc', 'Hồ Ba Bể', 'Cột cờ Lũng Cú', 'Cầu kính Mộc Châu',
  'Tàu Tây Bắc', 'Vòng quay may mắn', 'Dinh Độc Lập', 'Phí du lịch', 'Landmark 81',
]

export function vietnamTileName(index, fallback = '') {
  if (fallback && (/[^\x00-\x7F]/.test(fallback) || fallback === 'World Tour')) return fallback
  return VIETNAM_TILES[Number(index)] ?? fallback
}
