import { describe, expect, it } from "vitest";
import { LlmDishResponseSchema } from "../src/api/recipes/recipesValidation.js";

describe("recipesValidation", () => {
  it("accepts DeepSeek-style decimal quantities and numeric parallel groups", () => {
    const result = LlmDishResponseSchema.parse({
      dishes: [
        {
          dishId: "ga-xao-gung",
          name: "Gà xào gừng",
          nameEn: "Ginger chicken stir-fry",
          cuisine: "Việt Nam",
          matchPercentage: 95,
          cookTimeMinutes: 25,
          caloriesPerServing: 350,
          tags: ["Việt Nam", "Có thịt"],
          imageDescription: "Đĩa gà xào gừng thơm lừng",
          ingredients: [
            { name: "Thịt gà", quantity: 300, unit: "g" },
            { name: "Tiêu", quantity: 0.5, unit: "muỗng cà phê" },
          ],
          steps: [
            {
              label: "Sơ chế nguyên liệu",
              durationMinutes: 10,
              parallelGroup: 1,
            },
            { label: "Xào gà chín vàng", durationMinutes: 8 },
          ],
          totalCookTimeMinutes: 25,
        },
      ],
    });

    expect(result.dishes[0]?.ingredients[1]?.quantity).toBe(0.5);
    expect(result.dishes[0]?.steps[0]?.parallelGroup).toBe("1");
  });
});
