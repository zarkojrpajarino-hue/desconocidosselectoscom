import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * FASE 2: Consolidación de utilidades de fecha
 * Evita código duplicado en 8+ archivos
 */

export const formatDate = (date: string | Date, formatStr = "d 'de' MMMM, yyyy") => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, formatStr, { locale: es });
};

export const formatDateTime = (date: string | Date) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, "d/MM/yyyy 'a las' HH:mm", { locale: es });
};

export const formatTime = (time: string) => {
  return time.substring(0, 5); // HH:MM
};

export const formatShortDate = (dateStr: string, dayName: string) => {
  const date = new Date(dateStr);
  return `${dayName} ${date.getDate()} ${date.toLocaleDateString('es-ES', { month: 'short' })}`;
};

export const getDayName = (date: Date) => {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return days[date.getDay()];
};

export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
};