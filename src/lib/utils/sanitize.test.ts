import { describe, it, expect } from 'vitest';
import { sanitizeHTML, sanitizeText, sanitizeAndTruncate } from './sanitize';

describe('sanitize utilities', () => {
  describe('sanitizeHTML', () => {
    it('should allow safe HTML tags', () => {
      const input = '<p>Hello <strong>world</strong></p>';
      const result = sanitizeHTML(input);
      expect(result).toBe('<p>Hello <strong>world</strong></p>');
    });

    it('should remove script tags', () => {
      const input = '<p>Hello</p><script>alert("XSS")</script>';
      const result = sanitizeHTML(input);
      expect(result).not.toContain('<script>');
      expect(result).toContain('<p>Hello</p>');
    });

    it('should remove onclick attributes', () => {
      const input = '<div onclick="alert(\'XSS\')">Click me</div>';
      const result = sanitizeHTML(input);
      expect(result).not.toContain('onclick');
    });

    it('should handle empty string', () => {
      expect(sanitizeHTML('')).toBe('');
    });

    it('should handle null and undefined', () => {
      expect(sanitizeHTML(null as any)).toBe('');
      expect(sanitizeHTML(undefined as any)).toBe('');
    });
  });

  describe('sanitizeText', () => {
    it('should strip all HTML tags', () => {
      const input = '<p>Hello <strong>world</strong></p>';
      const result = sanitizeText(input);
      expect(result).toBe('Hello world');
    });

    it('should remove script content', () => {
      const input = 'Text before <script>alert("XSS")</script> text after';
      const result = sanitizeText(input);
      expect(result).not.toContain('alert');
      expect(result).toContain('Text before');
      expect(result).toContain('text after');
    });

    it('should handle plain text', () => {
      const input = 'Just plain text';
      expect(sanitizeText(input)).toBe('Just plain text');
    });
  });

  describe('sanitizeAndTruncate', () => {
    it('should sanitize and truncate long text', () => {
      const input = '<p>This is a very long text that should be truncated</p>';
      const result = sanitizeAndTruncate(input, 20);
      expect(result.length).toBeLessThanOrEqual(23); // 20 + "..."
      expect(result).toContain('...');
      expect(result).not.toContain('<p>');
    });

    it('should not truncate short text', () => {
      const input = '<p>Short</p>';
      const result = sanitizeAndTruncate(input, 20);
      expect(result).toBe('Short');
      expect(result).not.toContain('...');
    });

    it('should handle exact length', () => {
      const input = 'Exactly twenty chars';
      const result = sanitizeAndTruncate(input, 20);
      expect(result).toBe('Exactly twenty chars');
    });
  });
});
