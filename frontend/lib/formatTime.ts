import { getLanguage } from './i18n';

export function formatTime(minutes: number): string {
  const language = getLanguage();
  return language === 'en' ? `${minutes} min` : `${minutes} phút`;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  const km = (meters / 1000).toFixed(1);
  return `${km}km`;
}
