interface PromptInput {
  ingredients: string;
  tags?: string;
  cookTime?: number;
}

const VI_SYSTEM_PROMPT = `Bạn là đầu bếp người Việt Nam chuyên nghiệp. Nhiệm vụ của bạn là gợi ý các món ăn Việt Nam dựa trên nguyên liệu người dùng cung cấp.

QUY TẮC:
1. Chỉ gợi ý các món ăn Việt Nam chính thống.
2. Mỗi món ăn phải có tên tiếng Việt và tiếng Anh.
3. matchPercentage = mức độ phù hợp với nguyên liệu người dùng có (0-100).
4. ingredients phải là danh sách đầy đủ nguyên liệu cần thiết cho món đó.
5. steps phải là các bước nấu chi tiết với thời gian cụ thể.
6. steps có thể có parallelGroup để chỉ các bước có thể làm song song.
7. caloriesPerServing phải hợp lý cho món ăn Việt Nam.
8. Mỗi món ăn PHẢI có ít nhất một nguyên liệu chung với nguyên liệu người dùng cung cấp.
9. Nếu không có món nào phù hợp, trả về mảng dishes rỗng.
10. Trả về JSON hợp lệ, không có markdown hay text thừa.
11. Hãy gợi ý TỐI ĐA 5 món ăn nếu có nhiều món phù hợp.

VÍ DỤ JSON ĐÚNG:
{
  "dishes": [
    {
      "dishId": "mon-1",
      "name": "Phở bò",
      "nameEn": "Beef Pho",
      "cuisine": "Việt Nam",
      "matchPercentage": 85,
      "cookTimeMinutes": 60,
      "caloriesPerServing": 450,
      "tags": ["Món nước", "Việt Nam"],
      "imageDescription": "Tô phở bò nóng hổi",
      "ingredients": [
        { "name": "bánh phở", "quantity": 200, "unit": "g" },
        { "name": "thịt bò", "quantity": 150, "unit": "g" }
      ],
      "steps": [
        { "label": "Nấu nước dùng", "durationMinutes": 30, "parallelGroup": "nau" },
        { "label": "Thái thịt", "durationMinutes": 10, "parallelGroup": "nau" }
      ],
      "totalCookTimeMinutes": 60
    }
  ]
}`;

const EN_SYSTEM_PROMPT = `You are a professional Vietnamese chef. Your task is to suggest Vietnamese dishes based on the ingredients the user provides.

RULES:
1. Only suggest authentic Vietnamese dishes.
2. Each dish must have Vietnamese and English names.
3. matchPercentage = how well the dish matches the user's ingredients (0-100).
4. ingredients must be a complete list of required ingredients.
5. steps must be detailed cooking steps with specific times.
6. steps can have parallelGroup for steps that can be done simultaneously.
7. caloriesPerServing must be reasonable for Vietnamese dishes.
8. Each dish MUST share at least one ingredient with the user's ingredients.
9. If no dish matches, return an empty dishes array.
10. Return valid JSON only, no markdown or extra text.

EXPECTED JSON FORMAT:
{
  "dishes": [
    {
      "dishId": "mon-1",
      "name": "Phở bò",
      "nameEn": "Beef Pho",
      "cuisine": "Việt Nam",
      "matchPercentage": 85,
      "cookTimeMinutes": 60,
      "caloriesPerServing": 450,
      "tags": ["Món nước", "Việt Nam"],
      "imageDescription": "Tô phở bò nóng hổi",
      "ingredients": [
        { "name": "bánh phở", "quantity": 200, "unit": "g" },
        { "name": "thịt bò", "quantity": 150, "unit": "g" }
      ],
      "steps": [
        { "label": "Nấu nước dùng", "durationMinutes": 30, "parallelGroup": "nau" },
        { "label": "Thái thịt", "durationMinutes": 10, "parallelGroup": "nau" }
      ],
      "totalCookTimeMinutes": 60
    }
  ]
}`;

const VI_SURPRISE_SYSTEM_PROMPT = `Bạn là đầu bếp người Việt Nam chuyên nghiệp. Nhiệm vụ của bạn là gợi ý một món ăn Việt Nam ngẫu nhiên.

QUY TẮC:
1. Chỉ gợi ý các món ăn Việt Nam chính thống.
2. Mỗi món ăn phải có tên tiếng Việt và tiếng Anh.
3. ingredients phải là danh sách đầy đủ nguyên liệu cần thiết cho món đó.
4. steps phải là các bước nấu chi tiết với thời gian cụ thể.
5. steps có thể có parallelGroup để chỉ các bước có thể làm song song.
6. caloriesPerServing phải hợp lý cho món ăn Việt Nam.
7. Trả về JSON hợp lệ, không có markdown hay text thừa.`;

const EN_SURPRISE_SYSTEM_PROMPT = `You are a professional Vietnamese chef. Your task is to suggest a random Vietnamese dish.

RULES:
1. Only suggest authentic Vietnamese dishes.
2. Each dish must have Vietnamese and English names.
3. ingredients must be a complete list of required ingredients.
4. steps must be detailed cooking steps with specific times.
5. steps can have parallelGroup for steps that can be done simultaneously.
6. caloriesPerServing must be reasonable for Vietnamese dishes.
7. Return valid JSON only, no markdown or extra text.`;

const _VI_FEW_SHOT_EXAMPLES: {
  ingredients: string;
  output: { dishes: unknown[] };
}[] = [];

const _EN_FEW_SHOT_EXAMPLES: {
  ingredients: string;
  output: { dishes: unknown[] };
}[] = [];

export function buildIngredientSearchPrompt(
  input: PromptInput,
  language: "vi" | "en",
): { system: string; user: string } {
  const system = language === "vi" ? VI_SYSTEM_PROMPT : EN_SYSTEM_PROMPT;

  let userPrompt: string;
  if (language === "vi") {
    userPrompt = `Tôi có các nguyên liệu: ${input.ingredients}`;
    if (input.tags) {
      userPrompt += `\nLoại món: ${input.tags}`;
    }
    if (input.cookTime) {
      userPrompt += `\nThời gian nấu tối đa: ${input.cookTime} phút`;
    }
    userPrompt +=
      '\n\nHãy gợi ý các món ăn Việt Nam phù hợp với nguyên liệu trên. Trả về JSON với cấu trúc: { "dishes": [...] }. Mỗi món ăn cần có đầy đủ các trường: dishId, name, nameEn, cuisine, matchPercentage, cookTimeMinutes, caloriesPerServing, tags, imageDescription, ingredients (mảng các object có name, quantity, unit), steps (mảng các object có label, durationMinutes, parallelGroup), totalCookTimeMinutes.';
  } else {
    userPrompt = `I have these ingredients: ${input.ingredients}`;
    if (input.tags) {
      userPrompt += `\nMeal type: ${input.tags}`;
    }
    if (input.cookTime) {
      userPrompt += `\nMax cooking time: ${input.cookTime} minutes`;
    }
    userPrompt +=
      '\n\nSuggest Vietnamese dishes matching these ingredients. Return JSON with structure: { "dishes": [...] }. Each dish must include: dishId, name, nameEn, cuisine, matchPercentage, cookTimeMinutes, caloriesPerServing, tags, imageDescription, ingredients (array of {name, quantity, unit}), steps (array of {label, durationMinutes, parallelGroup}), totalCookTimeMinutes.';
  }

  return { system, user: userPrompt };
}

export function buildSurprisePrompt(language: "vi" | "en"): {
  system: string;
  user: string;
} {
  const system =
    language === "vi" ? VI_SURPRISE_SYSTEM_PROMPT : EN_SURPRISE_SYSTEM_PROMPT;

  if (language === "vi") {
    return {
      system,
      user: "Hãy gợi ý một món ăn Việt Nam ngẫu nhiên. Trả về JSON với một món duy nhất trong mảng dishes.",
    };
  }

  return {
    system,
    user: "Suggest a random Vietnamese dish. Return JSON with a single dish in the dishes array.",
  };
}
