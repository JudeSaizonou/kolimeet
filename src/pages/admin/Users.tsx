import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DataTable } from "@/components/admin/ui/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserBadge } from "@/components/admin/ui/UserBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MoreHorizontal, Ban, UserX, RefreshCw, Eye, Trash2 } from "lucide-react";
import { useAdmin } from "@/hooks/useAdmin";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface User {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  trust_score: number;
  is_verified: boolean;
  is_banned: boolean;
  is_suspended: boolean;
  suspended_until: string | null;
  created_at: string;
  updated_at: string;
}

export default function Users() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canManageUsers, hasRole } = useAdmin();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);

  useEffect(() => {
    fetchUsers();
  }, [statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      let query = supabase.from("profiles").select("*");

      // Apply status filter
      if (statusFilter === "banned") {
        query = query.eq("is_banned", true);
      } else if (statusFilter === "suspended") {
        query = query.eq("is_suspended", true);
      } else if (statusFilter === "verified") {
        query = query.eq("is_verified", true);
      } else if (statusFilter === "active") {
        query = query.eq("is_banned", false).eq("is_suspended", false);
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) throw error;

      setUsers(data as User[]);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les utilisateurs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId: string) => {
    if (!canManageUsers()) {
      toast({
        title: "Non autorisé",
        description: "Vous n'avez pas la permission de bannir des utilisateurs",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.rpc("admin_ban_user", {
        p_user_id: userId,
        p_reason: "Banni par l'administrateur",
        p_permanent: false,
        p_duration_days: 30,
      });

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Utilisateur banni pour 30 jours",
      });

      fetchUsers();
    } catch (error: any) {
      console.error("Error banning user:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de bannir l'utilisateur",
        variant: "destructive",
      });
    }
  };

  const handleSuspendUser = async (userId: string) => {
    if (!canManageUsers()) {
      toast({
        title: "Non autorisé",
        description:
          "Vous n'avez pas la permission de suspendre des utilisateurs",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.rpc("admin_suspend_user", {
        p_user_id: userId,
        p_reason: "Suspendu par l'administrateur",
        p_duration_days: 7,
      });

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Utilisateur suspendu pour 7 jours",
      });

      fetchUsers();
    } catch (error: any) {
      console.error("Error suspending user:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de suspendre l'utilisateur",
        variant: "destructive",
      });
    }
  };

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "full_name",
      header: "Utilisateur",
      cell: ({ row }) => (
        <UserBadge
          user={{
            user_id: row.original.user_id,
            full_name: row.original.full_name || "Sans nom",
            avatar_url: row.original.avatar_url,
            trust_score: row.original.trust_score,
          }}
        />
      ),
    },
    {
      accessorKey: "trust_score",
      header: "Trust Score",
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.trust_score >= 80
              ? "default"
              : row.original.trust_score >= 60
              ? "secondary"
              : "destructive"
          }
        >
          {row.original.trust_score}
        </Badge>
      ),
    },
    {
      accessorKey: "is_verified",
      header: "Statut",
      cell: ({ row }) => {
        if (row.original.is_banned) {
          return <Badge variant="destructive">Banni</Badge>;
        }
        if (row.original.is_suspended) {
          return <Badge variant="secondary">Suspendu</Badge>;
        }
        if (row.original.is_verified) {
          return <Badge variant="default">Vérifié</Badge>;
        }
        return <Badge variant="outline">Actif</Badge>;
      },
    },
    {
      accessorKey: "created_at",
      header: "Inscription",
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
                onClick={() => navigate(`/admin/users/${row.original.user_id}`)}
              >
                <Eye className="mr-2 h-4 w-4" />
                Voir le profil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {canManageUsers() && (
                <>
                  <DropdownMenuItem
                    onClick={() => handleBanUser(row.original.user_id)}
                    disabled={row.original.is_banned}
                  >
                    <Ban className="mr-2 h-4 w-4" />
                    Bannir (30j)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleSuspendUser(row.original.user_id)}
                    disabled={row.original.is_suspended}
                  >
                    <UserX className="mr-2 h-4 w-4" />
                    Suspendre (7j)
                  </DropdownMenuItem>
                  {hasRole("super_admin") && (
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Supprimer
                    </DropdownMenuItem>
                  )}
                </>
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
          <h1 className="text-3xl font-bold">Gestion des Utilisateurs</h1>
          <p className="text-muted-foreground mt-1">
            {users.length} utilisateur(s)
          </p>
        </div>
        <Button onClick={fetchUsers} variant="outline" size="sm">
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
            <SelectItem value="active">Actifs</SelectItem>
            <SelectItem value="verified">Vérifiés</SelectItem>
            <SelectItem value="suspended">Suspendus</SelectItem>
            <SelectItem value="banned">Bannis</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk actions */}
      {selectedUsers.length > 0 && canManageUsers() && (
        <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
          <span className="text-sm font-medium">
            {selectedUsers.length} sélectionné(s)
          </span>
          <Button variant="outline" size="sm">
            <Ban className="h-4 w-4 mr-2" />
            Bannir la sélection
          </Button>
          <Button variant="outline" size="sm">
            <UserX className="h-4 w-4 mr-2" />
            Suspendre la sélection
          </Button>
        </div>
      )}

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={users}
        searchKey="full_name"
        searchPlaceholder="Rechercher par nom..."
        selectable={canManageUsers()}
        onSelectionChange={setSelectedUsers}
        onRowClick={(user) => navigate(`/admin/users/${user.user_id}`)}
      />
    </div>
  );
}
