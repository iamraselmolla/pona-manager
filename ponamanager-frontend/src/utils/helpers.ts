// src/utils/helpers.ts
import dayjs from 'dayjs';
import 'dayjs/locale/bn';

export const formatCurrency = (amount: number, isBengali = false): string => {
  if (isBengali) {
    return `৳${amount.toLocaleString('bn-BD')}`;
  }
  return `৳${amount.toLocaleString('en-IN')}`;
};

export const formatDate = (date: string, format = 'DD MMM YYYY'): string => {
  return dayjs(date).format(format);
};

export const formatDateTime = (date: string): string => {
  return dayjs(date).format('DD MMM YYYY, hh:mm A');
};

export const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

export const calculateDue = (totalPrice: number, advance: number, payments: number): number => {
  return Math.max(0, totalPrice - advance - payments);
};

export const calculateMirPercentage = (ordered: number, delivered: number): number => {
  if (ordered === 0) return 0;
  return ((ordered - delivered) / ordered) * 100;
};

export const calculateFinalAmount = (
  deliveredQty: number,
  rate: number,
  discount: number
): number => {
  return deliveredQty * rate - discount;
};

export const calculateProfitLoss = (
  finalAmount: number,
  companyProvidedCost: number,
  expenses: number
): number => {
  return finalAmount - companyProvidedCost - expenses;
};

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const getTodayDate = (): string => {
  return dayjs().format('YYYY-MM-DD');
};

export const getMonthYear = (date?: string): { month: string; year: string } => {
  const d = date ? dayjs(date) : dayjs();
  return { month: d.format('MM'), year: d.format('YYYY') };
};

export const validateMobile = (mobile: string): boolean => {
  return /^01[3-9]\d{8}$/.test(mobile);
};

export const getPonaTypeColor = (type: string): string => {
  switch (type) {
    case 'Golda PL': return '#F5A623';
    case 'Bagda PL': return '#1E88E5';
    case 'Vannamei PL': return '#43A047';
    default: return '#8A9A8A';
  }
};
