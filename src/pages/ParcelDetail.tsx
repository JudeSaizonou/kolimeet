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
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-background to-background pb-24 pt-20 md:pt-24">
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

          {/* Zone de capture pour le partage */}
          <div ref={shareContentRef} className="bg-white">
            {/* Header coloré subtil */}
            <div className="bg-gradient-to-r from-violet-500/10 via-violet-500/5 to-transparent p-6 pb-4 pt-16">
              {/* Badge colis */}
              <div className="flex items-center gap-2 mb-4">
                <Badge className="bg-violet-500/10 text-violet-600 border-0">
                  <Package className="h-3 w-3 mr-1" />
                  Colis
                </Badge>
                <Badge variant={parcel.status === "open" ? "default" : "secondary"} className="text-xs">
                  {parcel.status === "open" ? "Recherche transporteur" : "Fermé"}
                </Badge>
              </div>

              {/* Titre du colis */}
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 mb-4 line-clamp-2">
                {parcel.title || `${typeLabels[parcel.type]} à envoyer`}
              </h1>

              {/* Itinéraire */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Expédition</p>
                  <h2 className="text-xl md:text-2xl font-bold text-slate-900">{parcel.from_city}</h2>
                  <p className="text-slate-500 text-sm">{parcel.from_country}</p>
                </div>
                
                <div className="flex flex-col items-center px-4">
                  <div className="w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center">
                    <Box className="h-6 w-6 text-violet-600" />
                  </div>
                  <div className="h-0.5 w-16 bg-slate-200 my-2" />
                </div>
                
                <div className="flex-1 text-right">
                  <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Destination</p>
                  <h2 className="text-xl md:text-2xl font-bold text-slate-900">{parcel.to_city}</h2>
                  <p className="text-slate-500 text-sm">{parcel.to_country}</p>
                </div>
              </div>
            </div>

            <div className="p-6 pt-4">
              {/* Infos clés */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-slate-50 rounded-2xl p-3 text-center border border-slate-100">
                  <Weight className="h-4 w-4 mx-auto mb-1 text-violet-600" />
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Poids</p>
                  <p className="font-bold text-sm text-slate-900">{parcel.weight_kg} kg</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-3 text-center border border-slate-100">
                  <Package className="h-4 w-4 mx-auto mb-1 text-violet-600" />
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Type</p>
                  <p className="font-bold text-sm text-slate-900">{typeLabels[parcel.type]}</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-3 text-center border border-slate-100">
                  <Clock className="h-4 w-4 mx-auto mb-1 text-violet-600" />
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Avant le</p>
                  <p className="font-bold text-sm text-slate-900">
                    {format(new Date(parcel.deadline), "d MMM", { locale: fr })}
                  </p>
                </div>
              </div>

              {/* Profil simplifié pour le partage */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 ring-2 ring-violet-500/20">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback className="text-sm bg-violet-500/10 text-violet-600">
                      {profile?.full_name?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-slate-900 truncate">{profile?.full_name || "Utilisateur"}</h3>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      {profile?.rating_avg > 0 ? (
                        <>
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span>{Number(profile.rating_avg).toFixed(1)}</span>
                        </>
                      ) : (
                        <span>Nouvel utilisateur</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Logo Kolimeet pour le partage */}
              <div className="mt-4 text-center">
                <span className="text-xs text-slate-400">kolimeet.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section profil complète - Hors de la card principale */}
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
                  score={profile?.trust_score || 50} 
                  referrerCount={ownerReferrers.length}
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
                className="flex-1 h-14 rounded-2xl font-semibold text-base shadow-lg shadow-violet-500/20 bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 touch-manipulation"
              >
                <Settings className="w-5 h-5 mr-2" />
                Gérer l'annonce
              </Button>
            ) : (
              <>
                <Button 
                  onClick={handleContact} 
                  className="flex-1 h-14 rounded-2xl font-semibold text-base shadow-lg shadow-violet-500/20 bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 touch-manipulation"
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
