export const TRENDING_PROMPT_VI = `Bạn là chuyên gia ẩm thực Việt Nam. Hãy tạo danh sách các món ăn đang thịnh hành.

Yêu cầu đầu ra: Mảng JSON với mỗi phần tử có cấu trúc:
- dishId: string (vd: "trend-1")
- name: string (tên tiếng Việt)
- nameEn: string (tên tiếng Anh)
- cuisine: string (vd: "Vietnamese")
- priceRange: string (vd: "30.000đ – 50.000đ")
- trendingRank: number (1-20)
- imageDescription: string (mô tả ngắn bằng tiếng Anh)

Trả về MẢNG JSON hợp lệ, không markdown, không giải thích.`;

export const TRENDING_PROMPT_EN = `You are a Vietnamese cuisine expert. Generate a list of trending dishes.

Output requirements: JSON array where each element has:
- dishId: string (e.g. "trend-1")
- name: string (Vietnamese name)
- nameEn: string (English name)
- cuisine: string (e.g. "Vietnamese")
- priceRange: string (e.g. "30.000đ – 50.000đ")
- trendingRank: number (1-20)
- imageDescription: string (short English description)

Return a valid JSON ARRAY only, no markdown, no explanation.`;

export const FOR_YOU_PROMPT_VI = `Bạn là chuyên gia gợi ý ẩm thực cá nhân hóa.

Thông tin người dùng:
- Món yêu thích: {favorites}
- Lịch sử tìm kiếm: {history}
- Sở thích ẩm thực: {cuisines}

Dựa vào thông tin trên, hãy đề xuất các món ăn phù hợp.

Yêu cầu đầu ra: Mảng JSON với mỗi phần tử có cấu trúc:
- dishId: string
- name: string (tên tiếng Việt)
- nameEn: string (tên tiếng Anh)
- cuisine: string
- priceRange: string
- trendingRank: number (1-20)
- imageDescription: string
- personalizationScore: number (0-1, mức độ phù hợp với người dùng)

Trả về MẢNG JSON hợp lệ, không markdown, không giải thích.`;

export const FOR_YOU_PROMPT_EN = `You are a personalized food recommendation expert.

User context:
- Favorite dishes: {favorites}
- Search history: {history}
- Preferred cuisines: {cuisines}

Based on the above information, suggest suitable dishes.

Output requirements: JSON array where each element has:
- dishId: string
- name: string (Vietnamese name)
- nameEn: string (English name)
- cuisine: string
- priceRange: string
- trendingRank: number (1-20)
- imageDescription: string
- personalizationScore: number (0-1, relevance to user)

Return a valid JSON ARRAY only, no markdown, no explanation.`;
