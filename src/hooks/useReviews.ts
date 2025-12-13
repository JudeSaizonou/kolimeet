import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Review = Database["public"]["Tables"]["reviews"]["Row"] & {
  reviewer: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

export function useReviews(targetUserId: string | null) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const ITEMS_PER_PAGE = 10;

  const loadReviews = useCallback(async () => {
    if (!targetUserId) return;
    
    try {
      setLoading(true);
      const from = page * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, error } = await supabase
        .from("reviews")
        .select(
          `
          *,
          reviewer:profiles!reviews_reviewer_id_fkey(full_name, avatar_url)
        `
        )
        .eq("target_user_id", targetUserId)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      if (data.length < ITEMS_PER_PAGE) {
        setHasMore(false);
      }

      setReviews((prev) => (page === 0 ? data : [...prev, ...data]));
    } catch (error) {
      console.error("Error loading reviews:", error);
    } finally {
      setLoading(false);
    }
  }, [targetUserId, page]);

  useEffect(() => {
    if (!targetUserId) {
      setLoading(false);
      return;
    }
    loadReviews();

    // Temps réel : écouter les nouveaux avis pour cet utilisateur
    const channel = supabase
      .channel(`reviews-${targetUserId}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'reviews',
          filter: `target_user_id=eq.${targetUserId}`
        },
        () => {
          console.log('[useReviews] 🔔 Review changed, refreshing...');
          setPage(0);
          setHasMore(true);
          setReviews([]);
          loadReviews();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [targetUserId, loadReviews]);

  async function createReview(
    targetUserId: string,
    rating: number,
    comment?: string
  ) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Non authentifié");

    const { data, error } = await supabase
      .from("reviews")
      .insert({
        reviewer_id: user.id,
        target_user_id: targetUserId,
        rating,
        comment: comment?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new Error("Vous avez déjà laissé un avis aujourd'hui");
      }
      throw error;
    }

    return data;
  }

  function loadMore() {
    if (!loading && hasMore) {
      setPage((p) => p + 1);
    }
  }

  function refresh() {
    setPage(0);
    setHasMore(true);
    setReviews([]);
  }

  return {
    reviews,
    loading,
    hasMore,
    loadMore,
    createReview,
    refresh,
  };
}
