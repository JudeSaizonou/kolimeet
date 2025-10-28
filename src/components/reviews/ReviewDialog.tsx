import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ReviewForm } from "./ReviewForm";

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetUserId: string;
  targetUserName: string;
}

export function ReviewDialog({
  open,
  onOpenChange,
  targetUserId,
  targetUserName,
}: ReviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Laisser un avis</DialogTitle>
          <DialogDescription>
            Partagez votre expérience avec {targetUserName}
          </DialogDescription>
        </DialogHeader>
        <ReviewForm
          targetUserId={targetUserId}
          targetUserName={targetUserName}
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
