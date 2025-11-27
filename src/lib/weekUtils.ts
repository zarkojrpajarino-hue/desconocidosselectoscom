/**
 * Utility functions for week management
 * Weeks start on Wednesday at 13:30 and end the following Wednesday at 10:30
 */

export const getNextWednesdayStart = (fromDate: Date = new Date()): Date => {
  const date = new Date(fromDate);
  const dayOfWeek = date.getDay(); // 0 = Sunday, 3 = Wednesday
  
  // Calculate days until next Wednesday
  let daysUntilWednesday = (3 - dayOfWeek + 7) % 7;
  
  // If today is Wednesday, check if we're before or after 13:30
  if (dayOfWeek === 3) {
    const currentHour = date.getHours();
    const currentMinute = date.getMinutes();
    
    // If it's before 13:30, use today
    if (currentHour < 13 || (currentHour === 13 && currentMinute < 30)) {
      daysUntilWednesday = 0;
    } else {
      // If after 13:30, go to next Wednesday
      daysUntilWednesday = 7;
    }
  }
  
  const nextWednesday = new Date(date);
  nextWednesday.setDate(date.getDate() + daysUntilWednesday);
  nextWednesday.setHours(13, 30, 0, 0);
  
  return nextWednesday;
};

export const getCurrentWeekStart = (fromDate: Date = new Date()): Date => {
  const date = new Date(fromDate);
  const dayOfWeek = date.getDay();
  
  // If it's Wednesday after 13:30, the week just started
  if (dayOfWeek === 3) {
    const currentHour = date.getHours();
    const currentMinute = date.getMinutes();
    
    if (currentHour > 13 || (currentHour === 13 && currentMinute >= 30)) {
      const weekStart = new Date(date);
      weekStart.setHours(13, 30, 0, 0);
      return weekStart;
    }
  }
  
  // Calculate days since last Wednesday
  let daysSinceWednesday = (dayOfWeek - 3 + 7) % 7;
  if (daysSinceWednesday === 0) daysSinceWednesday = 7; // Last Wednesday
  
  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() - daysSinceWednesday);
  weekStart.setHours(13, 30, 0, 0);
  
  return weekStart;
};

export const getCurrentWeekDeadline = (fromDate: Date = new Date()): Date => {
  const weekStart = getCurrentWeekStart(fromDate);
  const deadline = new Date(weekStart);
  deadline.setDate(weekStart.getDate() + 7);
  deadline.setHours(10, 30, 0, 0); // Next Wednesday at 10:30
  
  return deadline;
};

export const isWeekActive = (fromDate: Date = new Date()): boolean => {
  const now = fromDate;
  const deadline = getCurrentWeekDeadline(now);
  
  return now < deadline;
};

export const getWeekNumber = (date: Date = new Date()): number => {
  const weekStart = getCurrentWeekStart(date);
  const startOfYear = new Date(weekStart.getFullYear(), 0, 1);
  const diff = weekStart.getTime() - startOfYear.getTime();
  const weekNumber = Math.ceil(diff / (7 * 24 * 60 * 60 * 1000));
  
  return weekNumber;
};
