/**
 * Comprehensive error translation for Kolimeet
 * Translates technical errors into user-friendly French messages
 */

const ERROR_TRANSLATIONS: Record<string, string> = {
  // ============= AUTH ERRORS =============
  'Email not confirmed': 'Veuillez confirmer votre email avant de vous connecter',
  'Invalid login credentials': 'Email ou mot de passe incorrect',
  'User already registered': 'Un compte existe déjà avec cet email',
  'Password should be at least 6 characters': 'Le mot de passe doit contenir au moins 6 caractères',
  'Invalid email': 'Format d\'email invalide',
  'Email already exists': 'Cet email est déjà utilisé',
  'Invalid password': 'Mot de passe invalide',
  'Password is too weak': 'Le mot de passe est trop faible',
  'User not found': 'Utilisateur introuvable',
  'Invalid token': 'Jeton de session invalide. Veuillez vous reconnecter',
  'Token has expired': 'Session expirée. Veuillez vous reconnecter',
  'Email rate limit exceeded': 'Trop de tentatives. Veuillez réessayer dans quelques minutes',
  'Signup disabled': 'Les inscriptions sont temporairement désactivées',
  
  // ============= NETWORK ERRORS =============
  'Failed to fetch': 'Connexion internet perdue. Vérifiez votre réseau',
  'Network request failed': 'Erreur réseau. Veuillez réessayer',
  'NetworkError': 'Impossible de se connecter au serveur',
  'ECONNREFUSED': 'Le serveur est indisponible',
  'ETIMEDOUT': 'La requête a expiré. Vérifiez votre connexion',
  'Connection timeout': 'Délai de connexion dépassé',
  
  // ============= DATABASE ERRORS =============
  'duplicate key value': 'Cette entrée existe déjà',
  'foreign key constraint': 'Impossible de supprimer : des données liées existent',
  'unique constraint': 'Cette valeur doit être unique',
  'not-null constraint': 'Un champ obligatoire est manquant',
  'check constraint': 'La valeur fournie ne respecte pas les contraintes',
  'permission denied': 'Vous n\'avez pas les permissions nécessaires',
  'Row level security': 'Accès refusé par les politiques de sécurité',
  
  // ============= FILE UPLOAD ERRORS =============
  'File too large': 'Le fichier est trop volumineux (max 5 MB)',
  'Invalid file type': 'Type de fichier non autorisé',
  'Storage quota exceeded': 'Espace de stockage insuffisant',
  'Upload failed': 'Échec du téléchargement du fichier',
  
  // ============= VALIDATION ERRORS =============
  'Invalid input': 'Les données fournies sont invalides',
  'Required field missing': 'Un champ obligatoire est manquant',
  'Invalid date': 'Format de date invalide',
  'Invalid phone number': 'Numéro de téléphone invalide',
  'Invalid country': 'Pays non valide',
  'Invalid city': 'Ville non valide',
  
  // ============= BUSINESS LOGIC ERRORS =============
  'Insufficient capacity': 'Capacité insuffisante',
  'Listing not found': 'Annonce introuvable',
  'Listing already deleted': 'Cette annonce a déjà été supprimée',
  'Cannot contact yourself': 'Vous ne pouvez pas vous contacter vous-même',
  'Cannot book own listing': 'Vous ne pouvez pas réserver votre propre annonce',
  'Already booked': 'Cette annonce est déjà réservée',
  'Booking closed': 'Les réservations sont fermées pour cette annonce',
  
  // ============= RATE LIMITING =============
  'Too many requests': 'Trop de requêtes. Veuillez patienter quelques minutes',
  'Rate limit exceeded': 'Limite de requêtes dépassée. Réessayez plus tard',
  
  // ============= GENERIC ERRORS =============
  'Unknown error': 'Une erreur inconnue est survenue',
  'Internal server error': 'Erreur interne du serveur',
  'Service unavailable': 'Service temporairement indisponible',
  'Bad request': 'Requête invalide',
  'Unauthorized': 'Vous devez être connecté pour effectuer cette action',
  'Forbidden': 'Accès interdit',
  'Not found': 'Ressource introuvable',
  'Conflict': 'Conflit avec les données existantes',
  
  // ============= SPECIFIC KOLIMEET ERRORS =============
  'Non authentifié': 'Vous devez être connecté',
  'You can only delete your own account': 'Vous ne pouvez supprimer que votre propre compte',
  'Account deletion failed': 'Échec de la suppression du compte',
  'Phone verification required': 'Vérification téléphonique requise',
  'Trust score too low': 'Votre score de confiance est insuffisant',
  'Account suspended': 'Votre compte est suspendu',
};

/**
 * Translate error messages to user-friendly French
 */
export const translateError = (error: unknown): string => {
  if (!error) {
    return ERROR_TRANSLATIONS['Unknown error'];
  }
  
  // Extract error message
  let message: string;
  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  } else if (typeof error === 'object' && error !== null) {
    // Handle Supabase error format
    const supabaseError = error as any;
    message = supabaseError.message || supabaseError.error_description || JSON.stringify(error);
  } else {
    return ERROR_TRANSLATIONS['Unknown error'];
  }
  
  // Exact match
  if (ERROR_TRANSLATIONS[message]) {
    return ERROR_TRANSLATIONS[message];
  }
  
  // Partial match (case-insensitive)
  const lowerMessage = message.toLowerCase();
  for (const [key, translation] of Object.entries(ERROR_TRANSLATIONS)) {
    if (lowerMessage.includes(key.toLowerCase())) {
      return translation;
    }
  }
  
  // Log untranslated errors in development
  if (import.meta.env.DEV) {
    console.warn('🌐 Untranslated error:', message);
  }
  
  // Fallback: Return generic error for technical codes, original for readable messages
  // Technical error codes (like PGRST116) are not user-friendly
  // But descriptive messages (like "Something went wrong") can be shown
  const isTechnicalCode = /^[A-Z0-9_-]+$/.test(message) && message.length < 50;
  if (isTechnicalCode) {
    return ERROR_TRANSLATIONS['Unknown error'];
  }
  
  return message || ERROR_TRANSLATIONS['Unknown error'];
};

/**
 * Get user-friendly error with optional context
 */
export const getErrorMessage = (
  error: unknown,
  context?: string
): string => {
  const translatedError = translateError(error);
  
  if (context) {
    return `${context}: ${translatedError}`;
  }
  
  return translatedError;
};

/**
 * Check if error is a specific type
 * Uses original error message (before translation) for accurate detection
 */
export const isAuthError = (error: unknown): boolean => {
  const originalMessage = typeof error === 'string' ? error : String(error || '');
  const lower = originalMessage.toLowerCase();
  return lower.includes('invalid') && lower.includes('login') ||
         lower.includes('invalid') && lower.includes('credentials') ||
         lower.includes('password') ||
         lower.includes('auth') ||
         lower.includes('jwt') ||
         lower.includes('token') ||
         lower.includes('unauthorized') ||
         lower.includes('user not found') ||
         lower.includes('email not confirmed');
};

export const isNetworkError = (error: unknown): boolean => {
  const originalMessage = typeof error === 'string' ? error : String(error || '');
  const lower = originalMessage.toLowerCase();
  return lower.includes('failed to fetch') ||
         lower.includes('networkerror') ||
         lower.includes('network') ||
         lower.includes('timeout') ||
         lower.includes('timed out') ||
         lower.includes('econnrefused') ||
         lower.includes('etimedout') ||
         lower.includes('connection') ||
         lower.includes('err_internet') ||
         lower.includes('err_network');
};

export const isPermissionError = (error: unknown): boolean => {
  const message = translateError(error);
  return message.toLowerCase().includes('permission') ||
         message.toLowerCase().includes('accès') ||
         message.toLowerCase().includes('interdit');
};

/**
 * Get retry suggestion based on error type
 * Returns undefined for non-retryable errors (auth, validation)
 */
export const getRetryMessage = (error: unknown): string | undefined => {
  // Auth errors are not retryable - user needs to fix credentials
  if (isAuthError(error)) {
    return undefined;
  }
  
  // Network errors are retryable
  if (isNetworkError(error)) {
    return 'Vérifiez votre connexion internet et réessayez';
  }
  
  // Permission errors might be retryable after re-auth
  if (isPermissionError(error)) {
    return 'Contactez un administrateur si vous pensez que c\'est une erreur';
  }
  
  const originalMessage = typeof error === 'string' ? error : String(error || '');
  const lower = originalMessage.toLowerCase();
  
  // Database/server errors are retryable
  if (lower.includes('database') ||
      lower.includes('server') ||
      lower.includes('service') ||
      lower.includes('rate limit')) {
    return 'Veuillez réessayer dans quelques instants';
  }
  
  // Validation/client errors are not retryable
  if (lower.includes('invalid') ||
      lower.includes('required') ||
      lower.includes('constraint') ||
      lower.includes('duplicate')) {
    return undefined;
  }
  
  // Default: suggest retry for unknown errors
  return 'Veuillez réessayer dans quelques instants';
};

export default translateError;
