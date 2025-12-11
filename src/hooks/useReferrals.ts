import { useState, useEffect } from 'react';
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

// Contraintes intelligentes de parrainage (comme Gens de Confiance)
export const REFERRAL_CONSTRAINTS = {
  // Ancienneté minimum du compte pour pouvoir parrainer (en jours)
  MIN_ACCOUNT_AGE_DAYS: 7,
  // Nombre maximum de filleuls qu'un utilisateur peut avoir
  MAX_REFERRALS_AS_REFERRER: 10,
  // Nombre maximum de parrains qu'un utilisateur peut avoir
  MAX_REFERRERS_PER_USER: 5,
  // Délai minimum entre deux parrainages (en heures)
  COOLDOWN_HOURS: 24,
};

export interface EligibilityResult {
  canRefer: boolean;
  reason?: string;
  details?: {
    accountAgeDays?: number;
    referralCount?: number;
    isPhoneVerified?: boolean;
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setReferrers([]);
      setReferrals([]);
      setPendingRequests([]);
      setLoading(false);
      return;
    }

    fetchReferrals();
  }, [user]);

  const fetchReferrals = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Récupérer mes parrains (ceux qui m'ont parrainé)
      // @ts-ignore - Table referrals sera créée après migration
      const { data: myReferrers } = await supabase
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
        .eq('status', 'accepted') as { data: ReferralRow[] | null };

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
      // @ts-ignore - Table referrals sera créée après migration
      const { data: myReferrals } = await supabase
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
        .eq('status', 'accepted') as { data: ReferralRow[] | null };

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
      // @ts-ignore - Table referrals sera créée après migration
      const { data: pending } = await supabase
        .from('referrals')
        .select(`
          id,
          referrer_id,
          relationship,
          message,
          created_at
        `)
        .eq('referred_id', user.id)
        .eq('status', 'pending') as { data: ReferralRow[] | null };

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
    } catch (error) {
      console.error('Erreur chargement parrainages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendReferralRequest = async (
    referredId: string, 
    relationship: string, 
    message?: string
  ) => {
    if (!user) return { error: 'Non connecté' };

    try {
      // @ts-ignore - Table referrals sera créée après migration
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
    try {
      // @ts-ignore - Table referrals sera créée après migration
      const { error } = await supabase
        .from('referrals')
        .update({ status: 'accepted' })
        .eq('id', referralId);

      if (error) throw error;

      await fetchReferrals();
      return { success: true };
    } catch (error: any) {
      console.error('Erreur acceptation parrainage:', error);
      return { error: error.message };
    }
  };

  const declineReferral = async (referralId: string) => {
    try {
      // @ts-ignore - Table referrals sera créée après migration
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

  const getReferrersForUser = async (userId: string): Promise<ReferrerInfo[]> => {
    try {
      // @ts-ignore - Table referrals sera créée après migration
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
  };

  const checkExistingReferral = async (referredId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // @ts-ignore - Table referrals sera créée après migration
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
   */
  const checkReferralEligibility = async (targetUserId: string): Promise<EligibilityResult> => {
    if (!user) {
      return { canRefer: false, reason: 'Vous devez être connecté pour parrainer' };
    }

    if (user.id === targetUserId) {
      return { canRefer: false, reason: 'Vous ne pouvez pas vous parrainer vous-même' };
    }

    try {
      // 1. Vérifier le profil du parrain (téléphone vérifié + ancienneté)
      const { data: myProfile } = await supabase
        .from('profiles')
        .select('phone_verified, created_at')
        .eq('user_id', user.id)
        .single();

      if (!myProfile) {
        return { canRefer: false, reason: 'Profil introuvable' };
      }

      // Vérifier si le téléphone est vérifié
      const isPhoneVerified = (myProfile as any).phone_verified === true;
      if (!isPhoneVerified) {
        return { 
          canRefer: false, 
          reason: 'Vous devez vérifier votre numéro de téléphone pour pouvoir parrainer',
          details: { isPhoneVerified: false }
        };
      }

      // Vérifier l'ancienneté du compte
      const createdAt = new Date((myProfile as any).created_at || user.created_at);
      const now = new Date();
      const accountAgeDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      
      if (accountAgeDays < REFERRAL_CONSTRAINTS.MIN_ACCOUNT_AGE_DAYS) {
        return { 
          canRefer: false, 
          reason: `Votre compte doit avoir au moins ${REFERRAL_CONSTRAINTS.MIN_ACCOUNT_AGE_DAYS} jours pour parrainer (${accountAgeDays} jours actuellement)`,
          details: { accountAgeDays, isPhoneVerified: true }
        };
      }

      // 2. Vérifier le nombre de filleuls existants
      // @ts-ignore
      const { count: referralCount } = await supabase
        .from('referrals')
        .select('id', { count: 'exact', head: true })
        .eq('referrer_id', user.id)
        .in('status', ['accepted', 'pending']);

      if ((referralCount || 0) >= REFERRAL_CONSTRAINTS.MAX_REFERRALS_AS_REFERRER) {
        return { 
          canRefer: false, 
          reason: `Vous avez atteint la limite de ${REFERRAL_CONSTRAINTS.MAX_REFERRALS_AS_REFERRER} parrainages`,
          details: { referralCount: referralCount || 0, accountAgeDays, isPhoneVerified: true }
        };
      }

      // 3. Vérifier le délai depuis le dernier parrainage
      // @ts-ignore
      const { data: lastReferral } = await supabase
        .from('referrals')
        .select('created_at')
        .eq('referrer_id', user.id)
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
              referralCount: referralCount || 0, 
              accountAgeDays, 
              isPhoneVerified: true 
            }
          };
        }
      }

      // 4. Vérifier si un parrainage existe déjà entre ces deux utilisateurs
      // @ts-ignore
      const { data: existingReferral } = await supabase
        .from('referrals')
        .select('id')
        .eq('referrer_id', user.id)
        .eq('referred_id', targetUserId)
        .maybeSingle();

      if (existingReferral) {
        return { canRefer: false, reason: 'Vous avez déjà parrainé ou envoyé une demande à cette personne' };
      }

      // 5. Vérifier que la cible n'a pas déjà trop de parrains
      // @ts-ignore
      const { count: targetReferrerCount } = await supabase
        .from('referrals')
        .select('id', { count: 'exact', head: true })
        .eq('referred_id', targetUserId)
        .eq('status', 'accepted');

      if ((targetReferrerCount || 0) >= REFERRAL_CONSTRAINTS.MAX_REFERRERS_PER_USER) {
        return { 
          canRefer: false, 
          reason: `Cette personne a déjà ${REFERRAL_CONSTRAINTS.MAX_REFERRERS_PER_USER} parrains, c'est le maximum`,
          details: { targetReferrerCount: targetReferrerCount || 0, referralCount: referralCount || 0, accountAgeDays, isPhoneVerified: true }
        };
      }

      // Tout est OK !
      return { 
        canRefer: true,
        details: {
          accountAgeDays,
          referralCount: referralCount || 0,
          isPhoneVerified: true,
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
