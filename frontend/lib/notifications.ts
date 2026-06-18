import {
  scheduleNotificationAsync,
  cancelScheduledNotificationAsync,
  getAllScheduledNotificationsAsync,
  getPermissionsAsync,
  requestPermissionsAsync,
  SchedulableTriggerInputTypes,
} from 'expo-notifications';

const NOTIFICATION_CONTENT: Record<string, { title: string; body: string }> = {
  breakfast: { title: 'Hôm Nay Ăn Gì', body: 'Đến giờ ăn sáng! Khám phá món ngon ngay.' },
  lunch: { title: 'Hôm Nay Ăn Gì', body: 'Đến giờ ăn trưa! Khám phá món ngon ngay.' },
  dinner: { title: 'Hôm Nay Ăn Gì', body: 'Đến giờ ăn tối! Khám phá món ngon ngay.' },
  'suggestion-daily': { title: 'Gợi ý món ngon', body: 'Hôm nay thử món {dishName} nhé!' },
};

const DEFAULTS: Record<string, { hour: number; minute: number }> = {
  breakfast: { hour: 7, minute: 0 },
  lunch: { hour: 11, minute: 30 },
  dinner: { hour: 18, minute: 0 },
  'suggestion-daily': { hour: 9, minute: 0 },
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export async function scheduleMealReminder(
  mealType: 'breakfast' | 'lunch' | 'dinner',
  hour?: number,
  minute?: number,
): Promise<void> {
  await cancelMealReminder(mealType);
  const h = clamp(hour ?? DEFAULTS[mealType].hour, 0, 23);
  const m = clamp(minute ?? DEFAULTS[mealType].minute, 0, 59);
  const content = NOTIFICATION_CONTENT[mealType];
  await scheduleNotificationAsync({
    content: { title: content.title, body: content.body, data: { type: 'meal', mealType } },
    trigger: { type: SchedulableTriggerInputTypes.DAILY, hour: h, minute: m },
  });
}

export async function cancelMealReminder(mealType: 'breakfast' | 'lunch' | 'dinner'): Promise<void> {
  const scheduled = await getAllScheduledNotificationsAsync();
  await Promise.allSettled(
    scheduled
      .filter((n) => n.content.data?.type === 'meal' && n.content.data?.mealType === mealType)
      .map((n) => cancelScheduledNotificationAsync(n.identifier)),
  );
}

export async function scheduleDailySuggestion(
  hour?: number,
  minute?: number,
  dishName?: string,
): Promise<void> {
  await cancelDailySuggestion();
  const h = clamp(hour ?? DEFAULTS['suggestion-daily'].hour, 0, 23);
  const m = clamp(minute ?? DEFAULTS['suggestion-daily'].minute, 0, 59);
  const content = NOTIFICATION_CONTENT['suggestion-daily'];
  const body = dishName
    ? content.body.replace('{dishName}', dishName)
    : 'Hôm nay thử món này nhé! Khám phá món mới.';
  await scheduleNotificationAsync({
    content: { title: content.title, body, data: { type: 'suggestion' } },
    trigger: { type: SchedulableTriggerInputTypes.DAILY, hour: h, minute: m },
  });
}

export async function cancelDailySuggestion(): Promise<void> {
  const scheduled = await getAllScheduledNotificationsAsync();
  await Promise.allSettled(
    scheduled
      .filter((n) => n.content.data?.type === 'suggestion')
      .map((n) => cancelScheduledNotificationAsync(n.identifier)),
  );
}

export async function requestNotificationPermissions(): Promise<{ granted: boolean; canAskAgain: boolean }> {
  const existing = await getPermissionsAsync();
  if (existing.granted) return { granted: true, canAskAgain: true };
  if (existing.canAskAgain) {
    const result = await requestPermissionsAsync();
    return { granted: result.granted, canAskAgain: result.canAskAgain };
  }
  return { granted: false, canAskAgain: false };
}
