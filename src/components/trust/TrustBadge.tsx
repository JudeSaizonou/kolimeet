import { Shield, ShieldCheck, ShieldAlert, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TrustBadgeProps {
  trustScore: number;
  referredByCount?: number;
  isVerified?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function TrustBadge({ 
  trustScore, 
  referredByCount = 0,
  isVerified = false,
  size = 'md',
  showLabel = false,
  className 
}: TrustBadgeProps) {
  const getTrustLevel = () => {
    if (trustScore >= 80) return { level: 'high', label: 'Très fiable', color: 'text-emerald-600 bg-emerald-50' };
    if (trustScore >= 60) return { level: 'medium', label: 'Fiable', color: 'text-blue-600 bg-blue-50' };
    if (trustScore >= 40) return { level: 'low', label: 'En progression', color: 'text-amber-600 bg-amber-50' };
    return { level: 'new', label: 'Nouveau', color: 'text-slate-500 bg-slate-50' };
  };

  const { level, label, color } = getTrustLevel();

  const iconSizes = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const badgeSizes = {
    sm: 'px-1.5 py-0.5 text-[10px]',
    md: 'px-2 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  const Icon = level === 'high' ? ShieldCheck : level === 'new' ? ShieldAlert : Shield;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            'inline-flex items-center gap-1 rounded-full font-medium cursor-help',
            badgeSizes[size],
            color,
            className
          )}>
            <Icon className={iconSizes[size]} />
            {showLabel && <span>{label}</span>}
            {referredByCount > 0 && (
              <span className="flex items-center gap-0.5 ml-1 opacity-80">
                <Users className={cn(iconSizes[size], 'scale-90')} />
                {referredByCount}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-center">
            <p className="font-medium">{label}</p>
            <p className="text-xs text-muted-foreground">
              Score de confiance: {trustScore}/100
            </p>
            {referredByCount > 0 && (
              <p className="text-xs text-muted-foreground">
                Parrainé par {referredByCount} membre{referredByCount > 1 ? 's' : ''}
              </p>
            )}
            {isVerified && (
              <p className="text-xs text-emerald-600">✓ Identité vérifiée</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
