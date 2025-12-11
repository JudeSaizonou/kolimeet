import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ReferrerInfo } from '@/hooks/useReferrals';

interface ReferrersListProps {
  referrers: ReferrerInfo[];
  maxDisplay?: number;
  size?: 'sm' | 'md';
}

const RELATIONSHIP_LABELS: Record<string, string> = {
  friend: 'Ami(e)',
  family: 'Famille',
  colleague: 'Collègue',
  neighbor: 'Voisin(e)',
  other: 'Connaissance',
};

export function ReferrersList({ referrers, maxDisplay = 3, size = 'md' }: ReferrersListProps) {
  if (referrers.length === 0) return null;

  const displayedReferrers = referrers.slice(0, maxDisplay);
  const remainingCount = referrers.length - maxDisplay;

  const avatarSizes = {
    sm: 'h-6 w-6 text-[10px]',
    md: 'h-8 w-8 text-xs',
  };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <div className="flex items-center text-xs text-muted-foreground gap-1">
          <Users className="h-3.5 w-3.5" />
          <span>Parrainé par</span>
        </div>
        
        <div className="flex -space-x-2">
          {displayedReferrers.map((referrer) => (
            <Tooltip key={referrer.referrer_id}>
              <TooltipTrigger asChild>
                <Avatar className={cn(
                  avatarSizes[size], 
                  'border-2 border-white cursor-pointer hover:z-10 transition-transform hover:scale-110'
                )}>
                  <AvatarImage src={referrer.referrer_avatar || undefined} />
                  <AvatarFallback className="bg-violet-100 text-violet-700">
                    {referrer.referrer_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-center">
                  <p className="font-medium">{referrer.referrer_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {RELATIONSHIP_LABELS[referrer.relationship] || 'Connaissance'}
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
          
          {remainingCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn(
                  avatarSizes[size],
                  'rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-slate-600 font-medium cursor-pointer'
                )}>
                  +{remainingCount}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Et {remainingCount} autre{remainingCount > 1 ? 's' : ''} parrain{remainingCount > 1 ? 's' : ''}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
