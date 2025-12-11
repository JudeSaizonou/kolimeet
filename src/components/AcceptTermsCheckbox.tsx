import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';

interface AcceptTermsCheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  type: 'trip' | 'parcel';
  error?: string;
}

export function AcceptTermsCheckbox({ 
  checked, 
  onCheckedChange, 
  type,
  error 
}: AcceptTermsCheckboxProps) {
  const contentText = type === 'trip' 
    ? "les colis que je transporterai ne contiennent aucun"
    : "mon colis ne contient aucun";

  return (
    <div className="space-y-2">
      <div className="flex items-start space-x-3 p-4 border rounded-lg bg-muted/30">
        <Checkbox
          id="accept-terms"
          checked={checked}
          onCheckedChange={(value) => onCheckedChange(value === true)}
          className="mt-0.5"
        />
        <Label 
          htmlFor="accept-terms" 
          className="text-sm leading-relaxed cursor-pointer font-normal"
        >
          Je certifie que {contentText}{' '}
          <Link 
            to="/articles-interdits" 
            className="text-primary hover:underline font-medium"
            target="_blank"
          >
            article interdit
          </Link>{' '}
          et j'accepte les{' '}
          <Link 
            to="/cgu" 
            className="text-primary hover:underline font-medium"
            target="_blank"
          >
            conditions générales d'utilisation
          </Link>
          . Je comprends que je suis <strong>légalement responsable</strong> du contenu 
          {type === 'trip' ? ' des colis que je transporte' : ' de mon envoi'}.
        </Label>
      </div>
      {error && (
        <p className="text-sm text-destructive pl-1">{error}</p>
      )}
    </div>
  );
}
