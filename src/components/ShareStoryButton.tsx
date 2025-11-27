import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ShareStoryButtonProps {
  type: 'trip' | 'parcel';
  data: {
    fromCity: string;
    toCity: string;
    fromCountry: string;
    toCountry: string;
    date?: string;
    capacity?: number;
    price?: number;
    weight?: number;
    parcelType?: string;
    deadline?: string;
    reward?: number;
  };
}

export function ShareStoryButton({ type, data }: ShareStoryButtonProps) {
  const [loading, setLoading] = useState(false);

  const generateImageUrl = () => {
    const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    const params = new URLSearchParams();
    
    params.set('from', data.fromCity || '');
    params.set('to', data.toCity || '');
    params.set('fromCountry', data.fromCountry || '');
    params.set('toCountry', data.toCountry || '');
    
    if (type === 'trip') {
      if (data.date) params.set('date', data.date);
      if (data.capacity !== undefined) params.set('capacity', data.capacity.toString());
      if (data.price !== undefined) params.set('price', data.price.toString());
      return `${baseUrl}/api/og/trip?${params.toString()}`;
    } else {
      if (data.weight !== undefined) params.set('weight', data.weight.toString());
      if (data.parcelType) params.set('type', data.parcelType);
      if (data.deadline) params.set('deadline', data.deadline);
      if (data.reward !== undefined) params.set('reward', data.reward.toString());
      return `${baseUrl}/api/og/parcel?${params.toString()}`;
    }
  };

  const downloadImage = async () => {
    setLoading(true);
    try {
      const imageUrl = generateImageUrl();
      
      // Fetch l'image depuis notre API
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error('Erreur lors de la génération');
      
      const blob = await response.blob();
      
      // Sur mobile, essayer le partage natif avec l'image
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], `kolimeet-${type}.png`, { type: 'image/png' });
        const shareData = { files: [file] };
        
        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          toast.success('Image prête à partager !');
          setLoading(false);
          return;
        }
      }
      
      // Sinon, télécharger classiquement
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `kolimeet-${type}-${data.fromCity}-${data.toCity}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Image téléchargée ! Partagez-la sur vos réseaux.');
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la génération de l\'image');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={downloadImage} 
      disabled={loading}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <ImageIcon className="h-4 w-4" />
      )}
      <span className="hidden sm:inline">Télécharger pour Story</span>
      <span className="sm:hidden">Story</span>
    </Button>
  );
}
