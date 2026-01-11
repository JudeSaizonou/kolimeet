import { zonedTimeToUtc, utcToZonedTime, format as tzFormat } from 'date-fns-tz';
import { format as dateFnsFormat, parseISO, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Default timezone for the application
 * Users in France, Benin, etc.
 */
export const DEFAULT_TIMEZONE = 'Europe/Paris';

/**
 * Convert local date/time to UTC for storage in database
 * @param date - Date string or Date object in local timezone
 * @param timezone - User's timezone (defaults to Europe/Paris)
 * @returns ISO string in UTC
 */
export const toUTC = (date: string | Date, timezone: string = DEFAULT_TIMEZONE): string => {
  if (!date) return new Date().toISOString();
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) {
      console.error('Invalid date:', date);
      return new Date().toISOString();
    }
    return zonedTimeToUtc(dateObj, timezone).toISOString();
  } catch (error) {
    console.error('Error converting to UTC:', error);
    return new Date().toISOString();
  }
};

/**
 * Convert UTC date from database to local timezone for display
 * @param utcDate - UTC date string from database
 * @param timezone - User's timezone (defaults to Europe/Paris)
 * @returns Date object in local timezone
 */
export const fromUTC = (utcDate: string, timezone: string = DEFAULT_TIMEZONE): Date => {
  if (!utcDate) return new Date();
  
  try {
    const dateObj = parseISO(utcDate);
    if (!isValid(dateObj)) {
      console.error('Invalid UTC date:', utcDate);
      return new Date();
    }
    return utcToZonedTime(dateObj, timezone);
  } catch (error) {
    console.error('Error converting from UTC:', error);
    return new Date();
  }
};

/**
 * Format a date for display in French locale
 * @param date - Date string or Date object
 * @param formatStr - Format string (default: 'PPP' = 'jeudi 15 janvier 2026')
 * @param timezone - User's timezone (defaults to Europe/Paris)
 * @returns Formatted date string
 */
export const formatDate = (
  date: string | Date,
  formatStr: string = 'PPP',
  timezone: string = DEFAULT_TIMEZONE
): string => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) {
      console.error('Invalid date for formatting:', date);
      return '';
    }
    
    // Convert to local timezone before formatting
    const localDate = typeof date === 'string' && date.includes('Z')
      ? fromUTC(date, timezone)
      : dateObj;
    
    return dateFnsFormat(localDate, formatStr, { locale: fr });
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

/**
 * Format a date with time for display
 * @param date - Date string or Date object
 * @param timezone - User's timezone
 * @returns Formatted string like "15 janvier 2026 à 14:30"
 */
export const formatDateTime = (
  date: string | Date,
  timezone: string = DEFAULT_TIMEZONE
): string => {
  return formatDate(date, "d MMMM yyyy 'à' HH:mm", timezone);
};

/**
 * Format a date as relative time (e.g., "il y a 2 heures")
 * @param date - Date string or Date object
 * @returns Relative time string
 */
export const formatRelative = (date: string | Date): string => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return '';
    
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return "à l'instant";
    if (diffMins < 60) return `il y a ${diffMins} min`;
    if (diffHours < 24) return `il y a ${diffHours}h`;
    if (diffDays === 1) return 'hier';
    if (diffDays < 7) return `il y a ${diffDays} jours`;
    
    return formatDate(dateObj, 'd MMM');
  } catch (error) {
    console.error('Error formatting relative date:', error);
    return '';
  }
};

/**
 * Check if a date is in the past
 */
export const isPast = (date: string | Date): boolean => {
  if (!date) return false;
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return isValid(dateObj) && dateObj.getTime() < Date.now();
};

/**
 * Check if a date is in the future
 */
export const isFuture = (date: string | Date): boolean => {
  if (!date) return false;
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return isValid(dateObj) && dateObj.getTime() > Date.now();
};

/**
 * Get date input value for HTML input[type="date"]
 * Converts UTC date to local date string (YYYY-MM-DD)
 */
export const toDateInputValue = (utcDate: string, timezone: string = DEFAULT_TIMEZONE): string => {
  if (!utcDate) return '';
  try {
    const localDate = fromUTC(utcDate, timezone);
    return dateFnsFormat(localDate, 'yyyy-MM-dd');
  } catch (error) {
    console.error('Error converting to date input value:', error);
    return '';
  }
};

/**
 * Get datetime input value for HTML input[type="datetime-local"]
 * Converts UTC date to local datetime string (YYYY-MM-DDTHH:mm)
 */
export const toDateTimeInputValue = (utcDate: string, timezone: string = DEFAULT_TIMEZONE): string => {
  if (!utcDate) return '';
  try {
    const localDate = fromUTC(utcDate, timezone);
    return dateFnsFormat(localDate, "yyyy-MM-dd'T'HH:mm");
  } catch (error) {
    console.error('Error converting to datetime input value:', error);
    return '';
  }
};
