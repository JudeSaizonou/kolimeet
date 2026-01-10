import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFavorite } from "@/hooks/useFavorite";
import { useToast } from "@/hooks/use-toast";
import { useReferrals } from "@/hooks/useReferrals";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Package, Star, Weight, MessageCircle, Heart, Settings, Box, Clock, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ReviewDialog } from "@/components/reviews/ReviewDialog";
import { MatchingSuggestions } from "@/components/matching/MatchingSuggestions";
import { ShareButton } from "@/components/ShareButton";
import { SEO } from "@/components/SEO";
import { generateParcelOGImage } from "@/lib/utils/ogImage";
import { ReportButton } from "@/components/ReportButton";
import { TrustBadge, ReferralRequestDialog, ReferrersList } from "@/components/trust";

const ParcelDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { isFavorited, favoritesCount, toggleFavorite } = useFavorite("parcel", id || "");
  const { getReferrersForUser } = useReferrals();
  const [parcel, setParcel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [validPhotos, setValidPhotos] = useState<string[]>([]);
  const [ownerReferrers, setOwnerReferrers] = useState<any[]>([]);
  const shareContentRef = useRef<HTMLDivElement>(null);

  const typeLabels: Record<string, string> = {
    documents: "Documents",
    vetements: "Vêtements",
    electronique: "Électronique",
    autre: "Autre",
  };

  const fetchParcel = useCallback(async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from("parcels")
        .select("*, profiles!parcels_user_id_fkey(full_name, avatar_url, rating_avg, rating_count, trust_score, is_verified)")
        .eq("id", id)
        .single();

      if (error) throw error;
      setParcel(data);
      
      // Charger les parrains du propriétaire du colis
      if (data?.user_id) {
        const referrers = await getReferrersForUser(data.user_id);
        setOwnerReferrers(referrers);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger ce colis.",
      });
      navigate("/explorer");
    } finally {
      setLoading(false);
    }
  }, [id, navigate, toast, getReferrersForUser]);

  useEffect(() => {
    fetchParcel();

    // Temps réel : écouter les changements de ce colis
    if (id) {
      const channel = supabase
        .channel(`parcel-detail-${id}`)
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'parcels',
            filter: `id=eq.${id}`
          },
          () => {
            console.log('[ParcelDetail] 🔔 Parcel changed, reloading...');
            fetchParcel();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [id, fetchParcel]);

  // Valider les photos après le chargement
  useEffect(() => {
    if (parcel?.photos && parcel.photos.length > 0) {
      const photos = parcel.photos.filter((photo: string) => 
        photo && typeof photo === 'string' && photo.startsWith('http')
      );
      setValidPhotos(photos);
    } else {
      setValidPhotos([]);
    }
  }, [parcel?.photos]);

  const handleContact = async () => {
    if (!user) {
      navigate("/auth/login");
      return;
    }

    if (user.id === parcel.user_id) {
      toast({
        title: "Information",
        description: "Vous ne pouvez pas vous contacter vous-même.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Vérifier si un thread existe déjà pour cette annonce entre les deux utilisateurs
      const { data: existingThreads } = await supabase
        .from("threads")
        .select("id, created_by, other_user_id")
        .eq("related_id", id)
        .eq("related_type", "parcel");

      // Filtrer pour trouver un thread entre les deux utilisateurs
      const existingThread = existingThreads?.find(
        (thread: any) =>
          (thread.created_by === user.id && thread.other_user_id === parcel.user_id) ||
          (thread.created_by === parcel.user_id && thread.other_user_id === user.id)
      );

      if (existingThread) {
        navigate(`/messages/${existingThread.id}`);
        return;
      }

      // Créer un nouveau thread directement
      const { data: newThread, error: threadError } = await supabase
        .from("threads")
        .insert({
          created_by: user.id,
          other_user_id: parcel.user_id,
          related_type: "parcel",
          related_id: id,
        })
        .select()
        .single();

      if (threadError) throw threadError;

      navigate(`/messages/${newThread.id}`);
    } catch (error: any) {
      console.error("Error creating thread:", error);
      toast({
        title: "Erreur",
        description: "Impossible de démarrer la conversation.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-96 mb-6" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!parcel) return null;

  const profile = parcel.profiles;

  const ogImage = generateParcelOGImage({
    fromCity: parcel.from_city || '',
    toCity: parcel.to_city || '',
    fromCountry: parcel.from_country || '',
    toCountry: parcel.to_country || '',
    deadline: parcel.delivery_deadline ? format(new Date(parcel.delivery_deadline), "d MMM yyyy", { locale: fr }) : '',
    weight: parcel.weight || 0,
    type: typeLabels[parcel.type] || parcel.type || 'Colis',
    reward: parcel.reward || 0,
  });

  const shareTitle = `Colis ${parcel.from_city || 'Ville'} → ${parcel.to_city || 'Ville'}`;
  const shareDescription = `${parcel.weight || 0}kg • ${typeLabels[parcel.type] || parcel.type || 'Colis'} • Livraison avant le ${parcel.delivery_deadline ? format(new Date(parcel.delivery_deadline), "d MMMM yyyy", { locale: fr }) : 'Date à confirmer'}`;
  const shareUrl = window.location.href;

  return (
    <>
      <SEO
        title={shareTitle}
        description={shareDescription}
        image={ogImage}
        url={shareUrl}
        type="article"
      />
      <div className="min-h-screen bg-slate-50 pb-24 pt-20 md:pt-24">
        <div className="container mx-auto px-4 max-w-3xl">
        
        {/* Hero Card - Design épuré sur fond blanc */}
        <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/60 mb-6 shadow-xl shadow-slate-200/50">
          {/* Boutons d'action - Hors de la zone de capture */}
          <div className="absolute top-4 right-4 flex gap-2 z-10">
            <ShareButton
              title={`Colis ${parcel.from_city} → ${parcel.to_city}`}
              description={`${parcel.weight_kg}kg - ${typeLabels[parcel.type]} - Avant le ${format(new Date(parcel.deadline), "d MMM yyyy", { locale: fr })}`}
              url={`/colis/${parcel.id}`}
              variant="ghost"
              size="icon"
              className="bg-white/80 hover:bg-white rounded-full text-slate-600 shadow-sm"
              storyShare={{
                type: 'parcel',
                data: {
                  fromCity: parcel.from_city || '',
                  toCity: parcel.to_city || '',
                  fromCountry: parcel.from_country || '',
                  toCountry: parcel.to_country || '',
                  weight: parcel.weight_kg || 0,
                  parcelType: parcel.type || 'colis',
                  deadline: parcel.deadline ? format(new Date(parcel.deadline), "d MMM yyyy", { locale: fr }) : '',
                  reward: parcel.reward || 0,
                },
                element: shareContentRef.current,
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFavorite}
              className="bg-white/80 hover:bg-white rounded-full text-slate-600 shadow-sm"
            >
              <Heart className={`h-5 w-5 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
            <ReportButton
              targetType="parcel"
              targetId={parcel.id}
              targetUserId={parcel.user_id}
              variant="ghost"
              size="icon"
              showText={false}
              className="bg-white/80 hover:bg-white rounded-full text-slate-600 shadow-sm"
            />
          </div>

          {/* Zone de capture pour le partage - Design épuré optimisé */}
          <div 
            ref={shareContentRef} 
            style={{
              backgroundColor: '#ffffff',
              overflow: 'hidden',
              imageRendering: 'crisp-edges',
              WebkitFontSmoothing: 'antialiased',
              textRendering: 'optimizeLegibility',
              willChange: 'transform',
              contain: 'layout style paint',
              maxWidth: '500px',
              margin: '0 auto',
            }}
          >
            {/* Header avec badge */}
            <div style={{ padding: '28px 32px 24px' }}>
              <span style={{ 
                display: 'inline-flex',
                backgroundColor: parcel.status === "open" ? '#8A38F5' : '#94a3b8', 
                color: 'white', 
                padding: '5px 12px', 
                borderRadius: '16px',
                fontSize: '11px',
                fontWeight: '600',
                letterSpacing: '0.03em'
              }}>
                {parcel.status === "open" ? "📦 RECHERCHE" : "FERMÉ"}
              </span>
            </div>

            {/* Titre */}
            <div style={{ padding: '0 32px 28px' }}>
              <h1 style={{ fontSize: '19px', fontWeight: '700', color: '#0f172a', margin: 0, lineHeight: '1.4', letterSpacing: '-0.02em' }}>
                {parcel.title || `${typeLabels[parcel.type]} à envoyer`}
              </h1>
            </div>

            {/* Itinéraire compact */}
            <div style={{ padding: '0 32px 28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px', fontWeight: '600' }}>Départ</p>
                  <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0, lineHeight: 1.2 }}>{parcel.from_city}</h2>
                  <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>{parcel.from_country}</p>
                </div>
                
                <div style={{ flexShrink: 0 }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8A38F5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
                    <path d="M5 12h14"/>
                    <path d="m12 5 7 7-7 7"/>
                  </svg>
                </div>
                
                <div style={{ flex: 1, textAlign: 'right' }}>
                  <p style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px', fontWeight: '600' }}>Arrivée</p>
                  <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0, lineHeight: 1.2 }}>{parcel.to_city}</h2>
                  <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>{parcel.to_country}</p>
                </div>
              </div>
            </div>

            {/* Séparateur */}
            <div style={{ height: '1px', backgroundColor: '#e2e8f0', margin: '0 32px' }} />

            {/* Stats compactes */}
            <div style={{ padding: '24px 32px 28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-around', gap: '20px' }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', margin: 0, lineHeight: 1, letterSpacing: '-0.02em' }}>{parcel.weight_kg}</p>
                  <p style={{ fontSize: '11px', color: '#64748b', marginTop: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Kilos</p>
                </div>
                <div style={{ width: '1px', backgroundColor: '#e2e8f0' }} />
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', margin: 0, lineHeight: 1.3 }}>{typeLabels[parcel.type]}</p>
                  <p style={{ fontSize: '11px', color: '#64748b', marginTop: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type</p>
                </div>
                <div style={{ width: '1px', backgroundColor: '#e2e8f0' }} />
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', margin: 0, lineHeight: 1, letterSpacing: '-0.02em' }}>
                    {format(new Date(parcel.deadline), "d", { locale: fr })}
                  </p>
                  <p style={{ fontSize: '11px', color: '#64748b', marginTop: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {format(new Date(parcel.deadline), "MMM", { locale: fr })}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer avec logo officiel inline pour html2canvas */}
            <div style={{ 
              padding: '16px 24px 20px', 
              borderTop: '1px solid #f1f5f9',
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center'
            }}>
              <svg width="107" height="28" viewBox="0 0 613 160" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
                <path d="M196.288 128C195.221 128 194.688 127.467 194.688 126.4V44.288C194.688 43.2213 195.221 42.688 196.288 42.688H219.712C220.779 42.688 221.312 43.2213 221.312 44.288V69.312H222.272L226.368 53.312L228.8 43.52C228.885 43.136 229.141 42.9013 229.568 42.816C230.037 42.7307 230.464 42.688 230.848 42.688H252.48C253.547 42.688 254.08 43.2213 254.08 44.288V60.8C254.08 61.184 253.995 61.5253 253.824 61.824C253.653 62.1227 253.483 62.464 253.312 62.848L244.032 83.648L243.008 85.44L244.032 87.488L254.848 108.928C255.061 109.269 255.189 109.632 255.232 110.016C255.317 110.357 255.36 110.805 255.36 111.36V126.4C255.36 127.467 254.827 128 253.76 128H231.872C231.531 128 231.147 127.936 230.72 127.808C230.336 127.68 230.08 127.424 229.952 127.04L226.048 115.2L222.272 104H221.312V126.4C221.312 127.467 220.779 128 219.712 128H196.288ZM277.072 128C276.091 128 275.237 127.637 274.512 126.912L261.712 114.112C261.029 113.429 260.688 112.576 260.688 111.552V74.048C260.688 73.024 261.029 72.1707 261.712 71.488L274.512 58.688C275.237 57.9627 276.091 57.6 277.072 57.6H296.528C297.509 57.6 298.363 57.9627 299.088 58.688L311.888 71.488C312.571 72.1707 312.912 73.024 312.912 74.048V111.552C312.912 112.576 312.571 113.429 311.888 114.112L299.088 126.912C298.363 127.637 297.509 128 296.528 128H277.072ZM286.672 106.688H286.8C287.653 106.688 288.315 106.453 288.784 105.984C289.253 105.515 289.488 104.853 289.488 104V81.6C289.488 80.7467 289.253 80.0853 288.784 79.616C288.315 79.1467 287.653 78.912 286.8 78.912H286.608C285.755 78.912 285.115 79.1467 284.688 79.616C284.304 80.0853 284.112 80.7467 284.112 81.6V104C284.112 104.853 284.325 105.515 284.752 105.984C285.221 106.453 285.861 106.688 286.672 106.688ZM319.913 128C318.846 128 318.313 127.467 318.313 126.4V44.288C318.313 43.2213 318.846 42.688 319.913 42.688H340.137C341.204 42.688 341.737 43.2213 341.737 44.288V126.4C341.737 127.467 341.204 128 340.137 128H319.913ZM348.663 128C347.596 128 347.063 127.467 347.063 126.4V59.2C347.063 58.1333 347.596 57.6 348.663 57.6H368.887C369.954 57.6 370.487 58.1333 370.487 59.2V126.4C370.487 127.467 369.954 128 368.887 128H348.663ZM348.343 52.288C347.49 52.288 347.063 51.8613 347.063 51.008V42.88C347.063 42.0267 347.49 41.6 348.343 41.6H369.335C370.103 41.6 370.487 42.0267 370.487 42.88V51.008C370.487 51.8613 370.103 52.288 369.335 52.288H348.343ZM377.413 128C376.346 128 375.813 127.467 375.813 126.4V59.2C375.813 58.1333 376.346 57.6 377.413 57.6H405.253C406.234 57.6 407.088 57.9627 407.813 58.688L415.685 66.56H418.053L425.925 58.688C426.65 57.9627 427.504 57.6 428.485 57.6H440.453C441.434 57.6 442.288 57.9627 443.013 58.688L455.813 71.488C456.496 72.1707 456.837 73.024 456.837 74.048V126.4C456.837 127.467 456.304 128 455.237 128H435.013C433.946 128 433.413 127.467 433.413 126.4V83.712C433.413 81.9627 432.517 81.088 430.725 81.088H428.037V126.4C428.037 127.467 427.504 128 426.437 128H406.213C405.146 128 404.613 127.467 404.613 126.4V83.712C404.613 81.9627 403.717 81.088 401.925 81.088H399.237V126.4C399.237 127.467 398.704 128 397.637 128H377.413ZM488.3 128C488.001 128 487.681 127.957 487.34 127.872C487.041 127.787 486.721 127.659 486.38 127.488L474.668 121.92L463.34 116.48C462.572 116.139 462.188 115.285 462.188 113.92V74.048C462.188 73.024 462.529 72.1707 463.212 71.488L476.012 58.688C476.737 57.9627 477.591 57.6 478.572 57.6H498.028C499.009 57.6 499.863 57.9627 500.588 58.688L513.388 71.488C514.071 72.1707 514.412 73.024 514.412 74.048V100.288H486.508V102.72L491.82 105.088L504.108 108.608C504.577 108.651 504.812 109.312 504.812 110.592V126.4C504.812 127.467 504.279 128 503.212 128H488.3ZM489.132 88.128H489.26C490.881 88.128 492.097 87.6587 492.908 86.72C493.761 85.7813 494.188 84.3947 494.188 82.56V82.368C494.188 80.5333 493.761 79.1467 492.908 78.208C492.097 77.2693 490.881 76.8 489.26 76.8H489.068C487.575 76.8 486.401 77.2693 485.548 78.208C484.737 79.1467 484.332 80.5333 484.332 82.368V82.56C484.332 84.3947 484.737 85.7813 485.548 86.72C486.359 87.6587 487.553 88.128 489.132 88.128ZM545.925 128C545.626 128 545.306 127.957 544.965 127.872C544.666 127.787 544.346 127.659 544.005 127.488L532.293 121.92L520.965 116.48C520.197 116.139 519.813 115.285 519.813 113.92V74.048C519.813 73.024 520.154 72.1707 520.837 71.488L533.637 58.688C534.362 57.9627 535.216 57.6 536.197 57.6H555.653C556.634 57.6 557.488 57.9627 558.213 58.688L571.013 71.488C571.696 72.1707 572.037 73.024 572.037 74.048V100.288H544.133V102.72L549.445 105.088L561.733 108.608C562.202 108.651 562.437 109.312 562.437 110.592V126.4C562.437 127.467 561.904 128 560.837 128H545.925ZM546.757 88.128H546.885C548.506 88.128 549.722 87.6587 550.533 86.72C551.386 85.7813 551.813 84.3947 551.813 82.56V82.368C551.813 80.5333 551.386 79.1467 550.533 78.208C549.722 77.2693 548.506 76.8 546.885 76.8H546.693C545.2 76.8 544.026 77.2693 543.173 78.208C542.362 79.1467 541.957 80.5333 541.957 82.368V82.56C541.957 84.3947 542.362 85.7813 543.173 86.72C543.984 87.6587 545.178 88.128 546.757 88.128ZM594.59 128C593.609 128 592.755 127.637 592.03 126.912L581.342 116.288C580.659 115.563 580.318 114.709 580.318 113.728V78.912H577.63C576.563 78.912 576.03 78.3787 576.03 77.312V59.2C576.03 58.1333 576.563 57.6 577.63 57.6H580.318V49.6C580.318 48.5333 580.851 48 581.918 48H602.142C603.209 48 603.742 48.5333 603.742 49.6V57.6H609.95C611.017 57.6 611.55 58.1333 611.55 59.2V77.312C611.55 78.3787 611.017 78.912 609.95 78.912H603.742V104.512C603.742 105.365 603.998 106.048 604.51 106.56L610.782 112.832C611.209 113.259 611.422 113.899 611.422 114.752V126.4C611.422 127.467 610.889 128 609.822 128H594.59Z" fill="#1e293b"/>
                <path d="M72.0219 64.5198L67.9619 71.5518C67.5519 72.2608 66.7959 72.6978 65.9759 72.6978H38.2199C37.4009 72.6978 36.6439 73.1348 36.2349 73.8438L33.3759 78.7948C32.9659 79.5038 32.9659 80.3778 33.3759 81.0878L36.2349 86.0388C36.6439 86.7478 37.4009 87.1848 38.2199 87.1848H65.9779C66.7959 87.1848 67.5519 87.6208 67.9619 88.3288L82.6909 113.773C83.1009 114.481 83.8569 114.917 84.6749 114.917H90.3939C91.2129 114.917 91.9699 114.48 92.3799 113.771L95.2379 108.821C95.6479 108.111 95.6469 107.236 95.2369 106.526L80.5109 81.0878C80.0999 80.3778 80.0999 79.5028 80.5099 78.7928L84.8239 71.3208C85.7059 69.7928 87.9119 69.7928 88.7949 71.3208L92.6239 77.9518C93.5069 79.4798 95.7119 79.4798 96.5949 77.9518L99.9309 72.1738C100.341 71.4648 100.341 70.5908 99.9309 69.8808L94.8489 61.0798L93.4549 58.6648C93.0449 57.9558 93.0449 57.0818 93.4549 56.3718L94.7349 54.1548C95.6169 52.6268 94.5139 50.7158 92.7489 50.7158H79.9909H76.8969H50.9109C50.0919 50.7158 49.3349 51.1528 48.9249 51.8618L45.5889 57.6398C44.7069 59.1678 45.8099 61.0788 47.5739 61.0788H70.0359C71.8009 61.0808 72.9039 62.9918 72.0219 64.5198Z" fill="#1e293b"/>
                <path d="M85.4538 17C99.3048 17 112.104 24.396 119.021 36.399C119.713 37.6 118.814 39.101 117.429 39.101H51.6878C49.3448 39.101 47.1808 40.35 46.0098 42.379L28.5048 72.698L25.4458 77.996C24.7508 79.2 24.7508 80.684 25.4458 81.888L31.1895 97.158L9.86775 94.439C8.10476 94.305 6.52175 93.31 5.63775 91.779L1.03575 83.808C-0.34525 81.415 -0.34525 78.468 1.03575 76.075L11.5628 57.841L33.2498 20.278C34.4208 18.25 36.5858 17 38.9278 17H60.6618H85.4538Z" fill="#8A38F5"/>
                <path d="M121.044 61.5068C120.018 61.4168 119.901 59.9618 120.9 59.7098L144.146 53.8848C145.986 53.4268 177.183 50.7178 175.287 50.7178H106.303C104.288 50.7178 103.028 52.8988 104.036 54.6448L117.886 78.6338C118.354 79.4438 118.354 80.4418 117.886 81.2518L99.2437 113.54L96.5707 118.17C95.6367 119.787 93.9107 120.784 92.0437 120.784H86.6977H47.9027H26.9177C24.9027 120.784 23.6427 122.965 24.6507 124.711L32.5107 138.325C34.1397 141.146 37.1497 142.884 40.4077 142.884H60.6617H82.3017H84.9927C99.1187 142.884 112.172 135.348 119.236 123.114L120.582 120.783L132.748 99.7118C139.05 88.7968 139.725 75.6238 134.781 64.2218C134.363 63.2578 133.458 62.5938 132.412 62.5018L121.044 61.5068Z" fill="#8A38F5"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Section profil complète */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-4 mb-6 shadow-sm">
          <Link 
            to={`/u/${parcel.user_id}`}
            className="flex items-center gap-3 hover:bg-slate-50 rounded-xl p-2 -m-2 transition-colors"
          >
            <Avatar className="h-12 w-12 ring-2 ring-violet-500/20">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="text-sm bg-violet-500/10 text-violet-600">
                {profile?.full_name?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-slate-900 truncate">{profile?.full_name || "Utilisateur"}</h3>
                <TrustBadge 
                  trustScore={profile?.trust_score || 50} 
                  referredByCount={ownerReferrers.length}
                  isVerified={profile?.is_verified}
                  size="sm"
                />
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-500">
                {profile?.rating_avg > 0 ? (
                  <>
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span>{Number(profile.rating_avg).toFixed(1)}</span>
                    <span>• {profile.rating_count} avis</span>
                  </>
                ) : (
                  <span>Nouvel utilisateur</span>
                )}
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </Link>
          
          {/* Parrains et bouton de parrainage */}
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
            <div className="flex items-center gap-2">
              {ownerReferrers.length > 0 ? (
                <>
                  <ReferrersList referrers={ownerReferrers} maxDisplay={3} size="sm" />
                  <span className="text-xs text-slate-500">
                    {ownerReferrers.length} parrain{ownerReferrers.length > 1 ? 's' : ''}
                  </span>
                </>
              ) : (
                <span className="text-xs text-slate-400">Pas encore parrainé</span>
              )}
            </div>
            {user && user.id !== parcel.user_id && (
              <ReferralRequestDialog
                targetUserId={parcel.user_id}
                targetUserName={profile?.full_name || 'cet expéditeur'}
                className="h-8 text-xs"
              />
            )}
          </div>
        </div>

        {/* Description */}
        {parcel.description && (
          <div className="bg-white rounded-2xl border border-slate-200/60 p-4 mb-6 shadow-sm">
            <p className="text-sm text-slate-600 leading-relaxed">{parcel.description}</p>
          </div>
        )}

        {/* Photos (en dehors de la card principale) */}
        {validPhotos.length > 0 && (
          <Card className="mb-6 border-0 shadow-lg">
            <CardContent className="p-5">
              <h3 className="font-semibold mb-4">Photos du colis</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {validPhotos.map((photo: string, index: number) => (
                  <div key={index} className="relative overflow-hidden rounded-xl aspect-square group cursor-pointer bg-muted">
                    <img
                      src={photo}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        // Masquer le conteneur si l'image ne charge pas
                        const container = (e.target as HTMLImageElement).parentElement;
                        if (container) container.style.display = 'none';
                      }}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="fixed bottom-0 left-0 right-0 p-4 pb-24 bg-gradient-to-t from-background via-background to-transparent md:relative md:bg-transparent md:p-0 md:pb-0 z-40 md:z-auto">
          <div className="container max-w-3xl mx-auto flex gap-3">
            {user?.id === parcel.user_id ? (
              <Button 
                onClick={() => navigate(`/publier/colis/${parcel.id}`)}
                className="flex-1 h-14 rounded-2xl font-semibold text-base shadow-lg shadow-violet-500/20 bg-violet-500 hover:bg-violet-600 touch-manipulation"
              >
                <Settings className="w-5 h-5 mr-2" />
                Gérer l'annonce
              </Button>
            ) : (
              <>
                <Button 
                  onClick={handleContact} 
                  className="flex-1 h-14 rounded-2xl font-semibold text-base shadow-lg shadow-violet-500/20 bg-violet-500 hover:bg-violet-600 touch-manipulation"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Contacter l'expéditeur
                </Button>

                {user && parcel.status === "closed" && (
                  <Button 
                    onClick={() => setReviewDialogOpen(true)} 
                    variant="outline" 
                    className="h-14 w-14 rounded-2xl p-0 border-2 touch-manipulation bg-background"
                  >
                    <Star className="w-5 h-5" />
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Suggestions de trajets compatibles */}
        <div className="mt-8 mb-24 md:mb-8">
          <MatchingSuggestions type="parcel" itemId={parcel.id} maxSuggestions={5} />
        </div>
      </div>
      </div>

      {user && user.id !== parcel.user_id && (
        <ReviewDialog
          open={reviewDialogOpen}
          onOpenChange={setReviewDialogOpen}
          targetUserId={parcel.user_id}
          targetUserName={profile?.full_name || "cet expéditeur"}
        />
      )}
    </>
  );
};

export default ParcelDetail;
