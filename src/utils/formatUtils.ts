export const formatCurrency = (amount: number, locale: string = 'zh-CN', currency: string = 'CNY'): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

export const formatNumber = (num: number, minimumFractionDigits: number = 0): string => {
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits,
    maximumFractionDigits: 2,
  }).format(num);
};

export const formatPhone = (phone: string): string => {
  if (phone.length === 11) {
    return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1****$3');
  }
  return phone;
};

export const formatIdCard = (idCard: string): string => {
  if (idCard.length === 18) {
    return idCard.replace(/(\d{6})(\d{8})(\d{4})/, '$1********$3');
  }
  return idCard;
};

export const truncateText = (text: string, maxLength: number, suffix: string = '...'): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + suffix;
};

export const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    '待派车': 'bg-yellow-100 text-yellow-800',
    '已派车': 'bg-blue-100 text-blue-800',
    '已接运': 'bg-purple-100 text-purple-800',
    '已完成': 'bg-green-100 text-green-800',
    '已取消': 'bg-gray-100 text-gray-600',
    '空闲': 'bg-green-100 text-green-800',
    '使用中': 'bg-blue-100 text-blue-800',
    '维修中': 'bg-red-100 text-red-800',
    '已预约': 'bg-yellow-100 text-yellow-800',
    '待确认': 'bg-yellow-100 text-yellow-800',
    '已确认': 'bg-blue-100 text-blue-800',
    '进行中': 'bg-purple-100 text-purple-800',
    '待火化': 'bg-yellow-100 text-yellow-800',
    '火化中': 'bg-orange-100 text-orange-800',
    '有效': 'bg-green-100 text-green-800',
    '即将到期': 'bg-yellow-100 text-yellow-800',
    '已过期': 'bg-red-100 text-red-800',
    '已取出': 'bg-gray-100 text-gray-600',
    '待支付': 'bg-yellow-100 text-yellow-800',
    '部分支付': 'bg-blue-100 text-blue-800',
    '已支付': 'bg-green-100 text-green-800',
    '已退款': 'bg-gray-100 text-gray-600',
    '在岗': 'bg-green-100 text-green-800',
    '休假': 'bg-yellow-100 text-yellow-800',
    '离岗': 'bg-red-100 text-red-800',
    '已占用': 'bg-blue-100 text-blue-800',
    '已预留': 'bg-purple-100 text-purple-800',
  };
  return colorMap[status] || 'bg-gray-100 text-gray-600';
};

export const getStatusDotColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    '空闲': 'bg-green-500',
    '使用中': 'bg-blue-500',
    '维修中': 'bg-red-500',
    '已预约': 'bg-yellow-500',
    '已占用': 'bg-blue-500',
    '已预留': 'bg-purple-500',
    '在岗': 'bg-green-500',
    '休假': 'bg-yellow-500',
    '离岗': 'bg-red-500',
  };
  return colorMap[status] || 'bg-gray-500';
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const downloadFile = (content: string, filename: string, mimeType: string = 'text/plain'): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
