export function formatCOP(value: number): string {
  const num = Number(value) || 0;
  return '$' + num.toLocaleString('es-CO', { maximumFractionDigits: 0 });
}

export function formatTime12h(time24: string): string {
  if (!time24) return '';
  if (time24 === 'DIA_COMPLETO') return 'Jornada Completa';
  const match = time24.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return time24;
  const h = parseInt(match[1], 10);
  const m = match[2];
  const suffix = h >= 12 ? 'p. m.' : 'a. m.';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m} ${suffix}`;
}

export function formatDateLong(dateStr: string): string {
  if (!dateStr) return '';
  const clean = parseSheetDate(dateStr);
  const dt = new Date(`${clean}T12:00:00`);
  if (Number.isNaN(dt.getTime())) return dateStr;
  return dt.toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateShort(dateStr: string): string {
  if (!dateStr) return '';
  const clean = parseSheetDate(dateStr);
  const dt = new Date(`${clean}T12:00:00`);
  if (Number.isNaN(dt.getTime())) return dateStr;
  return dt.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function parseSheetDate(value: unknown): string {
  if (value === null || value === undefined || value === '') return '';
  const str = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
  const dmy = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmy) {
    const day = dmy[1].padStart(2, '0');
    const month = dmy[2].padStart(2, '0');
    return `${dmy[3]}-${month}-${day}`;
  }
  const dt = new Date(str.includes('T') ? str : `${str}T12:00:00`);
  if (!Number.isNaN(dt.getTime())) {
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const d = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return str;
}

export function getTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getNextOpenDateISO(mondayOpen = false, blockedDates: string[] = [], holidays: string[] = []): string {
  const dt = new Date();
  for (let i = 0; i < 30; i++) {
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const d = String(dt.getDate()).padStart(2, '0');
    const iso = `${y}-${m}-${d}`;
    const dayOfWeek = dt.getDay(); // 0 Sun, 1 Mon
    const isHoliday = holidays.includes(iso);
    const isBlocked = blockedDates.includes(iso);
    if (!isBlocked && (dayOfWeek !== 1 || mondayOpen || isHoliday)) {
      return iso;
    }
    dt.setDate(dt.getDate() + 1);
  }
  return getTodayISO();
}

export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'gxp-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
}

export function generateBookingCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `GXP-${suffix}`;
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('No se pudo leer el archivo seleccionado.'));
    reader.readAsDataURL(file);
  });
}

export function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

