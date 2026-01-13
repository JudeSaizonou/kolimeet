import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StatsCard } from "@/components/admin/ui/StatsCard";
import {
  Users,
  Package,
  ShoppingCart,
  Flag,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  UserCheck,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardStats } from "@/integrations/supabase/types";

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("admin_dashboard_stats" as any)
        .select("*")
        .single();

      if (error) throw error;

      setStats(data as unknown as DashboardStats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="mb-8">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard Admin</h1>
        <p className="text-muted-foreground mt-2">
          Vue d'ensemble de la plateforme Kolimeet
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Users */}
        <StatsCard
          title="Total Utilisateurs"
          value={stats?.total_users || 0}
          icon={Users}
          description={`${stats?.active_users_30d || 0} actifs (30j)`}
        />

        <StatsCard
          title="Nouveaux Aujourd'hui"
          value={stats?.new_users_today || 0}
          icon={UserCheck}
          description={`${stats?.verified_users || 0} vérifiés`}
        />

        {/* Activity */}
        <StatsCard
          title="Trajets Actifs"
          value={stats?.active_trips || 0}
          icon={Package}
          description={`${stats?.total_trips || 0} au total`}
        />

        <StatsCard
          title="Colis Actifs"
          value={stats?.active_parcels || 0}
          icon={ShoppingCart}
          description={`${stats?.total_parcels || 0} au total`}
        />

        {/* Reservations */}
        <StatsCard
          title="Réservations Totales"
          value={stats?.total_reservations || 0}
          icon={CheckCircle}
          description={`${stats?.completed_reservations || 0} complétées`}
        />

        <StatsCard
          title="Taux de Succès"
          value={`${stats?.success_rate || 0}%`}
          icon={TrendingUp}
          trend={{
            value: 5,
            isPositive: true,
          }}
        />

        {/* Moderation */}
        <StatsCard
          title="Signalements"
          value={stats?.pending_flags || 0}
          icon={Flag}
          description="En attente"
          className={
            (stats?.pending_flags || 0) > 10
              ? "border-rose-200 bg-rose-50/50"
              : ""
          }
        />

        <StatsCard
          title="Trust Score Moyen"
          value={stats?.avg_trust_score || 0}
          icon={AlertTriangle}
          description="Score de confiance"
        />
      </div>

      {/* Quick Actions / Recent Activity could go here */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Flags Card */}
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4">Signalements Récents</h3>
          <p className="text-sm text-muted-foreground">
            Consulter la page{" "}
            <a href="/admin/flags" className="text-primary underline">
              Signalements
            </a>{" "}
            pour plus de détails
          </p>
        </div>

        {/* Recent Activity Card */}
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4">Activité Récente</h3>
          <p className="text-sm text-muted-foreground">
            {stats?.active_users_30d || 0} utilisateurs actifs ce mois
          </p>
        </div>
      </div>
    </div>
  );
}
