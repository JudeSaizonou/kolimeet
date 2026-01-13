import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status:
    | "active"
    | "inactive"
    | "suspended"
    | "banned"
    | "pending"
    | "resolved"
    | "declined"
    | "accepted"
    | "open"
    | "closed"
    | "new";
  className?: string;
}

const statusConfig = {
  active: { label: "Actif", className: "bg-emerald-100 text-emerald-700" },
  inactive: { label: "Inactif", className: "bg-slate-100 text-slate-600" },
  suspended: { label: "Suspendu", className: "bg-amber-100 text-amber-700" },
  banned: { label: "Banni", className: "bg-rose-100 text-rose-700" },
  pending: { label: "En attente", className: "bg-blue-100 text-blue-700" },
  resolved: { label: "Résolu", className: "bg-emerald-100 text-emerald-700" },
  declined: { label: "Refusé", className: "bg-rose-100 text-rose-700" },
  accepted: { label: "Accepté", className: "bg-emerald-100 text-emerald-700" },
  open: { label: "Ouvert", className: "bg-sky-100 text-sky-700" },
  closed: { label: "Fermé", className: "bg-slate-100 text-slate-600" },
  new: { label: "Nouveau", className: "bg-violet-100 text-violet-700" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.inactive;

  return (
    <Badge variant="secondary" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
