import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

dayjs.locale('zh-cn');

export const formatDate = (date: string | Date, format: string = 'YYYY-MM-DD'): string => {
  return dayjs(date).format(format);
};

export const formatDateTime = (date: string | Date, format: string = 'YYYY-MM-DD HH:mm'): string => {
  return dayjs(date).format(format);
};

export const formatTime = (date: string | Date, format: string = 'HH:mm'): string => {
  return dayjs(date).format(format);
};

export const getToday = (): string => {
  return dayjs().format('YYYY-MM-DD');
};

export const getNow = (): string => {
  return dayjs().format('YYYY-MM-DD HH:mm:ss');
};

export const addDays = (date: string | Date, days: number): string => {
  return dayjs(date).add(days, 'day').format('YYYY-MM-DD');
};

export const addYears = (date: string | Date, years: number): string => {
  return dayjs(date).add(years, 'year').format('YYYY-MM-DD');
};

export const diffDays = (date1: string | Date, date2: string | Date): number => {
  return dayjs(date1).diff(dayjs(date2), 'day');
};

export const isExpiringSoon = (endDate: string, days: number = 30): boolean => {
  const diff = dayjs(endDate).diff(dayjs(), 'day');
  return diff >= 0 && diff <= days;
};

export const isExpired = (endDate: string): boolean => {
  return dayjs(endDate).isBefore(dayjs(), 'day');
};

export const getWeekDates = (date?: string | Date): Date[] => {
  const start = dayjs(date || getToday()).startOf('week');
  return Array.from({ length: 7 }, (_, i) => start.add(i, 'day').toDate());
};

export const getMonthDays = (date?: string | Date): Date[] => {
  const start = dayjs(date || getToday()).startOf('month');
  const daysInMonth = start.daysInMonth();
  return Array.from({ length: daysInMonth }, (_, i) => start.add(i, 'day').toDate());
};

export const getAge = (birthDate: string, deathDate: string): number => {
  return dayjs(deathDate).diff(dayjs(birthDate), 'year');
};

export const generateOrderNo = (prefix: string = 'JY'): string => {
  const date = dayjs().format('YYYYMMDD');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${date}${random}`;
};

export default dayjs;
