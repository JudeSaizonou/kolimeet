import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  status: 'pending' | 'accepted' | 'declined';
  message?: string;
  relationship?: string;
  created_at: string;
  accepted_at?: string;
}

export interface ReferrerInfo {
  referral_id: string;
  referrer_id: string;
  referrer_name: string;
  referrer_avatar: string | null;
  referrer_trust_score: number;
  relationship: string;
}

export interface ReferredInfo {
  referral_id: string;
  referred_id: string;
  referred_name: string;
  referred_avatar: string | null;
  referred_trust_score: number;
  relationship: string;
}

export interface PendingRequest {
  id: string;
  referrer_id: string;
  referrer_name: string;
  referrer_avatar: string | null;
  relationship: string;
  message?: string;
  created_at: string;
}

// Demande de parrainage envoyée en attente
export interface SentPendingRequest {
  id: string;
  referred_id: string;
  referred_name: string;
  referred_avatar: string | null;
  relationship: string;
  message?: string;
  created_at: string;
}

// Contraintes intelligentes de parrainage (comme Gens de Confiance)
export const REFERRAL_CONSTRAINTS = {
  // Ancienneté minimum du compte pour pouvoir parrainer (en jours)
  MIN_ACCOUNT_AGE_DAYS: 7,
  // Nombre maximum de filleuls qu'un utilisateur peut avoir
  MAX_REFERRALS_AS_REFERRER: 10,
  // Nombre maximum de parrains qu'un utilisateur peut avoir
  MAX_REFERRERS_PER_USER: 5,
  // Délai minimum entre deux parrainages (en heures) - désactivé pour le moment
  COOLDOWN_HOURS: 0,
};

export interface EligibilityResult {
  canRefer: boolean;
  reason?: string;
  details?: {
    accountAgeDays?: number;
    referralCount?: number;
    isPhoneVerified?: boolean;
    targetMissingPhone?: boolean;
    lastReferralDate?: string;
    targetReferrerCount?: number;
  };
}

// Type temporaire en attendant la régénération des types Supabase
type ReferralRow = {
  id: string;
  referrer_id: string;
  referred_id: string;
  status: string;
  message: string | null;
  relationship: string | null;
  created_at: string;
  accepted_at: string | null;
};

type ProfileRow = {
  user_id: string;
  phone_verified?: boolean;
  created_at?: string;
};

export function useReferrals() {
  const { user } = useAuth();
  const [referrers, setReferrers] = useState<ReferrerInfo[]>([]);
  const [referrals, setReferrals] = useState<ReferredInfo[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [sentPendingRequests, setSentPendingRequests] = useState<SentPendingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReferrals = useCallback(async () => {
    if (!user) {
      console.log('[useReferrals] No user, skipping fetch');
      setLoading(false);
      return;
    }

    console.log('[useReferrals] Fetching referrals for user:', user.id);
    setLoading(true);
    try {
      // Récupérer mes parrains (ceux qui m'ont parrainé)
      const { data: myReferrers, error: referrersError } = await supabase
        .from('referrals')
        .select(`
          id,
          referrer_id,
          relationship,
          message,
          status,
          created_at,
          accepted_at
        `)
        .eq('referred_id', user.id)
        .eq('status', 'accepted') as { data: ReferralRow[] | null; error: any };

      if (referrersError) {
        console.error('[useReferrals] Error fetching my referrers:', referrersError);
      } else {
        console.log('[useReferrals] My referrers (accepted):', myReferrers?.length || 0, myReferrers);
      }

      if (myReferrers && myReferrers.length > 0) {
        // Récupérer les profils des parrains
        const referrerIds = myReferrers.map((r: ReferralRow) => r.referrer_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url, trust_score')
          .in('user_id', referrerIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

        setReferrers(myReferrers.map((r: ReferralRow) => {
          const profile = profileMap.get(r.referrer_id);
          return {
            referral_id: r.id,
            referrer_id: r.referrer_id,
            referrer_name: (profile as any)?.full_name || 'Utilisateur',
            referrer_avatar: (profile as any)?.avatar_url || null,
            referrer_trust_score: (profile as any)?.trust_score || 50,
            relationship: r.relationship || 'other',
          };
        }));
      } else {
        setReferrers([]);
      }

      // Récupérer mes filleuls (ceux que j'ai parrainés)
      const { data: myReferrals, error: referralsError } = await supabase
        .from('referrals')
        .select(`
          id,
          referred_id,
          relationship,
          message,
          status,
          created_at,
          accepted_at
        `)
        .eq('referrer_id', user.id)
        .eq('status', 'accepted') as { data: ReferralRow[] | null; error: any };

      if (referralsError) {
        console.error('[useReferrals] Error fetching my referrals (filleuls):', referralsError);
      } else {
        console.log('[useReferrals] My referrals (filleuls, accepted):', myReferrals?.length || 0, myReferrals);
      }

      if (myReferrals && myReferrals.length > 0) {
        // Récupérer les profils des filleuls
        const referredIds = myReferrals.map((r: ReferralRow) => r.referred_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url, trust_score')
          .in('user_id', referredIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

        setReferrals(myReferrals.map((r: ReferralRow) => {
          const profile = profileMap.get(r.referred_id);
          return {
            referral_id: r.id,
            referred_id: r.referred_id,
            referred_name: (profile as any)?.full_name || 'Utilisateur',
            referred_avatar: (profile as any)?.avatar_url || null,
            referred_trust_score: (profile as any)?.trust_score || 50,
            relationship: r.relationship || 'other',
          };
        }));
      } else {
        setReferrals([]);
      }

      // Récupérer les demandes de parrainage en attente
      const { data: pending, error: pendingError } = await supabase
        .from('referrals')
        .select(`
          id,
          referrer_id,
          relationship,
          message,
          created_at
        `)
        .eq('referred_id', user.id)
        .eq('status', 'pending') as { data: ReferralRow[] | null; error: any };

      if (pendingError) {
        console.error('[useReferrals] Error fetching pending requests:', pendingError);
      } else {
        console.log('[useReferrals] Pending requests:', pending?.length || 0, pending);
      }

      if (pending && pending.length > 0) {
        // Récupérer les profils des demandeurs
        const referrerIds = pending.map((r: ReferralRow) => r.referrer_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url, trust_score')
          .in('user_id', referrerIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

        setPendingRequests(pending.map((r: ReferralRow) => {
          const profile = profileMap.get(r.referrer_id);
          return {
            id: r.id,
            referrer_id: r.referrer_id,
            referrer_name: (profile as any)?.full_name || 'Utilisateur',
            referrer_avatar: (profile as any)?.avatar_url || null,
            relationship: r.relationship || 'other',
            message: r.message || undefined,
            created_at: r.created_at,
          };
        }));
      } else {
        setPendingRequests([]);
      }

      // Récupérer les demandes de parrainage que j'ai envoyées et qui sont en attente
      const { data: sentPending, error: sentPendingError } = await supabase
        .from('referrals')
        .select(`
          id,
          referred_id,
          relationship,
          message,
          created_at
        `)
        .eq('referrer_id', user.id)
        .eq('status', 'pending') as { data: ReferralRow[] | null; error: any };

      if (sentPendingError) {
        console.error('[useReferrals] Error fetching sent pending requests:', sentPendingError);
      } else {
        console.log('[useReferrals] Sent pending requests:', sentPending?.length || 0, sentPending);
      }

      if (sentPending && sentPending.length > 0) {
        // Récupérer les profils des destinataires
        const referredIds = sentPending.map((r: ReferralRow) => r.referred_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url, trust_score')
          .in('user_id', referredIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

        setSentPendingRequests(sentPending.map((r: ReferralRow) => {
          const profile = profileMap.get(r.referred_id);
          return {
            id: r.id,
            referred_id: r.referred_id,
            referred_name: (profile as any)?.full_name || 'Utilisateur',
            referred_avatar: (profile as any)?.avatar_url || null,
            relationship: r.relationship || 'other',
            message: r.message || undefined,
            created_at: r.created_at,
          };
        }));
      } else {
        setSentPendingRequests([]);
      }
    } catch (error) {
      console.error('Erreur chargement parrainages:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setReferrers([]);
      setReferrals([]);
      setPendingRequests([]);
      setSentPendingRequests([]);
      setLoading(false);
      return;
    }

    fetchReferrals();

    // Temps réel : écouter les changements de parrainages
    const channel = supabase
      .channel(`referrals-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'referrals' },
        (payload) => {
          const ref = payload.new as any;
          // Rafraîchir si le parrainage concerne l'utilisateur
          if (ref?.referrer_id === user.id || ref?.referred_id === user.id) {
            console.log('[useReferrals] 🔔 Referral changed, refetching...');
            fetchReferrals();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchReferrals]);

  const sendReferralRequest = async (
    referredId: string, 
    relationship: string, 
    message?: string
  ) => {
    if (!user) return { error: 'Non connecté' };

    try {
      const { error } = await supabase
        .from('referrals')
        .insert({
          referrer_id: user.id,
          referred_id: referredId,
          relationship,
          message,
          status: 'pending',
        });

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Erreur envoi parrainage:', error);
      return { error: error.message };
    }
  };

  const acceptReferral = async (referralId: string) => {
    console.log('[useReferrals] Accepting referral:', referralId);
    try {
      const { data, error } = await supabase
        .from('referrals')
        .update({ status: 'accepted' })
        .eq('id', referralId)
        .select();

      if (error) {
        console.error('[useReferrals] Error accepting referral:', error);
        throw error;
      }

      console.log('[useReferrals] Referral accepted successfully:', data);
      await fetchReferrals();
      return { success: true };
    } catch (error: any) {
      console.error('Erreur acceptation parrainage:', error);
      return { error: error.message };
    }
  };

  const declineReferral = async (referralId: string) => {
    try {
      const { error } = await supabase
        .from('referrals')
        .update({ status: 'declined' })
        .eq('id', referralId);

      if (error) throw error;

      await fetchReferrals();
      return { success: true };
    } catch (error: any) {
      console.error('Erreur refus parrainage:', error);
      return { error: error.message };
    }
  };

  const getReferrersForUser = useCallback(async (userId: string): Promise<ReferrerInfo[]> => {
    try {
      const { data, error } = await supabase
        .from('referrals')
        .select(`
          id,
          referrer_id,
          relationship
        `)
        .eq('referred_id', userId)
        .eq('status', 'accepted') as { data: ReferralRow[] | null; error: any };

      if (error) throw error;

      if (!data || data.length === 0) return [];

      // Récupérer les profils des parrains
      const referrerIds = data.map((r: ReferralRow) => r.referrer_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, trust_score')
        .in('user_id', referrerIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return data.map((r: ReferralRow) => {
        const profile = profileMap.get(r.referrer_id);
        return {
          referral_id: r.id,
          referrer_id: r.referrer_id,
          referrer_name: (profile as any)?.full_name || 'Utilisateur',
          referrer_avatar: (profile as any)?.avatar_url || null,
          referrer_trust_score: (profile as any)?.trust_score || 50,
          relationship: r.relationship || 'other',
        };
      });
    } catch (error) {
      console.error('Erreur récupération parrains:', error);
      return [];
    }
  }, []);

  const checkExistingReferral = async (referredId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('referrals')
        .select('id')
        .eq('referrer_id', user.id)
        .eq('referred_id', referredId)
        .maybeSingle();

      if (error) throw error;

      return !!data;
    } catch (error) {
      console.error('Erreur vérification parrainage existant:', error);
      return false;
    }
  };

  /**
   * Vérifie si l'utilisateur actuel est éligible pour parrainer quelqu'un
   * Contraintes comme Gens de Confiance :
   * - Compte avec téléphone vérifié
   * - Ancienneté minimum du compte
   * - Pas trop de filleuls déjà
   * - Délai entre parrainages
   * - La cible n'a pas déjà trop de parrains
   * @param targetUserId - ID de l'utilisateur cible à parrainer
   * @param currentUserId - ID de l'utilisateur qui parraine (optionnel, utilise user du hook par défaut)
   */
  const checkReferralEligibility = async (targetUserId: string, currentUserId?: string): Promise<EligibilityResult> => {
    const referrerId = currentUserId || user?.id;
    
    if (!referrerId) {
      return { canRefer: false, reason: 'Vous devez être connecté pour parrainer' };
    }

    if (referrerId === targetUserId) {
      return { canRefer: false, reason: 'Vous ne pouvez pas vous parrainer vous-même' };
    }

    try {
      const now = new Date();

      // 1. Vérifier le nombre de filleuls existants
      const { count: referralCount } = await supabase
        .from('referrals')
        .select('id', { count: 'exact', head: true })
        .eq('referrer_id', referrerId)
        .in('status', ['accepted', 'pending']);

      if ((referralCount || 0) >= REFERRAL_CONSTRAINTS.MAX_REFERRALS_AS_REFERRER) {
        return { 
          canRefer: false, 
          reason: `Vous avez atteint la limite de ${REFERRAL_CONSTRAINTS.MAX_REFERRALS_AS_REFERRER} parrainages`,
          details: { referralCount: referralCount || 0 }
        };
      }

      // 2. Vérifier le délai depuis le dernier parrainage
      const { data: lastReferral } = await supabase
        .from('referrals')
        .select('created_at')
        .eq('referrer_id', referrerId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastReferral) {
        const lastReferralDate = new Date((lastReferral as any).created_at);
        const hoursSinceLastReferral = (now.getTime() - lastReferralDate.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceLastReferral < REFERRAL_CONSTRAINTS.COOLDOWN_HOURS) {
          const hoursRemaining = Math.ceil(REFERRAL_CONSTRAINTS.COOLDOWN_HOURS - hoursSinceLastReferral);
          return { 
            canRefer: false, 
            reason: `Veuillez attendre encore ${hoursRemaining}h avant de parrainer à nouveau`,
            details: { 
              lastReferralDate: (lastReferral as any).created_at, 
              referralCount: referralCount || 0
            }
          };
        }
      }

      // 3. Vérifier si un parrainage existe déjà entre ces deux utilisateurs
      const { data: existingReferral } = await supabase
        .from('referrals')
        .select('id')
        .eq('referrer_id', referrerId)
        .eq('referred_id', targetUserId)
        .maybeSingle();

      if (existingReferral) {
        return { canRefer: false, reason: 'Vous avez déjà parrainé ou envoyé une demande à cette personne' };
      }

      // 4. Vérifier que la cible n'a pas déjà trop de parrains
      const { count: targetReferrerCount } = await supabase
        .from('referrals')
        .select('id', { count: 'exact', head: true })
        .eq('referred_id', targetUserId)
        .eq('status', 'accepted');

      if ((targetReferrerCount || 0) >= REFERRAL_CONSTRAINTS.MAX_REFERRERS_PER_USER) {
        return { 
          canRefer: false, 
          reason: `Cette personne a déjà ${REFERRAL_CONSTRAINTS.MAX_REFERRERS_PER_USER} parrains, c'est le maximum`,
          details: { targetReferrerCount: targetReferrerCount || 0, referralCount: referralCount || 0 }
        };
      }

      // Tout est OK !
      return { 
        canRefer: true,
        details: {
          referralCount: referralCount || 0,
          targetReferrerCount: targetReferrerCount || 0,
        }
      };
    } catch (error) {
      console.error('Erreur vérification éligibilité:', error);
      return { canRefer: false, reason: 'Erreur lors de la vérification' };
    }
  };

  return {
    referrers,
    referrals,
    pendingRequests,
    sentPendingRequests,
    loading,
    sendReferralRequest,
    acceptReferral,
    declineReferral,
    getReferrersForUser,
    checkExistingReferral,
    checkReferralEligibility,
    refresh: fetchReferrals,
  };
}
