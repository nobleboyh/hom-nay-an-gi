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
8. Trả về JSON hợp lệ, không có markdown hay text thừa.`;

const EN_SYSTEM_PROMPT = `You are a professional Vietnamese chef. Your task is to suggest Vietnamese dishes based on the ingredients the user provides.

RULES:
1. Only suggest authentic Vietnamese dishes.
2. Each dish must have Vietnamese and English names.
3. matchPercentage = how well the dish matches the user's ingredients (0-100).
4. ingredients must be a complete list of required ingredients.
5. steps must be detailed cooking steps with specific times.
6. steps can have parallelGroup for steps that can be done simultaneously.
7. caloriesPerServing must be reasonable for Vietnamese dishes.
8. Return valid JSON only, no markdown or extra text.`;

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

const VI_FEW_SHOT_EXAMPLES = [
  {
    ingredients: "thịt gà, bông cải, trứng",
    output: {
      dishes: [
        {
          dishId: "example-ga-xao-sa-ot",
          name: "Gà Xào Sả Ớt",
          nameEn: "Lemongrass Chili Chicken",
          cuisine: "Miền Nam",
          matchPercentage: 82,
          cookTimeMinutes: 30,
          caloriesPerServing: 420,
          tags: ["món mặn", "thịt gà", "xào"],
          imageDescription: "Thịt gà vàng óng với sả ớt trên đĩa trắng",
          ingredients: [
            { name: "Thịt gà", quantity: 300, unit: "g" },
            { name: "Bông cải", quantity: 200, unit: "g" },
            { name: "Trứng", quantity: 2, unit: "quả" },
          ],
          steps: [
            { label: "Sơ chế nguyên liệu", durationMinutes: 10 },
            { label: "Xào gà với sả ớt", durationMinutes: 15 },
            { label: "Hoàn thiện và trình bày", durationMinutes: 5 },
          ],
          totalCookTimeMinutes: 30,
        },
      ],
    },
  },
];

const EN_FEW_SHOT_EXAMPLES = [
  {
    ingredients: "chicken, broccoli, eggs",
    output: {
      dishes: [
        {
          dishId: "example-ga-xao-sa-ot",
          name: "Gà Xào Sả Ớt",
          nameEn: "Lemongrass Chili Chicken",
          cuisine: "Southern",
          matchPercentage: 82,
          cookTimeMinutes: 30,
          caloriesPerServing: 420,
          tags: ["savory", "chicken", "stir-fry"],
          imageDescription:
            "Golden chicken with lemongrass and chili on a white plate",
          ingredients: [
            { name: "Chicken", quantity: 300, unit: "g" },
            { name: "Broccoli", quantity: 200, unit: "g" },
            { name: "Eggs", quantity: 2, unit: "pieces" },
          ],
          steps: [
            { label: "Prep ingredients", durationMinutes: 10 },
            { label: "Stir-fry chicken with lemongrass and chili", durationMinutes: 15 },
            { label: "Plate and serve", durationMinutes: 5 },
          ],
          totalCookTimeMinutes: 30,
        },
      ],
    },
  },
];

export function buildIngredientSearchPrompt(
  input: PromptInput,
  language: "vi" | "en",
): { system: string; user: string } {
  const system = language === "vi" ? VI_SYSTEM_PROMPT : EN_SYSTEM_PROMPT;
  const examples =
    language === "vi" ? VI_FEW_SHOT_EXAMPLES : EN_FEW_SHOT_EXAMPLES;

  const exampleOutput = examples[0]?.output;
  const exampleJson =
    exampleOutput !== undefined ? JSON.stringify(exampleOutput, null, 2) : "";

  let userPrompt: string;
  if (language === "vi") {
    userPrompt = `Tôi có các nguyên liệu: ${input.ingredients}`;
    if (input.tags) {
      userPrompt += `\nLoại món: ${input.tags}`;
    }
    if (input.cookTime !== undefined) {
      userPrompt += `\nThời gian nấu tối đa: ${input.cookTime} phút`;
    }
    userPrompt +=
      "\n\nHãy gợi ý các món ăn Việt Nam phù hợp. Trả về JSON theo đúng schema.";
    if (exampleJson) {
      userPrompt += `\n\nVí dụ:\n${exampleJson}`;
    }
  } else {
    userPrompt = `I have these ingredients: ${input.ingredients}`;
    if (input.tags) {
      userPrompt += `\nMeal type: ${input.tags}`;
    }
    if (input.cookTime !== undefined) {
      userPrompt += `\nMax cooking time: ${input.cookTime} minutes`;
    }
    userPrompt +=
      "\n\nSuggest matching Vietnamese dishes. Return JSON matching the schema.";
    if (exampleJson) {
      userPrompt += `\n\nExample:\n${exampleJson}`;
    }
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
