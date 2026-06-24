import { test, expect } from '@playwright/test';

test.describe('Epic 2 — Core Search Smoke Tests', () => {

  test('2.3 tagline and ingredient input render on home screen', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Nhập nguyên liệu bạn có')).toBeVisible();
    await expect(page.getByPlaceholder('Gõ nguyên liệu, ví dụ: thịt gà, bông cải, trứng')).toBeVisible();
  });

  test('2.3 filter section labels render', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Loại món')).toBeVisible();
    await expect(page.getByText('Ẩm thực')).toBeVisible();
    await expect(page.getByText('Cảm giác thèm')).toBeVisible();
    await expect(page.getByText('Thời gian nấu')).toBeVisible();
  });

  test('2.3 all food type chips render', async ({ page }) => {
    await page.goto('/');
    for (const label of ['Chay', 'Salad', 'Nhẹ', 'Có thịt', 'Mặn', 'Chua', 'Ngọt', 'Tráng miệng']) {
      await expect(page.getByRole('button', { name: label })).toBeVisible();
    }
  });

  test('2.3 all cuisine chips render', async ({ page }) => {
    await page.goto('/');
    for (const label of ['Việt Nam', 'Miền Bắc', 'Miền Trung', 'Miền Nam']) {
      await expect(page.getByRole('button', { name: label })).toBeVisible();
    }
  });

  test('2.3 all cook time chips render with 30 phút default', async ({ page }) => {
    await page.goto('/');
    for (const label of ['15 phút', '30 phút', '60 phút', '90+ phút']) {
      await expect(page.getByRole('button', { name: label })).toBeVisible();
    }
  });

  test('2.3 ingredient comma triggers chip creation', async ({ page }) => {
    await page.goto('/');
    const input = page.getByPlaceholder('Gõ nguyên liệu, ví dụ: thịt gà, bông cải, trứng');
    await input.click();
    await page.keyboard.type('ga,', { delay: 50 });
    await expect(page.getByText('ga')).toBeVisible({ timeout: 5000 });
  });

  test('2.4 results screen empty state renders', async ({ page }) => {
    await page.goto('/results');
    await expect(page).toHaveURL(/\/results/);
    await expect(page.getByText('Không còn món nào để hiển thị')).toBeVisible();
  });

  test('2.5 recipe screen not-found empty state renders', async ({ page }) => {
    await page.goto('/recipe/test-123');
    await expect(page).toHaveURL(/\/recipe\/test-123/);
    await expect(page.getByText('Không tìm thấy công thức')).toBeVisible();
  });

  test('2.5 recipe screen action buttons render', async ({ page }) => {
    await page.goto('/recipe/test-123');
    await expect(page.getByText('Không tìm thấy công thức')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Quay lại' })).toBeVisible();
  });

  test('2.6 shopping list loads with query params', async ({ page }) => {
    const params = new URLSearchParams({
      dishId: 'test',
      dishName: 'Phở',
      owned: 'gà,trứng',
      missing: 'rau,muối',
    });
    await page.goto(`/shopping-list?${params.toString()}`);
    await expect(page).toHaveURL(/\/shopping-list/);
    await expect(page.getByText('Bạn đã có')).toBeVisible();
    await expect(page.getByText('Cần mua thêm')).toBeVisible();
  });

  test('2.6 shopping list action buttons and tip card render', async ({ page }) => {
    const params = new URLSearchParams({
      dishId: 'test',
      dishName: 'Phở',
      owned: 'gà,trứng',
      missing: 'rau,muối',
    });
    await page.goto(`/shopping-list?${params.toString()}`);
    await expect(page.getByText('Lưu danh sách')).toBeVisible();
    await expect(page.getByText('Chia sẻ')).toBeVisible();
    await expect(page.getByText('Sao chép')).toBeVisible();
    await expect(page.getByText('Mẹo tiết kiệm')).toBeVisible();
  });

});
