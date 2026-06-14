import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Colors, Radius, Spacing, Typography, oklchToRgba } from '../lib/tokens';

export type LocationOption = {
  lat: number;
  lng: number;
  label: string;
};

type LocationPickerProps = {
  onSelect: (location: LocationOption) => void;
  onClose: () => void;
  visible: boolean;
};

const CURRENT_LOCATION_OPTION: LocationOption = {
  lat: 0,
  lng: 0,
  label: '📍 Vị trí hiện tại',
};

const LOCATIONS: LocationOption[] = [
  // ─── TP. Hồ Chí Minh ─────────────────────────────────────
  { lat: 10.8231, lng: 106.6297, label: 'TP. Hồ Chí Minh' },
  { lat: 10.7769, lng: 106.6952, label: 'Quận 1, TP. Hồ Chí Minh' },
  { lat: 10.7769, lng: 106.7009, label: 'Đường Lê Lợi, Quận 1, TP. Hồ Chí Minh' },
  { lat: 10.7728, lng: 106.698, label: 'Đường Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh' },
  { lat: 10.7795, lng: 106.6953, label: 'Đường Đồng Khởi, Quận 1, TP. Hồ Chí Minh' },
  { lat: 10.7735, lng: 106.7045, label: 'Ngõ 12 Lê Duẩn, Quận 1, TP. Hồ Chí Minh' },
  { lat: 10.769, lng: 106.694, label: 'Đường Pasteur, Quận 1, TP. Hồ Chí Minh' },
  { lat: 10.778, lng: 106.69, label: 'Đường Nguyễn Thị Minh Khai, Quận 1, TP. Hồ Chí Minh' },
  { lat: 10.7728, lng: 106.7045, label: 'Đường Lê Duẩn, Quận 1, TP. Hồ Chí Minh' },
  { lat: 10.78, lng: 106.692, label: 'Đường Phạm Hồng Thái, Quận 1, TP. Hồ Chí Minh' },
  { lat: 10.78, lng: 106.688, label: 'Đường Nguyễn Văn Cừ, Quận 1, TP. Hồ Chí Minh' },
  { lat: 10.788, lng: 106.704, label: 'Quận 3, TP. Hồ Chí Minh' },
  { lat: 10.782, lng: 106.693, label: 'Đường Nguyễn Đình Chiểu, Quận 3, TP. Hồ Chí Minh' },
  { lat: 10.784, lng: 106.697, label: 'Đường Võ Văn Tần, Quận 3, TP. Hồ Chí Minh' },
  { lat: 10.79, lng: 106.691, label: 'Đường Cao Thắng, Quận 3, TP. Hồ Chí Minh' },
  { lat: 10.786, lng: 106.686, label: 'Đường Lê Văn Sỹ, Quận 3, TP. Hồ Chí Minh' },
  { lat: 10.762, lng: 106.68, label: 'Quận 5, TP. Hồ Chí Minh' },
  { lat: 10.755, lng: 106.678, label: 'Đường Nguyễn Trãi, Quận 5, TP. Hồ Chí Minh' },
  { lat: 10.753, lng: 106.682, label: 'Đường Trần Hưng Đạo, Quận 5, TP. Hồ Chí Minh' },
  { lat: 10.757, lng: 106.675, label: 'Đường Hồng Bàng, Quận 5, TP. Hồ Chí Minh' },
  { lat: 10.759, lng: 106.673, label: 'Ngõ 45 Nguyễn Biểu, Quận 5, TP. Hồ Chí Minh' },
  { lat: 10.797, lng: 106.668, label: 'Quận 10, TP. Hồ Chí Minh' },
  { lat: 10.793, lng: 106.672, label: 'Đường Sư Vạn Hạnh, Quận 10, TP. Hồ Chí Minh' },
  { lat: 10.798, lng: 106.665, label: 'Đường Nguyễn Tri Phương, Quận 10, TP. Hồ Chí Minh' },
  { lat: 10.795, lng: 106.677, label: 'Đường Lý Thường Kiệt, Quận 10, TP. Hồ Chí Minh' },
  { lat: 10.74, lng: 106.688, label: 'Quận 7, TP. Hồ Chí Minh' },
  { lat: 10.73, lng: 106.703, label: 'Đường Nguyễn Lương Bằng, Quận 7, TP. Hồ Chí Minh' },
  { lat: 10.738, lng: 106.732, label: 'Đường Nguyễn Văn Linh, Quận 7, TP. Hồ Chí Minh' },
  { lat: 10.735, lng: 106.695, label: 'Ngõ 28 Nguyễn Văn Linh, Quận 7, TP. Hồ Chí Minh' },
  { lat: 10.806, lng: 106.687, label: 'Quận Bình Thạnh, TP. Hồ Chí Minh' },
  { lat: 10.81, lng: 106.69, label: 'Đường Nguyễn Xí, Quận Bình Thạnh, TP. Hồ Chí Minh' },
  { lat: 10.802, lng: 106.697, label: 'Đường Nguyễn Hữu Cảnh, Quận Bình Thạnh, TP. Hồ Chí Minh' },
  { lat: 10.812, lng: 106.67, label: 'Đường Xô Viết Nghệ Tĩnh, Quận Bình Thạnh, TP. Hồ Chí Minh' },
  { lat: 10.793, lng: 106.653, label: 'Quận Tân Bình, TP. Hồ Chí Minh' },
  { lat: 10.78, lng: 106.648, label: 'Đường Cộng Hòa, Quận Tân Bình, TP. Hồ Chí Minh' },
  { lat: 10.788, lng: 106.658, label: 'Đường Hoàng Văn Thụ, Quận Tân Bình, TP. Hồ Chí Minh' },
  { lat: 10.79, lng: 106.66, label: 'Đường Nguyễn Thái Bình, Quận Tân Bình, TP. Hồ Chí Minh' },
  { lat: 10.775, lng: 106.659, label: 'Quận Tân Phú, TP. Hồ Chí Minh' },
  { lat: 10.842, lng: 106.651, label: 'Quận Gò Vấp, TP. Hồ Chí Minh' },
  { lat: 10.78, lng: 106.672, label: 'Quận Phú Nhuận, TP. Hồ Chí Minh' },
  { lat: 10.835, lng: 106.761, label: 'TP. Thủ Đức, TP. Hồ Chí Minh' },
  { lat: 10.764, lng: 106.626, label: 'Quận Bình Tân, TP. Hồ Chí Minh' },
  { lat: 10.851, lng: 106.606, label: 'Quận 12, TP. Hồ Chí Minh' },
  { lat: 10.762, lng: 106.66, label: 'Quận 11, TP. Hồ Chí Minh' },
  { lat: 10.742, lng: 106.658, label: 'Quận 6, TP. Hồ Chí Minh' },
  { lat: 10.745, lng: 106.667, label: 'Quận 4, TP. Hồ Chí Minh' },
  { lat: 10.732, lng: 106.644, label: 'Quận 8, TP. Hồ Chí Minh' },
  { lat: 10.812, lng: 106.586, label: 'Huyện Hóc Môn, TP. Hồ Chí Minh' },
  { lat: 11.048, lng: 106.488, label: 'Huyện Củ Chi, TP. Hồ Chí Minh' },
  { lat: 10.688, lng: 106.742, label: 'Huyện Nhà Bè, TP. Hồ Chí Minh' },
  { lat: 10.486, lng: 106.87, label: 'Huyện Cần Giờ, TP. Hồ Chí Minh' },

  // ─── Hà Nội ──────────────────────────────────────────────
  { lat: 21.0285, lng: 105.8542, label: 'Hà Nội' },
  { lat: 21.025, lng: 105.857, label: 'Quận Hoàn Kiếm, Hà Nội' },
  { lat: 21.0245, lng: 105.854, label: 'Phố Hàng Ngang, Quận Hoàn Kiếm, Hà Nội' },
  { lat: 21.0235, lng: 105.8515, label: 'Phố Hàng Đào, Quận Hoàn Kiếm, Hà Nội' },
  { lat: 21.023, lng: 105.855, label: 'Phố Tràng Tiền, Quận Hoàn Kiếm, Hà Nội' },
  { lat: 21.022, lng: 105.858, label: 'Ngõ 12 Lương Văn Can, Quận Hoàn Kiếm, Hà Nội' },
  { lat: 21.026, lng: 105.859, label: 'Phố Lê Thái Tổ, Quận Hoàn Kiếm, Hà Nội' },
  { lat: 21.019, lng: 105.851, label: 'Phố Huế, Quận Hoàn Kiếm, Hà Nội' },
  { lat: 21.035, lng: 105.836, label: 'Quận Ba Đình, Hà Nội' },
  { lat: 21.038, lng: 105.834, label: 'Phố Đội Cấn, Quận Ba Đình, Hà Nội' },
  { lat: 21.034, lng: 105.832, label: 'Phố Kim Mã, Quận Ba Đình, Hà Nội' },
  { lat: 21.04, lng: 105.839, label: 'Đường Hoàng Hoa Thám, Quận Ba Đình, Hà Nội' },
  { lat: 21.032, lng: 105.839, label: 'Phố Nguyễn Khánh Toàn, Quận Ba Đình, Hà Nội' },
  { lat: 21.017, lng: 105.838, label: 'Quận Đống Đa, Hà Nội' },
  { lat: 21.015, lng: 105.84, label: 'Đường Láng Hạ, Quận Đống Đa, Hà Nội' },
  { lat: 21.012, lng: 105.828, label: 'Phố Nguyễn Lương Bằng, Quận Đống Đa, Hà Nội' },
  { lat: 21.02, lng: 105.832, label: 'Phố Tây Sơn, Quận Đống Đa, Hà Nội' },
  { lat: 21.018, lng: 105.842, label: 'Đường Giải Phóng, Quận Đống Đa, Hà Nội' },
  { lat: 21.008, lng: 105.848, label: 'Ngõ 240 Phố Huế, Quận Hai Bà Trưng, Hà Nội' },
  { lat: 21.01, lng: 105.854, label: 'Quận Hai Bà Trưng, Hà Nội' },
  { lat: 21.003, lng: 105.846, label: 'Phố Bạch Mai, Quận Hai Bà Trưng, Hà Nội' },
  { lat: 21.008, lng: 105.852, label: 'Đường Trần Khát Chân, Quận Hai Bà Trưng, Hà Nội' },
  { lat: 21.005, lng: 105.856, label: 'Đường Minh Khai, Quận Hai Bà Trưng, Hà Nội' },
  { lat: 21.04, lng: 105.81, label: 'Quận Cầu Giấy, Hà Nội' },
  { lat: 21.03, lng: 105.8, label: 'Đường Xuân Thủy, Quận Cầu Giấy, Hà Nội' },
  { lat: 21.033, lng: 105.79, label: 'Đường Hồ Tùng Mậu, Quận Cầu Giấy, Hà Nội' },
  { lat: 21.027, lng: 105.79, label: 'Phố Phạm Hùng, Quận Cầu Giấy, Hà Nội' },
  { lat: 20.998, lng: 105.86, label: 'Quận Hoàng Mai, Hà Nội' },
  { lat: 20.995, lng: 105.855, label: 'Đường Giải Phóng, Quận Hoàng Mai, Hà Nội' },
  { lat: 20.998, lng: 105.865, label: 'Đường Tam Trinh, Quận Hoàng Mai, Hà Nội' },
  { lat: 21.015, lng: 105.82, label: 'Quận Thanh Xuân, Hà Nội' },
  { lat: 21.007, lng: 105.825, label: 'Đường Nguyễn Trãi, Quận Thanh Xuân, Hà Nội' },
  { lat: 21.027, lng: 105.778, label: 'Quận Nam Từ Liêm, Hà Nội' },
  { lat: 21.057, lng: 105.768, label: 'Quận Bắc Từ Liêm, Hà Nội' },
  { lat: 21.06, lng: 105.828, label: 'Quận Tây Hồ, Hà Nội' },
  { lat: 21.066, lng: 105.835, label: 'Đường Lạc Long Quân, Quận Tây Hồ, Hà Nội' },
  { lat: 21.048, lng: 105.881, label: 'Quận Long Biên, Hà Nội' },
  { lat: 20.972, lng: 105.776, label: 'Quận Hà Đông, Hà Nội' },
  { lat: 20.976, lng: 105.782, label: 'Đường Quang Trung, Quận Hà Đông, Hà Nội' },
  { lat: 21.125, lng: 105.932, label: 'Huyện Gia Lâm, Hà Nội' },
  { lat: 21.153, lng: 105.867, label: 'Huyện Đông Anh, Hà Nội' },
  { lat: 21.283, lng: 105.845, label: 'Huyện Sóc Sơn, Hà Nội' },
  { lat: 20.919, lng: 105.819, label: 'Huyện Thanh Trì, Hà Nội' },
  { lat: 20.991, lng: 105.721, label: 'Huyện Hoài Đức, Hà Nội' },
  { lat: 20.983, lng: 105.645, label: 'Huyện Quốc Oai, Hà Nội' },
  { lat: 21.002, lng: 105.559, label: 'Huyện Thạch Thất, Hà Nội' },
  { lat: 20.885, lng: 105.68, label: 'Huyện Chương Mỹ, Hà Nội' },

  // ─── Đà Nẵng ─────────────────────────────────────────────
  { lat: 16.0544, lng: 108.2022, label: 'Đà Nẵng' },
  { lat: 16.068, lng: 108.22, label: 'Quận Hải Châu, Đà Nẵng' },
  { lat: 16.066, lng: 108.22, label: 'Đường Bạch Đằng, Quận Hải Châu, Đà Nẵng' },
  { lat: 16.065, lng: 108.225, label: 'Đường Nguyễn Văn Linh, Quận Hải Châu, Đà Nẵng' },
  { lat: 16.07, lng: 108.218, label: 'Đường Lê Duẩn, Quận Hải Châu, Đà Nẵng' },
  { lat: 16.071, lng: 108.22, label: 'Ngõ 30 Lê Duẩn, Quận Hải Châu, Đà Nẵng' },
  { lat: 16.058, lng: 108.24, label: 'Quận Sơn Trà, Đà Nẵng' },
  { lat: 16.06, lng: 108.245, label: 'Đường Võ Nguyên Giáp, Quận Sơn Trà, Đà Nẵng' },
  { lat: 16.06, lng: 108.235, label: 'Đường Trần Hưng Đạo, Quận Sơn Trà, Đà Nẵng' },
  { lat: 16.083, lng: 108.195, label: 'Quận Thanh Khê, Đà Nẵng' },
  { lat: 16.083, lng: 108.19, label: 'Đường Hàm Nghi, Quận Thanh Khê, Đà Nẵng' },
  { lat: 16.045, lng: 108.246, label: 'Quận Ngũ Hành Sơn, Đà Nẵng' },
  { lat: 16.07, lng: 108.16, label: 'Quận Liên Chiểu, Đà Nẵng' },
  { lat: 16.025, lng: 108.212, label: 'Quận Cẩm Lệ, Đà Nẵng' },
  { lat: 15.983, lng: 108.133, label: 'Huyện Hòa Vang, Đà Nẵng' },

  // ─── Hải Phòng ───────────────────────────────────────────
  { lat: 20.8449, lng: 106.6881, label: 'Hải Phòng' },
  { lat: 20.855, lng: 106.68, label: 'Quận Hồng Bàng, Hải Phòng' },
  { lat: 20.848, lng: 106.689, label: 'Quận Lê Chân, Hải Phòng' },
  { lat: 20.84, lng: 106.695, label: 'Quận Ngô Quyền, Hải Phòng' },
  { lat: 20.83, lng: 106.73, label: 'Đường Điện Biên Phủ, Quận Ngô Quyền, Hải Phòng' },
  { lat: 20.836, lng: 106.668, label: 'Quận Hải An, Hải Phòng' },
  { lat: 20.81, lng: 106.637, label: 'Quận Kiến An, Hải Phòng' },
  { lat: 20.785, lng: 106.7, label: 'Quận Đồ Sơn, Hải Phòng' },
  { lat: 20.82, lng: 106.662, label: 'Quận Dương Kinh, Hải Phòng' },

  // ─── Cần Thơ ─────────────────────────────────────────────
  { lat: 10.0342, lng: 105.7227, label: 'Cần Thơ' },
  { lat: 10.03, lng: 105.769, label: 'Quận Ninh Kiều, Cần Thơ' },
  { lat: 10.03, lng: 105.78, label: 'Đường Nguyễn Văn Cừ, Quận Ninh Kiều, Cần Thơ' },
  { lat: 10.032, lng: 105.778, label: 'Đường Mậu Thân, Quận Ninh Kiều, Cần Thơ' },
  { lat: 10.028, lng: 105.785, label: 'Đường 30/4, Quận Ninh Kiều, Cần Thơ' },
  { lat: 10.025, lng: 105.775, label: 'Ngõ 56 Nguyễn Văn Cừ, Quận Ninh Kiều, Cần Thơ' },
  { lat: 10.052, lng: 105.732, label: 'Quận Bình Thủy, Cần Thơ' },
  { lat: 10.0, lng: 105.694, label: 'Quận Cái Răng, Cần Thơ' },
  { lat: 10.11, lng: 105.65, label: 'Quận Ô Môn, Cần Thơ' },
  { lat: 10.173, lng: 105.543, label: 'Quận Thốt Nốt, Cần Thơ' },

  // ─── Các tỉnh/thành khác ─────────────────────────────────
  { lat: 12.2388, lng: 109.1967, label: 'Khánh Hòa (Nha Trang)' },
  { lat: 12.24, lng: 109.19, label: 'TP. Nha Trang, Khánh Hòa' },
  { lat: 12.245, lng: 109.198, label: 'Đường Trần Phú, Nha Trang, Khánh Hòa' },
  { lat: 12.238, lng: 109.192, label: 'Đường Nguyễn Thiện Thuật, Nha Trang, Khánh Hòa' },
  { lat: 10.9589, lng: 106.8186, label: 'Đồng Nai' },
  { lat: 10.947, lng: 106.841, label: 'TP. Biên Hòa, Đồng Nai' },
  { lat: 10.945, lng: 106.845, label: 'Đường Nguyễn Ái Quốc, Biên Hòa, Đồng Nai' },
  { lat: 10.9925, lng: 106.6517, label: 'Bình Dương' },
  { lat: 10.984, lng: 106.652, label: 'TP. Thủ Dầu Một, Bình Dương' },
  { lat: 10.982, lng: 106.656, label: 'Đường Cách Mạng Tháng 8, Thủ Dầu Một, Bình Dương' },
  { lat: 21.0245, lng: 105.8412, label: 'Bắc Ninh' },
  { lat: 20.9718, lng: 106.0422, label: 'Hưng Yên' },
  { lat: 20.7148, lng: 106.0318, label: 'Hải Dương' },
  { lat: 21.3011, lng: 105.5195, label: 'Vĩnh Phúc' },
  { lat: 20.8597, lng: 106.689, label: 'Thái Bình' },
  { lat: 20.4461, lng: 106.3372, label: 'Nam Định' },
  { lat: 20.3919, lng: 105.5092, label: 'Hòa Bình' },
  { lat: 18.6735, lng: 105.6863, label: 'Nghệ An (Vinh)' },
  { lat: 18.673, lng: 105.692, label: 'TP. Vinh, Nghệ An' },
  { lat: 18.335, lng: 105.898, label: 'Hà Tĩnh' },
  { lat: 16.9597, lng: 107.1241, label: 'Quảng Trị' },
  { lat: 16.4689, lng: 107.5799, label: 'Thừa Thiên Huế' },
  { lat: 16.461, lng: 107.596, label: 'TP. Huế, Thừa Thiên Huế' },
  { lat: 16.473, lng: 107.598, label: 'Đường Trần Hưng Đạo, Huế, Thừa Thiên Huế' },
  { lat: 16.463, lng: 107.585, label: 'Đường Nguyễn Huệ, Huế, Thừa Thiên Huế' },
  { lat: 15.1198, lng: 108.2586, label: 'Quảng Nam (Hội An)' },
  { lat: 15.882, lng: 108.327, label: 'TP. Hội An, Quảng Nam' },
  { lat: 15.887, lng: 108.332, label: 'Phố cổ Hội An, Quảng Nam' },
  { lat: 13.7687, lng: 109.2362, label: 'Bình Định (Quy Nhơn)' },
  { lat: 13.773, lng: 109.237, label: 'TP. Quy Nhơn, Bình Định' },
  { lat: 12.6686, lng: 108.0517, label: 'Đắk Lắk (Buôn Ma Thuột)' },
  { lat: 12.672, lng: 108.037, label: 'TP. Buôn Ma Thuột, Đắk Lắk' },
  { lat: 11.9465, lng: 108.4419, label: 'Lâm Đồng (Đà Lạt)' },
  { lat: 11.955, lng: 108.443, label: 'TP. Đà Lạt, Lâm Đồng' },
  { lat: 11.946, lng: 108.44, label: 'Đường Nguyễn Chí Thanh, Đà Lạt, Lâm Đồng' },
  { lat: 11.943, lng: 108.436, label: 'Đường Hồ Tùng Mậu, Đà Lạt, Lâm Đồng' },
  { lat: 10.5831, lng: 107.0487, label: 'Bà Rịa – Vũng Tàu' },
  { lat: 10.361, lng: 107.07, label: 'TP. Vũng Tàu, Bà Rịa – Vũng Tàu' },
  { lat: 10.351, lng: 107.074, label: 'Đường Thùy Vân, Vũng Tàu, Bà Rịa – Vũng Tàu' },
  { lat: 10.3547, lng: 106.3623, label: 'Tiền Giang (Mỹ Tho)' },
  { lat: 10.2456, lng: 105.5927, label: 'Đồng Tháp' },
  { lat: 10.0493, lng: 105.5713, label: 'Vĩnh Long' },
  { lat: 10.2541, lng: 104.9534, label: 'An Giang (Châu Đốc)' },
  { lat: 9.9365, lng: 106.346, label: 'Trà Vinh' },
  { lat: 9.7793, lng: 105.6168, label: 'Hậu Giang' },
  { lat: 9.6052, lng: 105.5736, label: 'Sóc Trăng' },
  { lat: 9.2873, lng: 105.7203, label: 'Bạc Liêu' },
  { lat: 9.1769, lng: 105.1529, label: 'Cà Mau' },
  { lat: 10.4035, lng: 105.8192, label: 'Long An' },
  { lat: 10.1845, lng: 106.3895, label: 'Bến Tre' },
  { lat: 11.3167, lng: 106.098, label: 'Tây Ninh' },
  { lat: 11.0833, lng: 106.6667, label: 'Bình Phước' },
  { lat: 20.251, lng: 105.4623, label: 'Thanh Hóa' },
  { lat: 21.3385, lng: 105.7542, label: 'Bắc Giang' },
  { lat: 21.8533, lng: 106.7606, label: 'Lạng Sơn' },
  { lat: 22.4863, lng: 103.9712, label: 'Lào Cai (Sa Pa)' },
  { lat: 21.3127, lng: 103.9125, label: 'Sơn La' },
  { lat: 21.4039, lng: 103.0476, label: 'Điện Biên' },
  { lat: 21.8231, lng: 104.0874, label: 'Yên Bái' },
  { lat: 21.6809, lng: 105.7586, label: 'Thái Nguyên' },
  { lat: 21.5929, lng: 105.8695, label: 'Bắc Kạn' },
  { lat: 22.1456, lng: 105.8368, label: 'Tuyên Quang' },
  { lat: 22.6676, lng: 104.9905, label: 'Hà Giang' },
  { lat: 22.7441, lng: 105.6745, label: 'Cao Bằng' },
  { lat: 22.3845, lng: 103.9674, label: 'Lai Châu' },
];

export function LocationPicker({ onClose, onSelect, visible }: LocationPickerProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return LOCATIONS;
    const q = search.trim().toLowerCase();
    return LOCATIONS.filter((p) => p.label.toLowerCase().includes(q));
  }, [search]);

  function handleSelect(option: LocationOption) {
    onSelect(option);
    setSearch('');
  }

  function handleClose() {
    setSearch('');
    onClose();
  }

  return (
    <Modal
      animationType="slide"
      onRequestClose={handleClose}
      transparent
      visible={visible}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handleRow}>
            <View style={styles.handle} />
          </View>

          <Text style={styles.title}>Chọn vị trí</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              aria-label="Tìm địa điểm, đường, quận, thành phố..."
              onChangeText={setSearch}
              placeholder="Tìm địa điểm, đường, quận, thành phố..."
              placeholderTextColor={oklchToRgba(Colors.muted)}
              style={styles.searchInput}
              value={search}
            />
          </View>

          <Pressable
            accessibilityLabel="Sử dụng vị trí hiện tại"
            accessibilityRole="button"
            onPress={() => handleSelect(CURRENT_LOCATION_OPTION)}
            style={({ pressed }) => [
              styles.currentLocationRow,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={styles.currentLocationIcon}>📡</Text>
            <Text style={styles.currentLocationText}>Sử dụng GPS của thiết bị</Text>
          </Pressable>

          <FlatList
            data={filtered}
            keyExtractor={(item) => item.label}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                accessibilityLabel={item.label}
                accessibilityRole="button"
                onPress={() => handleSelect(item)}
                style={({ pressed }) => [
                  styles.option,
                  { backgroundColor: pressed ? oklchToRgba(Colors.accentDim) : undefined },
                ]}
              >
                <Text style={styles.optionText}>{item.label}</Text>
              </Pressable>
            )}
            style={styles.list}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '80%',
    backgroundColor: oklchToRgba(Colors.bg),
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    paddingBottom: Spacing.xl,
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: Spacing.sm2,
    paddingBottom: Spacing.xs,
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: Radius.full,
    backgroundColor: oklchToRgba(Colors.border),
  },
  title: {
    fontFamily: Typography.screenTitle.family,
    fontSize: Typography.screenTitle.fontSize,
    fontWeight: Typography.screenTitle.fontWeight,
    color: oklchToRgba(Colors.fg),
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'web' ? 10 : 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: oklchToRgba(Colors.border),
    backgroundColor: oklchToRgba(Colors.surface),
    gap: Spacing.sm,
  },
  searchIcon: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    fontFamily: Typography.cardSubtitle.family,
    fontSize: 16,
    color: oklchToRgba(Colors.fg),
    padding: 0,
    outlineStyle: 'none',
    ...(Platform.OS === 'web' ? { outline: 'none' } : {}),
  },
  currentLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.sm2,
    borderBottomWidth: 1,
    borderBottomColor: oklchToRgba(Colors.border),
    gap: Spacing.sm2,
    minHeight: 44,
  },
  currentLocationIcon: {
    fontSize: 18,
  },
  currentLocationText: {
    fontFamily: Typography.cardSubtitle.family,
    fontSize: Typography.cardSubtitle.fontSize,
    fontWeight: '600',
    color: oklchToRgba(Colors.accent),
  },
  list: {
    maxHeight: 500,
  },
  option: {
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  optionText: {
    fontFamily: Typography.cardSubtitle.family,
    fontSize: Typography.cardSubtitle.fontSize,
    color: oklchToRgba(Colors.fg),
  },
});
