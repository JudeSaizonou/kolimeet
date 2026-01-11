import { describe, it, expect } from 'vitest';
import { translateError, isAuthError, isNetworkError, getRetryMessage } from './errors';

describe('error translation utilities', () => {
  describe('translateError', () => {
    it('should translate auth errors', () => {
      const result = translateError('Invalid login credentials');
      expect(result).toBe('Email ou mot de passe incorrect');
    });

    it('should translate network errors', () => {
      const result = translateError('Failed to fetch');
      expect(result).toBe('Erreur de connexion. Vérifiez votre connexion internet.');
    });

    it('should translate database errors', () => {
      const result = translateError('duplicate key value violates unique constraint');
      expect(result).toContain('existe déjà');
    });

    it('should handle partial matches', () => {
      const result = translateError('Password is too weak');
      expect(result).toContain('mot de passe');
    });

    it('should return original message if no translation found', () => {
      const unknownError = 'Some very specific error message';
      const result = translateError(unknownError);
      expect(result).toBe(unknownError);
    });

    it('should handle empty strings', () => {
      expect(translateError('')).toBe('');
    });

    it('should be case-insensitive', () => {
      const result = translateError('INVALID LOGIN CREDENTIALS');
      expect(result).toBe('Email ou mot de passe incorrect');
    });
  });

  describe('isAuthError', () => {
    it('should identify auth errors', () => {
      expect(isAuthError('Invalid login credentials')).toBe(true);
      expect(isAuthError('JWT expired')).toBe(true);
      expect(isAuthError('User not found')).toBe(true);
      expect(isAuthError('Refresh token not found')).toBe(true);
    });

    it('should return false for non-auth errors', () => {
      expect(isAuthError('Failed to fetch')).toBe(false);
      expect(isAuthError('Database connection failed')).toBe(false);
      expect(isAuthError('Unknown error')).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(isAuthError('INVALID LOGIN CREDENTIALS')).toBe(true);
    });

    it('should handle partial matches', () => {
      expect(isAuthError('The JWT token has expired')).toBe(true);
    });
  });

  describe('isNetworkError', () => {
    it('should identify network errors', () => {
      expect(isNetworkError('Failed to fetch')).toBe(true);
      expect(isNetworkError('NetworkError')).toBe(true);
      expect(isNetworkError('Network request failed')).toBe(true);
      expect(isNetworkError('ERR_INTERNET_DISCONNECTED')).toBe(true);
    });

    it('should return false for non-network errors', () => {
      expect(isNetworkError('Invalid credentials')).toBe(false);
      expect(isNetworkError('Database error')).toBe(false);
      expect(isNetworkError('Validation failed')).toBe(false);
    });

    it('should handle timeout errors', () => {
      expect(isNetworkError('Request timeout')).toBe(true);
      expect(isNetworkError('The operation timed out')).toBe(true);
    });
  });

  describe('getRetryMessage', () => {
    it('should provide retry message for network errors', () => {
      const result = getRetryMessage('Failed to fetch');
      expect(result).toContain('réessayer');
      expect(result).toContain('connexion');
    });

    it('should provide retry message for timeout errors', () => {
      const result = getRetryMessage('Request timeout');
      expect(result).toContain('réessayer');
    });

    it('should return undefined for non-retryable errors', () => {
      const result = getRetryMessage('Invalid credentials');
      expect(result).toBeUndefined();
    });

    it('should return undefined for auth errors', () => {
      const result = getRetryMessage('JWT expired');
      expect(result).toBeUndefined();
    });

    it('should handle database errors', () => {
      const result = getRetryMessage('Database connection failed');
      expect(result).toContain('réessayer');
    });
  });

  describe('error message quality', () => {
    it('should provide user-friendly messages', () => {
      const technicalError = 'PGRST116';
      const userMessage = translateError(technicalError);
      expect(userMessage).not.toBe(technicalError);
      expect(userMessage).toContain('serveur');
    });

    it('should handle multiple error types', () => {
      const errors = [
        'Invalid login credentials',
        'Failed to fetch',
        'duplicate key value',
        'Rate limit exceeded',
      ];
      
      errors.forEach(error => {
        const translation = translateError(error);
        expect(translation).toBeTruthy();
        expect(translation.length).toBeGreaterThan(0);
      });
    });

    it('should provide actionable messages', () => {
      const result = translateError('Rate limit exceeded');
      expect(result).toContain('trop');
      expect(result).toContain('plus tard');
    });
  });
});
