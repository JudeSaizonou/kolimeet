import { supabase } from '@/integrations/supabase/client';

/**
 * Rate limiting configuration
 */
const RATE_LIMITS = {
  'create_parcel': { maxRequests: 10, windowMinutes: 60 }, // 10 annonces/heure
  'create_trip': { maxRequests: 10, windowMinutes: 60 },
  'send_message': { maxRequests: 60, windowMinutes: 1 }, // 60 messages/minute
  'create_account': { maxRequests: 3, windowMinutes: 60 }, // 3 comptes/heure
  'default': { maxRequests: 100, windowMinutes: 1 }, // 100 req/minute par défaut
} as const;

type RateLimitEndpoint = keyof typeof RATE_LIMITS;

/**
 * Check if request is allowed based on rate limit
 */
export const checkRateLimit = async (
  endpoint: RateLimitEndpoint,
  ipAddress?: string
): Promise<{ allowed: boolean; remaining?: number; resetAt?: Date }> => {
  try {
    const config = RATE_LIMITS[endpoint] || RATE_LIMITS.default;
    
    // In browser, we can't get real IP, so use a placeholder
    // The actual rate limiting should be done server-side
    const ip = ipAddress || '0.0.0.0';
    
    const { data, error } = await supabase.rpc('check_rate_limit' as any, {
      p_ip_address: ip,
      p_endpoint: endpoint,
      p_max_requests: config.maxRequests,
      p_window_minutes: config.windowMinutes,
    });
    
    if (error) {
      console.error('Rate limit check error:', error);
      // On error, allow the request (fail open)
      return { allowed: true };
    }
    
    return {
      allowed: data === true,
      remaining: data ? config.maxRequests : 0,
      resetAt: new Date(Date.now() + config.windowMinutes * 60 * 1000),
    };
  } catch (error) {
    console.error('Rate limit check exception:', error);
    // On exception, allow the request (fail open)
    return { allowed: true };
  }
};

/**
 * Log an API request (called after successful request)
 */
export const logApiRequest = async (
  endpoint: RateLimitEndpoint,
  statusCode: number = 200,
  ipAddress?: string
): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const ip = ipAddress || '0.0.0.0';
    
    await supabase.rpc('log_api_request' as any, {
      p_ip_address: ip,
      p_endpoint: endpoint,
      p_user_id: user?.id || null,
      p_user_agent: navigator.userAgent,
      p_status_code: statusCode,
    });
  } catch (error) {
    // Silent fail for logging
    console.debug('Failed to log API request:', error);
  }
};

/**
 * Hook to use rate limiting in components
 */
export const useRateLimit = () => {
  const checkAndLog = async (endpoint: RateLimitEndpoint) => {
    const result = await checkRateLimit(endpoint);
    
    if (!result.allowed) {
      throw new Error(
        `Trop de requêtes. Veuillez réessayer dans quelques minutes.`
      );
    }
    
    return result;
  };
  
  return {
    checkRateLimit: checkAndLog,
    logRequest: logApiRequest,
  };
};
