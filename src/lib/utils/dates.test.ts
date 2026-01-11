import { describe, it, expect } from 'vitest';
import { toUTC, fromUTC, formatDate, formatTime, formatDateTime, isDateInPast } from './dates';

describe('date utilities', () => {
  describe('toUTC', () => {
    it('should convert date to UTC ISO string', () => {
      const date = new Date('2024-01-15T10:00:00');
      const result = toUTC(date);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    });

    it('should handle string input', () => {
      const dateStr = '2024-01-15T10:00:00';
      const result = toUTC(dateStr);
      expect(typeof result).toBe('string');
      expect(result).toContain('T');
      expect(result).toContain('Z');
    });

    it('should handle invalid date', () => {
      const result = toUTC('invalid-date');
      expect(typeof result).toBe('string');
      // Should return a valid ISO string (current time)
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should handle null/undefined', () => {
      const result = toUTC(null as any);
      expect(typeof result).toBe('string');
    });
  });

  describe('fromUTC', () => {
    it('should convert UTC to local date', () => {
      const utcDate = '2024-01-15T10:00:00.000Z';
      const result = fromUTC(utcDate);
      expect(result).toBeInstanceOf(Date);
    });

    it('should handle invalid UTC string', () => {
      const result = fromUTC('invalid');
      expect(result).toBeInstanceOf(Date);
    });

    it('should handle empty string', () => {
      const result = fromUTC('');
      expect(result).toBeInstanceOf(Date);
    });
  });

  describe('formatDate', () => {
    it('should format date in French', () => {
      const date = new Date('2024-01-15T10:00:00');
      const result = formatDate(date);
      expect(result).toContain('2024');
      expect(result).toMatch(/\d{1,2}\s\w+\s\d{4}/); // "15 janvier 2024" format
    });

    it('should handle string input', () => {
      const result = formatDate('2024-01-15');
      expect(typeof result).toBe('string');
    });

    it('should handle Date object', () => {
      const date = new Date('2024-01-15');
      const result = formatDate(date);
      expect(typeof result).toBe('string');
    });
  });

  describe('formatTime', () => {
    it('should format time as HH:mm', () => {
      const date = new Date('2024-01-15T14:30:00');
      const result = formatTime(date);
      expect(result).toMatch(/^\d{2}:\d{2}$/);
      expect(result).toBe('14:30');
    });

    it('should handle string input', () => {
      const result = formatTime('2024-01-15T09:05:00');
      expect(result).toMatch(/^\d{2}:\d{2}$/);
    });
  });

  describe('formatDateTime', () => {
    it('should format date and time together', () => {
      const date = new Date('2024-01-15T14:30:00');
      const result = formatDateTime(date);
      expect(result).toContain('2024');
      expect(result).toContain('14:30');
    });

    it('should include both date and time components', () => {
      const result = formatDateTime('2024-01-15T14:30:00');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(10); // More than just date
    });
  });

  describe('isDateInPast', () => {
    it('should return true for past dates', () => {
      const pastDate = new Date('2020-01-01');
      expect(isDateInPast(pastDate)).toBe(true);
    });

    it('should return false for future dates', () => {
      const futureDate = new Date('2030-01-01');
      expect(isDateInPast(futureDate)).toBe(false);
    });

    it('should handle string input', () => {
      expect(isDateInPast('2020-01-01')).toBe(true);
      expect(isDateInPast('2030-01-01')).toBe(false);
    });

    it('should handle current date approximately', () => {
      const now = new Date();
      // Adding a small buffer for execution time
      expect(isDateInPast(now)).toBe(false);
    });
  });
});
