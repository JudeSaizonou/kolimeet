import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DataTable } from "@/components/admin/ui/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Flag,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Ban,
  UserX,
  Trash2,
} from "lucide-react";
import { useAdmin } from "@/hooks/useAdmin";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface FlagItem {
  id: string;
  flagger_id: string;
  flagger_name: string | null;
  flagged_user_id: string;
  flagged_user_name: string | null;
  flag_type: string;
  reason: string;
  description: string | null;
  status: string;
  created_at: string;
  resolved_at: string | null;
  resolution: string | null;
}

export default function Flags() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canResolveFlags } = useAdmin();
  const [flags, setFlags] = useState<FlagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [selectedFlags, setSelectedFlags] = useState<FlagItem[]>([]);
  
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [flagToResolve, setFlagToResolve] = useState<FlagItem | null>(null);
  const [resolutionAction, setResolutionAction] = useState<string>("dismiss");
  const [resolutionNotes, setResolutionNotes] = useState("");

  useEffect(() => {
    fetchFlags();
  }, [statusFilter]);

  const fetchFlags = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from("flags")
        .select(`
          *,
          flagger:profiles!flags_flagger_id_fkey(full_name),
          flagged_user:profiles!flags_flagged_user_id_fkey(full_name)
        `)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setFlags(
        (data || []).map((flag: any) => ({
          id: flag.id,
          flagger_id: flag.flagger_id,
          flagger_name: flag.flagger?.full_name || null,
          flagged_user_id: flag.flagged_user_id,
          flagged_user_name: flag.flagged_user?.full_name || null,
          flag_type: flag.flag_type,
          reason: flag.reason,
          description: flag.description,
          status: flag.status,
          created_at: flag.created_at,
          resolved_at: flag.resolved_at,
          resolution: flag.resolution,
        }))
      );
    } catch (error) {
      console.error("Error fetching flags:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les signalements",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResolveFlag = async () => {
    if (!flagToResolve || !canResolveFlags()) return;

    try {
      const { error } = await supabase.rpc("admin_resolve_flag" as any, {
        p_flag_id: flagToResolve.id,
        p_action: resolutionAction,
        p_resolution_notes: resolutionNotes || "Traité par l'administrateur",
        p_notify_reporter: true,
      });

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Signalement traité",
      });

      setResolveDialogOpen(false);
      setFlagToResolve(null);
      setResolutionAction("dismiss");
      setResolutionNotes("");
      fetchFlags();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de traiter le signalement",
        variant: "destructive",
      });
    }
  };

  const handleBulkResolve = async (action: string) => {
    if (selectedFlags.length === 0 || !canResolveFlags()) return;

    try {
      const flagIds = selectedFlags.map((f) => f.id);
      
      const { error } = await supabase.rpc("admin_bulk_resolve_flags" as any, {
        p_flag_ids: flagIds,
        p_action: action,
        p_resolution_notes: `Action groupée: ${action}`,
      });

      if (error) throw error;

      toast({
        title: "Succès",
        description: `${selectedFlags.length} signalement(s) traité(s)`,
      });

      setSelectedFlags([]);
      fetchFlags();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de traiter les signalements",
        variant: "destructive",
      });
    }
  };

  const columns: ColumnDef<FlagItem>[] = [
    {
      accessorKey: "reason",
      header: "Motif",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          <span className="font-medium">{row.original.reason}</span>
        </div>
      ),
    },
    {
      accessorKey: "flagger_name",
      header: "Signalé par",
      cell: ({ row }) => (
        <Button
          variant="link"
          className="p-0 h-auto"
          onClick={() => navigate(`/admin/users/${row.original.flagger_id}`)}
        >
          {row.original.flagger_name || "Anonyme"}
        </Button>
      ),
    },
    {
      accessorKey: "flagged_user_name",
      header: "Utilisateur signalé",
      cell: ({ row }) => (
        <Button
          variant="link"
          className="p-0 h-auto"
          onClick={() => navigate(`/admin/users/${row.original.flagged_user_id}`)}
        >
          {row.original.flagged_user_name || "Inconnu"}
        </Button>
      ),
    },
    {
      accessorKey: "flag_type",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.flag_type}</Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Statut",
      cell: ({ row }) => {
        const statusConfig: Record<string, { variant: any; icon: any }> = {
          pending: { variant: "destructive", icon: Flag },
          resolved: { variant: "default", icon: CheckCircle },
          declined: { variant: "secondary", icon: XCircle },
        };
        const config = statusConfig[row.original.status] || {
          variant: "outline",
          icon: Flag,
        };
        const Icon = config.icon;
        return (
          <Badge variant={config.variant} className="gap-1">
            <Icon className="h-3 w-3" />
            {row.original.status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Date",
      cell: ({ row }) =>
        new Date(row.original.created_at).toLocaleDateString("fr-FR"),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        if (row.original.status !== "pending" || !canResolveFlags()) {
          return null;
        }
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setFlagToResolve(row.original);
              setResolveDialogOpen(true);
            }}
          >
            Traiter
          </Button>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Signalements</h1>
          <p className="text-muted-foreground mt-1">
            {flags.length} signalement(s)
          </p>
        </div>
        <Button onClick={fetchFlags} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="resolved">Résolus</SelectItem>
            <SelectItem value="declined">Refusés</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions */}
      {selectedFlags.length > 0 && canResolveFlags() && (
        <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
          <span className="text-sm font-medium mr-4">
            {selectedFlags.length} sélectionné(s)
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBulkResolve("dismiss")}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Rejeter
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBulkResolve("remove_content")}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer contenu
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBulkResolve("suspend_user")}
          >
            <UserX className="h-4 w-4 mr-2" />
            Suspendre
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleBulkResolve("ban_user")}
          >
            <Ban className="h-4 w-4 mr-2" />
            Bannir
          </Button>
        </div>
      )}

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={flags}
        searchKey="reason"
        searchPlaceholder="Rechercher par motif..."
        selectable={canResolveFlags()}
        onSelectionChange={setSelectedFlags}
      />

      {/* Resolve Dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Traiter le signalement</DialogTitle>
            <DialogDescription>
              Choisissez l'action à effectuer pour ce signalement.
            </DialogDescription>
          </DialogHeader>

          {flagToResolve && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Détails du signalement</Label>
                <div className="text-sm text-muted-foreground">
                  <p><strong>Motif:</strong> {flagToResolve.reason}</p>
                  <p><strong>Description:</strong> {flagToResolve.description || "N/A"}</p>
                  <p><strong>Type:</strong> {flagToResolve.flag_type}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="action">Action</Label>
                <Select
                  value={resolutionAction}
                  onValueChange={setResolutionAction}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dismiss">Rejeter (non fondé)</SelectItem>
                    <SelectItem value="warning">Avertissement</SelectItem>
                    <SelectItem value="remove_content">
                      Supprimer le contenu
                    </SelectItem>
                    <SelectItem value="suspend_user">
                      Suspendre l'utilisateur (7j)
                    </SelectItem>
                    <SelectItem value="ban_user">
                      Bannir l'utilisateur (permanent)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optionnel)</Label>
                <Textarea
                  id="notes"
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Détails de la résolution..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResolveDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button onClick={handleResolveFlag}>Confirmer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
