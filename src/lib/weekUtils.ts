/**
 * Utility functions for personalized week management
 * Each user configures their preferred week start day (0=Sunday, 1=Monday, ..., 6=Saturday)
 */

export interface UserWeekPreferences {
  preferredWeekStartDay: number; // 0-6
  personalWeekStart?: Date | null; // When their current week cycle started
}

/**
 * Calculate the start of the current week based on user's preferred start day
 */
export const getCurrentWeekStart = (
  fromDate: Date = new Date(),
  preferredStartDay: number = 1 // Default Monday
): Date => {
  const date = new Date(fromDate);
  const dayOfWeek = date.getDay();
  
  // Calculate days since preferred start day
  let daysSinceStart = (dayOfWeek - preferredStartDay + 7) % 7;
  
  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() - daysSinceStart);
  weekStart.setHours(0, 0, 0, 0);
  
  return weekStart;
};

/**
 * Calculate the end of the current week based on user's preferred start day
 */
export const getCurrentWeekEnd = (
  fromDate: Date = new Date(),
  preferredStartDay: number = 1
): Date => {
  const weekStart = getCurrentWeekStart(fromDate, preferredStartDay);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  
  return weekEnd;
};

/**
 * Get the next week start date based on user's preferred start day
 */
export const getNextWeekStart = (
  fromDate: Date = new Date(),
  preferredStartDay: number = 1
): Date => {
  const currentWeekStart = getCurrentWeekStart(fromDate, preferredStartDay);
  const nextWeekStart = new Date(currentWeekStart);
  nextWeekStart.setDate(currentWeekStart.getDate() + 7);
  
  return nextWeekStart;
};

/**
 * Check if a date falls within the current week based on user's preferences
 */
export const isInCurrentWeek = (
  date: Date,
  preferredStartDay: number = 1,
  fromDate: Date = new Date()
): boolean => {
  const weekStart = getCurrentWeekStart(fromDate, preferredStartDay);
  const weekEnd = getCurrentWeekEnd(fromDate, preferredStartDay);
  
  return date >= weekStart && date <= weekEnd;
};

/**
 * Calculate which week number a date falls into relative to a starting point
 */
export const getWeekNumber = (
  date: Date,
  startingPoint: Date,
  preferredStartDay: number = 1
): number => {
  const dateWeekStart = getCurrentWeekStart(date, preferredStartDay);
  const startWeekStart = getCurrentWeekStart(startingPoint, preferredStartDay);
  
  const diffTime = dateWeekStart.getTime() - startWeekStart.getTime();
  const diffWeeks = Math.floor(diffTime / (7 * 24 * 60 * 60 * 1000));
  
  return diffWeeks + 1; // Week 1, 2, 3...
};

/**
 * Get the ISO week number for a given date
 */
export const getISOWeekNumber = (date: Date = new Date()): number => {
  const tempDate = new Date(date.getTime());
  tempDate.setHours(0, 0, 0, 0);
  tempDate.setDate(tempDate.getDate() + 3 - (tempDate.getDay() + 6) % 7);
  const week1 = new Date(tempDate.getFullYear(), 0, 4);
  return 1 + Math.round(((tempDate.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
};

/**
 * Format week range for display
 */
export const formatWeekRange = (
  fromDate: Date = new Date(),
  preferredStartDay: number = 1,
  locale: string = 'es-ES'
): string => {
  const weekStart = getCurrentWeekStart(fromDate, preferredStartDay);
  const weekEnd = getCurrentWeekEnd(fromDate, preferredStartDay);
  
  const formatOptions: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short'
  };
  
  const startStr = weekStart.toLocaleDateString(locale, formatOptions);
  const endStr = weekEnd.toLocaleDateString(locale, formatOptions);
  
  return `${startStr} - ${endStr}`;
};

/**
 * Get the day name for a given day number
 */
export const getDayName = (dayNumber: number, locale: string = 'es-ES'): string => {
  const days: Record<string, string[]> = {
    'es-ES': ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
    'en-US': ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  };
  
  return days[locale]?.[dayNumber] || days['es-ES'][dayNumber];
};

/**
 * Check if a week has passed since a given date based on user preferences
 */
export const hasWeekPassed = (
  sinceDate: Date,
  preferredStartDay: number = 1,
  fromDate: Date = new Date()
): boolean => {
  const sinceWeekStart = getCurrentWeekStart(sinceDate, preferredStartDay);
  const currentWeekStart = getCurrentWeekStart(fromDate, preferredStartDay);
  
  return currentWeekStart > sinceWeekStart;
};

/**
 * Get all week start dates for a given date range
 */
export const getWeekStartsInRange = (
  startDate: Date,
  endDate: Date,
  preferredStartDay: number = 1
): Date[] => {
  const weeks: Date[] = [];
  let currentWeek = getCurrentWeekStart(startDate, preferredStartDay);
  
  while (currentWeek <= endDate) {
    weeks.push(new Date(currentWeek));
    currentWeek.setDate(currentWeek.getDate() + 7);
  }
  
  return weeks;
};

// Legacy exports for backward compatibility (deprecated - use personalized versions)
export const getCurrentWeekDeadline = (fromDate: Date = new Date()): Date => {
  const weekStart = getCurrentWeekStart(fromDate, 1);
  const deadline = new Date(weekStart);
  deadline.setDate(weekStart.getDate() + 7);
  deadline.setHours(10, 30, 0, 0);
  return deadline;
};

export const isWeekActive = (fromDate: Date = new Date()): boolean => {
  const now = fromDate;
  const deadline = getCurrentWeekDeadline(now);
  return now < deadline;
};
