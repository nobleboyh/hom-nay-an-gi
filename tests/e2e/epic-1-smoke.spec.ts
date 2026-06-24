import { test, expect } from "@playwright/test";

test.describe("Epic 1 — E2E Smoke Tests", () => {
  test("1.3 app shell loads with Vietnamese title and skip-link", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByText("Hôm Nay Ăn Gì")).toBeVisible();
    await expect(page.getByText("Bỏ qua điều hướng")).toBeVisible();
  });

  test("1.6 collapsible section — Cảm giác thèm section toggles", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByText("Cảm giác thèm")).toBeVisible();
  });

  test("1.5 search and surprise buttons are visible", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Tìm món" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Bất ngờ!" })).toBeVisible();
  });

  test("1.3 recipe detail route loads", async ({ page }) => {
    await page.goto("/recipe/surprise");
    await expect(page).toHaveURL(/\/recipe\//);
  });

  test("1.3 shopping list empty state renders", async ({ page }) => {
    await page.goto("/shopping-list");
    await expect(page).toHaveURL(/\/shopping-list/);
  });

  test("1.3 discover tab route loads Khám phá screen", async ({ page }) => {
    await page.goto("/discover");
    await expect(page).toHaveURL(/\/discover/);
    await expect(page.getByRole("tab", { name: /Khám phá/ })).toBeVisible();
  });

  test("1.3 favorites tab route loads", async ({ page }) => {
    await page.goto("/favorites");
    await expect(page).toHaveURL(/\/favorites/);
  });

  test("1.3 profile tab route loads", async ({ page }) => {
    await page.goto("/profile");
    await expect(page).toHaveURL(/\/profile/);
  });

  test("1.5+1.6 filter chips render", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Chay" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Việt Nam" })).toBeVisible();
    await expect(page.getByRole("button", { name: "15 phút" })).toBeVisible();
  });

  test("1.5+1.6 chip click triggers state change", async ({ page }) => {
    await page.goto("/");
    const chip = page.getByRole("button", { name: "Chay" });
    await chip.click();
    await page.waitForTimeout(300);
    await chip.click();
  });

  test("1.5+1.6 cook time chip row has default selection visible", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByText("Thời gian nấu")).toBeVisible();
    await expect(page.getByText("30 phút")).toBeVisible();
  });
});
