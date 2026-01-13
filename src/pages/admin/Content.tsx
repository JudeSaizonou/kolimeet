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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Trash2, RefreshCw, Package, Plane } from "lucide-react";
import { useAdmin } from "@/hooks/useAdmin";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ContentItem {
  id: string;
  type: "trip" | "parcel";
  user_id: string;
  user_name: string | null;
  from_city: string;
  from_country: string;
  to_city: string;
  to_country: string;
  status: string;
  price_expect?: number;
  created_at: string;
}

export default function Content() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canManageContent } = useAdmin();
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ContentItem | null>(null);

  useEffect(() => {
    fetchContent();
  }, [typeFilter, statusFilter]);

  const fetchContent = async () => {
    try {
      setLoading(true);

      let items: ContentItem[] = [];

      // Fetch trips
      if (typeFilter === "all" || typeFilter === "trip") {
        const tripsQuery = supabase
          .from("trips")
          .select("*, profiles!inner(full_name)")
          .order("created_at", { ascending: false });

        if (statusFilter !== "all") {
          tripsQuery.eq("status", statusFilter);
        }

        const { data: tripsData } = await tripsQuery;

        if (tripsData) {
          items = [
            ...items,
            ...tripsData.map((trip: any) => ({
              id: trip.id,
              type: "trip" as const,
              user_id: trip.user_id,
              user_name: trip.profiles?.full_name || null,
              from_city: trip.from_city,
              from_country: trip.from_country,
              to_city: trip.to_city,
              to_country: trip.to_country,
              status: trip.status,
              price_expect: trip.price_expect,
              created_at: trip.created_at,
            })),
          ];
        }
      }

      // Fetch parcels
      if (typeFilter === "all" || typeFilter === "parcel") {
        const parcelsQuery = supabase
          .from("parcels")
          .select("*, profiles!inner(full_name)")
          .order("created_at", { ascending: false });

        if (statusFilter !== "all") {
          parcelsQuery.eq("status", statusFilter);
        }

        const { data: parcelsData } = await parcelsQuery;

        if (parcelsData) {
          items = [
            ...items,
            ...parcelsData.map((parcel: any) => ({
              id: parcel.id,
              type: "parcel" as const,
              user_id: parcel.user_id,
              user_name: parcel.profiles?.full_name || null,
              from_city: parcel.from_city,
              from_country: parcel.from_country,
              to_city: parcel.to_city,
              to_country: parcel.to_country,
              status: parcel.status,
              price_expect: parcel.price_per_kg,
              created_at: parcel.created_at,
            })),
          ];
        }
      }

      // Sort by date
      items.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setContent(items);
    } catch (error) {
      console.error("Error fetching content:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger le contenu",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContent = async () => {
    if (!itemToDelete || !canManageContent()) return;

    try {
      const { error } = await supabase.rpc("admin_delete_content" as any, {
        p_content_type: itemToDelete.type,
        p_content_id: itemToDelete.id,
        p_reason: "Supprimé par l'administrateur",
      });

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Contenu supprimé",
      });

      setDeleteDialogOpen(false);
      setItemToDelete(null);
      fetchContent();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer le contenu",
        variant: "destructive",
      });
    }
  };

  const columns: ColumnDef<ContentItem>[] = [
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="outline" className="gap-1">
          {row.original.type === "trip" ? (
            <>
              <Plane className="h-3 w-3" />
              Trajet
            </>
          ) : (
            <>
              <Package className="h-3 w-3" />
              Colis
            </>
          )}
        </Badge>
      ),
    },
    {
      accessorKey: "user_name",
      header: "Utilisateur",
      cell: ({ row }) => (
        <Button
          variant="link"
          className="p-0 h-auto"
          onClick={() => navigate(`/admin/users/${row.original.user_id}`)}
        >
          {row.original.user_name || "Sans nom"}
        </Button>
      ),
    },
    {
      accessorKey: "route",
      header: "Itinéraire",
      cell: ({ row }) =>
        `${row.original.from_city} (${row.original.from_country}) → ${row.original.to_city} (${row.original.to_country})`,
    },
    {
      accessorKey: "status",
      header: "Statut",
      cell: ({ row }) => {
        const statusColors: Record<string, string> = {
          open: "default",
          closed: "secondary",
          cancelled: "destructive",
        };
        return (
          <Badge variant={statusColors[row.original.status] as any || "outline"}>
            {row.original.status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "price_expect",
      header: "Prix",
      cell: ({ row }) =>
        row.original.price_expect
          ? `${row.original.price_expect}€`
          : "-",
    },
    {
      accessorKey: "created_at",
      header: "Créé le",
      cell: ({ row }) =>
        new Date(row.original.created_at).toLocaleDateString("fr-FR"),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Ouvrir le menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() =>
                  navigate(
                    `/${row.original.type === "trip" ? "trajets" : "colis"}/${
                      row.original.id
                    }`
                  )
                }
              >
                <Eye className="mr-2 h-4 w-4" />
                Voir le détail
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {canManageContent() && (
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => {
                    setItemToDelete(row.original);
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
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
          <h1 className="text-3xl font-bold">Gestion du Contenu</h1>
          <p className="text-muted-foreground mt-1">
            {content.length} élément(s)
          </p>
        </div>
        <Button onClick={fetchContent} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="trip">Trajets</SelectItem>
            <SelectItem value="parcel">Colis</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="open">Ouverts</SelectItem>
            <SelectItem value="closed">Fermés</SelectItem>
            <SelectItem value="cancelled">Annulés</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={content}
        searchKey="user_name"
        searchPlaceholder="Rechercher par utilisateur..."
      />

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce contenu ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le{" "}
              {itemToDelete?.type === "trip" ? "trajet" : "colis"} sera
              définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteContent}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
